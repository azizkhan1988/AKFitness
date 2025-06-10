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
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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

  if (loading) return <div className="LoadingIcon"><LoadingIcon /></div>;
  if (error) return <p>Error: {error}</p>;
  if (!user) return <p>No user found</p>;

  const joiningDate = new Date(user.joiningDate);
  const today = new Date();
  const isValidJoiningDate = !isNaN(joiningDate);

  const formattedJoiningDate = isValidJoiningDate
    ? `${String(joiningDate.getDate()).padStart(2, "0")}-${months[joiningDate.getMonth()]}-${joiningDate.getFullYear()}`
    : "No joining date";

  const joiningMonthIndex = isValidJoiningDate ? joiningDate.getMonth() : 0;
  const currentMonthIndex = today.getMonth();
  let monthsDueCount = isValidJoiningDate
    ? (today.getFullYear() - joiningDate.getFullYear()) * 12 + (today.getMonth() - joiningDate.getMonth())
    : 0;

  if (isValidJoiningDate && today.getDate() >= joiningDate.getDate()) monthsDueCount += 1;

  let paidCount = 0;
  let dueMarked = false;

  const absentCount = months.reduce((count, month, index) => {
    if (index >= joiningMonthIndex && index <= currentMonthIndex) {
      if (user[month] === "Absent") return count + 1;
    }
    return count;
  }, 0);

  const renderedMonths = months.map((month, index) => {
    if (index < joiningMonthIndex || index >= joiningMonthIndex + monthsDueCount) return "-";

    const rawValue = user[month];
    if (rawValue === "Absent") return "Absent";

    const value = Number(rawValue);
    if (!isNaN(value)) {
      if (value >= 1000) {
        paidCount++;
        return "Paid";
      } else if (value > 0) {
        return `${1000 - value} Due`;
      }
    }

    if (!dueMarked && paidCount < monthsDueCount) {
      dueMarked = true;
      return "Due";
    }

    return "Due";
  });

  const handleFeeUpdate = async (e) => {
    e.preventDefault();

    if (!months.includes(updateMonth)) {
      toast.error("❌ Invalid month. Use first 3 letters (e.g. Jan)");
      return;
    }

    const updateMonthIndex = months.indexOf(updateMonth);
    const isFutureMonth =
      today.getFullYear() === joiningDate.getFullYear()
        ? updateMonthIndex > currentMonthIndex ||
          (updateMonthIndex === currentMonthIndex && today.getDate() < joiningDate.getDate())
        : updateMonthIndex > currentMonthIndex;

    if (isFutureMonth) {
      toast.error("❌ Cannot update future month");
      return;
    }

    if (updateMonthIndex < joiningMonthIndex) {
      toast.error(`❌ Cannot update before joining (${months[joiningMonthIndex]})`);
      return;
    }

    const newFee = Number(updateFee);
    if (isNaN(newFee) || newFee < 0) {
      toast.error("❌ Invalid fee amount");
      return;
    }

    const existing = user[updateMonth];
    const existingFee = existing && !isNaN(existing) ? Number(existing) : 0;

    if (newFee === 0) {
      try {
        const res = await fetch("/api/update-user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, month: updateMonth, fee: "Absent" }),
        });

        if (!res.ok) throw new Error("Failed to mark Absent");
        toast.success(`✅ Marked ${updateMonth} as Absent`);
        setUpdateFee("");
        setUpdateMonth("");
        setShowUpdateForm(false);
        fetchUser();
      } catch (err) {
        console.error(err);
        toast.error("❌ Error marking Absent");
      }
      return;
    }

    if (newFee < 100 || newFee > 1000) {
      toast.error("❌ Fee must be between 100 and 1000");
      return;
    }

    const total = existingFee + newFee;
    if (total > 1000) {
      toast.error(`❌ Total exceeds Rs.1000 (Already Paid: Rs.${existingFee})`);
      return;
    }

    try {
      const res = await fetch("/api/update-user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, month: updateMonth, fee: total }),
      });

      if (!res.ok) throw new Error("Failed to update fee");

      toast.success("✅ Fee updated successfully!");
      setUpdateFee("");
      setUpdateMonth("");
      setShowUpdateForm(false);
      fetchUser();
    } catch (err) {
      console.error(err);
      toast.error("❌ Error updating fee");
    }
  };

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
          <div className="userName text-capitalize"><strong>Name:</strong> {user.name}</div>
          <div className="userName"><strong>Phone:</strong> {formatPhoneNumber(user.phone)}</div>
          <div className="userName"><strong>Joining Date:</strong> {formattedJoiningDate}</div>
          <div className="userName"><strong>Admission Fee:</strong> Rs.{user.admissionFee}</div>
          <div className="userName">
            <strong>Total Months Paid:</strong> {paidCount} / {monthsDueCount} ({absentCount} Absent)
          </div>
        </div>
      </div>

      <div className="headingSec">
        <div className="headingBox">
          <h2>Monthly Fee Status</h2>
        </div>
        <div className="userFeeUpdate">
          {showUpdateForm ? (
            <form onSubmit={handleFeeUpdate} className="addUserFrom">
              <div className="mainFromBox">
                <select
                  name="month"
                  value={updateMonth}
                  onChange={(e) => setUpdateMonth(e.target.value)}
                  required
                >
                  <option value="">Select Month</option>
                  {months.map((month, idx) => {
                    const isFutureMonth =
                      today.getFullYear() === joiningDate.getFullYear()
                        ? idx > currentMonthIndex ||
                          (idx === currentMonthIndex && today.getDate() < joiningDate.getDate())
                        : idx > currentMonthIndex;

                    if (
                      idx >= joiningMonthIndex &&
                      !isFutureMonth &&
                      user[month] !== "Absent" &&
                      (isNaN(user[month]) || Number(user[month]) < 1000)
                    ) {
                      return <option key={month} value={month}>{month}</option>;
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
                <button type="button" onClick={() => setShowUpdateForm(false)}>Cancel Fee</button>
              </div>
            </form>
          ) : (
            <div onClick={() => setShowUpdateForm(true)} className="btnCommon">
              User Fee Update
            </div>
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
                const cleanVal = val.trim().toLowerCase();
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
