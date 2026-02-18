
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileCheck, Loader2, Download } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserButton } from "@/components/layout/UserButton";
import Link from 'next/link';
import { useJob } from "@/hooks/use-job";
import { generateCustomerStatement, generateAccountantInvoice } from '@/lib/pdf-generator';
import { supabase } from '@/lib/supabase';

function NewInvoiceContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const jobId = searchParams.get('jobId');

    const { job, loading, error } = useJob(jobId);

    // Default Accountant Settings
    const [customDescription, setCustomDescription] = useState('Milking Machine Service & Maintenance');
    const [vatRate, setVatRate] = useState('13.5');
    const [activeTab, setActiveTab] = useState("invoice");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Derived Data
    const lineItems = job?.items || [];
    const subtotal = lineItems.reduce((acc, item) => acc + item.total, 0);
    const vatAmount = (subtotal * parseFloat(vatRate)) / 100;
    const total = subtotal + vatAmount;

    // Generate Preview Effect
    useEffect(() => {
        if (!job) return;

        const isStatement = activeTab === 'statement';
        // Use a timeout to avoid stuttering on keystrokes
        const timer = setTimeout(() => {
            let url: string | URL | void;

            if (isStatement) {
                // Statement uses real line items
                url = generateCustomerStatement(job, lineItems, 'bloburl') as unknown as string;
            } else {
                // Invoice uses the simplified settings from the UI
                url = generateAccountantInvoice(job, customDescription, parseFloat(vatRate), total, 'bloburl') as unknown as string;
            }

            if (url) {
                setPreviewUrl(url.toString());
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [job, lineItems, activeTab, customDescription, vatRate, total]);

    const [generating, setGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!job) return;
        setGenerating(true);

        try {
            // 1. Generate PDFs as Blobs
            const statementBlob = generateCustomerStatement(job, lineItems, 'blob') as Blob;
            const invoiceBlob = generateAccountantInvoice(job, customDescription, parseFloat(vatRate), total, 'blob') as Blob;

            // 2. Upload to Supabase Storage (if bucket exists)
            // Note: We use a helper function or direct client. For now, strict 'invoices' bucket is assumed.
            const timestamp = Date.now();
            const statementPath = `statements/${job.jobNumber}_${timestamp}.pdf`;
            const invoicePath = `invoices/${job.jobNumber}_${timestamp}.pdf`;

            // Attempt Upload - Statement
            // Note: 'invoices' bucket might not exist in dev/demo environment. We handle this gracefully.
            let statementUrl = null;
            let invoiceUrl = null;

            // FIXME: This assumes 'invoices' bucket exists. If not, it will fail silently or we should alert.
            // For now, allow upload to fail but still create the record.
            /* 
            const { data: sData, error: sError } = await supabase.storage.from('invoices').upload(statementPath, statementBlob);
            if (!sError) statementUrl = supabase.storage.from('invoices').getPublicUrl(statementPath).data.publicUrl;
            */

            // 3. Create Invoice Record in DB
            const { data: invoiceData, error: invoiceError } = await supabase
                .from('invoices')
                .insert({
                    customer_id: job.customerId,
                    invoice_number: `INV-${new Date().getFullYear()}-${job.jobNumber}`,
                    total_amount: total,
                    status: 'issued',
                    issue_date: new Date().toISOString(),
                    vat_rate: parseFloat(vatRate),
                    custom_description: customDescription,
                    statement_url: statementUrl,
                    invoice_url: invoiceUrl,
                })
                .select()
                .single();

            if (invoiceError) throw invoiceError;

            // 4. Download locally for the user (since we might not have storage)
            generateCustomerStatement(job, lineItems, 'save');
            generateAccountantInvoice(job, customDescription, parseFloat(vatRate), total, 'save');

            // 5. Success & Redirect
            alert("Invoice generated and saved!");
            router.push('/invoices');

        } catch (err: any) {
            console.error("Error generating invoice:", err);
            alert(`Failed to save invoice: ${err.message}`);
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100 flex-col space-y-4">
                <div className="text-red-500 font-medium">Error loading job: {error || 'Job not found'}</div>
                <Link href="/jobs">
                    <Button variant="outline">Back to Jobs</Button>
                </Link>
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
                        <div className="flex items-center space-x-4">
                            <Link href={`/jobs/${job.id}`}>
                                <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                            </Link>
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-space-grotesk">Generate Invoice</h2>
                                <p className="text-muted-foreground">Creating documents for Job #{job.jobNumber}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <UserButton />
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* LEFT COLUMN: Configuration */}
                        <div className="space-y-6">
                            <Card className="border-l-4 border-l-blue-600">
                                <CardHeader>
                                    <CardTitle>Accountant Invoice Settings</CardTitle>
                                    <CardDescription>Configure the Simplified Invoice sent to the accountant.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Custom Description</Label>
                                        <Input
                                            value={customDescription}
                                            onChange={(e) => setCustomDescription(e.target.value)}
                                            placeholder="e.g. Milking Machine Service"
                                        />
                                        <p className="text-xs text-muted-foreground">This single line will replace the detailed breakdown.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>VAT Rate</Label>
                                        <Select value={vatRate} onValueChange={setVatRate}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="13.5">13.5% (Service/Labor)</SelectItem>
                                                <SelectItem value="23">23% (Standard Goods)</SelectItem>
                                                <SelectItem value="0">0% (Exempt)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <div className="flex justify-between font-medium text-sm">
                                            <span>Subtotal</span>
                                            <span>€{subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between font-medium text-sm text-muted-foreground">
                                            <span>VAT ({vatRate}%)</span>
                                            <span>€{vatAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-lg mt-2 text-slate-900">
                                            <span>Total (Incl. VAT)</span>
                                            <span>€{total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Customer Statement</CardTitle>
                                    <CardDescription>The detailed breakdown sent to the farmer.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-slate-50 p-4 rounded text-sm text-slate-600">
                                        <ul className="list-disc pl-4 space-y-1">
                                            <li>Includes full list of <strong>{lineItems.filter(i => i.type === 'part').length} parts</strong> used.</li>
                                            <li>Shows detailed labor hours.</li>
                                            <li>Standard VAT breakdown.</li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: Preview */}
                        <div className="space-y-6">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="invoice">Accountant Invoice</TabsTrigger>
                                    <TabsTrigger value="statement">Customer Statement</TabsTrigger>
                                </TabsList>

                                {/* PREVIEW: INVOICE */}
                                <TabsContent value="invoice">
                                    <Card className="h-[600px] overflow-hidden bg-gray-50 border shadow-sm flex flex-col items-center justify-center">
                                        {previewUrl ? (
                                            <iframe src={previewUrl} className="w-full h-full border-none rounded-md" title="PDF Preview" />
                                        ) : (
                                            <div className="flex flex-col items-center text-gray-400">
                                                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                                <p>Generating Preview...</p>
                                            </div>
                                        )}
                                    </Card>
                                </TabsContent>

                                {/* PREVIEW: STATEMENT */}
                                <TabsContent value="statement">
                                    <Card className="h-[600px] overflow-hidden bg-gray-50 border shadow-sm flex flex-col items-center justify-center">
                                        {previewUrl ? (
                                            <iframe src={previewUrl} className="w-full h-full border-none rounded-md" title="PDF Preview" />
                                        ) : (
                                            <div className="flex flex-col items-center text-gray-400">
                                                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                                <p>Generating Preview...</p>
                                            </div>
                                        )}
                                    </Card>
                                </TabsContent>
                            </Tabs>

                            <Button className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-bold shadow-lg" onClick={handleGenerate} disabled={generating}>
                                {generating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileCheck className="mr-2 h-5 w-5" />}
                                {generating ? 'Saving...' : 'Generate & Download PDFs'}
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function NewInvoicePage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-gray-100"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}>
            <NewInvoiceContent />
        </Suspense>
    );
}
