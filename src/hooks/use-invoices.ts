
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Define a local type for Invoice if not in global types
export interface Invoice {
    id: string;
    invoiceNumber: string;
    customerName: string;
    date: string;
    amount: number;
    status: 'Paid' | 'Unpaid' | 'Issued' | 'Draft' | 'Overdue';
}

export const useInvoices = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('invoices')
                .select('*, customers(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedInvoices: Invoice[] = (data || []).map(inv => ({
                id: inv.id, // Keep UUID for actions
                invoiceNumber: inv.invoice_number,
                customerName: inv.customers?.name || 'Unknown',
                date: inv.issue_date || inv.created_at,
                amount: inv.total_amount,
                status: (inv.status.charAt(0).toUpperCase() + inv.status.slice(1)) as any
            }));

            setInvoices(formattedInvoices);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { invoices, loading, error, refetch: fetchInvoices };
};
