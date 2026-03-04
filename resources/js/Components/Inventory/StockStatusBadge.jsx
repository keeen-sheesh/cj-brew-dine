import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

export const StockStatusBadge = ({
  quantity,
  threshold,
  showLabel = true,
}) => {
  const getStatus = () => {
    if (quantity === 0) {
      return {
        status: 'critical',
        percentage: 0,
        label: 'Out of Stock',
        color: 'critical',
      };
    }

    if (quantity <= threshold) {
      return {
        status: 'warning',
        percentage: (quantity / threshold) * 100,
        label: 'Low Stock',
        color: 'warning',
      };
    }

    return {
      status: 'normal',
      percentage: 100,
      label: 'In Stock',
      color: 'success',
    };
  };

  const status = getStatus();

  const colorClasses = {
    critical: 'bg-critical-50 text-critical-700 border border-critical-300',
    warning: 'bg-warning-50 text-warning-700 border border-warning-300',
    success: 'bg-success-50 text-success-700 border border-success-300',
  };

  const iconClasses = {
    critical: <AlertCircle className="w-4 h-4 inline mr-1" />,
    warning: <AlertTriangle className="w-4 h-4 inline mr-1" />,
    success: <CheckCircle className="w-4 h-4 inline mr-1" />,
  };

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClasses[status.color]}`}>
      {iconClasses[status.color]}
      {showLabel && status.label}
    </div>
  );
};

export const StockProgressBar = ({ quantity, threshold }) => {
  const percentage = threshold > 0 ? Math.min((quantity / threshold) * 100, 100) : 0;
  
  let bgColor = 'bg-success-500';
  if (quantity === 0) bgColor = 'bg-critical-500';
  else if (quantity <= threshold) bgColor = 'bg-warning-500';

  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all ${bgColor}`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

export const StockInfoCard = ({
  label,
  value,
  unit = '',
  trend,
  trendValue,
}) => {
  const trendColors = {
    up: 'text-success-600',
    down: 'text-critical-600',
    stable: 'text-gray-600',
  };

  return (
    <div className="bg-white rounded-lg border border-resto-200 p-4">
      <p className="text-gray-600 text-sm font-medium mb-2">{label}</p>
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-bold text-resto-900">
          {value}
          {unit && <span className="text-sm text-gray-600 ml-1">{unit}</span>}
        </p>
        {trend && trendValue && (
          <p className={`text-sm font-medium ${trendColors[trend]}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </p>
        )}
      </div>
    </div>
  );
};
