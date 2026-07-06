import Zkteco from "zkteco-js";
import { google } from "googleapis";

function updateSheet(rows, userId, totalAttendance) {
  const rowIndex = rows.findIndex(
    (row) => row[0] === String(userId)
  );

  if (rowIndex === -1) return;

  while (rows[rowIndex].length < 20) {
    rows[rowIndex].push("");
  }

  rows[rowIndex][18] = String(userId);
  rows[rowIndex][19] = String(totalAttendance);
}
export async function POST() {
  const device = new Zkteco(
    process.env.ZKTECO_IP,
    4370,
    10000,
    4000
  );

  try {
    // ==========================
    // Connect Machine
    // ==========================
    await device.createSocket();

    // Get Users
    const usersRes = await device.getUsers();
    const users = Array.isArray(usersRes?.data)
      ? usersRes.data
      : Array.isArray(usersRes)
        ? usersRes
        : [];

    // Get Attendance Logs
    const attendanceRes = await device.getAttendances();
    const logs = Array.isArray(attendanceRes?.data)
      ? attendanceRes.data
      : Array.isArray(attendanceRes)
        ? attendanceRes
        : [];

    // ==========================
    // Google Auth
    // ==========================
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
      ],
    });

    const sheets = google.sheets({
      version: "v4",
      auth,
    });

    const spreadsheetId = process.env.SPREADSHEET_ID;

    // ==========================
    // Read Google Sheet Once
    // ==========================
    const sheetResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Sheet1!A2:T",
      });

    const rows = sheetResponse.data.values || [];
    if (!rows.length) {
      return Response.json({
        success: true,
        attendance: [],
      });
    }

    // ==========================
    // Attendance Map
    // ==========================
    const attendanceMap = new Map();

    users.forEach((user) => {
      attendanceMap.set(String(user.userId), {
        userId: String(user.userId),
        name: user.name || "",
        totalAttendance: 0,
      });
    });
    // ==========================
    // Count Attendance
    // One Attendance Per Day
    // ==========================
    const userDates = new Map();
    logs.forEach((log) => {
      const userId = String(
        log.userId ??
        log.user_id ??
        log.uid ??
        ""
      );

      if (!attendanceMap.has(userId)) return;

      const logDate = new Date(
        log.timestamp ??
        log.time ??
        log.date ??
        Date.now()
      );

      if (isNaN(logDate.getTime())) return;

      const dateKey = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Karachi",
      }).format(logDate);

      
      if (!userDates.has(userId)) {
        userDates.set(userId, new Set());
      }

      const dates = userDates.get(userId);

      if (!dates.has(dateKey)) {
        attendanceMap.get(userId).totalAttendance++;
        dates.add(dateKey);
      }
    });

    // ==========================
    // Update Sheet Array
    // ==========================
    const attendanceSummary = Array.from(attendanceMap.values());

    attendanceSummary.forEach((user) => {
      updateSheet(
        rows,
        user.userId,
        user.totalAttendance
      );
    });

    // ==========================
    // Update Google Sheet Once
    // ==========================
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Sheet1!A2:T${rows.length + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: rows,
      },
    });

    return Response.json({
      success: true,
      totalUsers: attendanceSummary.length,
      attendance: attendanceSummary,
    });

  } catch (err) {
    console.error(err);

    return Response.json(
      {
        success: false,
        message: err.message,
      },
      {
        status: 500,
      }
    );

  } finally {
    await device.disconnect().catch(() => { });
  }
}
