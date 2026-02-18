
"use client";

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar, MobileSidebar } from "@/components/layout/Sidebar";
import { UserButton } from "@/components/layout/UserButton";
import { Loader2, ArrowLeft, ArrowRight, FileText, Printer } from "lucide-react";
import { useQuote } from "@/hooks/use-quotes";
import { supabase } from "@/lib/supabase";
import { QuoteStatus } from "@/types";
import Link from 'next/link';

const statusColors: Record<QuoteStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    converted: 'bg-purple-100 text-purple-800',
};

export default function QuoteDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { quote, loading, error } = useQuote(id as string);

    const handleStatusUpdate = async (newStatus: QuoteStatus) => {
        if (!quote) return;
        try {
            const { error } = await supabase
                .from('quotes')
                .update({ status: newStatus })
                .eq('id', quote.id);

            if (error) throw error;
            window.location.reload();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleConvert = async () => {
        if (!quote) return;
        if (!confirm('Convert this quote to an active Job?')) return;

        try {
            const partsUsed = quote.items
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
                    customer_id: quote.customerId,
                    description: quote.description,
                    status: 'scheduled',
                    scheduled_date: new Date().toISOString().split('T')[0],
                    parts_used: partsUsed,
                    labor_hours: quote.laborHours,
                    labor_rate: quote.laborRate,
                })
                .select()
                .single();

            if (jobError) throw jobError;

            await supabase
                .from('quotes')
                .update({ status: 'converted', converted_job_id: newJob.id })
                .eq('id', quote.id);

            alert('Quote converted to Job!');
            router.push(`/jobs/${newJob.id}`);
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !quote) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <Card className="p-8 text-center">
                    <p className="text-red-500 mb-4">Quote not found.</p>
                    <Link href="/quotes"><Button variant="outline">Back to Quotes</Button></Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-white border-r border-gray-200">
                <Sidebar />
            </div>

            <main className="md:pl-72 flex-1 h-full overflow-y-auto">
                <div className="flex-1 space-y-6 p-8 pt-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <MobileSidebar />
                            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-space-grotesk">
                                        {quote.quoteNumber}
                                    </h2>
                                    <Badge className={statusColors[quote.status]}>
                                        {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground">{quote.customerName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {quote.status === 'draft' && (
                                <Button variant="outline" onClick={() => handleStatusUpdate('sent')}>
                                    Mark as Sent
                                </Button>
                            )}
                            {quote.status === 'sent' && (
                                <>
                                    <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleStatusUpdate('accepted')}>
                                        Accept
                                    </Button>
                                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatusUpdate('rejected')}>
                                        Reject
                                    </Button>
                                </>
                            )}
                            {(quote.status === 'draft' || quote.status === 'sent' || quote.status === 'accepted') && (
                                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleConvert}>
                                    <ArrowRight className="mr-2 h-4 w-4" /> Convert to Job
                                </Button>
                            )}
                            {quote.convertedJobId && (
                                <Link href={`/jobs/${quote.convertedJobId}`}>
                                    <Button variant="outline">
                                        <FileText className="mr-2 h-4 w-4" /> View Job
                                    </Button>
                                </Link>
                            )}
                            <UserButton />
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Details */}
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Description</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700">{quote.description || 'No description.'}</p>
                                    {quote.notes && (
                                        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                            <p className="text-xs font-medium text-yellow-800 mb-1">Notes:</p>
                                            <p className="text-sm text-yellow-700">{quote.notes}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Line Items */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Items</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {quote.items.length === 0 ? (
                                        <p className="text-gray-400 text-sm text-center py-4">No items on this quote.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-500 px-2 py-1">
                                                <div className="col-span-1">Description</div>
                                                <div className="text-center">Qty</div>
                                                <div className="text-right">Unit Price</div>
                                                <div className="text-right">Total</div>
                                            </div>
                                            {quote.items.map((item, i) => (
                                                <div key={i} className="grid grid-cols-4 gap-2 items-center bg-gray-50 px-2 py-3 rounded-lg text-sm">
                                                    <div className="col-span-1 font-medium">{item.description}</div>
                                                    <div className="text-center">{item.quantity}</div>
                                                    <div className="text-right">€{item.unitPrice.toFixed(2)}</div>
                                                    <div className="text-right font-medium">€{item.total.toFixed(2)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Summary Sidebar */}
                        <div>
                            <Card className="sticky top-6">
                                <CardHeader>
                                    <CardTitle>Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Parts</span>
                                        <span>€{quote.items.reduce((s, i) => s + i.total, 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Labor ({quote.laborHours} hrs × €{quote.laborRate})</span>
                                        <span>€{(quote.laborHours * quote.laborRate).toFixed(2)}</span>
                                    </div>
                                    <hr />
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span className="text-blue-700">€{quote.totalAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 space-y-1">
                                        <div>Created: {new Date(quote.createdAt).toLocaleDateString()}</div>
                                        {quote.validUntil && <div>Valid until: {new Date(quote.validUntil).toLocaleDateString()}</div>}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
