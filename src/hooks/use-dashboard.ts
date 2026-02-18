
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
    totalRevenue: number;
    activeJobs: number;
    partsAllocated: number; // Simplified to just count of allocatable items for now? Or query products?
    activeCustomers: number;
    recentSales: any[];
}

export const useDashboardStats = () => {
    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: 0,
        activeJobs: 0,
        partsAllocated: 0,
        activeCustomers: 0,
        recentSales: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 1. Active Jobs
                const { count: jobsCount } = await supabase
                    .from('jobs')
                    .select('*', { count: 'exact', head: true })
                    .in('status', ['scheduled', 'in_progress']);

                // 2. Customers
                const { count: customersCount } = await supabase
                    .from('customers')
                    .select('*', { count: 'exact', head: true });

                // 3. Products
                const { count: productsCount } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true }); // Total products

                // 4. Recent Sales (Completed Jobs or Invoices) - Using Invoices for revenue
                const { data: invoicesData } = await supabase
                    .from('invoices')
                    .select('total_amount, status')
                    .eq('status', 'paid');

                const totalRevenue = (invoicesData || []).reduce((acc, inv) => acc + (Number(inv.total_amount) || 0), 0);

                // 5. Recent Activity (Latest 3 Invoices/Jobs)
                const { data: recentInvoices } = await supabase
                    .from('invoices')
                    .select('*, customers(name)')
                    .order('created_at', { ascending: false })
                    .limit(3);

                setStats({
                    activeJobs: jobsCount || 0,
                    activeCustomers: customersCount || 0,
                    partsAllocated: productsCount || 0, // Showing total products for now as "Inventory Items" or similar
                    totalRevenue: totalRevenue,
                    recentSales: (recentInvoices || []).map(inv => ({
                        id: inv.id,
                        customer: inv.customers?.name || 'Unknown',
                        description: inv.custom_description || 'Invoice',
                        amount: inv.total_amount,
                        initials: (inv.customers?.name || 'U').substring(0, 2).toUpperCase()
                    }))
                });

            } catch (error) {
                console.error("Error fetching dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return { stats, loading };
};
