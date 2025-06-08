import { google } from 'googleapis';

export async function GET() {
  try {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

    if (!privateKey || !clientEmail) {
      console.error('Missing env vars', { privateKeyExists: !!privateKey, clientEmail });
      throw new Error('Missing GOOGLE_PRIVATE_KEY or GOOGLE_CLIENT_EMAIL');
    }

    const auth = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = '1UvC5d_PJjNdClaDWiOa96O4IO2xGRFQCd72xtK-a2X0';
    const range = 'Sheet1!A2:Z';

    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });

    const rows = response.data.values || [];

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching sheet rows:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch rows', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
