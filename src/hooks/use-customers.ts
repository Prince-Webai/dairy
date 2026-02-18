
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/types';

export const useCustomers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .order('name');

            if (error) throw error;

            const formattedCustomers: Customer[] = (data || []).map(c => ({
                id: c.id,
                name: c.name,
                email: c.email || '',
                phone: c.phone || '',
                address: `${c.address || ''}, ${c.town || ''}`.replace(/^, /, ''),
                initials: c.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
                balance: 0, // Placeholder, logic for balance would be complex
            }));

            setCustomers(formattedCustomers);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { customers, loading, error, refetch: fetchCustomers };
};
