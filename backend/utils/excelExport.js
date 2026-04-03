const ExcelJS = require('exceljs');

/**
 * Export site transactions to Excel workbook
 */
const exportTransactionsToExcel = async (transactions, siteName = 'All Sites') => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Mangalyog Enterprise';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(`${siteName} - Transactions`);

  // Header row styling
  sheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Name', key: 'name', width: 22 },
    { header: 'Description', key: 'description', width: 30 },
    { header: 'Type', key: 'type', width: 8 },
    { header: 'Amount (Rs.)', key: 'amount', width: 14 },
    { header: 'Payment Mode', key: 'paymentMode', width: 14 },
    { header: 'Note', key: 'note', width: 25 },
  ];

  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' },
  };
  sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 22;

  let totalIn = 0;
  let totalOut = 0;

  transactions.forEach((txn) => {
    const row = sheet.addRow({
      date: new Date(txn.date).toLocaleDateString('en-IN'),
      name: txn.name,
      description: txn.description || '',
      type: txn.type,
      amount: txn.amount,
      paymentMode: txn.paymentMode,
      note: txn.note || '',
    });








    

    // Color IN green, OUT red
    row.getCell('type').font = {
      color: { argb: txn.type === 'IN' ? 'FF16A34A' : 'FFDC2626' },
      bold: true,
    };
    row.getCell('amount').numFmt = '#,##0.00';

    if (txn.type === 'IN') totalIn += txn.amount;
    else totalOut += txn.amount;
  });

  // Summary rows
  sheet.addRow([]);
  const summaryRow = sheet.addRow(['', '', '', 'Total IN', totalIn, '', '']);
  summaryRow.getCell(4).font = { bold: true, color: { argb: 'FF16A34A' } };
  summaryRow.getCell(5).numFmt = '#,##0.00';
  summaryRow.getCell(5).font = { bold: true };

  const summaryRow2 = sheet.addRow(['', '', '', 'Total OUT', totalOut, '', '']);
  summaryRow2.getCell(4).font = { bold: true, color: { argb: 'FFDC2626' } };
  summaryRow2.getCell(5).numFmt = '#,##0.00';
  summaryRow2.getCell(5).font = { bold: true };

  const balanceRow = sheet.addRow(['', '', '', 'Balance', totalIn - totalOut, '', '']);
  balanceRow.getCell(4).font = { bold: true };
  balanceRow.getCell(5).numFmt = '#,##0.00';
  balanceRow.getCell(5).font = { bold: true };

  return workbook;
};

module.exports = { exportTransactionsToExcel };
