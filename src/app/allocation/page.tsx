
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar, MobileSidebar } from "@/components/layout/Sidebar";
import { UserButton } from "@/components/layout/UserButton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useJobs } from "@/hooks/use-job";
import { Job } from "@/types";
import { useProfiles } from "@/hooks/use-profiles";
import { Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/lib/supabase';

export default function AllocationPage() {
    const { jobs: serverJobs, loading: jobsLoading, refetch } = useJobs();
    const { profiles, loading: profilesLoading } = useProfiles();

    // Local state for optimistic updates
    const [localJobs, setLocalJobs] = useState<Job[]>([]);
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    // Sync local state with server state when it changes
    useEffect(() => {
        if (serverJobs.length > 0) {
            setLocalJobs(serverJobs);
        }
    }, [serverJobs]);

    // Initial load
    if (jobsLoading || profilesLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const engineers = profiles.filter(p => p.role === 'engineer' || p.role === 'admin');

    // Group jobs using LOCAL state
    const unallocatedJobs = localJobs.filter(j => j.engineerName === 'Unassigned');

    // Helper to get jobs for a specific engineer name
    const getEngineerJobs = (fullName: string) => {
        return localJobs.filter(j => j.engineerName === fullName);
    };

    const handleAssign = async (jobId: string, engineerId: string | null) => {
        if (!jobId) return;
        setAssigningId(jobId);

        // Find the engineer name for optimistic update
        const engineer = profiles.find(p => p.id === engineerId);
        const newEngineerName = engineer ? engineer.full_name : 'Unassigned';

        // 1. Optimistic Update
        const previousJobs = [...localJobs];
        setLocalJobs(prev => prev.map(j =>
            j.id === jobId
                ? { ...j, engineerName: newEngineerName }
                : j
        ));

        // Check for Demo Mode (Mock IDs)
        if (engineerId && engineerId.startsWith('mock-')) {
            console.log("Demo Mode: Skipping DB update for mock profile.");
            setAssigningId(null);
            return; // Stop here, don't try to save to DB
        }

        try {
            const updates = engineerId ? { engineer_id: engineerId } : { engineer_id: null };

            const { error } = await supabase
                .from('jobs')
                .update(updates)
                .eq('id', jobId);

            if (error) throw error;

            // Success - strictly we could refetch here to be sure, 
            // but we already have correct state.
            // await refetch(); 

        } catch (error: any) {
            console.error("Assignment failed:", error);
            alert(`Error assigning job: ${error.message}`);
            // Revert on error
            setLocalJobs(previousJobs);
            await refetch();
        } finally {
            setAssigningId(null);
        }
    };

    // Drag and Drop Handlers
    const onDragStart = (e: React.DragEvent, jobId: string) => {
        e.dataTransfer.setData("jobId", jobId);
        e.dataTransfer.effectAllowed = "move";
        setIsDragging(true);
    };

    const onDragEnd = () => {
        setIsDragging(false);
    }

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = "move";
    };

    const onDrop = (e: React.DragEvent, engineerId: string | null) => {
        e.preventDefault();
        const jobId = e.dataTransfer.getData("jobId");
        if (jobId) {
            handleAssign(jobId, engineerId);
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
                        <div className="flex items-center gap-4">
                            <MobileSidebar />
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-space-grotesk">Allocation</h2>
                                <p className="text-muted-foreground">Drag and drop jobs to assign engineers</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <UserButton />
                        </div>
                    </div>

                    <div className="flex overflow-x-auto pb-4 gap-6 h-[calc(100vh-12rem)]">
                        {/* Unallocated Column */}
                        <div
                            className="min-w-[350px] flex-shrink-0 flex flex-col h-full"
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(e, null)} // Null for unallocated
                        >
                            <Card className={`h-full bg-slate-50 border-dashed border-2 flex flex-col ${isDragging ? 'bg-slate-100 border-blue-300' : ''} transition-colors`}>
                                <CardHeader className="pb-2 flex-none">
                                    <CardTitle className="text-lg font-medium text-slate-500">Unallocated</CardTitle>
                                    <Badge variant="secondary">{unallocatedJobs.length} Jobs</Badge>
                                </CardHeader>
                                <CardContent className="space-y-3 flex-1 overflow-y-auto p-2">
                                    {unallocatedJobs.map(job => (
                                        <div
                                            key={job.id}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, job.id)}
                                            onDragEnd={onDragEnd}
                                            className="bg-white p-3 rounded-md shadow-sm border border-slate-200 space-y-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-medium text-blue-700">{job.jobNumber}</div>
                                                    <div className="text-sm font-semibold">{job.customerName}</div>
                                                    <div className="text-xs text-slate-500">{job.description}</div>
                                                </div>
                                                <Badge variant="outline">{job.status}</Badge>
                                            </div>
                                            {/* Keep dropdown for accessibility/mobile */}
                                            <div className="pt-2">
                                                <Select onValueChange={(val) => handleAssign(job.id, val)} disabled={assigningId === job.id}>
                                                    <SelectTrigger className="h-8 w-full text-xs">
                                                        <SelectValue placeholder="Assign Engineer" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {engineers.map(eng => (
                                                            <SelectItem key={eng.id} value={eng.id}>
                                                                {eng.full_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    ))}
                                    {unallocatedJobs.length === 0 && (
                                        <div className="text-center text-sm text-muted-foreground py-8">
                                            No unallocated jobs.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Engineer Columns */}
                        {engineers.map((engineer) => {
                            const engineerJobs = getEngineerJobs(engineer.full_name);
                            return (
                                <div
                                    key={engineer.id}
                                    className="min-w-[350px] flex-shrink-0 flex flex-col h-full"
                                    onDragOver={onDragOver}
                                    onDrop={(e) => onDrop(e, engineer.id)}
                                >
                                    <Card className={`h-full flex flex-col ${isDragging ? 'bg-blue-50/30' : ''} transition-colors`}>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-none">
                                            <div className="flex items-center space-x-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">{engineer.initials}</AvatarFallback>
                                                </Avatar>
                                                <CardTitle className="text-lg font-medium truncate">{engineer.full_name}</CardTitle>
                                            </div>
                                            <Badge variant="secondary">{engineerJobs.length} Jobs</Badge>
                                        </CardHeader>
                                        <CardContent className="space-y-3 flex-1 overflow-y-auto p-2">
                                            {engineerJobs.map(job => (
                                                <div
                                                    key={job.id}
                                                    draggable
                                                    onDragStart={(e) => onDragStart(e, job.id)}
                                                    onDragEnd={onDragEnd}
                                                    className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-medium text-blue-700">{job.jobNumber}</div>
                                                            <div className="text-sm font-semibold">{job.customerName}</div>
                                                            <div className="text-xs text-slate-500">{job.description}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <Badge variant="outline" className="mb-1">{job.status}</Badge>
                                                            <div className="text-xs text-slate-500">{new Date(job.date).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                    {/* Optional: Reassign */}
                                                    <div className="pt-2">
                                                        <Select onValueChange={(val) => handleAssign(job.id, val)} disabled={assigningId === job.id}>
                                                            <SelectTrigger className="h-8 w-full text-xs bg-white">
                                                                <SelectValue placeholder="Reassign" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {engineers.map(eng => (
                                                                    <SelectItem key={eng.id} value={eng.id}>
                                                                        {eng.full_name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            ))}
                                            {engineerJobs.length === 0 && (
                                                <div className="text-center text-sm text-muted-foreground py-8">
                                                    No allocated jobs.
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
