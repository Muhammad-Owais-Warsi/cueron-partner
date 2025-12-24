'use client';

import React from 'react';
import {
  Search,
  Bell,
  MessageSquare,
  Plus,
  TrendingUp,
  FileText,
  ClipboardCheck,
  Wallet,
  Percent,
  MoreHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserProfile } from '@/hooks';
import { Spinner } from '@/components/ui/spinner';

// --- Sub-components to build the layout ---

function StatCard({ title, value, trend, sub, icon: Icon, iconBg, progress }: any) {
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
          {trend && (
            <Badge
              variant="secondary"
              className="bg-emerald-50 text-emerald-600 border-none text-[10px] font-bold"
            >
              <TrendingUp className="mr-1 size-3" /> {trend}
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
        {progress && (
          <Progress
            value={progress.val}
            className="h-1.5 mt-4"
            indicatorClassName={progress.color}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { profile, loading } = useUserProfile();

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12">
      <main className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* 2. WELCOME BAR */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, {profile?.role}
            </h1>
            <p className="text-slate-500 mt-1">
              Overview of your procurement activities and pending actions.
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 px-6 font-semibold shadow-md shadow-blue-100">
            <Plus className="mr-2 size-4" /> Create New Bid
          </Button>
        </div>

        {/* 3. METRIC CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Active Bids"
            value="24"
            trend="+12%"
            sub="vs last week"
            icon={FileText}
            iconBg="bg-blue-50"
          />
          <StatCard
            title="Pending Approvals"
            value="5"
            sub="Requires action today"
            icon={ClipboardCheck}
            iconBg="bg-amber-50"
          />
          <StatCard
            title="Total Spend YTD"
            value="$1.2M"
            trend="+5%"
            sub="vs last year"
            icon={Wallet}
            iconBg="bg-sky-50"
            progress={{ val: 65, color: 'bg-blue-600' }}
          />
          <StatCard
            title="Avg Savings"
            value="12%"
            trend="+2%"
            sub="vs target"
            icon={Percent}
            iconBg="bg-purple-50"
            progress={{ val: 80, color: 'bg-purple-600' }}
          />
        </div>

        {/* 4. CHART AND CATEGORY GRID (3:1 Ratio) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
          <Card className="lg:col-span-3 border-none shadow-sm outline outline-1 outline-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Bid Activity Over Time (Q3)</CardTitle>
                <CardDescription>High activity volume recorded in recent months</CardDescription>
              </div>
              <Badge
                variant="outline"
                className="text-emerald-600 bg-emerald-50 border-none font-bold"
              >
                +15% Growth
              </Badge>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center text-slate-400 italic">
              {/* Replace with your ChartAreaInteractive component */}
              [Interactive Chart Area]
            </CardContent>
          </Card>

          <Card className="lg:col-span-1 border-none shadow-sm outline outline-1 outline-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Spend by Category</CardTitle>
              <CardDescription>YTD distribution breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: 'Raw Materials', val: 45, color: 'bg-blue-600' },
                { label: 'IT Infrastructure', val: 28, color: 'bg-indigo-500' },
                { label: 'Logistics', val: 18, color: 'bg-teal-500' },
                { label: 'Services', val: 9, color: 'bg-orange-400' },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{item.label}</span>
                    <span>{item.val}%</span>
                  </div>
                  <Progress value={item.val} className="h-1.5" indicatorClassName={item.color} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 5. BOTTOM TABLE SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3 border-none shadow-sm outline outline-1 outline-slate-200 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">Pending Approvals</h3>
              <Button variant="link" className="text-blue-600 font-bold p-0">
                View All
              </Button>
            </div>
            <div className="p-0">
              {/* Placeholder for your DataTable component */}
              <div className="h-48 flex items-center justify-center text-slate-400">
                [Data Table Content]
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-1 border-none shadow-sm outline outline-1 outline-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Live Auctions</CardTitle>
              <CardDescription>Real-time status of open bids</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-slate-800">Office Expansion Project</h4>
                  <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] font-black">
                    ACTIVE
                  </Badge>
                </div>
                <div className="mt-4 flex justify-between items-end">
                  <span className="text-[11px] text-slate-500">Ends in 2h 15m</span>
                  <span className="text-sm font-bold text-slate-900">14 Bids</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
