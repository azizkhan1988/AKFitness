import Zkteco from "zkteco-js";
import { google } from "googleapis";

export async function GET() {
  const device = new Zkteco("192.168.0.104", 4370, 10000, 4000);

  try {
    /* ========= GOOGLE AUTH ========= */
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId =
      "1UvC5d_PJjNdClaDWiOa96O4IO2xGRFQCd72xtK-a2X0";

    /* ========= READ ID COLUMN ========= */
    const idRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A2:A",
    });

    const idRows = idRes.data.values || [];

    // id -> rowNumber
    const rowMap = {};
    idRows.forEach((row, index) => {
      const id = String(row[0]);
      if (id) rowMap[id] = index + 2;
    });

    /* ========= ZKTECO ========= */
    await device.createSocket();

    const usersRes = await device.getUsers();
    const users = Array.isArray(usersRes.data) ? usersRes.data : [];

    const attendanceRes = await device.getAttendances();
    const logs = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];

    await device.disconnect();

    /* ========= COUNT ATTENDANCE ========= */
    const attendanceCount = {};
    users.forEach(u => {
      attendanceCount[String(u.userId)] = 0;
    });

    logs.forEach(log => {
      const uid = String(log.userId ?? log.user_id ?? log.uid ?? "");
      if (attendanceCount[uid] !== undefined) {
        attendanceCount[uid]++;
      }
    });

    /* ========= UPDATE GOOGLE SHEET (S & T) ========= */
    const updates = [];
    const attendanceArray = [];

    Object.entries(attendanceCount).forEach(([userId, totalAttendance]) => {
      const rowNumber = rowMap[userId];
      if (!rowNumber) return;

      updates.push({
        range: `Sheet1!S${rowNumber}:T${rowNumber}`,
        values: [[userId, totalAttendance]],
      });

      attendanceArray.push({
        userId,
        name:
          users.find(u => String(u.userId) === userId)?.name || "",
        totalAttendance,
      });
    });

    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: "RAW",
          data: updates,
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        attendance: attendanceArray,
        updatedRows: updates.length,
      }),
      { status: 200 }
    );

  } catch (err) {
    if (device) await device.disconnect().catch(() => {});
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}
