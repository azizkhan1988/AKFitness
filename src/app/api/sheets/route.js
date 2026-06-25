import { google } from "googleapis";

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = process.env.SPREADSHEET_ID;

    const [headerRes, dataRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Sheet1!A1:T1",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Sheet1!A2:T",
      }),
    ]);

    const headers = headerRes.data.values?.[0] || [];
    const rows = dataRes.data.values || [];

    const monthNames = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    const currentMonthName =
      monthNames[new Date().getMonth()];

    const currentMonthIndex = headers.findIndex(
      (h) => h?.trim() === currentMonthName
    );

    const attendance = rows.map((row) => ({
      id: row[0] || "",
      name: row[1] || "",
      phone: row[2] || "",
      joiningDate: row[3] || "",
      admissionFee: row[4] || "",
      image: row[5] || "",
      currentMonthValue:
        row[currentMonthIndex] || "",
      userId: row[18] || "",
      totalAttendance: row[19] || "",
    }));

    return Response.json({
      success: true,
      attendance,
    });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}