import Zkteco from "zkteco-js";
import { google } from "googleapis";

// Month Names
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// ================================
// Check Due Month
// ================================

function getDueMonth(joiningDate) {
  if (!joiningDate) return null;

  const joining = new Date(joiningDate);
  if (isNaN(joining.getTime())) return null;

  const today = new Date();

  const joiningDay = joining.getDate();

  // First due date = next month, joining day + 1
  let dueDate = new Date(
    joining.getFullYear(),
    joining.getMonth() + 1,
    joiningDay + 1
  );

  // Abhi pehli due date nahi ayi
  if (today < dueDate) {
    return null;
  }

  // Current billing cycle
  while (true) {
    const nextDue = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth() + 1,
      joiningDay + 1
    );

    if (today < nextDue) {
      break;
    }

    dueDate = nextDue;
  }

  const monthToCheck =
    dueDate.getMonth() === 0
      ? 11
      : dueDate.getMonth() - 1;
  // 👇 Debug
  // console.log({
  //   joiningDate,
  //   today: today.toDateString(),
  //   dueDate: dueDate.toDateString(),
  //   dueMonth: MONTHS[monthToCheck],
  // });
  return MONTHS[monthToCheck];
}




// ================================
// Clear userId & Attendance
// ================================
function clearSheetData(rows, rowIndex) {
  while (rows[rowIndex].length < 20) {
    rows[rowIndex].push("");
  }

  rows[rowIndex][18] = "";
  rows[rowIndex][19] = "";
}

export async function POST() {
  const device = new Zkteco(
    process.env.ZKTECO_IP,
    4370,
    10000,
    4000
  );

  try {
    await device.createSocket();

    const usersRes = await device.getUsers();
    const users = Array.isArray(usersRes?.data)
      ? usersRes.data
      : Array.isArray(usersRes)
        ? usersRes
        : [];

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

    // Header + Data
    const response =
      await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Sheet1!A1:T",
      });

    const values = response.data.values || [];

    if (values.length < 2) {
      return Response.json({
        success: true,
        message: "No Data",
      });
    }

    const headers = values[0].map(h => (h || "").trim());
    const rows = values.slice(1);

    let deleted = 0;

    for (let i = 0; i < rows.length; i++) {

      const row = rows[i];

      const joiningDate = row[3];
      const userId = row[18];

      if (!joiningDate || !userId) continue;

      // Find current due month
      const dueMonth = getDueMonth(joiningDate);

      if (!dueMonth) continue;

      const monthIndex = headers.indexOf(dueMonth);

      if (monthIndex === -1) continue;

      const feeValue = (row[monthIndex] || "").trim();

      // Fee Paid
      if (feeValue !== "") {
        continue;
      }

      // Find user in machine
      const deviceUser = users.find(
        u => String(u.userId) === String(userId)
      );

      if (!deviceUser) continue;

      try {
        await device.deleteUser(deviceUser.uid);
        await new Promise(resolve => setTimeout(resolve, 300));

        clearSheetData(rows, i);
        deleted++;

      } catch (err) {
        console.log(`Failed to delete ${userId}:`, err.message);
      }

      console.log(
        `Deleted User ${userId} - Due Month ${dueMonth}`
      );
    }

    if (deleted > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Sheet1!A2:T${rows.length + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: rows,
        },
      });
    }

    return Response.json({
      success: true,
      deleted,
      message: "Due members processed successfully.",
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

