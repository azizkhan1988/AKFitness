// file: lib/sheet.js
import { getAuthSheetsClient } from './google'; // your auth logic

export async function updateImageInSheet(id, filename) {
    const sheets = await getAuthSheetsClient();
    const sheetName = 'Sheet1'; // adjust as needed
    const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: `${sheetName}!A2:Z1000`,
    });

    const rows = data.values;
    const rowIndex = rows.findIndex(row => row[0] === id);
    if (rowIndex === -1) return;

    const imageColIndex = 5; // Assuming "image" is column F (zero-indexed)

    rows[rowIndex][imageColIndex] = filename;

    await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: `${sheetName}!F${rowIndex + 2}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[filename]] },
        
    });
}
