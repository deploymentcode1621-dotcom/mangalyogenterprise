const TRANSACTION_TYPE = { IN: 'IN', OUT: 'OUT' };
const PAYMENT_MODE = { CASH: 'Cash', UPI: 'UPI', BANK: 'Bank' };
const SITE_STATUS = { ACTIVE: 'active', INACTIVE: 'inactive' };
const INVOICE_STATUS = { PAID: 'paid', UNPAID: 'unpaid', CANCELLED: 'cancelled' };
const QUOTATION_STATUS = { DRAFT: 'draft', SENT: 'sent', CONVERTED: 'converted', CANCELLED: 'cancelled' };

module.exports = { TRANSACTION_TYPE, PAYMENT_MODE, SITE_STATUS, INVOICE_STATUS, QUOTATION_STATUS };
