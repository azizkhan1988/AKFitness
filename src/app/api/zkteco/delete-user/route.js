import Zkteco from "zkteco-js";

export async function POST(req) {
  const { userId } = await req.json();

  if (!userId) {
    return new Response(
      JSON.stringify({ success: false, message: "userId is required" }),
      { status: 400 }
    );
  }

  const device = new Zkteco("192.168.0.102", 4370, 10000, 4000);

  try {
    await device.createSocket();

    // Fetch current users
    const usersRes = await device.getUsers();
    const users = Array.isArray(usersRes.data) ? usersRes.data : [];

    // Find user by userId (string) but delete using uid (numeric)
    const deviceUser = users.find(u => u.userId === String(userId));

    if (!deviceUser) {
      await device.disconnect();
      return new Response(
        JSON.stringify({ success: false, message: "User not found on device" }),
        { status: 404 }
      );
    }

    // Use numeric UID for deletion
    const deleteResult = await device.deleteUser(deviceUser.uid);

    // Wait briefly to persist changes
    await new Promise(res => setTimeout(res, 500));

    await device.disconnect();

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${userId} deleted successfully`,
        result: deleteResult
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
