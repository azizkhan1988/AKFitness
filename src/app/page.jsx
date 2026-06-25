"use client";
import { useState, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { LoadingIcon } from "@/src/app/app-constants";
import Link from "next/link";
import Image from "next/image";

export default function Page() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch attendance from API
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sheets");
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
      if (
        !user.joiningDate ||
        !user.userId ||
        !user.totalAttendance
      ) {
        continue;
      }

      const joining = new Date(user.joiningDate);
      const today = new Date();
      const feeDue = today.getDate() >= joining.getDate();
      const currentFee = !user.currentMonthValue || user.currentMonthValue.toString().trim() === "";
      if (feeDue && currentFee) {
        try {
          await fetch("/api/zkteco/delete-auto", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.userId,
              joiningDate: user.joiningDate,
              currentMonthValue: user.currentMonthValue,
              totalAttendance: user.totalAttendance,
            }),
          });
          console.log(`Auto-deleted user ${user.userId}`);
        } catch (err) {
          console.error(`Failed to auto-delete user ${user.userId}:`, err);
        }
      }
    }

    await fetchAttendance();
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
          await autoDeleteDueUsers(data.attendance);
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

  if (loading) return <div className="LoadingIcon"><LoadingIcon /></div>;

  // ⭐ Sorting by remaining days (1 day -> 2 -> 3)
  const sortedAttendance = [...attendance].sort((a, b) => {
    const today = new Date().getDate();

    const aDays = a.joiningDate
      ? new Date(a.joiningDate).getDate() - today
      : 999;

    const bDays = b.joiningDate
      ? new Date(b.joiningDate).getDate() - today
      : 999;

    // negative days ko last me bhej do
    const aValue = aDays < 0 ? 999 : aDays;
    const bValue = bDays < 0 ? 999 : bDays;

    return aValue - bValue;
  });
  return (
    <section className="mainSection">
      <Container>
        <Row>
          <Col md={12}>
            <h2 className="text-xl font-bold mb-4">Attendance Summary</h2>

            {sortedAttendance.length === 0 ? (
              <p>No attendance records found.</p>
            ) : (
              <div className="table-responsive listingTable">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Joining Date</th>
                      <th>Fee Alert</th>
                      <th>View Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAttendance.map((user, index) => {
                      let highlight = false;
                      let warningText = "";

                      if (user.joiningDate) {
                        const joiningDay = new Date(user.joiningDate).getDate();
                        const today = new Date().getDate();
                        const remainingDays = joiningDay - today;

                        if (remainingDays <= 5 && remainingDays >= 0) {
                          highlight = true;
                          warningText = `${remainingDays} days left`;
                        }
                      }

                      return (
                        <tr
                          key={index}
                          style={{
                            backgroundColor: highlight ? "#fff3cd" : "",
                            verticalAlign: "middle", // ✅ vertical center for <tr>
                          }}
                        >
                          <td style={{ verticalAlign: "middle" }}>{user.id || ""}</td>
                          <td style={{ verticalAlign: "middle" }}>
                            <div className="imageBox">
                              {user.image && (
                                <Image src={user.image} alt="" fill sizes="(max-width: 768px) 50px, 60px" />
                              )}

                            </div>
                          </td>
                          <td style={{ verticalAlign: "middle" }}>{user.name || ""}</td>
                          <td style={{ verticalAlign: "middle" }}>{user.phone || ""}</td>
                          <td style={{ verticalAlign: "middle" }}>{user.joiningDate || "-"}</td>
                          <td style={{ color: "red", fontWeight: "bold", verticalAlign: "middle" }}>
                            {warningText}
                          </td>
                          <td style={{ verticalAlign: "middle" }}>
                            <Link href={`/MoreDetail/${user.id}`}>View More</Link>
                          </td>
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