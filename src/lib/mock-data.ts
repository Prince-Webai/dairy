
import { Job, Customer, Product } from '@/types';

export const mockCustomers: Customer[] = [
    {
        id: 'cust_1',
        name: 'Murphy Farm Ltd',
        initials: 'MF',
        email: 'john@murphyfarm.ie',
        phone: '+353 87 123 4567',
        address: 'Ballyporeen, Co. Tipperary',
        balance: 4250.00
    },
    {
        id: 'cust_2',
        name: 'Kelly Cattle Co',
        initials: 'KC',
        email: 'pat@kellycattle.ie',
        phone: '+353 86 987 6543',
        address: 'Fermoy, Co. Cork',
        balance: 0.00
    },
    {
        id: 'cust_3',
        name: "O'Sullivan Dairy",
        initials: 'OD',
        email: 'michael@osullivandairy.ie',
        phone: '+353 85 555 1212',
        address: 'Mitchelstown, Co. Cork',
        balance: 1500.50
    }
];

export const mockJobs: Job[] = [
    {
        id: 'job_1',
        jobNumber: 'JOB-24-001',
        customerId: 'cust_1',
        customerName: 'Murphy Farm Ltd',
        description: 'Annual Milking Machine Service',
        status: 'Scheduled',
        date: '2024-02-15',
        engineerName: 'John Condon',
        items: []
    },
    {
        id: 'job_2',
        jobNumber: 'JOB-24-002',
        customerId: 'cust_2',
        customerName: 'Kelly Cattle Co',
        description: 'Bulk Tank Compressor Repair',
        status: 'In Progress',
        date: '2024-02-14',
        engineerName: 'Mike Ryan',
        items: []
    },
    {
        id: 'job_3',
        jobNumber: 'JOB-24-003',
        customerId: 'cust_3',
        customerName: "O'Sullivan Dairy",
        description: 'Emergency Pump Replacement',
        status: 'Completed',
        date: '2024-02-10',
        engineerName: 'John Condon',
        totalAmount: 450.00,
        items: []
    },
    {
        id: 'job_4',
        jobNumber: 'JOB-24-004',
        customerId: 'cust_1',
        customerName: "Murphy Farm Ltd",
        description: 'Parlour Wash Down System Fix',
        status: 'Completed',
        date: '2024-02-08',
        engineerName: 'Mike Ryan',
        totalAmount: 1250.00,
        items: []
    }
];

export const mockProducts: Product[] = [
    { id: 'prod_1', name: 'Vacuum Pump Oil (5L)', sku: 'OIL-VAC-5L', price: 45.00, stock: 24 },
    { id: 'prod_2', name: 'Milking Liner (Set of 4)', sku: 'LINER-SET-4', price: 85.00, stock: 100 },
    { id: 'prod_3', name: 'Pulsator Repair Kit', sku: 'PUL-KIT-01', price: 25.50, stock: 15 },
    { id: 'prod_4', name: 'Milk Filter Socks (Box)', sku: 'FIL-SOCK-BOX', price: 32.00, stock: 50 },
];
