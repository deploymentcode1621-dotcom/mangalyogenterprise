import React from 'react';
import { formatCurrency } from '../../utils/helpers';

export default function ItemsForm({ items, setItems, taxRate, setTaxRate }) {
  const addItem = () =>
    setItems([...items, { description: '', quantity: 1, rate: 0, amount: 0 }]);

  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const updateItem = (i, field, value) => {
    const updated = items.map((item, idx) => {
      if (idx !== i) return item;
      const next = { ...item, [field]: value };
      if (field === 'quantity' || field === 'rate') {
        next.amount = (parseFloat(next.quantity) || 0) * (parseFloat(next.rate) || 0);
      }
      return next;
    });
    setItems(updated);
  };

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const taxAmount = (subtotal * (parseFloat(taxRate) || 0)) / 100;
  const total = subtotal + taxAmount;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <label className="form-label" style={{ marginBottom: 0 }}>Items</label>
        <button type="button" className="btn btn-outline btn-sm" onClick={addItem}>+ Add Item</button>
      </div>

      <div className="items-table" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Description</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0', width: 80 }}>Qty</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0', width: 110 }}>Rate (Rs.)</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0', width: 110 }}>Amount</th>
              <th style={{ width: 40, borderBottom: '1px solid #e2e8f0' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td style={{ padding: '6px 4px' }}>
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                    placeholder="Item description"
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                </td>
                <td style={{ padding: '6px 4px' }}>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, textAlign: 'right', outline: 'none' }}
                  />
                </td>
                <td style={{ padding: '6px 4px' }}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => updateItem(i, 'rate', e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, textAlign: 'right', outline: 'none' }}
                  />
                </td>
                <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 600, color: '#1e293b', fontSize: 13 }}>
                  {formatCurrency(item.amount)}
                </td>
                <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16, padding: 4 }}>
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
          <span style={{ color: '#64748b' }}>Subtotal:</span>
          <span style={{ fontWeight: 600, minWidth: 110, textAlign: 'right' }}>{formatCurrency(subtotal)}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
          <span style={{ color: '#64748b' }}>Tax (%):</span>
          <input
            type="number"
            min="0"
            max="100"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            style={{ width: 70, padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, textAlign: 'right', outline: 'none' }}
          />
        </div>
        {taxRate > 0 && (
          <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
            <span style={{ color: '#64748b' }}>Tax Amount:</span>
            <span style={{ fontWeight: 600, minWidth: 110, textAlign: 'right' }}>{formatCurrency(taxAmount)}</span>
          </div>
        )}
        <div style={{
          display: 'flex', gap: 12, fontSize: 16, fontWeight: 700,
          color: '#1e293b', borderTop: '2px solid #1e40af', paddingTop: 8, marginTop: 4
        }}>
          <span>Total:</span>
          <span style={{ minWidth: 110, textAlign: 'right' }}>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
