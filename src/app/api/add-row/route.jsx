import { google } from 'googleapis';
import { NextResponse } from 'next/server';


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

        // const credentialsPath = path.join(process.cwd(), 'config/credentials.json');
        // const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));
        const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
        if (!rawCredentials) {
            throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_CREDENTIALS env variable');
        }

        const credentials = JSON.parse(rawCredentials);

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
