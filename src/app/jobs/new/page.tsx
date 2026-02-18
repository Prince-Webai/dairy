"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Save, ArrowLeft, Loader2 } from "lucide-react";
import { mockProducts } from "@/lib/mock-data";
import { JobItem, Customer } from '@/types';
import Link from 'next/link';
import { Sidebar } from "@/components/layout/Sidebar";
import { UserButton } from "@/components/layout/UserButton";
import { supabase } from '@/lib/supabase';

export default function NewJobPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Data State
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(true);

    // Form State
    const [customerId, setCustomerId] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState('Scheduled');
    const [notes, setNotes] = useState('');

    // Line Items State
    const [items, setItems] = useState<JobItem[]>([]);

    // Fetch Customers on Mount
    useEffect(() => {
        async function fetchCustomers() {
            try {
                const { data, error } = await supabase
                    .from('customers')
                    .select('*')
                    .order('name');

                if (error) throw error;

                // Map to Customer type
                const mappedCustomers: Customer[] = (data || []).map(c => ({
                    id: c.id,
                    name: c.name,
                    initials: c.initials,
                    email: c.email,
                    phone: c.phone,
                    address: c.address,
                    balance: c.balance
                }));

                setCustomers(mappedCustomers);
            } catch (err) {
                console.error("Error fetching customers:", err);
            } finally {
                setLoadingCustomers(false);
            }
        }
        fetchCustomers();
    }, []);

    // Function to add a line item
    const addItem = (type: 'part' | 'labor') => {
        const newItem: JobItem = {
            id: Math.random().toString(36).substr(2, 9),
            description: type === 'labor' ? 'Labor Hours' : '',
            quantity: 1,
            unitPrice: type === 'labor' ? 60 : 0,
            total: type === 'labor' ? 60 : 0,
            type: type
        };
        setItems([...items, newItem]);
    };

    // Function to update line item
    const updateItem = (id: string, field: keyof JobItem, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };

                // Auto-fill product details if product selected
                if (field === 'productId') {
                    const product = mockProducts.find(p => p.id === value);
                    if (product) {
                        updatedItem.description = product.name;
                        updatedItem.unitPrice = product.price;
                    }
                }

                // Recalculate total
                updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
                return updatedItem;
            }
            return item;
        }));
    };

    // Remove item
    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    // Calculate Grand Total
    const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerId) {
            alert("Please select a customer");
            return;
        }

        setLoading(true);

        try {
            // 1. Generate Job Number (Integer for DB compatibility)
            // Use timestamp % 1000000 to keep it manageable but unique enough for dev
            const uniquePart = Math.floor(Date.now() % 1000000);
            // Prefix with 24 (year) -> 24XXXXXX
            // Ensure it fits within Postgres integer (max 2,147,483,647). 
            // Date.now() is 13 digits. 
            // Let's use 2024 + 4 random digits = 2024XXXX (8 digits). Safe.
            const randomPart = Math.floor(1000 + Math.random() * 9000);
            const jobNumber = parseInt(`2024${randomPart}`);

            // 2. Prepare Data for Schema (parts_used JSONB, labor_hours)
            const partsUsed = items.filter(i => i.type === 'part').map(i => ({
                product_id: i.productId,
                quantity: i.quantity,
                price_at_time: i.unitPrice,
                description: i.description
            }));

            const laborHours = items
                .filter(i => i.type === 'labor')
                .reduce((acc, i) => acc + i.quantity, 0);

            // Map Status to DB enum
            const mapStatus = (s: string) => {
                switch (s) {
                    case 'In Progress': return 'in_progress';
                    case 'Completed': return 'completed';
                    case 'Cancelled': return 'cancelled';
                    default: return 'scheduled';
                }
            };

            // 3. Insert Job
            const { data: jobData, error: jobError } = await supabase
                .from('jobs')
                .insert({
                    job_number: jobNumber,
                    customer_id: customerId,
                    // customer_name removed (not in schema)
                    description: description,
                    status: mapStatus(status),
                    scheduled_date: date, // "YYYY-MM-DD"
                    // engineer_name removed (not in schema)
                    // total_amount removed (not in jobs schema)
                    parts_used: partsUsed,
                    labor_hours: laborHours
                })
                .select()
                .single();

            if (jobError) throw jobError;

            // Success
            router.push(`/jobs/${jobData.id}`);

        } catch (error: any) {
            console.error("Error creating job:", error);
            alert(`Error creating job: ${error.message}`);
        } finally {
            setLoading(false);
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
                            <Link href="/jobs">
                                <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                            </Link>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-space-grotesk">New Job</h2>
                        </div>
                        <div className="flex items-center space-x-2">
                            <UserButton />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
                        {/* Job Details Card */}
                        <Card className="md:col-span-1">
                            <CardHeader>
                                <CardTitle>Job Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="customer">Customer</Label>
                                    <Select value={customerId} onValueChange={setCustomerId} disabled={loadingCustomers}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={loadingCustomers ? "Loading..." : "Select Customer"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description of Work</Label>
                                    <Input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Annual Service" required />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Date</Label>
                                        <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select value={status} onValueChange={setStatus}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Scheduled">Scheduled</SelectItem>
                                                <SelectItem value="In Progress">In Progress</SelectItem>
                                                <SelectItem value="Completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Internal Notes</Label>
                                    <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional details for engineers..." />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Parts & Labor Card */}
                        <Card className="md:col-span-1">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Parts & Labor</CardTitle>
                                <div className="space-x-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => addItem('part')}>
                                        <Plus className="mr-2 h-4 w-4" /> Part
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => addItem('labor')}>
                                        <Plus className="mr-2 h-4 w-4" /> Labor
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {items.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                        No items added yet. Click above to add parts or labor.
                                    </div>
                                )}

                                {items.map((item, index) => (
                                    <div key={item.id} className="flex items-start space-x-2 bg-slate-50 p-3 rounded-md">
                                        <div className="grid gap-2 flex-1">
                                            {item.type === 'part' ? (
                                                <Select value={item.productId} onValueChange={(val) => updateItem(item.id, 'productId', val)}>
                                                    <SelectTrigger className="h-8">
                                                        <SelectValue placeholder="Select Part" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {mockProducts.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>{p.name} (€{p.price})</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Input value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} className="h-8" placeholder="Description" />
                                            )}

                                            <div className="flex gap-2">
                                                <div className="w-20">
                                                    <Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))} className="h-8" placeholder="Qty" min="0" />
                                                </div>
                                                <div className="w-24">
                                                    <Input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value))} className="h-8" placeholder="Price" min="0" />
                                                </div>
                                                <div className="flex-1 flex items-center justify-end text-sm font-bold text-slate-700">
                                                    €{item.total.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => removeItem(item.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}

                                {items.length > 0 && (
                                    <>
                                        <Separator />
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="font-bold text-lg">Total Cost</span>
                                            <span className="font-bold text-xl text-blue-600">€{grandTotal.toFixed(2)}</span>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                            <div className="p-6 pt-0">
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold" size="lg" disabled={loading}>
                                    {loading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                                    ) : (
                                        <><Save className="mr-2 h-4 w-4" /> Create Job</>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    </form>
                </div>
            </main>
        </div>
    );
}
