import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      id = "",
      name = "",
      phone = "",
      joiningDate = "",
      admissionFee = "",
      image = "",
      Jan = "",
      Feb = "",
      Mar = "",
      Apr = "",
      May = "",
      Jun = "",
      Jul = "",
      Aug = "",
      Sep = "",
      Oct = "",
      Nov = "",
      Dec = "",
    } = body;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = "1UvC5d_PJjNdClaDWiOa96O4IO2xGRFQCd72xtK-a2X0";
    const range = "Sheet1!A2";

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            id,
            name,
            phone,
            joiningDate,
            admissionFee,
            image,
            Jan,
            Feb,
            Mar,
            Apr,
            May,
            Jun,
            Jul,
            Aug,
            Sep,
            Oct,
            Nov,
            Dec,
          ],
        ],
      },
    });

    return NextResponse.json({ message: "Row added successfully" });
  } catch (error) {
    console.error("Add Row Error:", error);
    return NextResponse.json(
      { error: "Failed to add row", detail: error.message },
      { status: 500 }
    );
  }
}
