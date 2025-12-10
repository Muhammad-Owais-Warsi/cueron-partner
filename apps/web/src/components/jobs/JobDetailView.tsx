'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, formatCurrency } from '@/lib/utils/formatting';

import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useUserProfile } from '@/hooks';

export function JobDetailView({ jobNumber }: { jobNumber: string }) {
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile();

  const [job, setJob] = useState<any>(null);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEngineers, setLoadingEngineers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------
  // FETCH JOB DETAILS
  // -----------------------------
  useEffect(() => {
    async function fetchJobDetails() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/jobs/${jobNumber}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to fetch job details');
        }

        const data = await response.json();
        setJob(data);
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchJobDetails();
  }, [jobNumber]);

  // -----------------------------
  // FETCH ENGINEERS
  // -----------------------------
  useEffect(() => {
    async function loadEngineers() {
      try {
        if (!profile?.agency?.id) return;

        setLoadingEngineers(true);
        const res = await fetch(`/api/agencies/${profile.agency.id}/engineers`);

        if (!res.ok) throw new Error('Failed to load engineers');

        const list = await res.json();
        console.log('ENG:', list);

        // FIX HERE
        const extracted = Array.isArray(list) ? list : list.engineers || [];

        setEngineers(extracted);
      } catch (err) {
        console.error('Engineer load error', err);
      } finally {
        setLoadingEngineers(false);
      }
    }

    loadEngineers();
  }, [profile, jobNumber]);

  // ----------------------------------------------
  // WAIT IF PROFILE NOT READY
  // ----------------------------------------------
  if (profileLoading || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  if (!profile.agency || !profile.agency.id) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <Spinner />
        <p className="text-sm text-muted-foreground">Loading agency details…</p>
      </div>
    );
  }

  // ----------------------------------------------
  // LOADING JOB DETAILS
  // ----------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  // ----------------------------------------------
  // ERROR
  // ----------------------------------------------
  if (error || !job) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-600">{error || 'Job not found'}</p>
        <Button onClick={() => router.push('/dashboard/jobs')}>Back to Jobs</Button>
      </div>
    );
  }

  // ----------------------------------------------
  // MAIN RENDER
  // ----------------------------------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/dashboard/jobs')} className="mb-2">
          ← Back to Jobs
        </Button>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {job.status}
          </Badge>

          <Badge
            variant={
              job.urgency === 'emergency'
                ? 'destructive'
                : job.urgency === 'urgent'
                  ? 'secondary'
                  : 'outline'
            }
            className="px-3 py-1"
          >
            {job.urgency}
          </Badge>
        </div>
      </div>

      <h1 className="text-2xl font-bold">{job.job_number}</h1>
      <p className="text-muted-foreground">
        {job.client_name} • {job.job_type}
      </p>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT SECTION */}
        <div className="lg:col-span-2 space-y-6">
          {/* JOB DETAILS */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>Complete information about this work order</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Detail label="Client Name" value={job.client_name} />
                <Detail label="Client Phone" value={job.client_phone} />
                <Detail label="Job Type" value={job.job_type} />
                <Detail label="Equipment Type" value={job.equipment_type} />

                {job.scheduled_time && (
                  <Detail label="Scheduled Time" value={formatDate(job.scheduled_time)} />
                )}

                {job.service_fee && (
                  <Detail label="Service Fee" value={formatCurrency(job.service_fee)} />
                )}
              </div>

              <Separator />

              {/* Skill */}
              <div className="p-4 rounded-lg border bg-yellow-50">
                <p className="text-sm font-medium text-yellow-800">Required Skill Level</p>
                <p className="text-lg font-bold text-yellow-900">
                  Level {job.required_skill_level}
                </p>
              </div>

              {/* Issue */}
              {job.issue_description && (
                <Detail label="Issue Description" value={job.issue_description} />
              )}

              {/* Equipment */}
              {job.equipment_details && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Equipment Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Detail label="Brand" value={job.equipment_details.brand} small />
                    <Detail label="Model" value={job.equipment_details.model} small />
                    <Detail label="Serial" value={job.equipment_details.serial_number} small />
                    <Detail label="Capacity" value={job.equipment_details.capacity} small />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* LOCATION */}
          <Card>
            <CardHeader>
              <CardTitle>Service Location</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{job.site_location.address}</p>
              <p className="text-muted-foreground">
                {job.site_location.city}, {job.site_location.state}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDEBAR — ENGINEERS */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Engineers</CardTitle>
              <CardDescription>Engineers matching or near required skill</CardDescription>
            </CardHeader>

            <CardContent>
              {loadingEngineers ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : engineers?.length ? (
                <ScrollArea className="h-72 pr-2">
                  <div className="space-y-4">
                    {engineers.map((eng) => (
                      <div
                        key={eng.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={eng.avatar || ''} />
                            <AvatarFallback>{eng.name?.[0]}</AvatarFallback>
                          </Avatar>

                          <div>
                            <p className="font-medium">{eng.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Skill Level: {eng.skill_level}
                            </p>
                          </div>
                        </div>

                        <Badge variant={eng.status === 'available' ? 'outline' : 'secondary'}>
                          {eng.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">No engineers found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------
// Small reusable Detail component
// ----------------------------------------------
function Detail({ label, value, small = false }: { label: string; value: any; small?: boolean }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`font-medium ${small ? 'text-sm' : ''}`}>{value}</p>
    </div>
  );
}
