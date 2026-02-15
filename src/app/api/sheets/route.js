import { google } from "googleapis";

export async function GET(req) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = "1UvC5d_PJjNdClaDWiOa96O4IO2xGRFQCd72xtK-a2X0";
    const range = "Sheet1!A2:T"; // id, name, phone, joiningDate, userId, totalAttendance

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];

    const attendance = rows.map((row) => ({
      id: row[0],
      name: row[1],
      phone: row[2],
      joiningDate: row[3],
      userId: row[18],
      totalAttendance: row[19],
    }));

    return new Response(
      JSON.stringify({ success: true, attendance }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching Google Sheets data:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}
