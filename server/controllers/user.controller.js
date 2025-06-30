import User from "../models/user.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../utils/errors.js";
import { createToken } from "../utils/jwt.js";
import { GridFSBucket } from "mongodb";
import { mongoose } from "../app.js";

export const updateUser = async (req, res) => {
  try {
    console.log("update api called");
    const {
      username,
      gender,
      location,
      birthday,
      github,
      skills,
      education,
      linkedIn,
      name,
      bio,
      email,
    } = req.body;

    // console.log(req.body);

    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
        success: false,
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Ensure username and name are not empty strings
    if (!username?.trim() || !name?.trim()) {
      return res.status(400).json({
        message: "Username and profile name cannot be empty.",
        success: false,
      });
    }

    user.username = username;
    user.profile.name = name;
    user.email = email;
    user.profile = Object.assign(user.profile, {
      bio,
      gender,
      location,
      birthday,
      github,
      skills,
      education,
      linkedIn,
    });

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        username: user.username,
        profile: user.profile,
        email: user.email,
      },
      success: true,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.status(500).json({
      message: "Server error. Please try again later.",
      success: false,
    });
  }
};

export const uploadProfilePic = async (req, res) => {
  console.log("API is hit");

  try {
    const userId = req.user?.id;
    const file = req.file;

    if (!userId || !file || !file.id) {
      return res
        .status(400)
        .json({ error: "User ID and valid file are required." });
    }

    console.log("Uploading avatar for user:", userId);

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { "profile.avatar": file.id } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({
      message: "Avatar uploaded successfully.",
      fileId: file.id,
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ error: "Failed to upload profile picture." });
  }
};

export const getProfilePic = async (req, res) => {
  console.log("API hit OK");

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const fileId = user.profile?.avatar;
    if (!fileId) {
      return res.status(404).json({ error: "Profile picture not found." });
    }

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: "Invalid file ID." });
    }

    const bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: "uploads",
    });

    const fileStream = bucket.openDownloadStream(
      new mongoose.Types.ObjectId(fileId)
    );

    res.set("Content-Type", "image/jpeg");

    fileStream.on("error", (error) => {
      console.error("Error streaming profile picture:", error);
      if (!res.headersSent) {
        return res
          .status(500)
          .json({ error: "Error retrieving profile picture." });
      }
    });

    fileStream.on("end", () => {
      console.log("Profile picture stream completed.");
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error("Error fetching profile picture:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Server error." });
    }
  }
};

export const removeProfilePic = async (req, res) => {
  console.log("removeProfilePic API called");

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User does not exist." });
    }

    const fileId = user.profile?.avatar;
    if (!fileId) {
      console.log("Avatar not found");
      return res.status(404).json({ message: "Avatar does not exist." });
    }

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      console.log("Invalid file ID");
      return res.status(400).json({ message: "Invalid file ID." });
    }

    const bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: "uploads",
    });

    // await new Promise((resolve, reject) => {
    //   bucket.delete(new mongoose.Types.ObjectId(fileId), (err) => {
    //     if (err) {
    //       console.error("Error removing avatar:", err);
    //       reject(err);
    //     } else {
    //       resolve();
    //     }
    //   });
    // });

    await bucket.delete(new mongoose.Types.ObjectId(fileId));

    user.profile.avatar = null;
    await user.save();

    console.log("Avatar removed successfully.");
    res.status(200).json({ message: "Avatar removed successfully." });
  } catch (error) {
    console.error("Error removing profile picture:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// API Key Management Functions

export const addApiKey = async (req, res) => {
  try {
    const { name, key } = req.body;
    const userId = req.user?.id;

    if (!userId) {
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

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }    // Check if API key already exists
    const existingApiKey = user.apiKeys.find(apiKey => apiKey.key === key.trim());
    if (existingApiKey) {
      return res.status(400).json({
        message: "This API key is already added",
        success: false,
      });
    }    // Add the API key to user
    user.apiKeys.push({
      name: name.trim(),
      key: key.trim(),
      dailyUsage: 0,
      dailyLimit: 50,
      lastResetDate: new Date(),
      isActive: true,
    });

    await user.save();

    return res.status(201).json({
      message: "API key added successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error adding API key:", error);
    return res.status(500).json({
      message: "Server error. Please try again later.",
      success: false,
    });
  }
};

export const getApiKeys = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }    // Return API keys - optionally expose full key value for editing
    const { showFull } = req.query;
    const apiKeys = user.apiKeys.map((apiKey) => ({
      id: apiKey._id,
      name: apiKey.name,
      key: showFull === 'true' ? apiKey.key : `${apiKey.key.substring(0, 8)}...${apiKey.key.slice(-4)}`, // Mask key unless showFull is requested
      dailyUsage: apiKey.dailyUsage,
      dailyLimit: apiKey.dailyLimit,
      lastResetDate: apiKey.lastResetDate,
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt,
    }));

    return res.status(200).json({
      message: "API keys fetched successfully",
      apiKeys,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return res.status(500).json({
      message: "Server error. Please try again later.",
      success: false,
    });
  }
};

export const updateApiKey = async (req, res) => {
  try {
    const { apiKeyId } = req.params;
    const { name, isActive, key } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    const apiKey = user.apiKeys.id(apiKeyId);
    if (!apiKey) {
      return res.status(404).json({
        message: "API key not found",
        success: false,
      });
    }

    // Update fields if provided
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          message: "API key name cannot be empty",
          success: false,
        });
      }
      apiKey.name = name.trim();
    }

    if (key !== undefined) {
      if (!key.trim()) {
        return res.status(400).json({
          message: "API key value cannot be empty",
          success: false,
        });
      }        // Check if the new key already exists (excluding current key)
      const otherApiKeys = user.apiKeys.filter(otherKey => otherKey._id.toString() !== apiKeyId);
      const existingKey = otherApiKeys.find(otherKey => otherKey.key === key.trim());
      if (existingKey) {
        return res.status(400).json({
          message: "This API key already exists",
          success: false,
        });
      }
        // Update the key
      apiKey.key = key.trim();
      // Reset usage when key is changed
      apiKey.dailyUsage = 0;
      apiKey.lastResetDate = new Date();
    }

    if (isActive !== undefined) {
      apiKey.isActive = Boolean(isActive);
    }

    await user.save();

    return res.status(200).json({
      message: "API key updated successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error updating API key:", error);
    return res.status(500).json({
      message: "Server error. Please try again later.",
      success: false,
    });
  }
};

export const deleteApiKey = async (req, res) => {
  try {
    const { apiKeyId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    const apiKey = user.apiKeys.id(apiKeyId);
    if (!apiKey) {
      return res.status(404).json({
        message: "API key not found",
        success: false,
      });
    }

    // Remove the API key
    user.apiKeys.pull(apiKeyId);
    await user.save();

    return res.status(200).json({
      message: "API key deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return res.status(500).json({
      message: "Server error. Please try again later.",
      success: false,
    });
  }
};

export const getApiKeyUsage = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Reset daily usage if it's a new day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let needsUpdate = false;
    user.apiKeys.forEach((apiKey) => {
      const lastReset = new Date(apiKey.lastResetDate);
      lastReset.setHours(0, 0, 0, 0);

      if (today > lastReset) {
        apiKey.dailyUsage = 0;
        apiKey.lastResetDate = new Date();
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      await user.save();
    }

    // Calculate usage statistics
    const activeKeys = user.apiKeys.filter((key) => key.isActive);
    const totalUsage = activeKeys.reduce(
      (sum, key) => sum + key.dailyUsage,
      0
    );
    const totalLimit = activeKeys.reduce(
      (sum, key) => sum + key.dailyLimit,
      0
    );
    const usagePercentage =
      totalLimit > 0 ? Math.round((totalUsage / totalLimit) * 100) : 0;

    const usage = {
      totalUsage,
      totalLimit,
      usagePercentage,
      activeKeys: activeKeys.length,
      totalKeys: user.apiKeys.length,
      availableQuota: totalLimit - totalUsage,
      resetTime: "00:00 UTC",
    };

    return res.status(200).json({
      message: "Usage statistics fetched successfully",
      usage,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching API usage:", error);
    return res.status(500).json({
      message: "Server error. Please try again later.",
      success: false,
    });
  }
};
