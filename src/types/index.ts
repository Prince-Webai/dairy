
export type JobStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';

export interface Customer {
    id: string;
    name: string;
    initials: string;
    email: string;
    phone: string;
    address: string;
    balance: number;
}

export interface JobItem {
    id: string;
    description: string; // e.g., "Labor" or "Product Name"
    quantity: number;
    unitPrice: number;
    total: number;
    type: 'part' | 'labor';
    productId?: string; // Optional reference to product inventory
}

export interface Job {
    id: string;
    jobNumber: string;
    customerId: string;
    customerName: string;
    description: string;
    status: JobStatus;
    date: string;
    engineerName: string;
    items: JobItem[]; // Detailed line items
    notes?: string;
    totalAmount?: number;
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
}

export interface Quote {
    id: string;
    quoteNumber: string;
    customerId: string;
    customerName: string;
    description: string;
    status: QuoteStatus;
    validUntil: string;
    items: JobItem[];
    laborHours: number;
    laborRate: number;
    totalAmount: number;
    notes?: string;
    convertedJobId?: string;
    createdAt: string;
}
