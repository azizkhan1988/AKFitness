import { writeFile, mkdir, readFile, unlink } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const userId = formData.get("userId") || "unknown";
    const id = formData.get("id") || "unknown";

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const ext = file.name.split(".").pop();
    const fileName = `${userId}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public/userImage");
    const buffer = Buffer.from(await file.arrayBuffer());

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);

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
        values: [[fileName]],
      },
    });

    return NextResponse.json({ url: `/userImage/${fileName}` });
  } catch (error) {
    console.error("Error in /api/upload-image:", error.message, error.stack);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
