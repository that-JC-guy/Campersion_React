/**
 * Inventory List Page.
 *
 * Main inventory management page with:
 * - List of items with inline editing
 * - Quick-add buttons for common items
 * - Bulk update functionality
 * - Add new item inline
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInventory, useBulkUpdateInventory, useQuickAddInventoryItem, useDeleteInventoryItem } from '../../hooks/useInventory';

function InventoryList() {
  const { data, isLoading, error } = useInventory();
  const bulkUpdateMutation = useBulkUpdateInventory();
  const quickAddMutation = useQuickAddInventoryItem();
  const deleteMutation = useDeleteInventoryItem();

  // Local state for inline editing
  const [editedItems, setEditedItems] = useState({});
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, is_shared_gear: false });
  const [hasChanges, setHasChanges] = useState(false);

  // Reset edited items when data changes
  useEffect(() => {
    if (data?.items) {
      const initialState = {};
      data.items.forEach(item => {
        initialState[item.id] = {
          quantity: item.quantity,
          is_shared_gear: item.is_shared_gear
        };
      });
      setEditedItems(initialState);
    }
  }, [data]);

  const handleQuantityChange = (itemId, value) => {
    const quantity = parseInt(value) || 0;
    setEditedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity }
    }));
    setHasChanges(true);
  };

  const handleSharedChange = (itemId, checked) => {
    setEditedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], is_shared_gear: checked }
    }));
    setHasChanges(true);
  };

  const handleBulkSave = () => {
    if (!data?.items) return;

    // Build updates array
    const updates = data.items
      .map(item => {
        const edited = editedItems[item.id];
        if (edited.quantity !== item.quantity || edited.is_shared_gear !== item.is_shared_gear) {
          return {
            id: item.id,
            quantity: edited.quantity,
            is_shared_gear: edited.is_shared_gear
          };
        }
        return null;
      })
      .filter(Boolean);

    // Build request data
    const requestData = { updates };

    // Add new item if present
    if (newItem.name.trim()) {
      requestData.new_item = {
        name: newItem.name.trim(),
        quantity: newItem.quantity,
        is_shared_gear: newItem.is_shared_gear
      };
    }

    bulkUpdateMutation.mutate(requestData, {
      onSuccess: () => {
        setHasChanges(false);
        setNewItem({ name: '', quantity: 1, is_shared_gear: false });
      }
    });
  };

  const handleQuickAdd = (itemKey) => {
    quickAddMutation.mutate(itemKey);
  };

  const handleDelete = (itemId, itemName) => {
    if (window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
      deleteMutation.mutate(itemId);
    }
  };

  if (isLoading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          Failed to load inventory. Please try again.
        </div>
      </div>
    );
  }

  const items = data?.items || [];
  const commonItems = data?.common_items || {};

  return (
    <div className="container mt-4">
      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item active">Inventory</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <img src="/Member.png" alt="Member" style={{ height: '68px', width: 'auto' }} className="me-2" />
          My Inventory
        </h2>
      </div>

      {/* Quick Add Buttons */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">
            <i className="bi bi-lightning-charge me-2"></i>
            Quick Add Common Items
          </h5>
          <div className="row g-2">
            {Object.entries(commonItems).map(([key, name]) => (
              <div key={key} className="col-6 col-md-4 col-lg-3">
                <button
                  className="btn btn-outline-primary w-100"
                  onClick={() => handleQuickAdd(key)}
                  disabled={quickAddMutation.isPending}
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  {name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title mb-3">Your Items</h5>

          {items.length === 0 ? (
            <div className="text-center text-muted py-4">
              <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
              <p className="mt-2">No items yet. Use quick-add buttons above or add an item below.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th style={{ width: '120px' }}>Quantity</th>
                    <th style={{ width: '150px' }}>Shared Gear</th>
                    <th style={{ width: '100px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                        {item.description && (
                          <div className="small text-muted">{item.description}</div>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          min="0"
                          value={editedItems[item.id]?.quantity ?? item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        />
                      </td>
                      <td>
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`shared_${item.id}`}
                            checked={editedItems[item.id]?.is_shared_gear ?? item.is_shared_gear}
                            onChange={(e) => handleSharedChange(item.id, e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor={`shared_${item.id}`}>
                            {editedItems[item.id]?.is_shared_gear ? 'Yes' : 'No'}
                          </label>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(item.id, item.name)}
                          disabled={deleteMutation.isPending}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Add New Item Row */}
                  <tr>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="New item name..."
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        min="0"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                      />
                    </td>
                    <td>
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="new_item_shared"
                          checked={newItem.is_shared_gear}
                          onChange={(e) => setNewItem({ ...newItem, is_shared_gear: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="new_item_shared">
                          {newItem.is_shared_gear ? 'Yes' : 'No'}
                        </label>
                      </div>
                    </td>
                    <td>
                      <small className="text-muted">New</small>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Save Button */}
          <div className="d-grid mt-3">
            <button
              className="btn btn-primary"
              onClick={handleBulkSave}
              disabled={bulkUpdateMutation.isPending || (!hasChanges && !newItem.name.trim())}
            >
              {bulkUpdateMutation.isPending ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-save me-2"></i>
                  Save All Changes
                </>
              )}
            </button>
          </div>

          <div className="mt-3">
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Shared gear will be visible to camps you're a member of.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InventoryList;
