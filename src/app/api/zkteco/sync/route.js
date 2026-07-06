export async function POST(request) {
  try {
    const baseUrl = new URL(request.url).origin;

    // 1. Attendance Sync
    const attendanceRes = await fetch(
      `${baseUrl}/api/zkteco/attendance`,
      {
        method: "POST",
      }
    );

    const attendanceData = await attendanceRes.json();

    if (!attendanceData.success) {
      return Response.json(attendanceData, {
        status: 500,
      });
    }

    // 2. Delete Due Members
    const deleteRes = await fetch(
      `${baseUrl}/api/zkteco/delete-auto`,
      {
        method: "POST",
      }
    );

    const deleteData = await deleteRes.json();

    if (!deleteData.success) {
      return Response.json(deleteData, {
        status: 500,
      });
    }

    return Response.json({
      success: true,
      attendanceUsers: attendanceData.totalUsers || 0,
      deleted: deleteData.deleted || 0,
      message: "Attendance synced and due members processed successfully.",
    });

  } catch (err) {
    console.error(err);

    return Response.json(
      {
        success: false,
        error: err.message,
      },
      {
        status: 500,
      }
    );
  }
}