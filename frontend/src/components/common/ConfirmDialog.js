import React from 'react';
import Modal from './Modal';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Delete', message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="modal-body">
        <p style={{ color: '#475569', fontSize: 15 }}>
          {message || 'Are you sure you want to delete this item? This action cannot be undone.'}
        </p>
      </div>
      <div className="modal-footer">
        <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting...' : '🗑️ Delete'}
        </button>
      </div>
    </Modal>
  );
}
