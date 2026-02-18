
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sidebar, MobileSidebar } from "@/components/layout/Sidebar";
import { UserButton } from "@/components/layout/UserButton";
import { Plus, Search, Loader2, FileText, ArrowRight, MoreHorizontal } from "lucide-react";
import { useQuotes } from "@/hooks/use-quotes";
import { supabase } from "@/lib/supabase";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuoteStatus } from "@/types";

const statusColors: Record<QuoteStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    converted: 'bg-purple-100 text-purple-800',
};

export default function QuotesPage() {
    const { quotes, loading, refetch } = useQuotes();
    const [search, setSearch] = useState('');
    const router = useRouter();

    const filteredQuotes = quotes.filter(q =>
        q.customerName.toLowerCase().includes(search.toLowerCase()) ||
        q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
        q.description.toLowerCase().includes(search.toLowerCase())
    );

    const handleConvertToJob = async (quoteId: string, customerId: string, description: string, items: any[], laborHours: number, laborRate: number) => {
        if (!confirm('Convert this quote to a Job? This will create a new scheduled job.')) return;

        try {
            // 1. Create Job from Quote data
            const partsUsed = items
                .filter(i => i.type === 'part')
                .map(i => ({
                    description: i.description,
                    quantity: i.quantity,
                    price_at_time: i.unitPrice,
                    product_id: i.productId || null,
                }));

            const { data: newJob, error: jobError } = await supabase
                .from('jobs')
                .insert({
                    customer_id: customerId,
                    description: description,
                    status: 'scheduled',
                    scheduled_date: new Date().toISOString().split('T')[0],
                    parts_used: partsUsed,
                    labor_hours: laborHours,
                    labor_rate: laborRate,
                })
                .select()
                .single();

            if (jobError) throw jobError;

            // 2. Update Quote status to 'converted' and link to job
            const { error: updateError } = await supabase
                .from('quotes')
                .update({
                    status: 'converted',
                    converted_job_id: newJob.id,
                })
                .eq('id', quoteId);

            if (updateError) throw updateError;

            alert('Quote converted to Job successfully!');
            router.push(`/jobs/${newJob.id}`);
        } catch (err: any) {
            console.error('Error converting quote:', err);
            alert(`Failed to convert: ${err.message}`);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-white border-r border-gray-200">
                <Sidebar />
            </div>

            <main className="md:pl-72 flex-1 h-full overflow-y-auto">
                <div className="flex-1 space-y-4 p-8 pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <MobileSidebar />
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-space-grotesk">Quotes</h2>
                                <p className="text-muted-foreground">Manage estimates and convert to jobs</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Link href="/quotes/new">
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="mr-2 h-4 w-4" /> New Quote
                                </Button>
                            </Link>
                            <UserButton />
                        </div>
                    </div>

                    {/* Search */}
                    <div className="flex items-center space-x-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search quotes..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Quotes Grid */}
                    {filteredQuotes.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <FileText className="h-12 w-12 text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-500">No quotes yet</h3>
                                <p className="text-sm text-gray-400 mb-4">Create your first quote to get started.</p>
                                <Link href="/quotes/new">
                                    <Button className="bg-blue-600 hover:bg-blue-700">
                                        <Plus className="mr-2 h-4 w-4" /> Create Quote
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {/* Table Header */}
                            <div className="hidden md:grid md:grid-cols-6 gap-4 px-4 text-sm font-medium text-gray-500">
                                <div>Quote #</div>
                                <div>Customer</div>
                                <div>Description</div>
                                <div>Status</div>
                                <div className="text-right">Amount</div>
                                <div className="text-right">Actions</div>
                            </div>

                            {filteredQuotes.map(quote => (
                                <Card key={quote.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="grid md:grid-cols-6 gap-4 items-center">
                                            <div className="font-medium text-blue-700">{quote.quoteNumber}</div>
                                            <div className="font-semibold">{quote.customerName}</div>
                                            <div className="text-sm text-gray-600 truncate">{quote.description}</div>
                                            <div>
                                                <Badge className={statusColors[quote.status]}>
                                                    {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                                                </Badge>
                                            </div>
                                            <div className="text-right font-medium">
                                                €{quote.totalAmount.toFixed(2)}
                                            </div>
                                            <div className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => router.push(`/quotes/${quote.id}`)}>
                                                            <FileText className="mr-2 h-4 w-4" /> View Details
                                                        </DropdownMenuItem>
                                                        {quote.status !== 'converted' && quote.status !== 'rejected' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleConvertToJob(
                                                                    quote.id,
                                                                    quote.customerId,
                                                                    quote.description,
                                                                    quote.items,
                                                                    quote.laborHours,
                                                                    quote.laborRate
                                                                )}
                                                            >
                                                                <ArrowRight className="mr-2 h-4 w-4" /> Convert to Job
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
