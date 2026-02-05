import Zkteco from "zkteco-js";

export async function GET() {
  const device = new Zkteco("192.168.0.102", 4370, 10000, 4000);

  try {
    await device.createSocket();

    // Fetch users
    const usersRes = await device.getUsers();
    const users = Array.isArray(usersRes.data) ? usersRes.data : [];

    // Fetch attendance logs
    const attendanceRes = await device.getAttendances();
    const logs = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];

    await device.disconnect();

    // Initialize attendance map
    const attendanceMap = {};
    users.forEach(u => {
      attendanceMap[u.userId] = {
        userId: u.userId,
        name: u.name,
        totalAttendance: 0
      };
    });

    // Count logs
    logs.forEach(log => {
      // Support multiple possible fields
      const logUserId = String(log.userId ?? log.user_id ?? log.uid ?? ""); 
      if (logUserId && attendanceMap[logUserId]) {
        attendanceMap[logUserId].totalAttendance += 1;
      }
    });

    const attendanceSummary = Object.values(attendanceMap);

    return new Response(
      JSON.stringify({ success: true, attendance: attendanceSummary }),
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
