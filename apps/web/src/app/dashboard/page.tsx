'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  ClipboardCheck,
  Users,
  Database,
  LayoutDashboard,
  ArrowRight,
  MoreHorizontal,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Charting
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { useUserProfile } from '@/hooks';
import { Spinner } from '@/components/ui/spinner';

// --- Mock Chart Data (To be replaced by API timelines later) ---
const chartData = [
  { name: 'Mon', jobs: 4 },
  { name: 'Tue', jobs: 7 },
  { name: 'Wed', jobs: 5 },
  { name: 'Thu', jobs: 12 },
  { name: 'Fri', jobs: 8 },
  { name: 'Sat', jobs: 2 },
  { name: 'Sun', jobs: 3 },
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

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/new/admin');
        const data = await response.json();
        setStats(data.stats);
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setDataLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (profileLoading || dataLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12">
      <main className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* 1. HEADER SECTION */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight capitalize">
              Dashboard Overview
            </h1>
            <p className="text-slate-500 mt-1">
              Logged in as{' '}
              <span className="font-semibold text-slate-700">{profile?.role || 'Admin'}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">Settings</Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <LayoutDashboard className="mr-2 size-4" /> Export Data
            </Button>
          </div>
        </div>

        {/* 2. TOP METRICS */}
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
            sub="Partners pending review"
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
            sub="Field feedback reports"
            icon={ClipboardCheck}
            iconBg="bg-purple-50"
          />
        </div>

        {/* 3. CHART & MARKET SHARE */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3 border-none shadow-sm outline outline-1 outline-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Market Activity</CardTitle>
              <CardDescription>Daily job creation volume</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="jobs"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorJobs)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1 border-none shadow-sm outline outline-1 outline-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Distribution</CardTitle>
              <CardDescription>Records by Type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: 'Jobs', val: stats?.totalJobs, color: 'bg-blue-600' },
                { label: 'Agencies', val: stats?.totalAgencies, color: 'bg-indigo-500' },
                { label: 'Surveys', val: stats?.totalSurveys, color: 'bg-teal-500' },
              ].map((item) => {
                const total =
                  (stats?.totalJobs || 0) +
                  (stats?.totalAgencies || 0) +
                  (stats?.totalSurveys || 0);
                const percentage = total > 0 ? Math.round((item.val / total) * 100) : 0;
                return (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{item.label}</span>
                      <span>{percentage}%</span>
                    </div>
                    <Progress
                      value={percentage}
                      className="h-1.5"
                      indicatorClassName={item.color}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
