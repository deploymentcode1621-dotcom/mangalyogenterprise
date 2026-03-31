// Format Indian currency
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount || 0);

// Format date to readable
export const formatDate = (date) =>
  date
    ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(
        new Date(date)
      )
    : '—';

// Format date for input[type=date]
export const toInputDate = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

// Download blob as file
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Get error message from axios error
export const getError = (err) =>
  err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || err?.message || 'Something went wrong';

// Status badge color
export const statusColor = (status) => {
  const map = {
    paid: 'bg-green-100 text-green-700',
    unpaid: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-red-100 text-red-700',
    draft: 'bg-gray-100 text-gray-600',
    sent: 'bg-blue-100 text-blue-700',
    converted: 'bg-purple-100 text-purple-700',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};
