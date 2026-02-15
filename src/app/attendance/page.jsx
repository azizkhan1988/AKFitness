"use client";
import { useState, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { LoadingIcon } from "@/src/app/app-constants";


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
  if (loading)
    return <div className="LoadingIcon"><LoadingIcon /></div>;

  return (
    <section className="mainSection">
      <Container>
        <Row>
          <Col md={12}>
            <h2 className="text-xl font-bold mb-4">Attendance Summary</h2>
            {attendance.length === 0 ? (
              <p>No attendance records found.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Name</th>
                      <th>Total Attendance</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((user) => (
                      <tr key={user.userId}>
                        <td>{user.userId}</td>
                        <td>{user.name}</td>
                        <td>{user.totalAttendance}</td>
                        <td>
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
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </section>
  );
}
