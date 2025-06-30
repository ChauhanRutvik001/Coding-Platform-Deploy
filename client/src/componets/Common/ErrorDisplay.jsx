import React from 'react';
import { AlertCircle, Key, Clock, Plus, Settings } from 'lucide-react';

/**
 * ErrorDisplay Component
 * 
 * Displays user-friendly error messages for API key related issues
 * with actionable suggestions and visual indicators
 */
const ErrorDisplay = ({ error, onRetry, onGoToProfile }) => {
  const getErrorContent = () => {
    switch (error?.error) {
      case 'api_keys_required':
        return {
          icon: <Key className="w-8 h-8 text-blue-500" />,
          title: 'API Keys Required',
          message: error.message,
          suggestion: error.suggestion,
          actions: [
            {
              label: 'Add API Keys',
              onClick: onGoToProfile,
              variant: 'primary',
              icon: <Plus className="w-4 h-4" />
            }
          ],
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800'
        };

      case 'no_active_keys':
        return {
          icon: <Settings className="w-8 h-8 text-orange-500" />,
          title: 'No Active API Keys',
          message: error.message,
          suggestion: error.suggestion,
          actions: [
            {
              label: 'Manage API Keys',
              onClick: onGoToProfile,
              variant: 'primary',
              icon: <Settings className="w-4 h-4" />
            }
          ],
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800'
        };

      case 'daily_limit_exceeded':
        return {
          icon: <Clock className="w-8 h-8 text-red-500" />,
          title: 'Daily Limit Exceeded',
          message: error.message,
          suggestion: error.suggestion,
          keyUsageInfo: error.keyUsageInfo,
          actions: [
            {
              label: 'Add More Keys',
              onClick: onGoToProfile,
              variant: 'primary',
              icon: <Plus className="w-4 h-4" />
            },
            {
              label: 'Try Again Later',
              onClick: onRetry,
              variant: 'secondary'
            }
          ],
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };

      case 'rate_limit_exceeded':
        return {
          icon: <Clock className="w-8 h-8 text-yellow-500" />,
          title: 'Rate Limit Exceeded',
          message: error.message,
          suggestion: 'The API is currently rate-limited. Please wait a moment before trying again.',
          actions: [
            {
              label: 'Retry',
              onClick: onRetry,
              variant: 'secondary'
            },
            {
              label: 'Add API Keys',
              onClick: onGoToProfile,
              variant: 'primary',
              icon: <Plus className="w-4 h-4" />
            }
          ],
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800'
        };

      case 'api_key_invalid':
        return {
          icon: <AlertCircle className="w-8 h-8 text-red-500" />,
          title: 'Invalid API Key',
          message: error.message,
          suggestion: 'One or more of your API keys may be invalid. Please check your API key configuration.',
          actions: [
            {
              label: 'Check API Keys',
              onClick: onGoToProfile,
              variant: 'primary',
              icon: <Settings className="w-4 h-4" />
            }
          ],
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };

      default:
        return {
          icon: <AlertCircle className="w-8 h-8 text-gray-500" />,
          title: 'Execution Error',
          message: error?.message || 'An unexpected error occurred',
          suggestion: 'Please try again or contact support if the problem persists.',
          actions: [
            {
              label: 'Retry',
              onClick: onRetry,
              variant: 'secondary'
            }
          ],
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800'
        };
    }
  };

  if (!error) return null;

  const errorContent = getErrorContent();

  return (
    <div className={`rounded-lg border-2 ${errorContent.borderColor} ${errorContent.bgColor} p-6 mt-4`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {errorContent.icon}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${errorContent.textColor} mb-2`}>
            {errorContent.title}
          </h3>
          <p className={`${errorContent.textColor} mb-3`}>
            {errorContent.message}
          </p>
          
          {errorContent.suggestion && (
            <p className={`text-sm ${errorContent.textColor} opacity-80 mb-4`}>
              💡 {errorContent.suggestion}
            </p>
          )}

          {/* Display key usage information for limit exceeded error */}
          {errorContent.keyUsageInfo && (
            <div className="mb-4">
              <h4 className={`text-sm font-medium ${errorContent.textColor} mb-2`}>
                Your API Key Usage:
              </h4>
              <div className="space-y-2">
                {errorContent.keyUsageInfo.map((keyInfo, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className={errorContent.textColor}>{keyInfo.name}</span>
                    <span className={`font-mono ${errorContent.textColor}`}>
                      {keyInfo.usage} ({keyInfo.remaining} remaining)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex space-x-3">
            {errorContent.actions?.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  action.variant === 'primary'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
