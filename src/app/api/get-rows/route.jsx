// project/src/app/api/get-rows/route.jsx
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = "1UvC5d_PJjNdClaDWiOa96O4IO2xGRFQCd72xtK-a2X0";
    const range = "Sheet1!A2:Z";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];

    const data = rows.map((row, i) => ({
      id: row[0] || "",
      name: row[1] || "",
      phone: row[2] || "",
      joiningDate: row[3] || "",
      admissionFee: row[4] || "0",
      Jan: row[5] || "0",
      Feb: row[6] || "0",
      Mar: row[7] || "0",
      Apr: row[8] || "0",
      May: row[9] || "0",
      Jun: row[10] || "0",
      Jul: row[11] || "0",
      Aug: row[12] || "0",
      Sep: row[13] || "0",
      Oct: row[14] || "0",
      Nov: row[15] || "0",
      Dec: row[16] || "0",
    }));

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching sheet rows:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch rows" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
