"use client";
import { useState, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { LoadingIcon } from "@/src/app/app-constants";
import Link from "next/link";

export default function Page() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  
  // Fetch attendance from API
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res1 = await fetch("/api/zkteco/attendance");
      const res = await fetch("/api/sheets");
      const data1 = await res1.json();
      const data = await res.json();

      if (data.success && Array.isArray(data.attendance)) {
        const filtered = data.attendance.filter(
          (user) => user.userId && user.totalAttendance
        );
        setAttendance(filtered);
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

  // Auto-delete users whose fee is due
  const autoDeleteDueUsers = async (users) => {

    for (const user of users) {
      if (!user.joiningDate || !user.userId) continue;

      const joining = new Date(user.joiningDate);
      const today = new Date();
      const feeDue = today.getDate() >= joining.getDate();
      const currentFee = user.currentMonthValue === "";


      if (feeDue && currentFee) {
        try {
          await fetch("/api/zkteco/delete-auto", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.userId, joiningDate: user.joiningDate }),
          });
          console.log(`Auto-deleted user ${user.userId}`);
        } catch (err) {
          console.error(`Failed to auto-delete user ${user.userId}:`, err);
        }
      }
    }

    // Refresh attendance after auto-delete
    fetchAttendance();

  };

useEffect(() => {
  const fetchAndDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sheets");
      const data = await res.json();
      if (data.success && Array.isArray(data.attendance)) {
        const filtered = data.attendance.filter(
          (user) => user.userId && user.totalAttendance
        );
        setAttendance(filtered);
        await autoDeleteDueUsers(filtered);
      } else {
        setAttendance([]);
      }
    } catch (err) {
      console.error(err);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };
 fetchAndDelete();

}, []);


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
              <div className="table-responsive listingTable">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Joining Date</th>
                        <th>Total Attendance</th>
                        <th>View Details</th>
                          </tr>
                  </thead>
                  <tbody>
                    {attendance.map((user, index) => {
                  
                      return (
                        <tr key={index}>
                          <td>{user.id || ""}</td>
                          <td>{user.name || ""}</td>
                          <td>{user.phone || ""}</td>
                          <td>{user.joiningDate || "-"}</td>
                          <td>{user.totalAttendance}</td>
                          <td> <Link href={`/MoreDetail/${user.id}`}>View More</Link></td>
                          
                        </tr>
                      );
                    })}
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
