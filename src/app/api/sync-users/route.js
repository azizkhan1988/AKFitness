import Zkteco from "zkteco-js";
import { google } from "googleapis";

const spreadsheetId = process.env.SPREADSHEET_ID;

// ----------------------
// Google Sheets Client
// ----------------------
async function getSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

// ----------------------
// MAIN API
// ----------------------
export async function GET() {
  try {
    const sheets = await getSheets();

    // 1️⃣ Get sheet data
    const sheetRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A2:T",
    });

    const rows = sheetRes.data.values || [];

    // 2️⃣ Connect ZKTeco device
    const device = new Zkteco(
      process.env.ZKTECO_IP,
      4370,
      10000,
      4000
    );

    await device.createSocket();

    const usersRes = await device.getUsers();
    const deviceUsers = usersRes.data || [];

    let updatedCount = 0;

    // 3️⃣ Loop sheet rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const userId = row[18]; // userId column
      if (!userId) continue;

      const match = deviceUsers.find(
        (u) => String(u.userId) === String(userId)
      );

      if (match) {
        // ----------------------
        // UPDATE LOGIC
        // ----------------------

        // Example: totalAttendance update
        row[19] = match.userId ? "1" : row[19];

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Sheet1!A${i + 2}:T${i + 2}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [row],
          },
        });

        updatedCount++;
      }
    }

    // 4️⃣ Disconnect device
    await device.disconnect();

    return Response.json({
      success: true,
      message: "Sync completed successfully",
      updated: updatedCount,
    });
  } catch (error) {
    console.error("SYNC ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Sync failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}