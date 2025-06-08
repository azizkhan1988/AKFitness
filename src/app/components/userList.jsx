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

  if (loading)
    return (
      <div className="LoadingIcon">
        <LoadingIcon />
      </div>
    );
  if (error) return <p>Error: {error}</p>;
  if (!user) return <p>No user found</p>;

  const formattedJoiningDate = user.joiningDate
    ? (() => {
        const d = new Date(user.joiningDate);
        if (isNaN(d)) return "Invalid date";
        const day = String(d.getDate()).padStart(2, "0");
        const monthNames = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];
        const month = monthNames[d.getMonth()];
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      })()
    : "No joining date";

  const joiningDate = new Date(user.joiningDate);
  const today = new Date();
  const joiningMonthIndex = joiningDate.getMonth();
  const currentMonthIndex = today.getMonth();

  let monthsDueCount =
    (today.getFullYear() - joiningDate.getFullYear()) * 12 +
    (today.getMonth() - joiningDate.getMonth());
  if (today.getDate() >= joiningDate.getDate()) monthsDueCount += 1;

  let paidCount = 0;
  let dueMarked = false;
  const renderedMonths = months.map((month, index) => {
    if (
      index < joiningMonthIndex ||
      index >= joiningMonthIndex + monthsDueCount
    )
      return "-";

    const value = user[month];

    if (value && !isNaN(value)) {
      const feeNum = Number(value);
      if (feeNum >= 1000) {
        paidCount++;
        return "Paid";
      } else if (feeNum > 0) {
        return `${1000 - feeNum} Due`;
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
      toast.error("❌ Invalid month. Use first 3 letters of month (e.g. Jan, Feb)");
      return;
    }

    const updateMonthIndex = months.indexOf(updateMonth);

    if (updateMonthIndex > currentMonthIndex) {
      toast.error("❌ Cannot pay for a future month");
      return;
    }

    if (updateMonthIndex < joiningMonthIndex) {
      toast.error(`❌ Cannot pay for months before joining (${months[joiningMonthIndex]})`);
      return;
    }

    const newFee = Number(updateFee);
    if (isNaN(newFee) || newFee <= 0) {
      toast.error("❌ Enter a valid amount greater than 0");
      return;
    }

    const existing = user[updateMonth];
    const existingFee = existing && !isNaN(existing) ? Number(existing) : 0;
    const total = existingFee + newFee;

    if (total > 1000) {
      toast.error(`❌ Total fee for ${updateMonth} exceeds ₹1000 (Already Paid: ₹${existingFee})`);
      return;
    }

    try {
      const response = await fetch("/api/update-user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, month: updateMonth, fee: total }),
      });

      if (!response.ok) throw new Error("Failed to update fee");

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

  return (
    <div className="userDetails">
      <h2>User Details</h2>
      <div className="userInfo">
        <ImageUploader />
        <div className="userListItem">
          <div className="userName"><strong>ID:</strong> {user.id}</div>
          <div className="userName text-capitalize"><strong>Name:</strong> {user.name}</div>
          <div className="userName">
            <strong>Phone:</strong> {user.phone ? `+92-${user.phone}` : "No phone number"}
          </div>
          <div className="userName">
            <strong>Joining Date:</strong> {formattedJoiningDate}
          </div>
          <div className="userName">
            <strong>Admission Fee:</strong> {user.admissionFee}
          </div>
          <div className="userName">
            <strong>Total Months Paid:</strong> {paidCount} / {monthsDueCount}
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
                  className="p-2 border rounded w-1/2"
                >
                  <option value="">Select Month</option>
                  {months.map((month, idx) =>
                    idx >= joiningMonthIndex && idx <= currentMonthIndex ? (
                      <option key={month} value={month}>{month}</option>
                    ) : null
                  )}
                </select>
                <input
                  type="number"
                  name="fee"
                  placeholder="Fee Amount"
                  value={updateFee}
                  onChange={(e) => setUpdateFee(e.target.value)}
                  required
                  className="p-2 border rounded w-1/2"
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
                if (cleanVal.includes("due")) cellClass = "redColor";
                else if (cleanVal === "paid") cellClass = "greenColor";
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
