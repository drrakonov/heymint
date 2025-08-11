// src/pages/Dashboard.tsx

import api from "@/lib/axios";
import { useUserStore } from "@/store/userStore";
import { useEffect } from "react";

const Dashboard = () => {

    const { setUser, user } = useUserStore();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get("/api/user/me");
                setUser(res.data);
            } catch {
                setUser(null);
            }
        };

        if(!user) fetchUser();
    }, []);


    return (
        <div className="overflow-y-auto ">
            <h2 className="text-3xl font-semibold mb-4">Welcome to your Dashboard</h2>
            <p className="text-gray-700">Start creating or joining meetings below.</p>
        </div>
    );
};

export default Dashboard;
