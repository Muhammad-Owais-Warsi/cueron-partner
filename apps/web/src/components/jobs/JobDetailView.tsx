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
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  Wrench,
  AlertCircle,
  Clock,
  Building2,
  User,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { getJobStatusBadge } from '../shared/jobStatusBadge';
import { getJobUrgencyBadge } from '../shared/jobUrgencyBadge';
import { toast } from 'sonner';

export function JobDetailView({ jobNumber }: { jobNumber: string }) {
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile();
  const [job, setJob] = useState(null);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEngineers, setLoadingEngineers] = useState(true);

  // Fetch job details
  useEffect(() => {
    async function fetchJobDetails() {
      try {
        setLoading(true);
        const response = await fetch(`/api/jobs/${jobNumber}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to fetch job details');
        }
        const data = await response.json();
        setJob(data);
      } catch (err: any) {
        console.error('Error fetching job details:', err);
        toast(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchJobDetails();
  }, [jobNumber]);

  // Fetch engineers
  useEffect(() => {
    async function loadEngineers() {
      try {
        if (!profile?.agency?.id) return;
        setLoadingEngineers(true);
        const res = await fetch(`/api/agencies/${profile.agency.id}/engineers`);
        if (!res.ok) throw new Error('Failed to load engineers');
        const list = await res.json();
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

  async function assignEngineer(engineerId: string) {
    try {
      if (!job) return;

      const response = await fetch(`/api/jobs/${jobNumber}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engineer_id: engineerId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to assign engineer');

      toast.success('Engineer assigned successfully!');

      // refresh job details instantly
      setJob((prev) => ({
        ...prev,
        assigned_engineer_id: engineerId,
      }));
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  // Loading states
  if (profileLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!profile.agency || !profile.agency.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Spinner className="h-8 w-8 mx-auto" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Spinner className="h-8 w-8 mx-auto" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-lg font-semibold">Error Loading Job</p>
            <Button onClick={() => router.push('/dashboard/jobs')} className="w-full">
              Back to Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/jobs')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{job.job_number}</h1>
              {getJobStatusBadge(job.status)}
              {getJobUrgencyBadge(job.urgency)}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span className="font-medium">{job.client_name}</span>
              <span>•</span>
              <span>{job.job_type}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Job Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {job.scheduled_time && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Scheduled</p>
                      <p className="font-semibold">{formatDate(job.scheduled_time)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {job.service_fee && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Service Fee</p>
                      <p className="font-semibold">{formatCurrency(job.service_fee)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Skill Level</p>
                    <p className="font-semibold">Level {job.required_skill_level}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Issue Description */}
          {job.issue_description && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <CardTitle>Issue Description</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{job.issue_description}</p>
              </CardContent>
            </Card>
          )}

          {/* Equipment Details */}
          {job.equipment_details && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  <CardTitle>Equipment Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{job.equipment_details}</p>
              </CardContent>
            </Card>
          )}

          {/* Location */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle>Service Location</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{job.site_location.address}</p>
                <p className="text-muted-foreground">
                  {job.site_location.city}, {job.site_location.state}
                </p>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      `${job.site_location.address}, ${job.site_location.city}, ${job.site_location.state}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in Maps
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Engineers */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Available Engineers</CardTitle>
                  <CardDescription>Engineers matching required skill level</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingEngineers ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Spinner />
                  </div>
                </div>
              ) : engineers?.length ? (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {engineers.map((eng) => (
                      <Card
                        key={eng.id}
                        className="hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={eng.avatar} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {eng.name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{eng.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  Level {eng.skill_level}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={
                                    eng.availability_status === 'available'
                                      ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                      : 'bg-gray-500/10 text-gray-600 border-gray-500/20'
                                  }
                                >
                                  {eng.availability_status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="w-full mt-3"
                            disabled={eng.availability_status !== 'available'}
                            onClick={() => assignEngineer(eng.id)}
                          >
                            {eng.availability_status === 'available'
                              ? 'Assign to Job'
                              : 'Unavailable'}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No engineers found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
