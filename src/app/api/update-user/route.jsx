import { google } from "googleapis";

const monthToColumnIndex = {
  Jan: 7,
  Feb: 8,
  Mar: 9,
  Apr: 10,
  May: 11,
  Jun: 12,
  Jul: 13,
  Aug: 14,
  Sep: 15,
  Oct: 16,
  Nov: 17,
  Dec: 18,
};

function columnToLetter(column) {
  let temp,
    letter = "";
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

export async function PATCH(req) {
  try {
    const { id, month, fee } = await req.json();

    // ✅ FIX 1: fee === undefined (0 allow karega)
    if (!id || !month || fee === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing id, month, or fee" }),
        { status: 400 }
      );
    }

    if (!monthToColumnIndex.hasOwnProperty(month)) {
      return new Response(JSON.stringify({ error: "Invalid month" }), {
        status: 400,
      });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = "1UvC5d_PJjNdClaDWiOa96O4IO2xGRFQCd72xtK-a2X0";

    // 🔥 FIX 2: Proper row detection (empty rows issue solved)
    const getIdsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A2:A",
    });

    const rows = getIdsResponse.data.values || [];

    let sheetRowNumber = null;

    rows.forEach((row, index) => {
      if (row[0] && String(row[0]).trim() === String(id)) {
        sheetRowNumber = index + 2;
      }
    });

    if (!sheetRowNumber) {
      return new Response(JSON.stringify({ error: "User ID not found" }), {
        status: 404,
      });
    }

    const columnIndex = monthToColumnIndex[month];
    const cell = `${columnToLetter(columnIndex)}${sheetRowNumber}`;

    // 🔍 DEBUG (optional but useful)
    console.log("Updating Cell:", cell, "Value:", fee);

    // Step 2: Update fee
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Sheet1!${cell}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[fee]],
      },
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error("Error updating user:", error);
    return new Response(JSON.stringify({ error: "Failed to update user" }), {
      status: 500,
    });
  }
}