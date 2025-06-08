import { google } from 'googleapis';
import path from 'path';
import { promises as fs } from 'fs';

const monthToColumnIndex = {
    Jan: 7, Feb: 8, Mar: 9, Apr: 10, May: 11, Jun: 12,
    Jul: 13, Aug: 14, Sep: 15, Oct: 16, Nov: 17, Dec: 18,
};

function columnToLetter(column) {
    let temp, letter = '';
    while (column > 0) {
        temp = (column - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        column = (column - temp - 1) / 26;
    }
    return letter;
}

export async function PATCH(req) {
    try {
        const { id, month, fee } = await req.json();

        if (!id || !month || !fee) {
            return new Response(JSON.stringify({ error: 'Missing id, month, or fee' }), { status: 400 });
        }

        if (!monthToColumnIndex.hasOwnProperty(month)) {
            return new Response(JSON.stringify({ error: 'Invalid month' }), { status: 400 });
        }

        const credentialsPath = path.join(process.cwd(), 'config/credentials.json');
        const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = '1UvC5d_PJjNdClaDWiOa96O4IO2xGRFQCd72xtK-a2X0';

        // Step 1: Find user row
        const getIdsResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A2:A',
        });

        const ids = getIdsResponse.data.values?.flat() || [];
        const rowIndex = ids.findIndex((sheetId) => sheetId === id);

        if (rowIndex === -1) {
            return new Response(JSON.stringify({ error: 'User ID not found' }), { status: 404 });
        }

        const sheetRowNumber = rowIndex + 2;
        const columnIndex = monthToColumnIndex[month];
        const cell = `${columnToLetter(columnIndex)}${sheetRowNumber}`;

        // Step 2: Update fee
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!${cell}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[fee]],
            },
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error('Error updating user:', error);
        return new Response(JSON.stringify({ error: 'Failed to update user' }), { status: 500 });
    }
}
