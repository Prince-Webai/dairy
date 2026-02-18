
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from 'next/link';
import { Sidebar, MobileSidebar } from "@/components/layout/Sidebar";
import { UserButton } from "@/components/layout/UserButton";
import { supabase } from '@/lib/supabase';

export default function NewPartPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [cost, setCost] = useState('');
    const [stock, setStock] = useState('');
    const [minLevel, setMinLevel] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !sku || !price || !stock) {
            alert('Please fill in all required fields.');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('products')
                .insert({
                    name: name.trim(),
                    sku: sku.trim(),
                    category: category.trim() || 'General',
                    sell_price: parseFloat(price),
                    cost_price: cost ? parseFloat(cost) : null,
                    stock_level: parseInt(stock, 10),
                    min_stock_level: minLevel ? parseInt(minLevel, 10) : 5,
                });

            if (error) throw error;

            alert('Part saved successfully!');
            router.push('/inventory');
        } catch (err: any) {
            console.error('Error saving product:', err);
            alert(`Error: ${err.message}`);
        } finally {
            setSaving(false);
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
                                        <Input id="name" placeholder="e.g. 50mm PVC Elbow" required value={name} onChange={e => setName(e.target.value)} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="sku">SKU / Code</Label>
                                            <Input id="sku" placeholder="e.g. PVC-50-ELB" required value={sku} onChange={e => setSku(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="category">Category</Label>
                                            <Input id="category" placeholder="e.g. Plumbing" value={category} onChange={e => setCategory(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="price">Selling Price (€)</Label>
                                            <Input id="price" type="number" step="any" placeholder="0.00" required value={price} onChange={e => setPrice(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cost">Cost Price (€)</Label>
                                            <Input id="cost" type="number" step="any" placeholder="0.00" value={cost} onChange={e => setCost(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="stock">Initial Stock</Label>
                                            <Input id="stock" type="number" placeholder="0" required value={stock} onChange={e => setStock(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="min">Min Level Alert</Label>
                                            <Input id="min" type="number" placeholder="5" value={minLevel} onChange={e => setMinLevel(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={saving}>
                                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            {saving ? 'Saving...' : 'Save Part'}
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
