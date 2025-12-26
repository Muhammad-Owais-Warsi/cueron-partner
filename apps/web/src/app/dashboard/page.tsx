'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  ClipboardCheck,
  Users,
  Database,
  LayoutDashboard,
  ArrowRight,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';

// Shadcn UI Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Charting
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { useUserProfile } from '@/hooks';
import { Spinner } from '@/components/ui/spinner';

// --- Mock Data ---
const adminChartData = [
  { name: 'Mon', jobs: 4 },
  { name: 'Tue', jobs: 7 },
  { name: 'Wed', jobs: 5 },
  { name: 'Thu', jobs: 12 },
  { name: 'Fri', jobs: 8 },
  { name: 'Sat', jobs: 2 },
  { name: 'Sun', jobs: 3 },
];

const managerChartData = [
  { day: 'Mon', count: 2 },
  { day: 'Tue', count: 5 },
  { day: 'Wed', count: 3 },
  { day: 'Thu', count: 8 },
  { day: 'Fri', count: 6 },
];

// --- Reusable StatCard ---
function StatCard({ title, value, sub, icon: Icon, iconBg }: any) {
  return (
    <Card className="border-none shadow-sm outline outline-1 outline-slate-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className="size-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { profile, loading: profileLoading } = useUserProfile();
  const [stats, setStats] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = profile?.role?.toLowerCase();

  useEffect(() => {
    if (profileLoading) return;

    async function fetchStats() {
      try {
        let response;

        if (role === 'admin') {
          // Admin View: Standard GET
          response = await fetch('/api/new/admin');
        } else if (role === 'manager') {
          // MANDATE: Check for agency_id before calling API
          if (!profile?.agency.id) {
            throw new Error('No agency associated with this manager account.');
          }

          // Manager View: POST with mandated agency_id
          response = await fetch('/api/new/manager', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agency_id: profile.agency.id }),
          });
        } else {
          setDataLoading(false);
          return;
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch statistics');

        setStats(data.stats);
      } catch (err: any) {
        console.error('Dashboard error:', err);
        setError(err.message);
      } finally {
        setDataLoading(false);
      }
    }

    fetchStats();
  }, [role, profileLoading, profile?.agency.id]);

  if (profileLoading || dataLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <Spinner />
      </div>
    );
  }

  // Error State (Mandate Failure or Network Error)
  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center p-8 text-center bg-[#f8fafc]">
        <ShieldAlert className="size-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-slate-500 max-w-sm mt-2">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-6" variant="outline">
          Retry Session
        </Button>
      </div>
    );
  }

  // --- ADMIN VIEW ---
  if (role === 'admin') {
    return (
      <div className="min-h-screen bg-[#f8fafc] pb-12">
        <main className="max-w-[1600px] mx-auto p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Overview</h1>
              <p className="text-slate-500 mt-1 uppercase text-xs font-bold tracking-widest">
                Master Control Panel
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <LayoutDashboard className="mr-2 size-4" /> Export All Data
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Open Jobs"
              value={stats?.openJobs || 0}
              sub="Awaiting assignment"
              icon={FileText}
              iconBg="bg-blue-50"
            />
            <StatCard
              title="New Requests"
              value={stats?.totalRequests || 0}
              sub="Partners pending"
              icon={Users}
              iconBg="bg-amber-50"
            />
            <StatCard
              title="Agencies"
              value={stats?.totalAgencies || 0}
              sub="Verified partners"
              icon={Database}
              iconBg="bg-sky-50"
            />
            <StatCard
              title="Total Surveys"
              value={stats?.totalSurveys || 0}
              sub="Field reports"
              icon={ClipboardCheck}
              iconBg="bg-purple-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-3 border-none shadow-sm outline outline-1 outline-slate-200">
              <CardHeader>
                <CardTitle>Market Activity</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={adminChartData}>
                    <defs>
                      <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="jobs"
                      stroke="#2563eb"
                      fillOpacity={1}
                      fill="url(#colorJobs)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1 border-none shadow-sm outline outline-1 outline-slate-200">
              <CardHeader>
                <CardTitle>System Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { label: 'Jobs', val: stats?.totalJobs, color: 'bg-blue-600' },
                  { label: 'Agencies', val: stats?.totalAgencies, color: 'bg-indigo-500' },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{item.label}</span>
                    </div>
                    <Progress value={45} className="h-1.5" indicatorClassName={item.color} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // --- MANAGER VIEW ---
  if (role === 'manager') {
    return (
      <div className="min-h-screen bg-[#f8fafc] pb-12">
        <main className="max-w-[1600px] mx-auto p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Manager Dashboard
              </h1>
              <p className="text-slate-500 mt-1 uppercase text-xs font-bold tracking-widest text-indigo-600">
                Agency ID: <span className="font-mono text-slate-800">{profile?.agency_id}</span>
              </p>
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Users className="mr-2 size-4" /> Add Engineer
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Engineers"
              value={stats?.totalEngineers || 0}
              sub="Associated with your agency"
              icon={Users}
              iconBg="bg-indigo-50"
            />
            <StatCard
              title="Active Assignments"
              value="12"
              sub="Currently on-site"
              icon={UserCheck}
              iconBg="bg-emerald-50"
            />
            <StatCard
              title="Compliance"
              value="Verified"
              sub="Mandate filter active"
              icon={ShieldAlert}
              iconBg="bg-amber-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-sm outline outline-1 outline-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Onboarding Velocity</CardTitle>
                <CardDescription>Engineers joined over the last 5 days</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={managerChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm outline outline-1 outline-slate-200 bg-indigo-600 text-white p-6 flex flex-col justify-center text-center">
              <UserCheck className="size-10 mx-auto mb-4 opacity-80" />
              <h3 className="text-lg font-bold">Agency Verified</h3>
              <p className="text-indigo-100 text-sm mt-2">
                Only displaying resources assigned to your unique ID.
              </p>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return <div className="p-20 text-center">Unauthorized access or Role not recognized.</div>;
}
