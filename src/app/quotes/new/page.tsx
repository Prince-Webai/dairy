
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sidebar, MobileSidebar } from "@/components/layout/Sidebar";
import { UserButton } from "@/components/layout/UserButton";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useProducts } from "@/hooks/use-products";

interface QuoteLineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    type: 'part' | 'labor';
    productId?: string;
}

export default function NewQuotePage() {
    const router = useRouter();
    const { products } = useProducts();

    const [customers, setCustomers] = useState<any[]>([]);
    const [customerId, setCustomerId] = useState('');
    const [description, setDescription] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [notes, setNotes] = useState('');
    const [laborHours, setLaborHours] = useState('0');
    const [laborRate, setLaborRate] = useState('60');
    const [lineItems, setLineItems] = useState<QuoteLineItem[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchCustomers() {
            const { data } = await supabase.from('customers').select('id, name').order('name');
            setCustomers(data || []);
        }
        fetchCustomers();

        // Default valid-until to 30 days from now
        const future = new Date();
        future.setDate(future.getDate() + 30);
        setValidUntil(future.toISOString().split('T')[0]);
    }, []);

    const addLineItem = () => {
        setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, type: 'part' }]);
    };

    const removeLineItem = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const updateLineItem = (index: number, field: keyof QuoteLineItem, value: any) => {
        const updated = [...lineItems];
        (updated[index] as any)[field] = value;
        setLineItems(updated);
    };

    const addProductItem = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        setLineItems([...lineItems, {
            description: product.name,
            quantity: 1,
            unitPrice: product.price,
            type: 'part',
            productId: product.id,
        }]);
    };

    const partsTotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const laborTotal = (parseFloat(laborHours) || 0) * (parseFloat(laborRate) || 0);
    const grandTotal = partsTotal + laborTotal;

    const handleSave = async () => {
        if (!customerId) {
            alert('Please select a customer.');
            return;
        }
        if (!description) {
            alert('Please enter a description.');
            return;
        }

        setSaving(true);
        try {
            const itemsJson = lineItems.map(item => ({
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                type: item.type,
                product_id: item.productId || null,
            }));

            const { error } = await supabase
                .from('quotes')
                .insert({
                    customer_id: customerId,
                    description,
                    valid_until: validUntil || null,
                    items: itemsJson,
                    labor_hours: parseFloat(laborHours) || 0,
                    labor_rate: parseFloat(laborRate) || 60,
                    total_amount: grandTotal,
                    notes: notes || null,
                    status: 'draft',
                });

            if (error) throw error;

            alert('Quote saved successfully!');
            router.push('/quotes');
        } catch (err: any) {
            console.error('Error saving quote:', err);
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
                <div className="flex-1 space-y-6 p-8 pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <MobileSidebar />
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-space-grotesk">New Quote</h2>
                                <p className="text-muted-foreground">Create an estimate for a customer</p>
                            </div>
                        </div>
                        <UserButton />
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Main Form - 2 cols */}
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quote Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Customer</Label>
                                            <Select onValueChange={setCustomerId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select customer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {customers.map(c => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Valid Until</Label>
                                            <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            placeholder="Describe the work to be quoted..."
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Notes (optional)</Label>
                                        <Textarea
                                            placeholder="Internal notes..."
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Line Items */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Line Items</CardTitle>
                                    <div className="flex gap-2">
                                        {products.length > 0 && (
                                            <Select onValueChange={addProductItem}>
                                                <SelectTrigger className="w-[180px] h-8 text-xs">
                                                    <SelectValue placeholder="+ Add from inventory" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.map(p => (
                                                        <SelectItem key={p.id} value={p.id}>{p.name} (€{p.price})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                        <Button variant="outline" size="sm" onClick={addLineItem}>
                                            <Plus className="h-3 w-3 mr-1" /> Custom Item
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {lineItems.length === 0 ? (
                                        <div className="text-center text-gray-400 py-8 text-sm border border-dashed rounded-lg">
                                            No items added. Use the buttons above to add parts or custom items.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {/* Header */}
                                            <div className="hidden md:grid md:grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                                                <div className="col-span-5">Description</div>
                                                <div className="col-span-2">Qty</div>
                                                <div className="col-span-2">Unit Price (€)</div>
                                                <div className="col-span-2 text-right">Total</div>
                                                <div className="col-span-1"></div>
                                            </div>
                                            {lineItems.map((item, i) => (
                                                <div key={i} className="grid md:grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg">
                                                    <div className="md:col-span-5">
                                                        <Input
                                                            value={item.description}
                                                            onChange={e => updateLineItem(i, 'description', e.target.value)}
                                                            placeholder="Item description"
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <Input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={e => updateLineItem(i, 'quantity', Number(e.target.value))}
                                                            className="h-8 text-sm"
                                                            min={1}
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <Input
                                                            type="number"
                                                            value={item.unitPrice}
                                                            onChange={e => updateLineItem(i, 'unitPrice', Number(e.target.value))}
                                                            className="h-8 text-sm"
                                                            step="0.01"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 text-right font-medium text-sm">
                                                        €{(item.quantity * item.unitPrice).toFixed(2)}
                                                    </div>
                                                    <div className="md:col-span-1 flex justify-end">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => removeLineItem(i)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Labor */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Labor</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Hours</Label>
                                            <Input type="number" value={laborHours} onChange={e => setLaborHours(e.target.value)} min="0" step="0.5" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Rate (€/hr)</Label>
                                            <Input type="number" value={laborRate} onChange={e => setLaborRate(e.target.value)} min="0" step="5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Summary Sidebar - 1 col */}
                        <div className="space-y-6">
                            <Card className="sticky top-6">
                                <CardHeader>
                                    <CardTitle>Quote Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Parts ({lineItems.length} items)</span>
                                        <span className="font-medium">€{partsTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Labor ({laborHours} hrs × €{laborRate})</span>
                                        <span className="font-medium">€{laborTotal.toFixed(2)}</span>
                                    </div>
                                    <hr />
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span className="text-blue-700">€{grandTotal.toFixed(2)}</span>
                                    </div>
                                    <Button
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                        onClick={handleSave}
                                        disabled={saving}
                                    >
                                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Quote
                                    </Button>
                                    <Button variant="outline" className="w-full" onClick={() => router.back()}>
                                        Cancel
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
