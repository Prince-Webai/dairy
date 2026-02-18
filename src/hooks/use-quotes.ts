
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Quote, QuoteStatus, JobItem } from '@/types';

export function useQuotes() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchQuotes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('quotes')
                .select('*, customers(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formatted: Quote[] = (data || []).map(q => {
                const items: JobItem[] = (q.items || []).map((item: any, i: number) => ({
                    id: `item-${i}`,
                    description: item.description || 'Item',
                    quantity: item.quantity || 0,
                    unitPrice: item.unit_price || 0,
                    total: (item.quantity || 0) * (item.unit_price || 0),
                    type: item.type || 'part',
                }));

                const partsTotal = items.reduce((sum, item) => sum + item.total, 0);
                const laborTotal = (Number(q.labor_hours) || 0) * (Number(q.labor_rate) || 60);

                return {
                    id: q.id,
                    quoteNumber: `Q-${String(q.quote_number).padStart(4, '0')}`,
                    customerId: q.customer_id,
                    customerName: q.customers?.name || 'Unknown',
                    description: q.description || '',
                    status: q.status as QuoteStatus,
                    validUntil: q.valid_until || '',
                    items,
                    laborHours: Number(q.labor_hours) || 0,
                    laborRate: Number(q.labor_rate) || 60,
                    totalAmount: Number(q.total_amount) || partsTotal + laborTotal,
                    notes: q.notes || '',
                    convertedJobId: q.converted_job_id || undefined,
                    createdAt: q.created_at,
                };
            });

            setQuotes(formatted);
        } catch (err: any) {
            console.error('Error fetching quotes:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotes();
    }, []);

    return { quotes, loading, error, refetch: fetchQuotes };
}

export function useQuote(quoteId: string | null) {
    const [quote, setQuote] = useState<Quote | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!quoteId) {
            setLoading(false);
            return;
        }

        async function fetchQuote() {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('quotes')
                    .select('*, customers(name)')
                    .eq('id', quoteId)
                    .single();

                if (error) throw error;

                const items: JobItem[] = (data.items || []).map((item: any, i: number) => ({
                    id: `item-${i}`,
                    description: item.description || 'Item',
                    quantity: item.quantity || 0,
                    unitPrice: item.unit_price || 0,
                    total: (item.quantity || 0) * (item.unit_price || 0),
                    type: item.type || 'part',
                }));

                const partsTotal = items.reduce((sum, item) => sum + item.total, 0);
                const laborTotal = (Number(data.labor_hours) || 0) * (Number(data.labor_rate) || 60);

                setQuote({
                    id: data.id,
                    quoteNumber: `Q-${String(data.quote_number).padStart(4, '0')}`,
                    customerId: data.customer_id,
                    customerName: data.customers?.name || 'Unknown',
                    description: data.description || '',
                    status: data.status as QuoteStatus,
                    validUntil: data.valid_until || '',
                    items,
                    laborHours: Number(data.labor_hours) || 0,
                    laborRate: Number(data.labor_rate) || 60,
                    totalAmount: Number(data.total_amount) || partsTotal + laborTotal,
                    notes: data.notes || '',
                    convertedJobId: data.converted_job_id || undefined,
                    createdAt: data.created_at,
                });
            } catch (err: any) {
                console.error('Error fetching quote:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchQuote();
    }, [quoteId]);

    return { quote, loading, error };
}
