/**
 * Format price in Philippine Peso
 */
export const formatPeso = (amount) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(num);
};

/**
 * Format date to readable format
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date and time
 */
export const formatDateTime = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get stock status based on current quantity and threshold
 */
export const getStockStatus = (quantity, threshold) => {
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

/**
 * Format number with thousand separators
 */
export const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (current, total) => {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
};

/**
 * Truncate string to specified length
 */
export const truncateString = (str, length) => {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

/**
 * Get transaction type label
 */
export const getTransactionTypeLabel = (type) => {
  const labels = {
    in: { label: 'Stock In', color: 'success' },
    out: { label: 'Stock Out', color: 'warning' },
    adjustment: { label: 'Adjustment', color: 'info' },
    damage: { label: 'Damaged', color: 'critical' },
    expired: { label: 'Expired', color: 'critical' },
  };
  return labels[type] || { label: 'Unknown', color: 'gray' };
};

/**
 * Get role label
 */
export const getRoleLabel = (role) => {
  const labels = {
    admin: 'Administrator',
    resto_admin: 'Restaurant Admin',
    resto: 'Staff',
    kitchen: 'Kitchen Staff',
    cashier: 'Cashier',
    customer: 'Customer',
  };
  return labels[role] || role;
};
