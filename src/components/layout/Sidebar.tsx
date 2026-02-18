"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Briefcase, Users, Package, Settings, FileText, CheckSquare, PieChart, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const routes = [
    {
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/dashboard',
        color: 'text-sky-500',
    },
    {
        label: 'Jobs & Services',
        icon: Briefcase,
        href: '/jobs',
        color: 'text-violet-500',
    },
    {
        label: 'Customers',
        icon: Users,
        href: '/customers',
        color: 'text-pink-700',
    },
    {
        label: 'Inventory',
        icon: Package,
        href: '/inventory',
        color: 'text-orange-700',
    },
    {
        label: 'Allocation',
        icon: CheckSquare,
        href: '/allocation',
        color: 'text-emerald-500',
    },
    {
        label: 'Invoices',
        icon: FileText,
        href: '/invoices',
        color: 'text-green-700',
    },
    {
        label: 'Quotes',
        icon: FileText,
        href: '/quotes',
        color: 'text-amber-600',
    },
    {
        label: 'Reports',
        icon: PieChart,
        href: '/reports',
        color: 'text-gray-500',
    },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();

    return (
        <div className={cn("pb-12 space-y-4", className)}>
            <div className="px-3 py-2">
                <div className="flex items-center pl-3 mb-14">
                    <div className="relative w-8 h-8 mr-4">
                        <div className="flex items-center justify-center w-full h-full font-bold text-white rounded-lg bg-gradient-to-br from-blue-600 to-blue-800">
                            CD
                        </div>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold font-space-grotesk text-slate-900">
                            Condon Dairy
                        </h1>
                        <p className="text-xs text-slate-500">Service Management</p>
                    </div>
                </div>
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition",
                                pathname === route.href ? "text-blue-600 bg-blue-50" : "text-zinc-600"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function MobileSidebar() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-white">
                <Sidebar />
            </SheetContent>
        </Sheet>
    );
}
