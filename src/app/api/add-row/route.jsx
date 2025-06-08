import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function POST(req) {
    try {
        const body = await req.json();
        const {
            id = '',
            name = '',
            phone = '',
            joiningDate = '',
            admissionFee = '',
            image = '',
            Jan = '', Feb = '', Mar = '', Apr = '',
            May = '', Jun = '', Jul = '', Aug = '',
            Sep = '', Oct = '', Nov = '', Dec = ''
        } = body;

        const credentialsPath = path.join(process.cwd(), 'config/credentials.json');
        const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        const spreadsheetId = '1UvC5d_PJjNdClaDWiOa96O4IO2xGRFQCd72xtK-a2X0';
        const range = 'Sheet1!A2';

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    id,
                    name,
                    phone,
                    joiningDate,
                    admissionFee,
                    image,
                    Jan, Feb, Mar, Apr,
                    May, Jun, Jul, Aug,
                    Sep, Oct, Nov, Dec
                ]],
            },
        });

        return NextResponse.json({ message: 'Row added successfully' });
    } catch (error) {
        console.error('Add Row Error:', error);
        return NextResponse.json({ error: 'Failed to add row' }, { status: 500 });
    }
}
