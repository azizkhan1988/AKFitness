
"use client";
import { useState, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";

export default function Page() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch attendance summary from backend
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/zkteco/attendance");
      const data = await res.json();

      if (data.success && Array.isArray(data.attendance)) {
        setAttendance(data.attendance);
      } else {
        setAttendance([]);
        console.error("Invalid attendance data:", data);
      }
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(); 
  }, []);


const deleteUser = async (userId) => {
  if (!confirm(`Fee completed? Disable fingerprint for user ${userId}?`))
    return;

  try {
    const res = await fetch("/api/zkteco/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const data = await res.json();
    alert(data.message || "Done");

  } catch (err) {
    console.error(err);
    alert("Failed to disable user");
  }
};


  if (loading) return <p className="p-4">Loading attendance...</p>;

  return (
    <section className="mainSection" >
      <Container>
        <Row>
          <Col md={12}>
            <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Attendance Summary</h2>

      {attendance.length === 0 ? (
        <p>No attendance records found.</p>
      ) : (
        <table className="w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-2 py-1">User ID</th>
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Total Attendance</th>
              <th className="border px-2 py-1">Action</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((user) => (
              <tr key={user.userId}>
                <td className="border px-2 py-1">{user.userId}</td>
                <td className="border px-2 py-1">{user.name}</td>
                <td className="border px-2 py-1">{user.totalAttendance}</td>
                <td className="border px-2 py-1">
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded"
                    onClick={() => deleteUser(user.userId)}
                  >
                    Delete
                  </button>
                </td>
                
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
