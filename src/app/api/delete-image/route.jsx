import { NextResponse } from "next/server";
import { google } from "googleapis";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    const { id, userId } = await req.json();

    if (!id || !userId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(`user_images/${userId}`);

    // --- Update Google Sheet ---
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

    // find row
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:Z`,
    });

    const rows = getResponse.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: `User ID "${id}" not found` }, { status: 404 });
    }

    // find "image" column
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z1`,
    });

    const headers = headerResponse.data.values[0];
    const imageColIndex = headers.findIndex((h) => h.toLowerCase() === "image");

    if (imageColIndex === -1) {
      return NextResponse.json({ error: '"image" column not found' }, { status: 404 });
    }

    const columnLetter = String.fromCharCode(65 + imageColIndex);
    const cell = `${columnLetter}${rowIndex + 2}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!${cell}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[""]] }, // clear URL
    });

    return NextResponse.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error in /api/delete-image:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
