import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export const StockAdjustmentModal = ({
  isOpen,
  itemName,
  currentStock,
  onClose,
  onSubmit,
}) => {
  const [quantity, setQuantity] = useState('');
  const [type, setType] = useState('in');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!quantity || parseInt(quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(parseInt(quantity), type, notes);
      setQuantity('');
      setNotes('');
      setType('in');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-resto-900">Adjust Stock</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-critical-50 border border-critical-300 rounded-lg p-3 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-critical-600 flex-shrink-0" />
              <p className="text-sm text-critical-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item
            </label>
            <p className="text-gray-900 font-medium">{itemName}</p>
            <p className="text-sm text-gray-600">Current Stock: {currentStock}</p>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-resto-500"
            >
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="adjustment">Adjustment</option>
              <option value="damage">Damage</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-resto-500"
              min="0"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this adjustment"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-resto-500"
            ></textarea>
          </div>

          <div className="flex gap-3 pt-4">
            <SecondaryButton onClick={onClose} className="flex-1">
              Cancel
            </SecondaryButton>
            <PrimaryButton
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Confirm Adjustment'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};
