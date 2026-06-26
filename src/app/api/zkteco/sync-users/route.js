import Zkteco from "zkteco-js";
import { google } from "googleapis";

export async function GET() {
  let device;

  try {
    device = new Zkteco(process.env.ZKTECO_IP, 4370, 10000, 4000);

    await device.createSocket();

    const usersRes = await device.getUsers();

    const users = Array.isArray(usersRes)
      ? usersRes
      : usersRes?.data || [];

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const sheet = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Sheet1!A2:T500",
    });

    const rows = sheet.data.values || [];
    const existing = new Set(rows.map((r) => String(r[18])));

    const newRows = [];

    for (const user of users) {
      const id = String(user.userId || "");
      if (!id || existing.has(id)) continue;

      newRows.push([
        id,
        user.name || "",
        user.phone || "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        id,
        "0",
      ]);
    }

    if (newRows.length) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: "Sheet1!A2",
        valueInputOption: "RAW",
        requestBody: { values: newRows },
      });
    }

    await device.disconnect();

    return Response.json({
      success: true,
      added: newRows.length,
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message });
  }
}