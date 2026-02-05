import Zkteco from "zkteco-js";

export async function POST(req) {
  const { userId } = await req.json();

  const device = new Zkteco("192.168.0.104", 4370, 10000, 4000);

  try {
    await device.createSocket();

    // 🔴 STEP 1: Get all fingerprint templates of user
    const templates = await device.getTemplates();

    if (Array.isArray(templates.data)) {
      for (const tpl of templates.data) {
        const uid = String(tpl.uid ?? tpl.userId ?? tpl.userid ?? "");
        if (uid === String(userId)) {
          // 🔥 STEP 2: Delete fingerprint template
          await device.deleteTemplate(tpl.uid, tpl.fid);
        }
      }
    }

    await device.disconnect();

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${userId} fingerprint deleted (now inactive)`,
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
