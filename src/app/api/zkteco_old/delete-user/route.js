import Zkteco from "zkteco-js";

export async function POST(req) {
  let device = null;

  try {
    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: "userId required" }),
        { status: 400 }
      );
    }

    device = new Zkteco("192.168.0.102", 4370, 10000, 4000);

    console.log("Connecting to device...");
    await device.createSocket();

    console.log("Deleting user:", userId);
    await device.deleteUser(userId);

    await device.disconnect();

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${userId} deleted (fingerprint may still exist due to library limitation)`,
      }),
      { status: 200 }
    );

  } catch (err) {
    console.error("ZKTeco ERROR FULL:", err);

    if (device) {
      try { await device.disconnect(); } catch {}
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: err.message || "Unknown device error",
      }),
      { status: 500 }
    );
  }
}
