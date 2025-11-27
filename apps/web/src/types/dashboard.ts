export interface EarningsData {
  daily: {
    earnings: number;
    jobs_completed: number;
  };
  monthly: {
    earnings: number;
    jobs_completed: number;
  };
  yearly: {
    earnings: number;
    jobs_completed: number;
  };
}

export interface DashboardData {
  summary: {
    total_jobs_completed: number;
    total_revenue: number;
    avg_rating: number;
    total_engineers: number;
    active_engineers: number;
  };
  charts: {
    jobs_trend: any[];
    revenue_trend: any[];
    rating_distribution: any[];
    job_type_distribution: any[];
  };
  trends: {
    jobs_growth: number;
    revenue_growth: number;
    rating_change: number;
  };
}