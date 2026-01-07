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

  // Fee calculation with 2026 reset for 2025 joiners
  const calculateRemainingFee = (user) => {
    const {
      admissionFee = 0,
      joiningDate,
      Jan = "", Feb = "", Mar = "", Apr = "",
      May = "", Jun = "", Jul = "", Aug = "",
      Sep = "", Oct = "", Nov = "", Dec = "",
    } = user;

    const monthlyFields = { Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec };
    const join = joiningDate ? new Date(joiningDate) : null;
    const joinYear = join ? join.getFullYear() : null;
    const now = new Date();
    const currentYear = now.getFullYear();

    let monthlyPaid = 0;
    let absentCount = 0;

    // Loop over months
    Object.entries(monthlyFields).forEach(([month, value]) => {
      // Only consider 2026 months for 2025 joiners
      if (joinYear === 2025 && currentYear === 2026) {
        if (typeof value === "string" && value.trim().toLowerCase() === "absent") {
          absentCount++;
        } else {
          monthlyPaid += parseInt(value, 10) || 0;
        }
      } else {
        if (typeof value === "string" && value.trim().toLowerCase() === "absent") {
          absentCount++;
        } else {
          monthlyPaid += parseInt(value, 10) || 0;
        }
      }
    });

    const totalPaid = Number(admissionFee) + monthlyPaid;

    if (!join) return { remaining: 0, absentCount: 0 };

    // Calculate due months
    let dueMonths = 0;
    if (joinYear === 2025) {
      let nextDue = new Date(`Jan 1, 2026`);
      while (nextDue <= now) {
        dueMonths++;
        nextDue.setMonth(nextDue.getMonth() + 1);
      }
    } else {
      let nextDue = new Date(join);
      nextDue.setMonth(nextDue.getMonth() + 1);
      while (nextDue <= now) {
        dueMonths++;
        nextDue.setMonth(nextDue.getMonth() + 1);
      }
    }

    const baseDue = 500 + dueMonths * 1000; // 500 admission + monthly fee
    const adjustedDue = baseDue - absentCount * 1000;
    const remainingFee = adjustedDue - totalPaid;

    return {
      remaining: remainingFee > 0 ? remainingFee : 0,
      absentCount,
    };
  };

  // Filtered and searched data
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
              const { id = index + 1, name = "", phone = "", joiningDate = "" } = user;
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
                <tr key={id}>
                  <td>{id}</td>
                  <td>{name}</td>
                  <td>{phone ? formatPhoneNumber(phone) : <em>No phone number</em>}</td>
                  <td>{formattedJoiningDate}</td>
                  <td>
                    <div className={remaining > 0 ? "redColor" : "greenColor"}>
                      Rs. {remaining}
                      {absentCount > 0 && <em> ({absentCount} Absent)</em>}
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
