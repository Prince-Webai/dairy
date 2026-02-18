
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Job, JobItem, JobStatus } from '@/types';

export function useJob(jobId: string | null) {
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!jobId) {
            setLoading(false);
            return;
        }

        async function fetchJobData() {
            try {
                setLoading(true);
                setError(null);

                // 1. Fetch Job with Customer Relation
                const { data: jobData, error: jobError } = await supabase
                    .from('jobs')
                    .select('*, customers(name)')
                    .eq('id', jobId)
                    .single();

                if (jobError) throw jobError;
                if (!jobData) throw new Error('Job not found');

                // 2. Parse Items (parts_used + labor_hours)
                const parts: JobItem[] = (jobData.parts_used || []).map((p: any, i: number) => ({
                    id: `part-${i}`,
                    description: p.description || 'Part',
                    quantity: p.quantity,
                    unitPrice: p.price_at_time,
                    total: p.quantity * p.price_at_time,
                    type: 'part',
                    productId: p.product_id
                }));

                const labor: JobItem[] = Number(jobData.labor_hours) > 0 ? [{
                    id: 'labor-item',
                    description: 'Labor Hours',
                    quantity: jobData.labor_hours,
                    unitPrice: jobData.labor_rate || 60,
                    total: jobData.labor_hours * (jobData.labor_rate || 60),
                    type: 'labor'
                }] : [];

                const allItems = [...parts, ...labor];
                const calculatedTotal = allItems.reduce((sum, item) => sum + item.total, 0);

                // Helper to format status
                const formatStatus = (s: string): JobStatus => {
                    if (s === 'in_progress') return 'In Progress';
                    if (s === 'scheduled') return 'Scheduled';
                    if (s === 'completed') return 'Completed';
                    if (s === 'cancelled') return 'Cancelled';
                    return 'Scheduled';
                };

                // 3. Map to TypeScript Interface
                const formattedJob: Job = {
                    id: jobData.id,
                    jobNumber: String(jobData.job_number),
                    customerId: jobData.customer_id,
                    customerName: jobData.customers?.name || 'Unknown',
                    description: jobData.description,
                    status: formatStatus(jobData.status),
                    date: jobData.scheduled_date || jobData.created_at,
                    engineerName: 'Unknown', // Not in current schema
                    totalAmount: calculatedTotal,
                    items: allItems
                };

                setJob(formattedJob);

            } catch (err: any) {
                console.error('Error fetching job:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchJobData();
    }, [jobId]);

    return { job, loading, error };
}

export function useJobs() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchJobs() {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('jobs')
                    .select('*, customers(name), profiles:engineer_id(full_name)')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Helper to format status
                const formatStatus = (s: string): JobStatus => {
                    if (s === 'in_progress') return 'In Progress';
                    if (s === 'scheduled') return 'Scheduled';
                    if (s === 'completed') return 'Completed';
                    if (s === 'cancelled') return 'Cancelled';
                    return 'Scheduled';
                };

                const formattedJobs: Job[] = (data || []).map(j => {
                    // Calculate total for list view properly
                    const partsTotal = (j.parts_used || []).reduce((acc: number, p: any) => acc + (p.quantity * p.price_at_time), 0);
                    const laborTotal = (Number(j.labor_hours) || 0) * (Number(j.labor_rate) || 60);
                    // Safe access to profiles relationship
                    const engineerName = j.profiles?.full_name || 'Unassigned';

                    return {
                        id: j.id,
                        jobNumber: String(j.job_number),
                        customerId: j.customer_id,
                        customerName: j.customers?.name || 'Unknown',
                        description: j.description,
                        status: formatStatus(j.status),
                        date: j.scheduled_date || j.created_at,
                        engineerName: engineerName,
                        totalAmount: partsTotal + laborTotal, // Calculate total
                        items: [] // Empty for list view usually
                    };
                });

                setJobs(formattedJobs);
            } catch (err: any) {
                console.error('Error fetching jobs:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchJobs();

        return () => { }; // Cleanup if needed
    }, []);

    const refetch = async () => {
        setLoading(true);
        try {
            // Re-run the fetch logic (duplicate for now or extract to function outside effect if strictly needed, but inside effect is fine if we just trigger a state change or expose the function. 
            // Better pattern: extract fetchJobs outside useEffect, but inside component utilizing useCallback, or just copy paste for speed/simplicity in this context)
            const { data, error } = await supabase
                .from('jobs')
                .select('*, customers(name), profiles:engineer_id(full_name)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formatStatus = (s: string): JobStatus => {
                if (s === 'in_progress') return 'In Progress';
                if (s === 'scheduled') return 'Scheduled';
                if (s === 'completed') return 'Completed';
                if (s === 'cancelled') return 'Cancelled';
                return 'Scheduled';
            };

            const formattedJobs: Job[] = (data || []).map(j => {
                const partsTotal = (j.parts_used || []).reduce((acc: number, p: any) => acc + (p.quantity * p.price_at_time), 0);
                const laborTotal = (Number(j.labor_hours) || 0) * (Number(j.labor_rate) || 60);
                const engineerName = j.profiles?.full_name || 'Unassigned';

                return {
                    id: j.id,
                    jobNumber: String(j.job_number),
                    customerId: j.customer_id,
                    customerName: j.customers?.name || 'Unknown',
                    description: j.description,
                    status: formatStatus(j.status),
                    date: j.scheduled_date || j.created_at,
                    engineerName: engineerName,
                    totalAmount: partsTotal + laborTotal,
                    items: []
                };
            });
            setJobs(formattedJobs);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { jobs, loading, error, refetch };
}
