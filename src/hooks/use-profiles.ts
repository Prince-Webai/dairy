
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'engineer' | 'accountant';
    initials: string;
}

export function useProfiles() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProfiles() {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('full_name');

                if (error) throw error;

                if (error) throw error;

                let formattedProfiles: Profile[] = [];

                if (!data || data.length === 0) {
                    console.log('No profiles found, using mock data for demo');
                    formattedProfiles = [
                        { id: 'mock-1', email: 'john@condondairy.com', full_name: 'John Condon', role: 'admin', initials: 'JC' },
                        { id: 'mock-2', email: 'mike@condondairy.com', full_name: 'Mike Ryan', role: 'engineer', initials: 'MR' },
                        { id: 'mock-3', email: 'sarah@condondairy.com', full_name: 'Sarah Connor', role: 'engineer', initials: 'SC' },
                    ];
                } else {
                    formattedProfiles = data.map(p => ({
                        id: p.id,
                        email: p.email,
                        full_name: p.full_name || p.email.split('@')[0], // Fallback to email prefix
                        role: p.role || 'engineer',
                        initials: (p.full_name || p.email).substring(0, 2).toUpperCase()
                    }));
                }

                setProfiles(formattedProfiles);
            } catch (err: any) {
                console.error('Error fetching profiles:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchProfiles();
    }, []);

    return { profiles, loading, error };
}
