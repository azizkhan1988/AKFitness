import Zkteco from "zkteco-js";

export async function POST(req) {
  const { userId } = await req.json();

  if (!userId) {
    return new Response(
      JSON.stringify({ success: false, message: "userId required" }),
      { status: 400 }
    );
  }

  const device = new Zkteco("192.168.0.104", 4370, 10000, 4000);

  try {
    await device.createSocket();

    // ✅ THIS IS SUPPORTED & WORKS
    await device.deleteUser(userId);

    await device.disconnect();

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${userId} deleted from device (fingerprint removed)`,
      }),
      { status: 200 }
    );

  } catch (err) {
    if (device) await device.disconnect().catch(() => {});
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
