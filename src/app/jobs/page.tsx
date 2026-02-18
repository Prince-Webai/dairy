
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Loader2, MoreHorizontal, Printer, Edit, Eye, FileText } from "lucide-react";
import { JobStatus, JobItem } from "@/types";
import Link from 'next/link';
import { Sidebar, MobileSidebar } from "@/components/layout/Sidebar";
import { UserButton } from "@/components/layout/UserButton";
import { useJobs } from "@/hooks/use-job";
import { generateServiceReport } from "@/lib/pdf-generator";
import { supabase } from "@/lib/supabase";

const getStatusColor = (status: JobStatus) => {
    switch (status) {
        case 'Scheduled': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
        case 'In Progress': return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
        case 'Completed': return 'bg-green-100 text-green-800 hover:bg-green-100';
        case 'Cancelled': return 'bg-red-100 text-red-800 hover:bg-red-100';
        default: return 'bg-gray-100 text-gray-800';
    }
};

export default function JobsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const { jobs, loading, error } = useJobs();
    const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

    const filteredJobs = jobs.filter(job =>
        job.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePrint = async (jobId: string) => {
        try {
            setGeneratingPdf(jobId);

            // 1. Fetch Job with Customer Relation & Data
            const { data: jobData, error: jobError } = await supabase
                .from('jobs')
                .select('*, customers(name)')
                .eq('id', jobId)
                .single();

            if (jobError) throw jobError;

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

            // 3. Prepare Job Object for PDF
            // Helper to format status (duplicated from hook for now, ideally shared)
            const formatStatus = (s: string): JobStatus => {
                if (s === 'in_progress') return 'In Progress';
                if (s === 'scheduled') return 'Scheduled';
                if (s === 'completed') return 'Completed';
                if (s === 'cancelled') return 'Cancelled';
                return 'Scheduled';
            };

            const jobForPdf = {
                id: jobData.id,
                jobNumber: String(jobData.job_number),
                customerId: jobData.customer_id,
                customerName: jobData.customers?.name || 'Unknown',
                description: jobData.description,
                status: formatStatus(jobData.status),
                date: jobData.scheduled_date || jobData.created_at,
                engineerName: 'Unknown',
                totalAmount: 0, // Not used in service report
                items: allItems
            };

            // 4. Generate & Open
            const blobUrl = generateServiceReport(jobForPdf, allItems, 'bloburl');
            if (blobUrl && typeof blobUrl === 'string') {
                window.open(blobUrl, '_blank');
            }

        } catch (e) {
            console.error("Error generating PDF", e);
            alert("Failed to generate report. Please try again.");
        } finally {
            setGeneratingPdf(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100 text-red-500">
                Error loading jobs: {error}
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-white border-r border-gray-200">
                <Sidebar />
            </div>

            {/* Main Content */}
            <main className="md:pl-72 flex-1 h-full overflow-y-auto">
                <div className="flex-1 space-y-4 p-8 pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <MobileSidebar />
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-space-grotesk">Jobs</h2>
                                <p className="text-muted-foreground">Manage service calls and repairs</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <UserButton />
                        </div>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div className="flex items-center space-x-2">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search jobs..."
                                        className="pl-8 w-[300px]"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
                            </div>
                            <Link href="/jobs/new">
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="mr-2 h-4 w-4" /> New Job
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Job Number</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Engineer</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredJobs.map((job) => (
                                        <TableRow key={job.id}>
                                            <TableCell className="font-medium text-blue-600">{job.jobNumber}</TableCell>
                                            <TableCell>{job.customerName}</TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={job.description}>{job.description}</TableCell>
                                            <TableCell>{new Date(job.date).toLocaleDateString()}</TableCell>
                                            <TableCell>{job.engineerName}</TableCell>
                                            <TableCell>
                                                <Badge className={`${getStatusColor(job.status)} border-none shadow-none`}>
                                                    {job.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <Link href={`/jobs/${job.id}`}>
                                                            <DropdownMenuItem>
                                                                <Eye className="mr-2 h-4 w-4" /> View Details
                                                            </DropdownMenuItem>
                                                        </Link>
                                                        <Link href={`/jobs/${job.id}`}>
                                                            {/* Currently link to details for edit, or implement dedicated edit later */}
                                                            <DropdownMenuItem>
                                                                <Edit className="mr-2 h-4 w-4" /> Edit Job
                                                            </DropdownMenuItem>
                                                        </Link>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handlePrint(job.id)} disabled={generatingPdf === job.id}>
                                                            {generatingPdf === job.id ? (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Printer className="mr-2 h-4 w-4" />
                                                            )}
                                                            Print Report
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredJobs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                No results found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
