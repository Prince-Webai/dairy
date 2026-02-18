
"use client";

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, FileText, CheckCircle, Loader2 } from "lucide-react";
import { generateServiceReport } from "@/lib/pdf-generator";
import { JobStatus } from "@/types";
import { useJob } from "@/hooks/use-job";
import { Sidebar, MobileSidebar } from "@/components/layout/Sidebar";
import { UserButton } from "@/components/layout/UserButton";
import Link from 'next/link';

// Helper to get job status color
const getStatusColor = (status: JobStatus) => {
    switch (status) {
        case 'Scheduled': return 'bg-blue-100 text-blue-800';
        case 'In Progress': return 'bg-orange-100 text-orange-800';
        case 'Completed': return 'bg-green-100 text-green-800';
        case 'Cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

export default function JobDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.id as string;

    const { job, loading, error } = useJob(jobId);

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

    const lineItems = job.items || [];
    const subtotal = lineItems.reduce((acc, item) => acc + item.total, 0);
    const tax = subtotal * 0.135; // Example tax
    const total = subtotal + tax;

    const handlePreviewReport = () => {
        // Generate Blob URL
        const pdfUrl = generateServiceReport(job, lineItems, 'bloburl');
        if (typeof pdfUrl === 'string') {
            window.open(pdfUrl, '_blank');
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-white border-r border-gray-200">
                <Sidebar />
            </div>

            <main className="md:pl-72 flex-1 h-full overflow-y-auto">
                <div className="flex-1 space-y-4 p-8 pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <MobileSidebar />
                            <Link href="/jobs">
                                <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                            </Link>
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-space-grotesk">{job.jobNumber}</h2>
                                <p className="text-muted-foreground">Job Details & Service Report</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <UserButton />
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Main Info */}
                        <Card className="md:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Service Report</CardTitle>
                                <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="font-semibold text-sm text-gray-500">Customer</h3>
                                        <div className="text-lg font-medium">{job.customerName}</div>
                                        <div className="text-sm text-gray-600">Ballyporeen, Co. Tipperary</div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-gray-500">Scheduled Date</h3>
                                        <div className="text-lg font-medium">{job.date}</div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-sm text-gray-500 mb-2">Description of Work</h3>
                                    <p className="text-gray-700 bg-slate-50 p-3 rounded-md border border-slate-100">
                                        {job.description}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-sm text-gray-500 mb-3">Parts & Labor Used</h3>
                                    <div className="border rounded-md">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                                                <tr>
                                                    <th className="px-4 py-3">Item</th>
                                                    <th className="px-4 py-3 text-right">Qty</th>
                                                    <th className="px-4 py-3 text-right">Unit Price</th>
                                                    <th className="px-4 py-3 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {lineItems.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="px-4 py-3 text-center text-gray-500">No items added yet.</td>
                                                    </tr>
                                                )}
                                                {lineItems.map((item) => (
                                                    <tr key={item.id}>
                                                        <td className="px-4 py-3 font-medium text-gray-900">{item.description}</td>
                                                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                                                        <td className="px-4 py-3 text-right">€{item.unitPrice ? item.unitPrice.toFixed(2) : '0.00'}</td>
                                                        <td className="px-4 py-3 text-right font-medium">€{item.total ? item.total.toFixed(2) : '0.00'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50 font-medium">
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-3 text-right text-gray-600">Subtotal</td>
                                                    <td className="px-4 py-3 text-right">€{subtotal.toFixed(2)}</td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-3 text-right text-gray-600">VAT (Est. 13.5%)</td>
                                                    <td className="px-4 py-3 text-right">€{tax.toFixed(2)}</td>
                                                </tr>
                                                <tr className="border-t border-gray-200">
                                                    <td colSpan={3} className="px-4 py-3 text-right text-lg font-bold text-gray-900">Total</td>
                                                    <td className="px-4 py-3 text-right text-lg font-bold text-blue-600">€{total.toFixed(2)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions Sidebar */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {job.status !== 'Completed' ? (
                                        <Button className="w-full bg-green-600 hover:bg-green-700">
                                            <CheckCircle className="mr-2 h-4 w-4" /> Mark Completed
                                        </Button>
                                    ) : (
                                        <div className="flex items-center text-green-600 font-medium justify-center pb-2">
                                            <CheckCircle className="mr-2 h-4 w-4" /> Job Completed
                                        </div>
                                    )}

                                    <Link href={`/jobs/${jobId}/edit`}>
                                        <Button variant="outline" className="w-full">Edit Job Details</Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            <Card className="bg-blue-50 border-blue-100">
                                <CardHeader>
                                    <CardTitle className="text-blue-900">Finance & Documents</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-blue-700 mb-2">
                                        Generate the customer statement and accountant invoice for this job.
                                    </p>
                                    <Link href={`/invoices/new?jobId=${jobId}`}>
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm" size="lg">
                                            <FileText className="mr-2 h-4 w-4" /> Generate Invoice
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        className="w-full border-blue-200 text-blue-700 hover:bg-blue-100"
                                        onClick={handlePreviewReport}
                                    >
                                        <Printer className="mr-2 h-4 w-4" /> Preview Service Report
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
