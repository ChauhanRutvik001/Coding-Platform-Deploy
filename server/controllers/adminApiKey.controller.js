import AdminApiKey from "../models/adminApiKeys.js";
import SystemSettings from "../models/systemSettings.js";
import User from "../models/user.js";
import { StatusCodes } from "http-status-codes";

// Helper function to mask API key for display
const maskApiKey = (apiKey) => {
  if (!apiKey || apiKey.length < 8) return '********';
  return `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`;
};

// Helper function to migrate existing API keys to simple format
const migrateExistingApiKeys = async () => {
  try {
    // Clean up any existing documents with null keys
    const deletedCount = await AdminApiKey.deleteMany({ 
      $or: [
        { key: null }, 
        { key: undefined }
      ]
    });
    if (deletedCount.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount.deletedCount} invalid API key documents`);
    }

    // Migrate admin API keys that have originalKey but need to move to key field
    const adminApiKeysToMigrate = await AdminApiKey.find({ 
      originalKey: { $exists: true }
    });
      for (const apiKey of adminApiKeysToMigrate) {
      console.log(`⚠️ Found admin API key with originalKey field: ${apiKey.name}`);
      
      // Only migrate if originalKey exists and is not a placeholder/legacy value
      if (apiKey.originalKey && !apiKey.originalKey.includes('LEGACY') && apiKey.originalKey.trim().length > 0) {
        apiKey.key = apiKey.originalKey;
        // Remove the originalKey field
        apiKey.originalKey = undefined;
        await apiKey.save();
        console.log(`✅ Migrated admin API key: ${apiKey.name}`);
      } else {
        console.log(`❌ Cannot migrate admin API key with invalid originalKey: ${apiKey.name}, keeping current state`);
        // Don't change isActive status - keep the key as it is
        // Just remove the invalid originalKey field
        apiKey.originalKey = undefined;
        await apiKey.save();
      }
    }
    
    if (adminApiKeysToMigrate.length > 0) {
      console.log(`📁 Processed ${adminApiKeysToMigrate.length} admin API keys for migration`);
    }
  } catch (error) {
    console.error('Error migrating existing admin API keys:', error);
  }
};

// Helper function to migrate user API keys
const migrateUserApiKeys = async () => {
  try {
    const usersWithApiKeys = await User.find({ 'apiKeys.0': { $exists: true } });
    
    for (const user of usersWithApiKeys) {
      let userNeedsUpdate = false;
      
      for (const apiKey of user.apiKeys) {
        if (!apiKey.originalKey) {
          console.log(`⚠️ Found user API key without originalKey: ${user.username} - ${apiKey.name}`);
          
          // If this looks like an encrypted key, we can't recover it
          if (apiKey.key.includes(':')) {
            console.log(`❌ Cannot migrate encrypted user API key: ${user.username} - ${apiKey.name}`);
            apiKey.isActive = false;
            apiKey.name = `[LEGACY - NEEDS UPDATE] ${apiKey.name}`;
            apiKey.originalKey = 'LEGACY_ENCRYPTED_KEY_NEEDS_REPLACEMENT';
          } else if (apiKey.key && apiKey.key.startsWith('$2b$')) {
            // This is a bcrypt hash, can't recover
            console.log(`❌ Cannot migrate bcrypt hashed user API key: ${user.username} - ${apiKey.name}`);
            apiKey.isActive = false;
            apiKey.name = `[LEGACY - NEEDS UPDATE] ${apiKey.name}`;
            apiKey.originalKey = 'LEGACY_HASHED_KEY_NEEDS_REPLACEMENT';
          } else {
            // Plain text key, keep it and set originalKey
            apiKey.originalKey = apiKey.key;
            console.log(`✅ Migrated user API key: ${user.username} - ${apiKey.name}`);
          }
          userNeedsUpdate = true;
        }
      }
      
      if (userNeedsUpdate) {
        await user.save();
      }
    }
    
    console.log(`📁 Processed ${usersWithApiKeys.length} users for API key migration`);
  } catch (error) {
    console.error('Error migrating user API keys:', error);
  }
};

const adminApiKeyController = {  // Get all admin API keys
  getAdminApiKeys: async (req, res) => {
    try {
      // Run migration on first access
      await migrateExistingApiKeys();
      await migrateUserApiKeys();
      
      const { showFull } = req.query;
      
      const apiKeys = await AdminApiKey.find()
        .populate('createdBy', 'username')
        .sort({ createdAt: -1 });      const formattedKeys = apiKeys.map(key => ({
        id: key._id,
        name: key.name,
        key: showFull === 'true' ? key.key : maskApiKey(key.key),
        dailyUsage: key.dailyUsage,
        dailyLimit: key.dailyLimit,
        lastResetDate: key.lastResetDate,
        isActive: key.isActive,
        createdAt: key.createdAt,
        createdBy: key.createdBy?.username || 'Unknown'
      }));

      return res.status(200).json({
        message: "Admin API keys fetched successfully",
        apiKeys: formattedKeys,
        success: true,
      });
    } catch (error) {
      console.error("Error fetching admin API keys:", error);
      return res.status(500).json({
        message: "Server error. Please try again later.",
        success: false,
      });
    }  },

  // Add new admin API key
  addAdminApiKey: async (req, res) => {
    try {
      const { name, key, dailyLimit } = req.body;
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json({
          message: "Unauthorized",
          success: false,
        });
      }

      if (!name?.trim() || !key?.trim()) {
        return res.status(400).json({
          message: "API key name and key are required",
          success: false,
        });
      }

      // Validate daily limit
      const limit = parseInt(dailyLimit) || 5000;
      if (limit < 1 || limit > 50000) {
        return res.status(400).json({
          message: "Daily limit must be between 1 and 50,000",
          success: false,
        });
      }      // Clean up any existing documents with null keys first
      try {
        const deletedCount = await AdminApiKey.deleteMany({ 
          $or: [
            { key: null }, 
            { key: undefined }
          ]
        });
        if (deletedCount.deletedCount > 0) {
          console.log(`🧹 Cleaned up ${deletedCount.deletedCount} invalid API key documents`);
        }
      } catch (cleanupError) {
        console.warn('Cleanup warning:', cleanupError.message);
      }

      // Check if API key already exists
      const existingApiKey = await AdminApiKey.findOne({ key: key.trim() });
      if (existingApiKey) {
        return res.status(400).json({
          message: "This API key is already added",
          success: false,
        });
      }      // Create new admin API key
      const newApiKey = new AdminApiKey({
        name: name.trim(),
        key: key.trim(),
        createdBy: adminId,
        dailyUsage: 0,
        dailyLimit: limit,
        isActive: true,
      });

      await newApiKey.save();return res.status(201).json({
        message: "Admin API key added successfully",
        success: true,
      });
    } catch (error) {
      console.error("Error adding admin API key:", error);
      return res.status(500).json({
        message: "Server error. Please try again later.",
        success: false,
      });
    }
  },

  // Get single admin API key (with full key for editing)
  getAdminApiKey: async (req, res) => {
    try {
      const { apiKeyId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json({
          message: "Unauthorized",
          success: false,
        });
      }

      const apiKey = await AdminApiKey.findById(apiKeyId).populate('createdBy', 'username');
      if (!apiKey) {
        return res.status(404).json({
          message: "Admin API key not found",
          success: false,
        });
      }      const formattedKey = {
        id: apiKey._id,
        name: apiKey.name,
        key: apiKey.key, // Return the actual key for editing
        dailyUsage: apiKey.dailyUsage,
        dailyLimit: apiKey.dailyLimit,
        lastResetDate: apiKey.lastResetDate,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
        createdBy: apiKey.createdBy?.username || 'Unknown'
      };

      return res.status(200).json({
        message: "Admin API key fetched successfully",
        adminApiKey: formattedKey,
        success: true,
      });
    } catch (error) {
      console.error("Error fetching admin API key:", error);
      return res.status(500).json({
        message: "Server error. Please try again later.",
        success: false,
      });
    }
  },  // Update admin API key
  updateAdminApiKey: async (req, res) => {
    try {
      const { apiKeyId } = req.params;
      const { name, isActive, key } = req.body;
      const adminId = req.user?.id;

      console.log(`🔄 Admin ${adminId} updating API key ${apiKeyId}:`, { 
        name, 
        isActive, 
        key: key ? 'provided' : 'not provided' 
      });

      if (!adminId) {
        return res.status(401).json({
          message: "Unauthorized",
          success: false,
        });
      }

      // First verify the API key exists
      const existingApiKey = await AdminApiKey.findById(apiKeyId);
      if (!existingApiKey) {
        return res.status(404).json({
          message: "Admin API key not found",
          success: false,
        });
      }

      console.log(`📋 Current API key state:`, { 
        name: existingApiKey.name, 
        isActive: existingApiKey.isActive,
        dailyUsage: existingApiKey.dailyUsage 
      });

      // Build update object
      const updateData = {};

      // Handle name update
      if (name !== undefined) {
        if (!name.trim()) {
          return res.status(400).json({
            message: "API key name cannot be empty",
            success: false,
          });
        }
        updateData.name = name.trim();
        console.log(`📝 Will update name to: ${updateData.name}`);
      }

      // Handle key update
      if (key !== undefined) {
        if (!key.trim()) {
          return res.status(400).json({
            message: "API key value cannot be empty",
            success: false,
          });
        }

        // Check if the new key already exists (excluding current key)
        const existingKey = await AdminApiKey.findOne({ 
          key: key.trim(),
          _id: { $ne: apiKeyId }
        });
        
        if (existingKey) {
          return res.status(400).json({
            message: "This API key already exists",
            success: false,
          });
        }

        updateData.key = key.trim();
        updateData.dailyUsage = 0;
        updateData.lastResetDate = new Date();
        console.log(`🔑 Will update API key and reset usage`);
      }

      // Handle isActive toggle
      if (isActive !== undefined) {
        const newStatus = Boolean(isActive);
        updateData.isActive = newStatus;
        console.log(`🔄 Will toggle isActive from ${existingApiKey.isActive} to ${newStatus}`);
      }

      console.log(`🔄 Performing update with data:`, updateData);

      // Perform the update using updateOne for better control
      const updateResult = await AdminApiKey.updateOne(
        { _id: apiKeyId },
        { $set: updateData },
        { 
          writeConcern: { w: 'majority', j: true },
          upsert: false
        }
      );

      console.log(`📊 Update result:`, {
        acknowledged: updateResult.acknowledged,
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount
      });

      if (!updateResult.acknowledged || updateResult.matchedCount === 0) {
        console.error(`❌ Update operation failed - no documents matched`);
        return res.status(500).json({
          message: "Failed to update API key - document not found",
          success: false,
        });
      }

      if (updateResult.modifiedCount === 0) {
        console.log(`ℹ️ No modifications made - values may be the same`);
      }

      // Verify the update with a fresh query
      const verifiedApiKey = await AdminApiKey.findById(apiKeyId).lean();
      
      if (!verifiedApiKey) {
        console.error(`❌ CRITICAL: API key not found after update!`);
        return res.status(500).json({
          message: "Update verification failed",
          success: false,
        });
      }

      console.log(`✅ Verification - Updated API key state:`, {
        id: verifiedApiKey._id,
        name: verifiedApiKey.name,
        isActive: verifiedApiKey.isActive,
        dailyUsage: verifiedApiKey.dailyUsage,
        dailyLimit: verifiedApiKey.dailyLimit
      });

      // Double-check the isActive field if it was updated
      if (isActive !== undefined) {
        const expectedStatus = Boolean(isActive);
        if (verifiedApiKey.isActive !== expectedStatus) {
          console.error(`❌ CRITICAL: isActive verification failed! Expected: ${expectedStatus}, Got: ${verifiedApiKey.isActive}`);
          return res.status(500).json({
            message: "Database update verification failed",
            success: false,
          });
        }
        console.log(`✅ isActive verification passed: ${verifiedApiKey.isActive}`);
      }

      return res.status(200).json({
        message: "Admin API key updated successfully",
        success: true,
      });
    } catch (error) {
      console.error("❌ Error updating admin API key:", error);
      return res.status(500).json({
        message: "Server error. Please try again later.",
        success: false,
      });
    }
  },

  // Delete admin API key
  deleteAdminApiKey: async (req, res) => {
    try {
      const { apiKeyId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json({
          message: "Unauthorized",
          success: false,
        });
      }

      const apiKey = await AdminApiKey.findById(apiKeyId);
      if (!apiKey) {
        return res.status(404).json({
          message: "Admin API key not found",
          success: false,
        });
      }

      await AdminApiKey.findByIdAndDelete(apiKeyId);

      return res.status(200).json({
        message: "Admin API key deleted successfully",
        success: true,
      });
    } catch (error) {
      console.error("Error deleting admin API key:", error);
      return res.status(500).json({
        message: "Server error. Please try again later.",
        success: false,
      });
    }
  },

  // Get admin API key usage statistics
  getAdminApiKeyUsage: async (req, res) => {
    try {
      const adminKeys = await AdminApiKey.find();

      // Reset daily usage if it's a new day
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let needsUpdate = false;
      adminKeys.forEach((apiKey) => {
        const lastReset = new Date(apiKey.lastResetDate);
        lastReset.setHours(0, 0, 0, 0);

        if (today > lastReset) {
          apiKey.dailyUsage = 0;
          apiKey.lastResetDate = new Date();
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        await Promise.all(adminKeys.map(key => key.save()));
      }      // Calculate usage statistics
      const activeKeys = adminKeys.filter((key) => key.isActive);
      const totalUsage = activeKeys.reduce((sum, key) => sum + key.dailyUsage, 0);
      const totalLimit = activeKeys.reduce((sum, key) => sum + key.dailyLimit, 0);
      const usagePercentage = totalLimit > 0 ? Math.round((totalUsage / totalLimit) * 100) : 0;

      console.log('📊 Usage calculation:', {
        totalKeysFound: adminKeys.length,
        activeKeysFound: activeKeys.length,
        totalUsage,
        totalLimit,
        activeKeysDetails: activeKeys.map(k => ({ id: k._id, name: k.name, isActive: k.isActive, limit: k.dailyLimit }))
      });

      const usage = {
        totalUsageToday: totalUsage,
        totalLimit,
        usagePercentage,
        activeKeysCount: activeKeys.length,
        totalKeys: adminKeys.length,
        availableQuota: totalLimit - totalUsage,
        resetTime: "00:00 UTC",
      };

      return res.status(200).json({
        message: "Admin API usage statistics fetched successfully",
        usage,
        success: true,
      });
    } catch (error) {
      console.error("Error fetching admin API usage:", error);
      return res.status(500).json({
        message: "Server error. Please try again later.",
        success: false,
      });
    }
  },

  // Toggle API key mode (user keys vs admin keys)
  toggleApiKeyMode: async (req, res) => {
    try {
      const { useAdminKeys } = req.body;
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json({
          message: "Unauthorized",
          success: false,
        });
      }

      // Update or create the system setting
      await SystemSettings.findOneAndUpdate(
        { settingName: 'useAdminApiKeys' },
        {
          settingName: 'useAdminApiKeys',
          settingValue: Boolean(useAdminKeys),
          description: 'Whether to use admin API keys for all submissions instead of user keys',
          updatedBy: adminId,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );

      return res.status(200).json({
        message: `API key mode ${useAdminKeys ? 'enabled' : 'disabled'} successfully`,
        useAdminKeys: Boolean(useAdminKeys),
        success: true,
      });
    } catch (error) {
      console.error("Error toggling API key mode:", error);
      return res.status(500).json({
        message: "Server error. Please try again later.",
        success: false,
      });
    }
  },

  // Get current API key mode
  getApiKeyMode: async (req, res) => {
    try {
      const setting = await SystemSettings.findOne({ settingName: 'useAdminApiKeys' });
      const useAdminKeys = setting ? Boolean(setting.settingValue) : false;

      return res.status(200).json({
        message: "API key mode fetched successfully",
        useAdminKeys,
        success: true,
      });
    } catch (error) {
      console.error("Error fetching API key mode:", error);
      return res.status(500).json({
        message: "Server error. Please try again later.",
        success: false,
      });
    }
  }
};

export default adminApiKeyController;
