
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar, MobileSidebar } from "@/components/layout/Sidebar";
import { UserButton } from "@/components/layout/UserButton";
import { DollarSign, Activity, CreditCard, Users, Loader2 } from "lucide-react";
import { useDashboardStats } from "@/hooks/use-dashboard";

export default function DashboardPage() {
    const { stats, loading } = useDashboardStats();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-white border-r border-gray-200">
                <Sidebar />
            </div>

            {/* Main Content */}
            <main className="md:pl-72 flex-1 h-full overflow-y-auto">
                <div className="flex-1 space-y-4 p-8 pt-6">
                    <div className="flex items-center justify-between space-y-2">
                        <div className="flex items-center gap-2">
                            <MobileSidebar />
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-space-grotesk">Dashboard</h2>
                        </div>
                        <div className="flex items-center space-x-2">
                            {/* User Button / Header Actions */}
                            <div className="bg-white p-2 rounded-full shadow-sm border border-gray-100 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">JD</div>
                                <div className="text-sm font-medium pr-2">John Condon</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Revenue
                                </CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">€{stats.totalRevenue.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                <p className="text-xs text-muted-foreground">
                                    Collected from invoices
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Active Jobs
                                </CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.activeJobs}</div>
                                <p className="text-xs text-muted-foreground">
                                    Currently scheduled or in progress
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.partsAllocated}</div>
                                <p className="text-xs text-muted-foreground">
                                    Unique parts recorded
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Customers
                                </CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.activeCustomers}</div>
                                <p className="text-xs text-muted-foreground">
                                    Registered in system
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                {/* <Overview /> */}
                                <div className="h-[200px] w-full bg-slate-50 flex items-center justify-center text-slate-400">
                                    Chart Placeholder (Requires more data context)
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Recent Sales</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Latest paid invoices.
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-8">
                                    {stats.recentSales.length > 0 ? (
                                        stats.recentSales.map((sale: any) => (
                                            <div className="flex items-center" key={sale.id}>
                                                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                                    {sale.initials}
                                                </div>
                                                <div className="ml-4 space-y-1">
                                                    <p className="text-sm font-medium leading-none">{sale.customer}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {sale.description}
                                                    </p>
                                                </div>
                                                <div className="ml-auto font-medium">+€{sale.amount?.toFixed(2)}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-sm text-gray-500 py-4">No recent sales</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
