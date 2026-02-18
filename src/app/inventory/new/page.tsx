
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import Link from 'next/link';
import { Sidebar } from "@/components/layout/Sidebar";
import { UserButton } from "@/components/layout/UserButton";

export default function NewPartPage() {
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here we would save to DB
        router.push('/inventory');
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
                            <Link href="/inventory">
                                <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                            </Link>
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-space-grotesk">New Part</h2>
                                <p className="text-muted-foreground">Add a new item to inventory</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <UserButton />
                        </div>
                    </div>

                    <div className="max-w-2xl mx-auto">
                        <form onSubmit={handleSubmit}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Product Details</CardTitle>
                                    <CardDescription>Enter the details for the new part or material.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Part Name</Label>
                                        <Input id="name" placeholder="e.g. 50mm PVC Elbow" required />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="sku">SKU / Code</Label>
                                            <Input id="sku" placeholder="e.g. PVC-50-ELB" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="category">Category</Label>
                                            <Input id="category" placeholder="e.g. Plumbing" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="price">Selling Price (€)</Label>
                                            <Input id="price" type="number" step="0.01" placeholder="0.00" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cost">Cost Price (€)</Label>
                                            <Input id="cost" type="number" step="0.01" placeholder="0.00" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="stock">Initial Stock</Label>
                                            <Input id="stock" type="number" placeholder="0" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="min">Min Level Alert</Label>
                                            <Input id="min" type="number" placeholder="5" />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                                            <Save className="mr-2 h-4 w-4" /> Save Part
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
