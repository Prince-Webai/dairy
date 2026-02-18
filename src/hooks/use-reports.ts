
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface MonthlyData {
    name: string;
    total: number;
}

export interface ReportsData {
    totalRevenue: number;
    completedJobs: number;
    monthlyRevenue: MonthlyData[];
    revenueGrowth: number; // Mock or calculated
    jobsGrowth: number; // Mock or calculated
}

export function useReports() {
    const [data, setData] = useState<ReportsData>({
        totalRevenue: 0,
        completedJobs: 0,
        monthlyRevenue: [],
        revenueGrowth: 0,
        jobsGrowth: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchReports() {
            try {
                setLoading(true);

                // 1. Completed Jobs
                const { count: completedCount } = await supabase
                    .from('jobs')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'completed');

                // 2. Total Revenue (Paid Invoices)
                // Also fetch created_at to group by month
                const { data: invoices } = await supabase
                    .from('invoices')
                    .select('total_amount, issue_date')
                    .eq('status', 'paid'); // Assuming we only count paid

                const totalRevenue = (invoices || []).reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);

                // 3. Group by Month (Last 6 months)
                const monthMap = new Map<string, number>();
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                // Initialize current year months
                const currentYear = new Date().getFullYear();

                (invoices || []).forEach(inv => {
                    const date = new Date(inv.issue_date);
                    if (date.getFullYear() === currentYear) {
                        const monthName = months[date.getMonth()];
                        monthMap.set(monthName, (monthMap.get(monthName) || 0) + Number(inv.total_amount));
                    }
                });

                // Convert to array
                const monthlyRevenue: MonthlyData[] = months.slice(0, new Date().getMonth() + 1).map(m => ({
                    name: m,
                    total: monthMap.get(m) || 0
                }));

                setData({
                    totalRevenue,
                    completedJobs: completedCount || 0,
                    monthlyRevenue,
                    revenueGrowth: 0, // Needs 12-month data to calc
                    jobsGrowth: 0
                });

            } catch (error) {
                console.error("Error fetching reports:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchReports();
    }, []);

    return { data, loading };
}
