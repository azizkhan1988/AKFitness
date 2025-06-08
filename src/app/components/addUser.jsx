"use client";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AddUser() {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    phone: "",
    joiningDate: "",
    fee: "",
    image: "",
  });
  const [status, setStatus] = useState("Submit");
  const router = useRouter();

  useEffect(() => {
    async function fetchLastId() {
      try {
        const res = await fetch("/api/get-last-id");
        const data = await res.json();
        if (res.ok) {
          setFormData((prev) => ({ ...prev, id: data.id }));
        } else {
          toast.error("Failed to get next ID");
        }
      } catch (err) {
        console.error("Error getting last ID:", err);
        toast.error("Error fetching user ID");
      }
    }

    fetchLastId();
  }, []);
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Submitting...");

    const admissionFee = 500;
    const monthlyFee = 1000;

    const feeEntered = Number(formData.fee);
    const joiningDate = new Date(formData.joiningDate);
    const monthIndex = joiningDate.getMonth();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    if (feeEntered !== 500 && feeEntered !== 1500) {
      toast.dismiss();
      toast.error("❌ Invalid fee. Must be Rs.500 or Rs.1500.");
      return;
    }

    const monthData = Object.fromEntries(
      monthNames.map((month) => [month, ""])
    );
    if (feeEntered === 1500) {
      monthData[monthNames[monthIndex]] = monthlyFee;
    }

    const payload = {
      id: formData.id,
      name: formData.name,
      phone: formData.phone,
      joiningDate: formData.joiningDate,
      admissionFee: admissionFee,
      image: formData.image || "",
      ...monthData,
    };

    try {
      const response = await fetch("/api/add-row", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("✅ Submitted successfully!");
        setFormData({
          id: "",
          name: "",
          phone: "",
          joiningDate: "",
          fee: "",
          image: "",
        });
        router.push("/UserList");
      } else {
        toast.error("❌ Failed to submit");
      }
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("❌ Error submitting");
    }
  };

  return (
    <>
      <h2>User Form</h2>
      <form onSubmit={handleSubmit} className="addUserFrom">
        <div className="mainFromBox">
          <input
            type="text"
            name="name"
            placeholder="Name"
            required
            value={formData.name}
            onChange={handleChange}
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            required
            value={formData.phone}
            onChange={handleChange}
          />
          <input
            type="date"
            name="joiningDate"
            placeholder="Joining Date"
            value={formData.joiningDate}
            onChange={handleChange}
          />
          <input
            type="number"
            name="fee"
            placeholder="Total Fee"
            required
            value={formData.fee}
            onChange={handleChange}
          />
        </div>
        <button type="submit">{status}</button>
      </form>
    </>
  );
}
