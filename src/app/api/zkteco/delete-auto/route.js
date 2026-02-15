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

  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = response.data.values || [];

  const rowIndex = rows.findIndex(row => row[0] === String(userId));
  if (rowIndex === -1) return;

  while (rows[rowIndex].length < 20) rows[rowIndex].push("");
  rows[rowIndex][18] = ""; // Clear S column (userId)
  rows[rowIndex][19] = ""; // Clear T column (totalAttendance)

  const updateRange = `Sheet1!A${rowIndex + 2}:T${rowIndex + 2}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: updateRange,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [rows[rowIndex]] },
  });
}

export async function POST(req) {
  try {
    const { userId, joiningDate } = await req.json();
    if (!userId || !joiningDate) return new Response(null, { status: 204 });

    // Determine if fee is due based on joining date
    const joining = new Date(joiningDate);
    const today = new Date();
    const feeDue = today.getDate() >= joining.getDate();

    if (!feeDue) {
      // Not due yet, nothing to do
      return new Response(JSON.stringify({ message: "Fee not due yet" }), { status: 200 });
    }

    // Fee is due, auto-delete
    const device = new Zkteco(process.env.ZKTECO_IP, 4370, 10000, 4000);
    await device.createSocket();

    const usersRes = await device.getUsers();
    const users = usersRes.data || [];
    const deviceUser = users.find(u => u.userId === String(userId));

    if (deviceUser) {
      await device.deleteUser(deviceUser.uid);
      await new Promise(res => setTimeout(res, 300)); // small delay to ensure deletion
    }

    await clearSheetData(userId);
    await device.disconnect();

    return new Response(JSON.stringify({ message: "User auto-deleted due to fee due" }), { status: 200 });

  } catch (err) {
    console.error("Auto-delete error:", err);
    return new Response(JSON.stringify({ message: "Error processing auto-delete" }), { status: 500 });
  }
}
