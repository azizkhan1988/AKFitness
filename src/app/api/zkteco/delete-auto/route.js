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
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const range = "Sheet1!A2:T";

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = response.data.values || [];

  const rowIndex = rows.findIndex(
    (row) => row[0] === String(userId)
  );

  if (rowIndex === -1) return;

  while (rows[rowIndex].length < 20) {
    rows[rowIndex].push("");
  }

  // Clear userId & totalAttendance
  rows[rowIndex][18] = "";
  rows[rowIndex][19] = "";

  const updateRange = `Sheet1!A${rowIndex + 2}:T${rowIndex + 2}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: updateRange,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [rows[rowIndex]],
    },
  });
}

export async function POST(req) {
  try {
    const {
      userId,
      joiningDate,
      currentMonthValue,
      totalAttendance,
    } = await req.json();

    if (!userId || !joiningDate) {
      return new Response(
        JSON.stringify({
          message: "Missing required data",
        }),
        { status: 200 }
      );
    }

    // Already removed
    if (!totalAttendance) {
      return new Response(
        JSON.stringify({
          message: "Already removed",
        }),
        { status: 200 }
      );
    }

    // Current month fee paid?
    const feePaid =
      currentMonthValue &&
      currentMonthValue.toString().trim() !== "";

    if (feePaid) {
      return new Response(
        JSON.stringify({
          message: "Fee already paid",
        }),
        { status: 200 }
      );
    }

    // Check fee due date
    const joining = new Date(joiningDate);
    const today = new Date();

    const feeDue =
      today.getDate() >= joining.getDate();

    if (!feeDue) {
      return new Response(
        JSON.stringify({
          message: "Fee not due yet",
        }),
        { status: 200 }
      );
    }

    // Try deleting from device
    try {
      const device = new Zkteco(
        process.env.ZKTECO_IP,
        4370,
        10000,
        4000
      );

      await device.createSocket();

      const usersRes = await device.getUsers();
      const users = usersRes.data || [];

      const deviceUser = users.find(
        (u) => u.userId === String(userId)
      );

      if (deviceUser) {
        await device.deleteUser(deviceUser.uid);

        await new Promise((resolve) =>
          setTimeout(resolve, 300)
        );
      }

      await device.disconnect();
    } catch (deviceError) {
      console.log(
        "Device Offline:",
        deviceError.message
      );
    }

    // Always clear sheet data
    await clearSheetData(userId);

    return new Response(
      JSON.stringify({
        message: "User processed successfully",
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Auto-delete error:", err);

    return new Response(
      JSON.stringify({
        message: "Error processing auto-delete",
      }),
      { status: 500 }
    );
  }
}