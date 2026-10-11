import { CreditCard, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import Loader from "../subComponents/Loader";
import api from "@/lib/axios";

type Payments = {
    id: string
    meetingName: string
    amount: number
    status: string
    date: string
    paymentMethod: string
}

const Payments = () => {

    const navigate = useNavigate();
    const [payments, setPayments] = useState<Payments[]>([]);
    const { user } = useUserStore();
    const [isLoading, setIsLoading] = useState(false);


    useEffect(() => {
        const getAllPayments = async () => {
            try {

                if (!user) throw new Error("user not found");
                
                setIsLoading(true);
                const res = await api.get("/api/payment/get-payments", {
                    params: { userId: user.id }
                });

                if (!res.data.success) {
                    throw new Error("Failed to get payments");
                }
                
                setPayments(res.data.payments);
                setIsLoading(false);

            } catch (err) {
                console.error("failed to get payments", err);
            }
        }

        getAllPayments();
    }, [])


    const getStatusColor = (status: string) => {
        switch (status) {
            case "success":
                return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
            case "pending":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            case "failed":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "INR",
        }).format(amount)
    }

    const handleBrowseMeetings = () => {
        navigate("/dashboard/meetings");
    }

    if (isLoading) return <Loader />


    return (
        <div className="pt-6 min-h-screen pl-5 pr-5 md:pl-10 md:pr-10 ">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl text-text-primary font-bold mb-2">Payment History</h1>
                <p className="text-muted-foreground text-text-secondary mb-8">Your past payments at a glance</p>
                {payments.length > 0 ? (
                    <Card className="border-surface-2 bg-cardbg shadow-sm text-text-primary">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-semibold">Recent Transactions</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">

                            <div className="space-y-4 p-4">
                                {payments.map((payment) => (
                                    <Card key={payment.id} className="border-slate-400/30 bg-background">
                                        <CardContent className="p-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-text-secondary">
                                                        <Receipt className="h-4 w-4" />
                                                        <span className="font-mono text-sm">{payment.id}</span>
                                                    </div>
                                                    <Badge variant="secondary" className={`capitalize ${getStatusColor(payment.status)}`}>
                                                        {payment.status}
                                                    </Badge>
                                                </div>

                                                <div>
                                                    <h3 className="font-medium text-balance">{payment.meetingName}</h3>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-lg">{formatAmount(payment.amount)}</span>
                                                    <span className="text-sm">{formatDate(payment.date)}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    /* Empty State */
                    <Card className="border-surface-2 shadow-sm bg-cardbg text-text-primary">
                        <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                            <div className="rounded-full bg-muted p-4 mb-4">
                                <CreditCard className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2 text-balance">No payments found</h3>
                            <p className="text-text-secondary text-center max-w-md text-pretty">
                                You haven't made any payments yet. When you book and pay for meetings, they'll appear here.
                            </p>
                            <Button
                                onClick={handleBrowseMeetings}
                                className="mt-6 bg-accent-hover/60 hover:bg-primary/20 text-primary-foreground"
                            >
                                Browse Meetings
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

export default Payments;