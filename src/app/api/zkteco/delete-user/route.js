import Zkteco from "zkteco-js";
import { google } from "googleapis";

// Clear userId & totalAttendance in Google Sheet
async function clearSheetData(userId) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = "1UvC5d_PJjNdClaDWiOa96O4IO2xGRFQCd72xtK-a2X0";
  const range = "Sheet1!A2:T";

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = response.data.values || [];
  const rowIndex = rows.findIndex(row => row[0] === String(userId));
  if (rowIndex === -1) return;

  while (rows[rowIndex].length < 20) rows[rowIndex].push("");
  rows[rowIndex][18] = ""; // S column
  rows[rowIndex][19] = ""; // T column

  const updateRange = `Sheet1!A${rowIndex + 2}:T${rowIndex + 2}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: updateRange,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [rows[rowIndex]] },
  });
}

export async function POST(req) {
  const { userId } = await req.json();
  if (!userId)
    return Response.json({ success: false, message: "userId required" });

  const device = new Zkteco(process.env.ZKTECO_IP, 4370, 10000, 4000);

  try {
    await device.createSocket();

    const usersRes = await device.getUsers();
    const users = usersRes.data || [];

    const deviceUser = users.find(
      u => u.userId === String(userId)
    );

    if (deviceUser) {
      await device.deleteUser(deviceUser.uid);
      await new Promise(res => setTimeout(res, 300));
    }

    await clearSheetData(userId);
    await device.disconnect();

    return Response.json({ success: true });

  } catch (err) {
    if (device) await device.disconnect().catch(() => {});
    return Response.json({ success: false, message: err.message });
  }
}
