
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, Phone, Mail, MapPin, Loader2 } from "lucide-react";
import Link from 'next/link';
import { Sidebar } from "@/components/layout/Sidebar";
import { UserButton } from "@/components/layout/UserButton";
import { useCustomers } from "@/hooks/use-customers";

export default function CustomersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const { customers, loading, error } = useCustomers();

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.toLowerCase().includes(searchTerm.toLowerCase())
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
                Error loading customers: {error}
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
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-space-grotesk">Customers</h2>
                            <p className="text-muted-foreground">Manage client accounts and contacts</p>
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
                                        placeholder="Search customers..."
                                        className="pl-8 w-[300px]"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Link href="/customers/new">
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="mr-2 h-4 w-4" /> New Customer
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">Avatar</TableHead>
                                        <TableHead>Customer Name</TableHead>
                                        <TableHead>Contact Info</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCustomers.map((customer) => (
                                        <TableRow key={customer.id}>
                                            <TableCell>
                                                <Avatar>
                                                    <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">{customer.initials}</AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell className="font-medium">{customer.name}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {customer.email}</div>
                                                    <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {customer.phone}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <MapPin className="h-3 w-3" /> {customer.address}
                                                </div>
                                            </TableCell>
                                            <TableCell className={`text-right font-medium ${customer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                €{customer.balance.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/jobs?search=${encodeURIComponent(customer.name)}`}>
                                                    <Button variant="ghost" size="sm">View Job History</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredCustomers.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                No customers found.
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
