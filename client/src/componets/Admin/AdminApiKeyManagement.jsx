import React, { useState, useEffect } from "react";
import {
  Key,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Activity,
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings,
  Users,
  Shield,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  TrendingUp,
  Server,
  Clock,
} from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// Skeleton loader component for API key cards
const ApiKeyCardSkeleton = () => (
  <div className="animate-pulse bg-gray-800/80 rounded-xl p-6 flex flex-col">
    <div className="flex items-center justify-between mb-4">
      <div className="h-6 bg-gray-700 rounded w-1/3"></div>
      <div className="h-4 w-16 bg-gray-700 rounded"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-6 bg-gray-700 rounded"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-6 bg-gray-700 rounded"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-6 bg-gray-700 rounded"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-6 bg-gray-700 rounded"></div>
      </div>
    </div>
  </div>
);

// Stats card component
const StatsCard = ({
  title,
  value,
  description,
  icon: Icon,
  gradient,
  textColor,
  iconColor,
  iconBg,
}) => (
  <div
    className={`group bg-gradient-to-br ${gradient} rounded-xl shadow-lg overflow-hidden relative hover:shadow-xl transition-all duration-300`}
  >
    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]"></div>
    <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
    <div className="px-6 py-5 relative z-10">
      <div className="flex justify-between items-start">
        <div>
          <p className={`${textColor} text-sm font-medium`}>{title}</p>
          <h3 className="mt-1 text-3xl font-bold text-white">{value}</h3>
        </div>
        <div className={`p-3 ${iconBg} rounded-lg`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
      <div className="mt-4">
        <span className={`${textColor}/70 text-xs`}>{description}</span>
      </div>
    </div>
  </div>
);

// Grid background CSS
const gridBgStyle = `
@keyframes gridBackgroundMove {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 50px 50px;
  }
}

.bg-grid-white {
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  animation: gridBackgroundMove 15s linear infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-shimmer {
  background: linear-gradient(90deg, #4b5563 25%, #6b7280 50%, #4b5563 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
`;

const AdminApiKeyManagement = () => {
  const navigate = useNavigate();
  const [adminApiKeys, setAdminApiKeys] = useState([]);
  const [fullApiKeys, setFullApiKeys] = useState({}); // Store full API keys for editing
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newApiKey, setNewApiKey] = useState({
    name: "",
    key: "",
    dailyLimit: 5000,
  });
  const [visibleKeys, setVisibleKeys] = useState({});
  const [editingKey, setEditingKey] = useState(null);
  const [editingKeyValue, setEditingKeyValue] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiKeyMode, setApiKeyMode] = useState(false); // false = user keys, true = admin keys
  const [modeLoading, setModeLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState({}); // Track loading state for individual toggles

  useEffect(() => {
    fetchAdminApiKeys();
    fetchUsage();
    fetchApiKeyMode();
  }, []);
  const fetchAdminApiKeys = async () => {
    try {
      // console.log("🔄 Fetching admin API keys...");
      const response = await axiosInstance.get("/admin/api-keys");
      if (response.data.success) {
        // console.log(
        //   "✅ Admin API keys fetched:",
        //   response.data.apiKeys?.length || 0,
        //   "keys"
        // );
        // console.log(
        //   "📋 API Keys data:",
        //   response.data.apiKeys?.map((k) => ({
        //     id: k.id,
        //     name: k.name,
        //     isActive: k.isActive,
        //     dailyLimit: k.dailyLimit,
        //   }))
        // );
        setAdminApiKeys(response.data.apiKeys || []);
      } else {
        console.warn(
          "⚠️ Failed to fetch admin API keys:",
          response.data.message
        );
        setAdminApiKeys([]);
      }
    } catch (error) {
      console.error("❌ Error fetching admin API keys:", error);
      toast.error("Failed to fetch admin API keys");
      setAdminApiKeys([]); // Ensure it's always an array
    }
  };

  const fetchFullApiKey = async (apiKeyId) => {
    try {
      const response = await axiosInstance.get(`/admin/api-keys/${apiKeyId}`);
      if (response.data.success) {
        setFullApiKeys((prev) => ({
          ...prev,
          [apiKeyId]: response.data.adminApiKey.key,
        }));
      }
    } catch (error) {
      console.error("Error fetching full API key:", error);
      toast.error("Failed to fetch full API key");
    }
  };
  const fetchUsage = async () => {
    try {
      // console.log("📊 Fetching usage statistics...");
      const response = await axiosInstance.get("/admin/api-keys/usage");
      if (response.data.success) {
        // console.log("✅ Usage statistics fetched:", response.data.usage);
        // console.log("📈 Usage details:", {
        //   totalLimit: response.data.usage.totalLimit,
        //   activeKeysCount: response.data.usage.activeKeysCount,
        //   totalKeys: response.data.usage.totalKeys,
        // });
        setUsage(response.data.usage);
      } else {
        console.warn(
          "⚠️ Failed to fetch usage statistics:",
          response.data.message
        );
      }
    } catch (error) {
      console.error("❌ Error fetching usage:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApiKeyMode = async () => {
    try {
      const response = await axiosInstance.get("/admin/api-keys/mode");
      if (response.data.success) {
        setApiKeyMode(response.data.useAdminKeys);
      }
    } catch (error) {
      console.error("Error fetching API key mode:", error);
    }
  };

  const handleAddApiKey = async (e) => {
    e.preventDefault();
    if (!newApiKey.name.trim() || !newApiKey.key.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const response = await axiosInstance.post("/admin/api-keys", newApiKey);
      if (response.data.success) {
        setNewApiKey({ name: "", key: "", dailyLimit: 5000 });
        setShowAddForm(false);
        fetchAdminApiKeys();
        fetchUsage();
        toast.success("Admin API key added successfully");
      }
    } catch (error) {
      console.error("Error adding admin API key:", error);
      toast.error(
        error.response?.data?.message || "Error adding admin API key"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteApiKey = async (apiKeyId) => {
    if (!confirm("Are you sure you want to delete this admin API key?")) return;

    try {
      const response = await axiosInstance.delete(
        `/admin/api-keys/${apiKeyId}`
      );
      if (response.data.success) {
        fetchAdminApiKeys();
        fetchUsage();
        toast.success("Admin API key deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting admin API key:", error);
      toast.error("Failed to delete admin API key");
    }
  };
  const handleToggleApiKeyMode = async () => {
    setModeLoading(true);
    try {
      const newMode = !apiKeyMode;
      const response = await axiosInstance.post("/admin/api-keys/toggle-mode", {
        useAdminKeys: newMode,
      });
      if (response.data.success) {
        setApiKeyMode(newMode);
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error("Error toggling API key mode:", error);
      toast.error("Failed to toggle API key mode");
    } finally {
      setModeLoading(false);
    }
  };

  const toggleKeyVisibility = async (apiKeyId) => {
    if (!fullApiKeys[apiKeyId]) {
      await fetchFullApiKey(apiKeyId);
    }
    setVisibleKeys((prev) => ({
      ...prev,
      [apiKeyId]: !prev[apiKeyId],
    }));
  };
  const handleUpdateApiKey = async (apiKeyId, updatedData) => {
    try {
      const response = await axiosInstance.put(
        `/admin/api-keys/${apiKeyId}`,
        updatedData
      );
      if (response.data.success) {
        await fetchAdminApiKeys();
        await fetchUsage();
        setEditingKey(null);
        setEditingKeyValue(null);
        toast.success("Admin API key updated successfully");
      }
    } catch (error) {
      console.error("Error updating admin API key:", error);
      toast.error(
        error.response?.data?.message || "Failed to update admin API key"
      );
    }
  }; // Dedicated function for toggling individual key status
  const handleToggleKeyStatus = async (apiKeyId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      // console.log(
      //   `🔄 Toggling API key ${apiKeyId} from ${currentStatus} to ${newStatus}`
      // );

      // Set loading state for this specific toggle
      setToggleLoading((prev) => ({ ...prev, [apiKeyId]: true }));

      // Show immediate feedback
      toast.loading(`${newStatus ? "Enabling" : "Disabling"} API key...`, {
        id: `toggle-key-${apiKeyId}`,
      });

      const response = await axiosInstance.put(`/admin/api-keys/${apiKeyId}`, {
        isActive: newStatus,
      });

      // console.log("Toggle response:", response.data);
      if (response.data.success) {
        // Short delay for UI consistency, atomic update should be immediate
        await new Promise((resolve) => setTimeout(resolve, 200));

        // console.log("🔄 Refreshing data after atomic update...");

        // Fetch data sequentially to ensure consistency
        await fetchAdminApiKeys();
        await fetchUsage();

        toast.success(
          `API key ${newStatus ? "enabled" : "disabled"} successfully`,
          { id: `toggle-key-${apiKeyId}` }
        );
        // console.log("✅ Data refresh completed");
      } else {
        toast.error("Failed to toggle API key status", {
          id: `toggle-key-${apiKeyId}`,
        });
      }
    } catch (error) {
      console.error("❌ Error toggling API key status:", error);
      toast.error(
        error.response?.data?.message || "Failed to toggle API key status",
        { id: `toggle-key-${apiKeyId}` }
      );

      // Refresh data in case of error to ensure UI is in sync
      await Promise.all([fetchAdminApiKeys(), fetchUsage()]);
    } finally {
      // Remove loading state
      setToggleLoading((prev) => {
        const newState = { ...prev };
        delete newState[apiKeyId];
        return newState;
      });
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <style>{gridBgStyle}</style>
        <div className="from-gray-900 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="mt-16"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                  API Key Management
                </h1>
              </div>
              <div className="flex items-center space-x-2 text-blue-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <ApiKeyCardSkeleton />
            <ApiKeyCardSkeleton />
            <ApiKeyCardSkeleton />
          </div>
          <div className="space-y-4">
            <ApiKeyCardSkeleton />
            <ApiKeyCardSkeleton />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <style>{gridBgStyle}</style>

      {/* Header Section */}
      <div className="from-gray-900 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="mt-16"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                API Key Management
              </h1>
            </div>

            {/* API Key Mode Toggle */}
            <div className="flex items-center space-x-4 bg-gray-800/50 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span
                  className={`text-sm ${
                    !apiKeyMode ? "text-white font-medium" : "text-gray-400"
                  }`}
                >
                  User Keys
                </span>
              </div>

              <button
                onClick={handleToggleApiKeyMode}
                disabled={modeLoading}
                className="relative inline-flex items-center"
              >
                {modeLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                ) : apiKeyMode ? (
                  <ToggleRight className="w-8 h-8 text-blue-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
              </button>

              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <span
                  className={`text-sm ${
                    apiKeyMode ? "text-white font-medium" : "text-gray-400"
                  }`}
                >
                  Admin Keys
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Mode Status Banner */}
        <div
          className={`p-4 rounded-xl mb-8 ${
            apiKeyMode
              ? "bg-gradient-to-r from-blue-900/50 to-blue-800/50 border border-blue-500/30"
              : "bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600/30"
          } backdrop-blur-sm`}
        >
          <div className="flex items-center space-x-3">
            {apiKeyMode ? (
              <>
                <Shield className="w-6 h-6 text-blue-400" />
                <div>
                  <span className="text-blue-400 font-semibold text-lg">
                    Admin API Keys Active
                  </span>
                  <p className="text-gray-300 text-sm">
                    All student submissions and code executions use centralized
                    admin keys
                  </p>
                </div>
              </>
            ) : (
              <>
                <Users className="w-6 h-6 text-gray-400" />
                <div>
                  <span className="text-gray-300 font-semibold text-lg">
                    User API Keys Active
                  </span>
                  <p className="text-gray-400 text-sm">
                    Students use their own API keys for code compilation and
                    testing
                  </p>
                </div>
              </>
            )}
          </div>
        </div>{" "}
        {/* Statistics Cards */}
        {usage && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Usage Today"
              value={usage.totalUsageToday || 0}
              description="API calls made today"
              icon={TrendingUp}
              gradient="from-green-900/90 to-green-800/80"
              textColor="text-green-300"
              iconColor="text-green-400"
              iconBg="bg-green-500/20"
            />
            <StatsCard
              title="Daily Limit"
              value={usage.totalLimit || 0}
              description="Maximum daily requests"
              icon={Server}
              gradient="from-blue-900/90 to-blue-800/80"
              textColor="text-blue-300"
              iconColor="text-blue-400"
              iconBg="bg-blue-500/20"
            />
            <StatsCard
              title="Active Keys"
              value={`${usage.activeKeysCount || 0}/${usage.totalKeys || 0}`}
              description="Active / Total API keys"
              icon={Key}
              gradient="from-purple-900/90 to-purple-800/80"
              textColor="text-purple-300"
              iconColor="text-purple-400"
              iconBg="bg-purple-500/20"
            />
            <StatsCard
              title="Usage Rate"
              value={`${
                usage.totalLimit > 0
                  ? Math.round((usage.totalUsageToday / usage.totalLimit) * 100)
                  : 0
              }%`}
              description="Of daily limit used"
              icon={Clock}
              gradient="from-amber-900/90 to-amber-800/80"
              textColor="text-amber-300"
              iconColor="text-amber-400"
              iconBg="bg-amber-500/20"
            />
          </div>
        )}
        {/* Admin API Keys Management Section */}
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-lg overflow-hidden border border-gray-700/50 backdrop-blur-sm">
          {" "}
          <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 py-6 px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Key className="w-6 h-6 text-blue-400" />
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Admin API Keys ({adminApiKeys?.length || 0})
                  </h2>
                  {adminApiKeys?.length > 0 && (
                    <p className="text-sm text-gray-300 mt-1">
                      {adminApiKeys.filter((key) => key.isActive).length}{" "}
                      active,{" "}
                      {adminApiKeys.filter((key) => !key.isActive).length}{" "}
                      inactive
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {adminApiKeys?.length > 0 && (
                  <div className="text-right text-sm text-gray-300">
                    <div>Total Quota: {usage?.totalLimit || 0}</div>
                    <div>Used Today: {usage?.totalUsageToday || 0}</div>
                  </div>
                )}
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add Admin Key</span>
                </button>
              </div>
            </div>
          </div>
          <div className="p-8">
            {" "}
            {/* Add API Key Form */}
            {showAddForm && (
              <div className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-xl p-6 mb-6 border border-gray-600/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-blue-400" />
                  Add New Admin API Key
                </h3>
                <form onSubmit={handleAddApiKey} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Key Name *
                      </label>
                      <input
                        type="text"
                        value={newApiKey.name}
                        onChange={(e) =>
                          setNewApiKey({ ...newApiKey, name: e.target.value })
                        }
                        placeholder="e.g., Primary Admin Key"
                        className="w-full bg-gray-600 border border-gray-500 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        API Key *
                      </label>
                      <input
                        type="text"
                        value={newApiKey.key}
                        onChange={(e) =>
                          setNewApiKey({ ...newApiKey, key: e.target.value })
                        }
                        placeholder="Your Judge0 RapidAPI key"
                        className="w-full bg-gray-600 border border-gray-500 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Daily Limit
                      </label>
                      <input
                        type="number"
                        value={newApiKey.dailyLimit}
                        onChange={(e) =>
                          setNewApiKey({
                            ...newApiKey,
                            dailyLimit: parseInt(e.target.value),
                          })
                        }
                        min="100"
                        max="50000"
                        className="w-full bg-gray-600 border border-gray-500 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-200">
                    <strong>💡 Tip:</strong> Add multiple keys from different
                    RapidAPI accounts to increase your total quota. Each key
                    will be automatically load-balanced by the system.
                  </div>
                  <div className="flex items-center space-x-4 pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 hover:scale-105"
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                      <span className="font-medium">
                        {submitting ? "Adding..." : "Add Key"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-gray-400 hover:text-white px-6 py-3 rounded-lg transition-colors hover:bg-gray-700/50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
            {/* Bulk Actions */}
            {adminApiKeys?.length > 0 && (
              <div className="bg-gradient-to-r from-gray-700/30 to-gray-800/30 rounded-xl p-4 mb-6 border border-gray-600/30">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-gray-400" />
                    Bulk Actions
                  </h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        adminApiKeys.forEach((key) => {
                          if (!key.isActive) {
                            handleUpdateApiKey(key.id, { isActive: true });
                          }
                        });
                        toast.success("All keys activated");
                      }}
                      className="text-green-400 hover:text-green-300 px-4 py-2 rounded-lg transition-colors hover:bg-green-900/20 text-sm font-medium"
                    >
                      Enable All
                    </button>
                    <button
                      onClick={() => {
                        adminApiKeys.forEach((key) => {
                          if (key.isActive) {
                            handleUpdateApiKey(key.id, { isActive: false });
                          }
                        });
                        toast.success("All keys deactivated");
                      }}
                      className="text-red-400 hover:text-red-300 px-4 py-2 rounded-lg transition-colors hover:bg-red-900/20 text-sm font-medium"
                    >
                      Disable All
                    </button>
                    <div className="text-sm text-gray-400">
                      Quick manage all {adminApiKeys.length} keys
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* API Keys List */}
            <div className="space-y-4">
              {" "}
              {!adminApiKeys || adminApiKeys.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gray-700/30 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <Key className="w-12 h-12 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    No Admin API Keys Added
                  </h3>
                  <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                    Add multiple admin API keys to enable centralized key
                    management. You can activate/deactivate individual keys and
                    the system will automatically load balance across active
                    keys.
                  </p>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6 max-w-md mx-auto">
                    <p className="text-blue-200 text-sm">
                      <strong>💡 Pro tip:</strong> Add multiple keys from
                      different accounts to increase your total daily quota and
                      ensure uninterrupted service.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Your First Admin Key</span>
                  </button>
                </div>
              ) : (
                (adminApiKeys || []).map((apiKey) => (
                  <div
                    key={apiKey.id}
                    className={`bg-gradient-to-r rounded-xl p-6 border hover:border-gray-500/50 transition-all duration-200 ${
                      apiKey.isActive
                        ? "from-gray-700/50 to-gray-800/50 border-gray-600/30"
                        : "from-gray-800/30 to-gray-900/30 border-gray-700/30 opacity-75"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {" "}
                        <div className="flex items-center justify-between mb-4">
                          {" "}
                          <div className="flex items-center space-x-3">
                            <h4 className="text-xl font-semibold text-white">
                              {apiKey.name}
                            </h4>
                            <div
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                apiKey.isActive
                                  ? "bg-green-900/50 text-green-200 border border-green-500/30"
                                  : "bg-red-900/50 text-red-200 border border-red-500/30"
                              }`}
                            >
                              {apiKey.isActive ? "Active" : "Inactive"}
                            </div>
                            {apiKey.isActive && (
                              <div className="flex items-center space-x-1 text-green-400 text-xs">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span>Live</span>
                              </div>
                            )}
                          </div>{" "}
                          {/* Individual Key Toggle */}
                          <div className="flex items-center space-x-3">
                            <span className="text-gray-400 text-sm">
                              Enable Key:
                            </span>
                            <button
                              onClick={() =>
                                handleToggleKeyStatus(
                                  apiKey.id,
                                  apiKey.isActive
                                )
                              }
                              disabled={toggleLoading[apiKey.id]}
                              className="relative inline-flex items-center group disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                apiKey.isActive
                                  ? "Disable this API key"
                                  : "Enable this API key"
                              }
                            >
                              {toggleLoading[apiKey.id] ? (
                                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                              ) : apiKey.isActive ? (
                                <ToggleRight className="w-8 h-8 text-green-500 hover:text-green-400 transition-colors group-hover:scale-110" />
                              ) : (
                                <ToggleLeft className="w-8 h-8 text-gray-400 hover:text-gray-300 transition-colors group-hover:scale-110" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* API Key Card */}
                          <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-5 shadow-lg group transition-all duration-300 hover:scale-[1.025] hover:shadow-2xl border border-gray-700/40">
                            <div className="flex items-center space-x-2 mb-2">
                              <Key className="w-4 h-4 text-blue-400" />
                              <span className="text-gray-300 text-xs font-semibold tracking-wide uppercase">
                                API Key
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                              <code
                                className="bg-gray-900/70 px-3 py-2 rounded text-sm text-white font-mono flex-1 truncate border border-gray-700/40 cursor-pointer hover:bg-gray-900/90 transition-all"
                                title={
                                  visibleKeys[apiKey.id] &&
                                  fullApiKeys[apiKey.id]
                                    ? fullApiKeys[apiKey.id]
                                    : apiKey.key
                                }
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    visibleKeys[apiKey.id] &&
                                      fullApiKeys[apiKey.id]
                                      ? fullApiKeys[apiKey.id]
                                      : apiKey.key
                                  );
                                  toast.success("API key copied!");
                                }}
                              >
                                {visibleKeys[apiKey.id] &&
                                fullApiKeys[apiKey.id]
                                  ? fullApiKeys[apiKey.id]
                                  : `${apiKey.key.substring(
                                      0,
                                      8
                                    )}...${apiKey.key.slice(-4)}`}
                              </code>
                              <button
                                onClick={() => toggleKeyVisibility(apiKey.id)}
                                className="text-gray-400 hover:text-white p-2 rounded transition-colors hover:bg-gray-700/50 flex-shrink-0"
                                title={
                                  visibleKeys[apiKey.id]
                                    ? "Hide key"
                                    : "Show full key"
                                }
                              >
                                {visibleKeys[apiKey.id] ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            <span className="absolute top-3 right-3 bg-blue-900/60 text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wider border border-blue-500/20">
                              Copy
                            </span>
                          </div>

                          {/* Usage Today Card */}
                          <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-5 shadow-lg group transition-all duration-300 hover:scale-[1.025] hover:shadow-2xl border border-gray-700/40">
                            <div className="flex items-center space-x-2 mb-2">
                              <Activity className="w-4 h-4 text-green-400" />
                              <span className="text-gray-300 text-xs font-semibold tracking-wide uppercase">
                                Usage Today
                              </span>
                            </div>
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-white font-semibold">
                                <span>{apiKey.dailyUsage}</span>
                                <span className="text-gray-400">
                                  / {apiKey.dailyLimit}
                                </span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2 mt-2 relative group">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    apiKey.dailyUsage / apiKey.dailyLimit > 0.9
                                      ? "bg-red-500"
                                      : apiKey.dailyUsage / apiKey.dailyLimit >
                                        0.7
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  }`}
                                  style={{
                                    width: `${Math.min(
                                      (apiKey.dailyUsage / apiKey.dailyLimit) *
                                        100,
                                      100
                                    )}%`,
                                  }}
                                ></div>
                                <span className="absolute left-1/2 -translate-x-1/2 -top-7 bg-gray-900/90 text-xs text-white px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-all border border-gray-700/40">
                                  {apiKey.dailyUsage} / {apiKey.dailyLimit} used
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-1 text-xs">
                                <span
                                  className={`font-bold ${
                                    apiKey.dailyUsage / apiKey.dailyLimit > 0.9
                                      ? "text-red-400"
                                      : apiKey.dailyUsage / apiKey.dailyLimit >
                                        0.7
                                      ? "text-yellow-400"
                                      : "text-green-400"
                                  }`}
                                >
                                  {Math.round(
                                    (apiKey.dailyUsage / apiKey.dailyLimit) *
                                      100
                                  )}
                                  % used
                                </span>
                                <span className="text-gray-500">
                                  {apiKey.dailyLimit - apiKey.dailyUsage}{" "}
                                  remaining
                                </span>
                              </div>
                            </div>
                            <span className="absolute top-3 right-3 bg-green-900/60 text-green-300 text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wider border border-green-500/20">
                              Live
                            </span>
                          </div>

                          {/* Created Date Card */}
                          <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-5 shadow-lg group transition-all duration-300 hover:scale-[1.025] hover:shadow-2xl border border-gray-700/40">
                            <div className="flex items-center space-x-2 mb-2">
                              <Clock className="w-4 h-4 text-amber-400" />
                              <span className="text-gray-300 text-xs font-semibold tracking-wide uppercase">
                                Created
                              </span>
                            </div>
                            <div className="text-white font-semibold mt-2 text-lg">
                              {new Date(apiKey.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </div>
                            <span className="absolute top-3 right-3 bg-amber-900/60 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wider border border-amber-500/20">
                              Date
                            </span>
                          </div>
                        </div>
                      </div>{" "}
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 ml-6">
                        <button
                          onClick={() => {
                            setEditingKey(apiKey.id);
                            setEditingKeyValue({
                              name: apiKey.name,
                              dailyLimit: apiKey.dailyLimit,
                            });
                          }}
                          className="text-blue-400 hover:text-blue-300 p-3 rounded-lg transition-colors hover:bg-blue-900/20"
                          title="Edit API Key"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteApiKey(apiKey.id)}
                          className="text-red-400 hover:text-red-300 p-3 rounded-lg transition-colors hover:bg-red-900/20"
                          title="Delete API Key"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Edit Form */}
                    {editingKey === apiKey.id && (
                      <div className="mt-6 pt-6 border-t border-gray-600/50">
                        <h5 className="text-lg font-semibold text-white mb-4">
                          Edit API Key
                        </h5>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleUpdateApiKey(apiKey.id, editingKeyValue);
                          }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Key Name
                              </label>
                              <input
                                type="text"
                                value={editingKeyValue?.name || ""}
                                onChange={(e) =>
                                  setEditingKeyValue((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                  }))
                                }
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Enter key name"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Daily Limit
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="10000"
                                value={editingKeyValue?.dailyLimit || ""}
                                onChange={(e) =>
                                  setEditingKeyValue((prev) => ({
                                    ...prev,
                                    dailyLimit: parseInt(e.target.value),
                                  }))
                                }
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="5000"
                                required
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <button
                              type="submit"
                              disabled={submitting}
                              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50"
                            >
                              {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-5 h-5" />
                              )}
                              <span className="font-medium">
                                {submitting ? "Updating..." : "Update Key"}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingKey(null);
                                setEditingKeyValue(null);
                              }}
                              className="text-gray-400 hover:text-white px-6 py-3 rounded-lg transition-colors hover:bg-gray-700/50"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                ))
              )}{" "}
            </div>
          </div>
        </div>
        {/* Help Section */}
        <div className="mt-8  bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-xl p-6 border border-blue-500/30">
          <div className="flex items-start space-x-4">
            <AlertCircle className="text-blue-400 w-6 h-6 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-blue-300 mb-3">
                How Multi-Key Management Works
              </h3>
              <div className="space-y-2 text-blue-200 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p>
                      <strong className="text-blue-300">
                        🔄 Smart Load Balancing:
                      </strong>{" "}
                      System automatically distributes requests across all
                      active admin keys
                    </p>
                    <p>
                      <strong className="text-blue-300">
                        ⚡ Automatic Failover:
                      </strong>{" "}
                      When one key reaches its limit, system switches to the
                      next available key
                    </p>
                    <p>
                      <strong className="text-blue-300">
                        🎯 Individual Control:
                      </strong>{" "}
                      Toggle each key on/off based on your needs (e.g., keep 3
                      active, disable 2)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p>
                      <strong className="text-blue-300">
                        🌐 Global Toggle:
                      </strong>{" "}
                      Switch between user keys and admin keys system-wide
                    </p>
                    <p>
                      <strong className="text-blue-300">🔄 Daily Reset:</strong>{" "}
                      All usage counters reset at midnight UTC
                    </p>
                    <p>
                      <strong className="text-blue-300">
                        📊 Real-time Monitoring:
                      </strong>{" "}
                      Track usage across all keys in real-time
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <strong className="text-green-300">Example:</strong>
                  <span className="text-green-200">
                    {" "}
                    With 5 admin keys (3 active, 2 disabled), students get
                    access to combined quota of active keys. If you need to
                    reduce load, simply disable some keys without deleting them.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="pb-5"></div>
      </div>
    </div>
  );
};

export default AdminApiKeyManagement;
