import { unlink, readFile } from "fs/promises";
import path from "path";
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { id, userId, fileName } = await req.json();

    if (!id || !userId || !fileName) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), "public/userImage", fileName);
    await unlink(filePath);

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = "1UvC5d_PJjNdClaDWiOa96O4IO2xGRFQCd72xtK-a2X0";
    const sheetName = "Sheet1";

    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:Z`,
    });

    const rows = getResponse.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: `User ID "${id}" not found in sheet` },
        { status: 404 }
      );
    }

    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z1`,
    });

    const headers = headerResponse.data.values[0];
    const imageColIndex = headers.findIndex((h) => h.toLowerCase() === "image");

    if (imageColIndex === -1) {
      return NextResponse.json(
        { error: '"image" column not found in sheet' },
        { status: 404 }
      );
    }

    const columnLetter = String.fromCharCode(65 + imageColIndex);
    const cell = `${columnLetter}${rowIndex + 2}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!${cell}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[""]],
      },
    });

    return NextResponse.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error in /api/delete-image:", error.message, error.stack);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
