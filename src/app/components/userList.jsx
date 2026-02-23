"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ImageUploader from "@/src/app/components/imageUploader";
import { LoadingIcon } from "@/src/app/app-constants";
import toast from "react-hot-toast";

export default function MoreDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateMonth, setUpdateMonth] = useState("");
  const [updateFee, setUpdateFee] = useState("");

  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/get-user?id=${id}`);
      if (!res.ok) throw new Error("Failed to fetch user data");
      const json = await res.json();
      setUser(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchUser();
  }, [id]);

  if (loading)
    return <div className="LoadingIcon"><LoadingIcon /></div>;
  if (error) return <p>Error: {error}</p>;
  if (!user) return <p>No user found</p>;

  const joiningDate = new Date(user.joiningDate);
  const today = new Date();
  const DUE_DAY = joiningDate.getDate();

  const formattedJoiningDate = `${String(joiningDate.getDate()).padStart(2,"0")}-${months[joiningDate.getMonth()]}-${joiningDate.getFullYear()}`;

  // ================= FEE LOGIC =================
  let renderedMonths = [];
  let paidCount = 0;
  let absentCount = 0;

  months.forEach((month, index) => {
    const monthValue = user[month];
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    // Only 2026
    if (currentYear !== 2026) {
      renderedMonths.push("-");
      return;
    }

    // Before joining
    if (joiningDate.getFullYear() === 2026 && index < joiningDate.getMonth()) {
      renderedMonths.push("-");
      return;
    }

    // Future months
    if (index > currentMonth) {
      renderedMonths.push("-");
      return;
    }

    // Current month but due date not reached
    if (index === currentMonth && currentDay < DUE_DAY) {
      renderedMonths.push("-");
      return;
    }

    // Actual status
    if (monthValue === "Absent") {
      renderedMonths.push("Absent");
      absentCount++;
    } else if (!monthValue || Number(monthValue) === 0) {
      renderedMonths.push("Due");
    } else {
      const value = Number(monthValue);
      if (value >= 1000) {
        renderedMonths.push("Paid");
        paidCount++;
      } else if (value > 0) {
        renderedMonths.push(`${1000 - value} Due`);
      } else {
        renderedMonths.push("Due");
      }
    }
  });

  // Show button only if at least 1 month is Due
  const hasAnyDue = renderedMonths.some(
    (val) => val === "Due" || val.includes("Due")
  );

  // ================= UPDATE HANDLER =================
  const handleFeeUpdate = async (e) => {
    e.preventDefault();

    if (!months.includes(updateMonth)) {
      toast.error("Invalid month");
      return;
    }

    const newFee = Number(updateFee);
    if (isNaN(newFee) || newFee < 0) {
      toast.error("Invalid amount");
      return;
    }

    const existing = user[updateMonth];
    const existingFee = existing && !isNaN(existing) ? Number(existing) : 0;

    if (newFee === 0) {
      await fetch("/api/update-user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, month: updateMonth, fee: "Absent" }),
      });
      toast.success("Marked Absent");
      fetchUser();
      return;
    }

    const total = existingFee + newFee;
    if (total > 1000) {
      toast.error("Total exceeds 1000");
      return;
    }

    await fetch("/api/update-user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, month: updateMonth, fee: total }),
    });

    toast.success("Fee Updated");
    fetchUser();
  };

  // ================= PHONE FORMAT =================
  const formatPhoneNumber = (phone) => {
    if (!phone) return "No phone number";
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10 && digits.startsWith("3")) {
      return `+92-${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    if (digits.length === 12 && digits.startsWith("92")) {
      return `+${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    }
    return phone;
  };

  return (
    <div className="userDetails">
      <h2>User Details</h2>

      <div className="userInfo">
        <ImageUploader />
        <div className="userListItem">
          <div className="userName"><strong>ID:</strong> {user.id}</div>
          <div className="userName"><strong>Name:</strong> {user.name}</div>
          <div className="userName"><strong>Phone:</strong> {formatPhoneNumber(user.phone)}</div>
          <div className="userName"><strong>Joining Date:</strong> {formattedJoiningDate}</div>
          <div className="userName"><strong>Admission Fee:</strong> Rs.{user.admissionFee}</div>
          <div className="userName">
            <strong>Total Months Paid (2026):</strong> {paidCount} / 12 ({absentCount} Absent)
          </div>
        </div>
      </div>

      <div className="headingSec">
        <div className="headingBox">
          <h2>Monthly Fee Status (2026)</h2>
        </div>

        <div className="userFeeUpdate">
          {hasAnyDue && (
            showUpdateForm ? (
              <form onSubmit={handleFeeUpdate} className="addUserFrom">
                <div className="mainFromBox">
                  <select
                    name="month"
                    value={updateMonth}
                    onChange={(e) => setUpdateMonth(e.target.value)}
                    required
                  >
                    <option value="">Select Month</option>
                    {months.map((m, idx) => {
                      const status = renderedMonths[idx];
                      if (status === "Due" || status.includes("Due")) {
                        return <option key={m} value={m}>{m}</option>;
                      }
                      return null;
                    })}
                  </select>

                  <input
                    type="number"
                    name="fee"
                    placeholder="Fee Amount (Rs.)"
                    value={updateFee}
                    onChange={(e) => setUpdateFee(e.target.value)}
                    required
                  />
                </div>

                <div className="flexBtn">
                  <button type="submit">Submit Fee</button>
                  <button type="button" onClick={() => setShowUpdateForm(false)}>
                    Cancel Fee
                  </button>
                </div>
              </form>
            ) : (
              <div onClick={() => setShowUpdateForm(true)} className="btnCommon">
                User Fee Update
              </div>
            )
          )}
        </div>
      </div>

      <div className="table-responsive DetailsListing">
        <table className="table">
          <thead>
            <tr align="center">
              {months.map((month) => (
                <th key={month}>{month}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr align="center">
              {renderedMonths.map((val, index) => {
                const cleanVal = val.toLowerCase();
                let cellClass = "";
                if (cleanVal === "paid") cellClass = "greenColor";
                else if (cleanVal.includes("due")) cellClass = "redColor";
                else if (cleanVal === "absent") cellClass = "YellowColor";

                return (
                  <td key={months[index]}>
                    <div className={cellClass}>{val}</div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
