"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { LoadingIcon } from "@/src/app/app-constants";

export default function UserShow() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch("/api/get-rows");
        if (!res.ok) throw new Error("Failed to fetch data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function formatPhoneNumber(phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10 && digits.startsWith("3")) {
      return `+92-${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    if (digits.length === 12 && digits.startsWith("92")) {
      return `+${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    }
    return phone;
  }

  // Updated fee calculation with absent logic
const calculateRemainingFee = (user) => {
  const {
    admissionFee = 0,
    joiningDate,
    Jan = "", Feb = "", Mar = "", Apr = "",
    May = "", Jun = "", Jul = "", Aug = "",
    Sep = "", Oct = "", Nov = "", Dec = "",
  } = user;

  const monthlyFields = [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec];
  const monthlyFee = 1000;

  // Count absent months
  const absentCount = monthlyFields.filter(
    (val) => typeof val === "string" && val.trim().toLowerCase() === "absent"
  ).length;

  // Count paid months
  const paidMonths = monthlyFields.map((fee) => parseInt(fee, 10) || 0);
  const totalPaidMonths = paidMonths.reduce((sum, fee) => sum + fee, 0);

  const totalPaid = Number(admissionFee) + totalPaidMonths;

  if (!joiningDate) return { remaining: 0, absentCount: 0 };

  const join = new Date(joiningDate);
  if (isNaN(join)) return { remaining: 0, absentCount: 0 };

  const now = new Date();

  // --- 2025 ke months automatically paid --- //
  let paid2025Months = 0;
  if (join.getFullYear() === 2025) {
    paid2025Months = 12 - join.getMonth(); // joining month se Dec 2025
  }

  // --- 2026 onwards calculation --- //
  let dueMonths2026 = 0;
  const start2026 = new Date(Math.max(join.getTime(), new Date(2026, 0, join.getDate()))); // start from joining date or Jan 2026
  let nextDue = new Date(start2026);

  while (nextDue <= now) {
    dueMonths2026++;
    nextDue.setMonth(nextDue.getMonth() + 1);
  }

  // Total due = admission fee + 2025 months + 2026 months
  const totalDue = Number(admissionFee) + dueMonths2026 * monthlyFee;

  // Subtract already paid + absent months (for 2026)
  const adjustedDue = totalDue - totalPaid - absentCount * monthlyFee;

  return {
    remaining: adjustedDue > 0 ? adjustedDue : 0,
    absentCount,
  };
};



  const filteredData = data.filter((user) => {
    const { remaining } = calculateRemainingFee(user);

    if (filter === "paid" && remaining > 0) return false;
    if (filter === "due" && remaining <= 0) return false;

    if (search) {
      const searchLower = search.toLowerCase();
      const idString = String(user.id || "").toLowerCase();
      const nameLower = (user.name || "").toLowerCase();
       const phoneLower = (user.phone || "").toLowerCase();
      return idString.includes(searchLower) || nameLower.includes(searchLower) || phoneLower.includes(searchLower);
    }

    return true;
  });

  if (loading)
    return (
      <div className="LoadingIcon">
        <LoadingIcon />
      </div>
    );
  if (error) return <p>Error: {error}</p>;

  return (
    <>
      <div className="headingSec">
        <div className="headingBox">
          <h2>Monthly Fee Status</h2>
        </div>
        <div className="userFeeUpdate">
          <div className="mainSelectBox">
            <div>
              <label htmlFor="userSearch">Search User: </label>
              <input
                id="userSearch"
                type="text"
                placeholder="User ID Or Name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="userFilter">Filter Users: </label>
              <select
                id="userFilter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Users</option>
                <option value="paid">Paid Users</option>
                <option value="due">Due Users</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive listingTable">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Joining Date</th>
              <th>Remaining Fee</th>
              <th>More Detail</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((user, index) => {
              const {
                id = index + 1,
                name = "",
                phone = "",
                joiningDate = "",
              } = user;

              const { remaining, absentCount } = calculateRemainingFee(user);

              const formattedJoiningDate = joiningDate
                ? (() => {
                    const d = new Date(joiningDate);
                    if (isNaN(d)) return "";
                    const day = String(d.getDate()).padStart(2, "0");
                    const monthNames = [
                      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                    ];
                    const month = monthNames[d.getMonth()];
                    const year = d.getFullYear();
                    return `${day}-${month}-${year}`;
                  })()
                : "";

              return (
               <tr key={id || `row-${index}`}>
                  <td>{id}</td>
                  <td>{name}</td>
                  <td>
                    {phone ? formatPhoneNumber(phone) : <em>No phone number</em>}
                  </td>
                  <td>{formattedJoiningDate}</td>
                  <td>
                    <div className={remaining > 0 ? "redColor" : "greenColor"}>
                      Rs. {remaining}
                      {absentCount > 0 && (
                        <em>
                         ({absentCount} Absent)
                        </em>
                      )}
                    </div>
                  </td>
                  <td>
                    <Link href={`/MoreDetail/${id}`}>View More</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
