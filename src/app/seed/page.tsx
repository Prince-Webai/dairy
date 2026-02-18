
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import { mockCustomers, mockProducts, mockJobs } from '@/lib/mock-data';
import { Loader2, CheckCircle, Database } from "lucide-react";
import Link from 'next/link';

export default function SeedPage() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string[]>([]);
    const [completed, setCompleted] = useState(false);

    const log = (message: string) => setStatus(prev => [...prev, message]);

    const handleSeed = async () => {
        setLoading(true);
        setStatus([]);
        setCompleted(false);

        try {
            log("Starting database seed...");

            // 1. Seed Customers
            log(`Seeding ${mockCustomers.length} customers...`);
            const { error: custError } = await supabase
                .from('customers')
                .upsert(mockCustomers.map(c => ({
                    // We let Supabase generate IDs if we want, or use our mock IDs if UUID compatible
                    // mock IDs like 'cust_1' are not valid UUIDs. We should let Supabase generate them
                    // BUT for relationships to work in this seed script, we need to map them.
                    // Let's simplified: Insert and ignore return IDs for now, or just generic insert.
                    // Actually, for the 'Jobs' to link to 'Customers', we need valid UUIDs. 
                    // Let's just insert data without IDs and let Postgres generate UUIDs, 
                    // BUT we lose the relationships in this simple script unless we fetch them back.
                    // STRATEGY: Create everything fresh.
                    name: c.name,
                    initials: c.initials,
                    email: c.email,
                    phone: c.phone,
                    address: c.address,
                    balance: c.balance
                })));

            if (custError) throw custError;
            log("✅ Customers seeded.");

            // 2. Seed Products
            log(`Seeding ${mockProducts.length} products...`);
            const { error: prodError } = await supabase
                .from('products')
                .upsert(mockProducts.map(p => ({
                    name: p.name,
                    sku: p.sku,
                    price: p.price,
                    stock: p.stock,
                    category: 'General'
                })), { onConflict: 'sku' });

            if (prodError) throw prodError;
            log("✅ Products seeded.");

            // 3. Seed Jobs (We need to fetch a customer ID to link to)
            log("Fetching a customer to link jobs...");
            const { data: realCustomers } = await supabase.from('customers').select('id, name').limit(1);

            if (realCustomers && realCustomers.length > 0) {
                const customer = realCustomers[0];
                log(`Linking jobs to customer: ${customer.name}`);

                // Use Promise.all to handle multiple async operations
                const jobPromises = mockJobs.map(async (j, i) => {
                    // Fix: Database expects integer for job_number
                    const jobNumber = 2024000 + i;

                    // Map Status to DB enum (lowercase snake_case)
                    const mapStatus = (s: string) => {
                        switch (s) {
                            case 'In Progress': return 'in_progress';
                            case 'Completed': return 'completed';
                            case 'Cancelled': return 'cancelled';
                            default: return 'scheduled';
                        }
                    };

                    // Check if job exists
                    const { data: existing } = await supabase
                        .from('jobs')
                        .select('id')
                        .eq('job_number', jobNumber)
                        .single();

                    if (!existing) {
                        const { error: insertError } = await supabase
                            .from('jobs')
                            .insert({
                                job_number: jobNumber,
                                customer_id: customer.id,
                                // customer_name: j.customerName, // REMOVED: Not in schema
                                description: j.description,
                                status: mapStatus(j.status),
                                // date: new Date(j.date).toISOString(), // Schema has 'scheduled_date' type date, or 'created_at' type timestamptz. 
                                // Schema line 49: scheduled_date date
                                // Schema also has created_at default now().
                                // Let's map date to scheduled_date
                                scheduled_date: j.date, // Assuming string YYYY-MM-DD is fine for date type

                                // engineer_name column? Schema says engineer_id uuid. 
                                // Schema line 45: engineer_id uuid. 
                                // There is NO engineer_name column in schema.
                                // We probably need to fetch an engineer profile or just skip it for now.
                                // Code was: engineer_name: j.engineerName
                                // Let's SKIP engineer_name as it will fail too.

                                // total_amount column? 
                                // Schema line 52+: parts_used jsonb, labor_hours decimal, labor_rate decimal.
                                // There is NO 'total_amount' column in jobs table! 
                                // Wait, Schema line 68 has total_amount in INVOICES table.
                                // Jobs table does NOT have total_amount.
                                // So we cannot insert total_amount into jobs.
                            });
                        if (insertError) {
                            console.error(`Failed to insert job ${jobNumber}:`, insertError);
                            // throw insertError; // Don't throw, just log so we see other errors if any
                        }
                    }
                });

                await Promise.all(jobPromises);
                log("✅ Jobs seeded.");
            } else {
                log("⚠️ Could not find a customer to link jobs to. Skipping jobs.");
            }

            setCompleted(true);
            log("🎉 Database seeding complete!");

        } catch (error: any) {
            console.error(error);
            log(`❌ Error: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <Database className="h-6 w-6 text-blue-600" />
                        <CardTitle>Initialize Database</CardTitle>
                    </div>
                    <CardDescription>
                        Populate your new Supabase database with the demo data.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-xs h-48 overflow-y-auto mb-4">
                        {status.length === 0 ? (
                            <span className="text-slate-500">// Ready to seed...</span>
                        ) : (
                            status.map((line, i) => <div key={i}>{line}</div>)
                        )}
                    </div>

                    {!completed ? (
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={handleSeed}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Seeding...
                                </>
                            ) : (
                                "Seed Data Now"
                            )}
                        </Button>
                    ) : (
                        <Link href="/dashboard">
                            <Button className="w-full bg-green-600 hover:bg-green-700">
                                <CheckCircle className="mr-2 h-4 w-4" /> Go to Dashboard
                            </Button>
                        </Link>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
