const { body } = require('express-validator');

const transactionValidation = [
  body('type').isIn(['IN', 'OUT']).withMessage('Type must be IN or OUT'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('siteId').notEmpty().withMessage('Site is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('paymentMode')
    .optional()
    .isIn(['Cash', 'UPI', 'Bank'])
    .withMessage('Payment mode must be Cash, UPI, or Bank'),
];

module.exports = { transactionValidation };
