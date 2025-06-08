'use client';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddUser() {
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        phone: '',
        joiningDate: '',
        fee: '',
        image: '',
    });
    const [status, setStatus] = useState('');
    const router = useRouter();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('Submitting...');

        const admissionFee = 500;
        const monthlyFee = 1000;

        const feeEntered = Number(formData.fee);
        const joiningDate = new Date(formData.joiningDate);
        const monthIndex = joiningDate.getMonth(); // 0 to 11
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        if (feeEntered !== 500 && feeEntered !== 1500) {
            toast.dismiss();
            toast.error('❌ Invalid fee. Must be ₹500 or ₹1500.');
            return;
        }

        const monthData = Object.fromEntries(monthNames.map(month => [month, '']));
        if (feeEntered === 1500) {
            monthData[monthNames[monthIndex]] = monthlyFee;
        }

        const payload = {
            id: formData.id,
            name: formData.name,
            phone: formData.phone,
            joiningDate: formData.joiningDate,
            admissionFee: admissionFee,
            image: formData.image || '',   // default empty if not provided
            ...monthData,
        };

        try {
            const response = await fetch('/api/add-row', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                toast.success('✅ Submitted successfully!');
                setFormData({
                    id: '',
                    name: '',
                    phone: '',
                    joiningDate: '',
                    fee: '',
                    image: '',
                });
                router.push('/UserList');
            } else {
                toast.error('❌ Failed to submit');
            }
        } catch (err) {
            console.error(err);
            toast.dismiss();
            toast.error('❌ Error submitting');
        }
    };

    return (
        <>
            <h2>User Form</h2>
            <form onSubmit={handleSubmit} className="addUserFrom">

                <div className="mainFromBox">
                    <input
                        type="number"
                        name="id"
                        placeholder="User ID"
                        required
                        value={formData.id}
                        onChange={handleChange}
                    />
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
                        required
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
                <button
                    type="submit"
                >
                    Submit
                </button>
                <p>{status}</p>
            </form>
        </>
    );
}
