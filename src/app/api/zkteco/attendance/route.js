import Zkteco from "zkteco-js";
import { google } from "googleapis";

// Update Google Sheet function (unchanged)
async function updateSheet(userId, totalAttendance) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = "1UvC5d_PJjNdClaDWiOa96O4IO2xGRFQCd72xtK-a2X0";
  const range = "Sheet1!A2:T"; // read all columns including userId & totalAttendance

  // Get all rows
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = response.data.values || [];

  // Find row where first column (id) matches userId
  const rowIndex = rows.findIndex(row => row[0] === String(userId));
  if (rowIndex === -1) return; // ID not found

  // Make sure row has at least 20 columns
  while (rows[rowIndex].length < 20) rows[rowIndex].push("");

  // Update only columns S & T (indexes 18 & 19)
  rows[rowIndex][18] = String(userId);       // S column
  rows[rowIndex][19] = totalAttendance;      // T column

  const updateRange = `Sheet1!A${rowIndex + 2}:T${rowIndex + 2}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: updateRange,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [rows[rowIndex]] },
  });

  console.log(`Updated userId & totalAttendance for ID ${userId}`);
}


export async function GET() {
const device = new Zkteco(process.env.ZKTECO_IP, 4370, 10000, 4000);

  try {
    await device.createSocket();

    // Fetch users
    const usersRes = await device.getUsers();
    const users = Array.isArray(usersRes.data) ? usersRes.data : [];

    // Fetch attendance logs
    const attendanceRes = await device.getAttendances();
    const logs = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];

    await device.disconnect();

    // Initialize attendance map
    const attendanceMap = {};
    users.forEach(u => {
      attendanceMap[u.userId] = {
        userId: u.userId,
        name: u.name,
        totalAttendance: 0, // start from 0
      };
    });

    // Count attendance **once per day per user**
    const userDates = {}; // { userId: Set of yyyy-mm-dd }

    logs.forEach(log => {
      const logUserId = String(log.userId ?? log.user_id ?? log.uid ?? "");
      if (!logUserId || !attendanceMap[logUserId]) return;

      // Extract date part only
      const logTime = new Date(log.timestamp ?? log.time ?? log.date ?? Date.now());
      const dateKey = logTime.toISOString().split("T")[0]; 

      if (!userDates[logUserId]) userDates[logUserId] = new Set();

      if (!userDates[logUserId].has(dateKey)) {
        // first scan of the day, increment totalAttendance
        attendanceMap[logUserId].totalAttendance += 1;
        userDates[logUserId].add(dateKey);
      }
    });

    const attendanceSummary = Object.values(attendanceMap);

    // Update Google Sheet for each user
    for (const user of attendanceSummary) {
      await updateSheet(user.userId, user.totalAttendance);
    }

    return new Response(
      JSON.stringify({ success: true, attendance: attendanceSummary }),
      { status: 200 }
    );

  } catch (err) {
    if (device) await device.disconnect().catch(() => {});
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
