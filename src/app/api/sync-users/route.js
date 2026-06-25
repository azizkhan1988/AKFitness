import Zkteco from "zkteco-js";
import { google } from "googleapis";

export const runtime = "nodejs"; // 🔥 IMPORTANT for Vercel

const spreadsheetId = process.env.SPREADSHEET_ID;

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

export async function GET() {
  let device;

  try {
    const sheets = await getSheets();

    // 1️⃣ Sheet data
    const sheetRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A2:T",
    });

    const rows = sheetRes.data.values || [];

    // 2️⃣ Device connect (SAFE)
    device = new Zkteco(
      process.env.ZKTECO_IP,
      4370,
      15000,
      5000
    );

    await device.createSocket();

    const usersRes = await device.getUsers();
    const deviceUsers = usersRes.data || [];

    let updatedCount = 0;

    // 3️⃣ Sync loop (OPTIMIZED)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const userId = row[18];
      if (!userId) continue;

      const match = deviceUsers.find(
        (u) => String(u.userId) === String(userId)
      );

      if (!match) continue;

      // Example logic (attendance update safe)
      if (!row[19]) {
        row[19] = "1";
      }

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

    return Response.json({
      success: true,
      updated: updatedCount,
    });

  } catch (error) {
    console.error("SYNC ERROR:", error);

    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );

  } finally {
    if (device) {
      try {
        await device.disconnect();
      } catch {}
    }
  }
}