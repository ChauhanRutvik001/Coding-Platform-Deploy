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
} from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";

const ApiKeyManagement = () => {  const [apiKeys, setApiKeys] = useState([]);
  const [fullApiKeys, setFullApiKeys] = useState({}); // Store full API keys for editing
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newApiKey, setNewApiKey] = useState({ name: "", key: "" });
  const [visibleKeys, setVisibleKeys] = useState({});
  const [editingKey, setEditingKey] = useState(null);
  const [editingKeyValue, setEditingKeyValue] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchApiKeys();
    fetchUsage();
  }, []);
  const fetchApiKeys = async () => {
    try {
      const response = await axiosInstance.get("/user/api-keys");
      if (response.data.success) {
        setApiKeys(response.data.apiKeys);
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
    }
  };

  const fetchFullApiKey = async (apiKeyId) => {
    try {
      const response = await axiosInstance.get("/user/api-keys?showFull=true");
      if (response.data.success) {
        const fullApiKey = response.data.apiKeys.find(key => key.id === apiKeyId);
        if (fullApiKey) {
          setFullApiKeys(prev => ({
            ...prev,
            [apiKeyId]: fullApiKey.key
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching full API key:", error);
    }
  };

  const fetchUsage = async () => {
    try {
      const response = await axiosInstance.get("/user/api-keys/usage");
      if (response.data.success) {
        setUsage(response.data.usage);
      }
    } catch (error) {
      console.error("Error fetching usage:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddApiKey = async (e) => {
    e.preventDefault();
    if (!newApiKey.name.trim() || !newApiKey.key.trim()) return;

    setSubmitting(true);
    try {
      const response = await axiosInstance.post("/user/api-keys", newApiKey);
      if (response.data.success) {
        setNewApiKey({ name: "", key: "" });
        setShowAddForm(false);
        fetchApiKeys();
        fetchUsage();
      }
    } catch (error) {
      console.error("Error adding API key:", error);
      alert(error.response?.data?.message || "Error adding API key");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteApiKey = async (apiKeyId) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      const response = await axiosInstance.delete(`/user/api-keys/${apiKeyId}`);
      if (response.data.success) {
        fetchApiKeys();
        fetchUsage();
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
      alert("Error deleting API key");
    }
  };
  const handleUpdateApiKey = async (apiKeyId, updates) => {
    try {
      const response = await axiosInstance.put(`/user/api-keys/${apiKeyId}`, updates);
      if (response.data.success) {
        setEditingKey(null);
        setEditingKeyValue(null);
        // Clear the full key cache for this key since it might have changed
        if (updates.key) {
          setFullApiKeys(prev => {
            const updated = { ...prev };
            delete updated[apiKeyId];
            return updated;
          });
        }
        fetchApiKeys();
      }
    } catch (error) {
      console.error("Error updating API key:", error);
      alert(error.response?.data?.message || "Error updating API key");
    }
  };
  const toggleKeyVisibility = async (keyId) => {
    const willBeVisible = !visibleKeys[keyId];
    setVisibleKeys(prev => ({
      ...prev,
      [keyId]: willBeVisible
    }));
    
    // Fetch full key if we're showing it and don't have it cached
    if (willBeVisible && !fullApiKeys[keyId]) {
      await fetchFullApiKey(keyId);
    }
  };

  const getUsageColor = (usage, limit) => {
    const percentage = (usage / limit) * 100;
    if (percentage >= 90) return "text-red-400";
    if (percentage >= 70) return "text-yellow-400";
    return "text-green-400";
  };

  const getUsageBarColor = (usage, limit) => {
    const percentage = (usage / limit) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-blue-400" size={32} />
      </div>
    );
  }
  return (
    <div className="bg-gray-900 rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 border border-blue-900/30">
      <div className="mb-4 sm:mb-8 text-center">
        <h2 className="text-xl sm:text-3xl font-bold text-blue-400">
          Judge0 API Keys
        </h2>
        <div className="mt-2 h-1 w-24 mx-auto bg-blue-500 rounded-full"></div>
      </div>      {/* Usage Overview */}
      {usage && (
        <div className="mb-4 sm:mb-8 p-3 sm:p-6 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-xl font-semibold text-white flex items-center">
              <Activity className="mr-1 sm:mr-2 text-blue-400" size={18} />
              Daily Usage Overview
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div className="text-center p-2 bg-gray-900/50 rounded-lg border border-gray-600">
              <div className="text-lg sm:text-2xl font-bold text-blue-400">{usage.totalUsage}</div>
              <div className="text-xs sm:text-sm text-gray-400">Used Today</div>
            </div>
            <div className="text-center p-2 bg-gray-900/50 rounded-lg border border-gray-600">
              <div className="text-lg sm:text-2xl font-bold text-purple-400">{usage.totalLimit}</div>
              <div className="text-xs sm:text-sm text-gray-400">Total Limit</div>
            </div>
            <div className="text-center p-2 bg-gray-900/50 rounded-lg border border-gray-600">
              <div className="text-lg sm:text-2xl font-bold text-green-400">{usage.activeKeys}</div>
              <div className="text-xs sm:text-sm text-gray-400">Active Keys</div>
            </div>
            <div className="text-center p-2 bg-gray-900/50 rounded-lg border border-gray-600">
              <div className="text-lg sm:text-2xl font-bold text-orange-400">{usage.usagePercentage}%</div>
              <div className="text-xs sm:text-sm text-gray-400">Usage Rate</div>
            </div>
          </div>
          <div className="w-full bg-gray-900 rounded-full h-2 border border-gray-600">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                usage.usagePercentage >= 90 ? 'bg-red-500' :
                usage.usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usage.usagePercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Add API Key Button */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm sm:text-base"
        >
          <Plus size={16} className="mr-1 sm:mr-2" />
          Add API Key
        </button>
      </div>      {/* Add API Key Form */}
      {showAddForm && (
        <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Plus size={18} className="mr-2 text-blue-400" />
            Add New API Key
          </h3>
          <form onSubmit={handleAddApiKey} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2 text-sm font-medium">
                  API Key Name
                </label>
                <input
                  type="text"                  value={newApiKey.name}
                  onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="e.g., My Judge0 Key"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2 text-sm font-medium">
                  API Key Value
                </label>
                <input
                  type="text"
                  value={newApiKey.key}
                  onChange={(e) => setNewApiKey(prev => ({ ...prev, key: e.target.value }))}
                  className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter your Judge0 API key"
                  required
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                {submitting ? (
                  <Loader2 size={18} className="mr-2 animate-spin" />
                ) : (
                  <CheckCircle size={18} className="mr-2" />
                )}
                {submitting ? 'Adding...' : 'Add Key'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.length === 0 ? (
          <div className="text-center py-12">
            <Key size={48} className="mx-auto text-gray-500 mb-4" />
            <p className="text-lg text-gray-400 mb-2">No API keys added yet</p>
            <p className="text-sm text-gray-500">
              Add your Judge0 API keys to get started with submissions
            </p>
          </div>
        ) : (
          apiKeys.map((apiKey) => (
            <div
              key={apiKey.id}
              className="p-4 sm:p-6 bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-lg"
            >
              {/* Header Section */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 gap-4">
                <div className="flex items-start min-w-0 flex-1">
                  <div className="p-2 bg-blue-900/30 rounded-lg mr-3 flex-shrink-0">
                    <Key className="text-blue-400" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingKey === apiKey.id ? (
                      <input
                        type="text"
                        defaultValue={apiKey.name}
                        onBlur={(e) => handleUpdateApiKey(apiKey.id, { name: e.target.value })}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateApiKey(apiKey.id, { name: e.target.value });
                          }
                        }}                        className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-lg font-semibold w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <h3 className="text-lg sm:text-xl font-semibold text-white truncate mb-1">{apiKey.name}</h3>
                    )}
                    
                    {/* API Key Display */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg px-3 py-2 min-w-0 flex-1 max-w-lg border border-gray-600">
                        {editingKeyValue === apiKey.id ? (
                          <input
                            type="text"
                            defaultValue={fullApiKeys[apiKey.id] || apiKey.key}
                            onBlur={(e) => {
                              handleUpdateApiKey(apiKey.id, { key: e.target.value });
                              setEditingKeyValue(null);
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateApiKey(apiKey.id, { key: e.target.value });
                                setEditingKeyValue(null);
                              }
                              if (e.key === 'Escape') {
                                setEditingKeyValue(null);
                              }
                            }}
                            className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm text-gray-300 truncate font-mono">
                            {visibleKeys[apiKey.id] ? (fullApiKeys[apiKey.id] || apiKey.key) : `${apiKey.key.substring(0, 12)}...${apiKey.key.slice(-4)}`}
                          </span>
                        )}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                            className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded transition-colors"
                            title={visibleKeys[apiKey.id] ? "Hide key" : "Show key"}
                          >
                            {visibleKeys[apiKey.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={async () => {
                              const newEditingState = editingKeyValue === apiKey.id ? null : apiKey.id;
                              setEditingKeyValue(newEditingState);
                              if (newEditingState && !fullApiKeys[apiKey.id]) {
                                await fetchFullApiKey(apiKey.id);
                              }
                            }}
                            className="p-1 text-green-400 hover:text-green-300 hover:bg-green-900/30 rounded transition-colors"
                            title="Edit API key value"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            apiKey.isActive ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        ></div>
                        <span className={`text-sm font-medium ${
                          apiKey.isActive ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {apiKey.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditingKey(editingKey === apiKey.id ? null : apiKey.id)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="Edit API key name"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteApiKey(apiKey.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete API key"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              {/* Usage Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">Daily Usage</span>
                  <span className={`text-sm font-bold ${getUsageColor(apiKey.dailyUsage, apiKey.dailyLimit)}`}>
                    {apiKey.dailyUsage} / {apiKey.dailyLimit} requests
                  </span>                </div>
                <div className="w-full bg-gray-900 rounded-full h-3 border border-gray-600">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getUsageBarColor(apiKey.dailyUsage, apiKey.dailyLimit)}`}
                    style={{ width: `${Math.min((apiKey.dailyUsage / apiKey.dailyLimit) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-right mt-1">
                  <span className="text-xs text-gray-400">
                    {((apiKey.dailyUsage / apiKey.dailyLimit) * 100).toFixed(1)}% used
                  </span>
                </div>
              </div>
              
              {/* Status Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <span className="text-sm font-medium text-gray-300">Status Control</span>
                <button
                  onClick={() => handleUpdateApiKey(apiKey.id, { isActive: !apiKey.isActive })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    apiKey.isActive
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {apiKey.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Help Text - More condensed on mobile */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="text-blue-400 mr-2 mt-0.5 flex-shrink-0" size={18} />
          <div className="text-xs sm:text-sm text-blue-200">
            <p className="font-medium mb-1 sm:mb-2">How API Key Rotation Works:</p>
            <ul className="space-y-0.5 sm:space-y-1 text-blue-300">
              <li>• <strong>Smart Load Balancing:</strong> System automatically selects the API key with lowest usage</li>
              <li>• <strong>Automatic Failover:</strong> When one key reaches its limit (50/50), system switches to the next available key</li>
              <li>• <strong>Daily Reset:</strong> All usage counters reset to 0 at midnight UTC</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManagement;
