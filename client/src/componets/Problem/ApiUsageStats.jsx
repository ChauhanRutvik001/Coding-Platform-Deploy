import React, { useState, useEffect } from "react";
import { Activity, AlertCircle, Key } from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";

const ApiUsageStats = () => {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await axiosInstance.get("/user/api-keys/usage");
      if (response.data.success) {
        setUsage(response.data.usage);
      }
    } catch (error) {
      console.error("Error fetching API usage:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !usage) {
    return null;
  }

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return "text-red-400";
    if (percentage >= 70) return "text-yellow-400";
    return "text-green-400";
  };

  const getUsageBackground = (percentage) => {
    if (percentage >= 90) return "bg-red-900/20 border-red-800/30";
    if (percentage >= 70) return "bg-yellow-900/20 border-yellow-800/30";
    return "bg-green-900/20 border-green-800/30";
  };

  return (
    <div className={`mb-4 p-3 rounded-lg border ${getUsageBackground(usage.usagePercentage)}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Key className="text-blue-400 mr-2" size={16} />
          <span className="text-sm font-medium text-white">API Usage Today</span>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <span className={`font-medium ${getUsageColor(usage.usagePercentage)}`}>
            {usage.totalUsage} / {usage.totalLimit}
          </span>
          <span className="text-gray-400">
            ({usage.activeKeys} key{usage.activeKeys !== 1 ? 's' : ''})
          </span>
        </div>
      </div>
      
      {usage.totalLimit > 0 && (
        <div className="mt-2">
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                usage.usagePercentage >= 90 ? 'bg-red-500' :
                usage.usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usage.usagePercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {usage.totalKeys === 0 && (
        <div className="mt-2 flex items-center text-xs text-yellow-400">
          <AlertCircle size={14} className="mr-1" />
          No API keys configured. Add keys in your profile to increase quota.
        </div>
      )}      {usage.usagePercentage >= 90 && (
        <div className="mt-2 flex items-center text-xs text-red-400">
          <AlertCircle size={14} className="mr-1" />
          API quota nearly exhausted. Add more keys or wait for daily reset at midnight UTC.
        </div>
      )}

      {usage.totalKeys > 1 && usage.usagePercentage < 90 && (
        <div className="mt-2 flex items-center text-xs text-green-400">
          <Activity size={14} className="mr-1" />
          Smart rotation active: System automatically balances load across {usage.activeKeys} keys
        </div>
      )}
    </div>
  );
};

export default ApiUsageStats;
