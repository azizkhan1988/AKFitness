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

    // 1️⃣ Fetch header row to find current month
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A1:T1",
    });

    const headers = headerResponse.data.values[0];
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const currentMonthName = monthNames[new Date().getMonth()]; // e.g., "Feb"
    const currentMonthIndex = headers.indexOf(currentMonthName);

    if (currentMonthIndex === -1) {
      throw new Error(`Current month (${currentMonthName}) column not found in sheet`);
    }

    // 2️⃣ Fetch all data rows
    const range = "Sheet1!A2:T";
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values || [];

    const today = new Date();

    // 3️⃣ Map rows to attendance objects with feeDue
    const attendance = rows.map((row) => {
      const joiningDateStr = row[3]; 
        const currentValue = row[currentMonthIndex];

     return {
        id: row[0],
        name: row[1],
        phone: row[2],
        image: row[5],
        joiningDate: joiningDateStr,
        currentMonthValue: currentValue || "",
        userId: row[18],
        totalAttendance: row[19],
      };
    });

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
