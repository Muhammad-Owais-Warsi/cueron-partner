'use client';

import {
  TrendingUpIcon,
  TrendingDownIcon,
  FileText,
  ClipboardCheck,
  Wallet,
  Percent,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

/**
 * Custom StatCard component to match the photo's style
 */
function StatCard({
  title,
  value,
  trend,
  trendValue,
  description,
  icon: Icon,
  iconBg,
  progressColor,
  progressValue,
}: any) {
  return (
    <Card className="border-none shadow-sm bg-white dark:bg-zinc-950">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className="size-4 text-primary-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          {trendValue && (
            <div
              className={`flex items-center text-xs font-medium ${trend === 'up' ? 'text-emerald-500' : 'text-orange-500'}`}
            >
              {trend === 'up' ? (
                <TrendingUpIcon className="mr-1 size-3" />
              ) : (
                <TrendingDownIcon className="mr-1 size-3" />
              )}
              {trendValue}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{description}</p>
          {progressValue !== undefined && (
            <div className="pt-2">
              <Progress
                value={progressValue}
                className="h-1.5"
                indicatorClassName={progressColor}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 lg:px-6 bg-slate-50/50 py-6">
      <StatCard
        title="Active Bids"
        value="24"
        trend="up"
        trendValue="+12%"
        description="vs last week"
        icon={FileText}
        iconBg="bg-blue-100 dark:bg-blue-900"
      />

      <StatCard
        title="Pending Approvals"
        value="5"
        description="Requires action today"
        icon={ClipboardCheck}
        iconBg="bg-amber-100 dark:bg-amber-900"
      />

      <StatCard
        title="Total Spend YTD"
        value="$1.2M"
        trend="up"
        trendValue="+5% vs last year"
        description=""
        icon={Wallet}
        iconBg="bg-sky-100 dark:bg-sky-900"
        progressValue={65}
        progressColor="bg-blue-600"
      />

      <StatCard
        title="Avg Savings"
        value="12%"
        trend="up"
        trendValue="+2% vs target"
        description=""
        icon={Percent}
        iconBg="bg-purple-100 dark:bg-purple-900"
        progressValue={80}
        progressColor="bg-purple-600"
      />
    </div>
  );
}
