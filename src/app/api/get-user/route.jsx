import { google } from 'googleapis';
import { NextResponse } from 'next/server';


export async function GET(req) {
    try {
        const url = new URL(req.url);
        const idParam = url.searchParams.get('id');

       const auth = new google.auth.GoogleAuth({
            credentials: {
              client_email: process.env.GOOGLE_CLIENT_EMAIL,
              private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            },
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
          });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = '1UvC5d_PJjNdClaDWiOa96O4IO2xGRFQCd72xtK-a2X0';
        const range = 'Sheet1!A2:R';

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const rows = response.data.values || [];
        const headers = ['id', 'name', 'phone', 'joiningDate', 'admissionFee', 'image', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const userRow = rows.find(row => row[0] === idParam);

        if (!userRow) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = Object.fromEntries(headers.map((key, i) => [key, userRow[i] || '']));
        return NextResponse.json(user);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}
