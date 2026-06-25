import Zkteco from "zkteco-js";
import { google } from "googleapis";

const DEVICE_IP = process.env.ZK_DEVICE_IP;
const DEVICE_PORT = process.env.ZK_DEVICE_PORT || 4370;

const spreadsheetId = process.env.SPREADSHEET_ID;

// 🔗 Google Auth
async function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function GET() {
  let zk;

  try {
    // 1️⃣ Connect ZKTeco device
    zk = new Zkteco(DEVICE_IP, DEVICE_PORT, 10000, 4000);
    await zk.connect();

    const users = await zk.getUsers();

    if (!users || users.length === 0) {
      return Response.json({
        success: true,
        message: "No users found in device",
        added: 0,
      });
    }

    // 2️⃣ Google Sheets auth
    const auth = await getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    // 3️⃣ Existing sheet data
    const sheetRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A2:F",
    });

    const existingRows = sheetRes.data.values || [];
    const existingIds = new Set(existingRows.map((r) => String(r[0])));

    // 4️⃣ Prepare new rows
    const newRows = [];

    for (const user of users) {
      const userId = String(user.userId || user.uid || "");

      if (!userId) continue;

      // skip duplicates
      if (existingIds.has(userId)) continue;

      newRows.push([
        userId,
        user.name || "",
        user.phone || "",
        user.privilege || "",
        new Date().toISOString().split("T")[0], // sync date
      ]);
    }

    // 5️⃣ Append to sheet
    if (newRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Sheet1!A2",
        valueInputOption: "RAW",
        requestBody: {
          values: newRows,
        },
      });
    }

    // 6️⃣ Disconnect device (safe cleanup)
    try {
      await zk.disconnect();
    } catch {}

    return Response.json({
      success: true,
      totalDeviceUsers: users.length,
      addedToSheet: newRows.length,
    });
  } catch (err) {
    console.error("SYNC ERROR:", err);

    return Response.json({
      success: false,
      error: err.message || "Sync failed",
    });
  }
}