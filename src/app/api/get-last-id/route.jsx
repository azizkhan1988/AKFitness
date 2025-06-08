import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
     const auth = new google.auth.GoogleAuth({
         credentials: {
           client_email: process.env.GOOGLE_CLIENT_EMAIL,
           private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
         },
         scopes: ["https://www.googleapis.com/auth/spreadsheets"],
       });

    const sheets = google.sheets({ version: 'v4', auth });

    const sheetId = "1UvC5d_PJjNdClaDWiOa96O4IO2xGRFQCd72xtK-a2X0";
    const range = 'Sheet1!A2:A'; 

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = res.data.values || [];

    const lastRow = rows.length ? rows[rows.length - 1][0] : 0;
    const nextId = parseInt(lastRow, 10) + 1;

    return NextResponse.json({ id: nextId });
  } catch (err) {
    console.error('Error fetching last ID:', err);
    return NextResponse.json({ error: 'Failed to fetch last ID' }, { status: 500 });
  }
}
