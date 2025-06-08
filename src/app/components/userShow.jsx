'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { LoadingIcon } from '@/src/app/app-constants';

export default function UserShow() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const res = await fetch('/api/get-rows'); // API route
                if (!res.ok) throw new Error('Failed to fetch data');
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

    if (loading) return <div className="LoadingIcon"><LoadingIcon /></div>;
    if (error) return <p>Error: {error}</p>;

    return (



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
                    {data.map((user, index) => {
                        const {
                            id = index + 1,
                            name = '',
                            phone = '',
                            joiningDate = '',
                            admissionFee = 0,
                            Jan = '', Feb = '', Mar = '', Apr = '',
                            May = '', Jun = '', Jul = '', Aug = '',
                            Sep = '', Oct = '', Nov = '', Dec = ''
                        } = user;

                        // Parse monthly fees to numbers
                        const paidMonths = [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]
                            .map((fee) => parseInt(fee, 10) || 0);

                        const monthlyPaid = paidMonths.reduce((sum, fee) => sum + fee, 0);
                        const totalPaid = Number(admissionFee) + monthlyPaid;

                        let remainingFee = 0;
                        let formattedJoiningDate = joiningDate;
                        if (joiningDate) {
                            const join = new Date(joiningDate);
                            if (!isNaN(join)) {
                                formattedJoiningDate = join.toLocaleDateString(); // Format nicely
                                const now = new Date();
                                const monthsDue = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth() + 1);
                                const totalDue = 500 + (monthsDue * 1000);
                                remainingFee = totalDue - totalPaid;
                            }
                        }

                        return (
                            <tr key={id}>
                                <td>{id}</td>
                                <td>{name}</td>
                                <td>{phone}</td>
                                <td>{formattedJoiningDate}</td>
                                <td><div className={remainingFee > 0 ? 'redColor' : 'greenColor'}>{remainingFee}</div></td>
                                <td>
                                    <Link href={`/MoreDetail/${id}`}>View More</Link>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
