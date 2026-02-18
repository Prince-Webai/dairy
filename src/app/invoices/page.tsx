
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
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Loader2, Download, MoreHorizontal, Eye, Edit, Printer } from "lucide-react";
import Link from 'next/link';
import { Sidebar } from "@/components/layout/Sidebar";
import { UserButton } from "@/components/layout/UserButton";
import { useInvoices } from "@/hooks/use-invoices";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Paid': return 'bg-green-100 text-green-800 hover:bg-green-100';
        case 'Unpaid': return 'bg-red-100 text-red-800 hover:bg-red-100';
        case 'Issued': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
        case 'Overdue': return 'bg-red-100 text-red-800 font-bold';
        default: return 'bg-gray-100 text-gray-800';
    }
};

export default function InvoicesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const { invoices, loading, error } = useInvoices();

    const filteredInvoices = invoices.filter(inv =>
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                Error loading invoices: {error}
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
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-space-grotesk">Invoices</h2>
                            <p className="text-muted-foreground">Manage billing and payments</p>
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
                                        placeholder="Search invoices..."
                                        className="pl-8 w-[300px]"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
                            </div>
                            <div className="space-x-2">
                                <Button variant="outline">
                                    <Download className="mr-2 h-4 w-4" /> Export Report
                                </Button>
                                <Link href="/invoices/new">
                                    <Button className="bg-blue-600 hover:bg-blue-700">
                                        <Plus className="mr-2 h-4 w-4" /> Create Invoice
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice #</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Date Issued</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInvoices.map((inv) => (
                                        <TableRow key={inv.id}>
                                            <TableCell className="font-medium font-mono">{inv.invoiceNumber}</TableCell>
                                            <TableCell>{inv.customerName}</TableCell>
                                            <TableCell>{new Date(inv.date).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right font-medium">€{Number(inv.amount).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge className={`${getStatusColor(inv.status)} border-none shadow-none`}>
                                                    {inv.status}
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
                                                        <DropdownMenuItem>
                                                            <Eye className="mr-2 h-4 w-4" /> View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit Invoice
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem>
                                                            <Download className="mr-2 h-4 w-4" /> Download PDF
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredInvoices.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                No invoices found.
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
