/**
 * Demo Data Generator
 * 
 * Generates realistic, deterministic demo data for mock users.
 * All data is generated using seeded random number generation to ensure
 * consistency across sessions for the same user.
 */

import { SeededRandom } from './seeded-random';
import type { EarningsData, DashboardData } from '@/types/dashboard';
import type { Job, JobType, JobStatus, JobUrgency } from '@cueron/types';
import type { Engineer, AvailabilityStatus, SkillLevel } from '@cueron/types';

// Realistic value ranges based on design document
const RANGES = {
  DAILY_EARNINGS: { min: 5000, max: 25000 },
  DAILY_JOBS: { min: 2, max: 8 },
  MONTHLY_EARNINGS: { min: 150000, max: 600000 },
  MONTHLY_JOBS: { min: 50, max: 200 },
  YEARLY_EARNINGS: { min: 1800000, max: 7200000 },
  YEARLY_JOBS: { min: 600, max: 2400 },
  TOTAL_JOBS: { min: 100, max: 1000 },
  TOTAL_REVENUE: { min: 500000, max: 5000000 },
  AVG_RATING: { min: 3.5, max: 5.0 },
  TOTAL_ENGINEERS: { min: 10, max: 50 },
  ACTIVE_ENGINEERS_RATIO: { min: 0.5, max: 0.8 },
  JOBS_GROWTH: { min: -20, max: 30 },
  REVENUE_GROWTH: { min: -15, max: 35 },
  RATING_CHANGE: { min: -0.3, max: 0.3 },
  SERVICE_FEE: { min: 2000, max: 15000 },
  ENGINEER_JOBS: { min: 10, max: 150 },
  ENGINEER_RATING: { min: 3.5, max: 5.0 },
};

const JOB_TYPES: JobType[] = ['AMC', 'Repair', 'Installation', 'Emergency'];
const JOB_STATUSES: JobStatus[] = ['pending', 'assigned', 'accepted', 'travelling', 'onsite', 'completed', 'cancelled'];
const JOB_URGENCIES: JobUrgency[] = ['emergency', 'urgent', 'normal', 'scheduled'];
const AVAILABILITY_STATUSES: AvailabilityStatus[] = ['available', 'on_job', 'offline', 'on_leave'];
const EQUIPMENT_TYPES = ['Air Conditioner', 'Refrigerator', 'Washing Machine', 'Water Heater', 'Microwave', 'Dishwasher'];
const FIRST_NAMES = ['Rajesh', 'Amit', 'Priya', 'Suresh', 'Anita', 'Vijay', 'Deepak', 'Kavita', 'Ravi', 'Sunita', 'Manoj', 'Neha', 'Arun', 'Pooja', 'Sanjay'];
const LAST_NAMES = ['Kumar', 'Sharma', 'Singh', 'Patel', 'Verma', 'Gupta', 'Reddy', 'Rao', 'Nair', 'Iyer', 'Joshi', 'Mehta', 'Desai', 'Pillai', 'Menon'];

/**
 * Generates realistic earnings data for a demo user
 * @param userId - User ID to use as seed
 * @returns EarningsData object with daily, monthly, and yearly earnings
 */
export function generateEarnings(userId: string): EarningsData {
  const rng = new SeededRandom(userId + '-earnings');
  
  return {
    daily: {
      earnings: rng.nextInt(RANGES.DAILY_EARNINGS.min, RANGES.DAILY_EARNINGS.max),
      jobs_completed: rng.nextInt(RANGES.DAILY_JOBS.min, RANGES.DAILY_JOBS.max),
    },
    monthly: {
      earnings: rng.nextInt(RANGES.MONTHLY_EARNINGS.min, RANGES.MONTHLY_EARNINGS.max),
      jobs_completed: rng.nextInt(RANGES.MONTHLY_JOBS.min, RANGES.MONTHLY_JOBS.max),
    },
    yearly: {
      earnings: rng.nextInt(RANGES.YEARLY_EARNINGS.min, RANGES.YEARLY_EARNINGS.max),
      jobs_completed: rng.nextInt(RANGES.YEARLY_JOBS.min, RANGES.YEARLY_JOBS.max),
    },
  };
}

/**
 * Generates monthly metrics for time-series charts
 * @param userId - User ID to use as seed
 * @param months - Number of months to generate
 * @returns Array of monthly metric objects
 */
export function generateMonthlyMetrics(userId: string, months: number = 6): Array<{
  month: string;
  completed: number;
  cancelled: number;
  total: number;
  revenue: number;
  avg_job_value: number;
}> {
  const rng = new SeededRandom(userId + '-monthly');
  const metrics = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    const completed = rng.nextInt(40, 180);
    const cancelled = rng.nextInt(2, 15);
    const total = completed + cancelled;
    const revenue = rng.nextInt(100000, 500000);
    const avg_job_value = Math.round(revenue / completed);
    
    metrics.push({
      month: monthName,
      completed,
      cancelled,
      total,
      revenue,
      avg_job_value,
    });
  }
  
  return metrics;
}

/**
 * Generates comprehensive dashboard data including summary, charts, and trends
 * @param userId - User ID to use as seed
 * @param period - Time period for data generation (default: '6months')
 * @returns DashboardData object with all dashboard metrics
 */
export function generateDashboardData(userId: string, period: string = '6months'): DashboardData {
  const rng = new SeededRandom(userId + '-dashboard');
  
  // Parse period to determine months (default to 6 if invalid)
  let months = 6;
  const periodMatch = period.match(/(\d+)months?/);
  if (periodMatch) {
    months = parseInt(periodMatch[1], 10);
  }
  
  // Generate summary data
  const total_engineers = rng.nextInt(RANGES.TOTAL_ENGINEERS.min, RANGES.TOTAL_ENGINEERS.max);
  const active_ratio = rng.nextFloat(RANGES.ACTIVE_ENGINEERS_RATIO.min, RANGES.ACTIVE_ENGINEERS_RATIO.max);
  const active_engineers = Math.round(total_engineers * active_ratio);
  
  const summary = {
    total_jobs_completed: rng.nextInt(RANGES.TOTAL_JOBS.min, RANGES.TOTAL_JOBS.max),
    total_revenue: rng.nextInt(RANGES.TOTAL_REVENUE.min, RANGES.TOTAL_REVENUE.max),
    avg_rating: parseFloat(rng.nextFloat(RANGES.AVG_RATING.min, RANGES.AVG_RATING.max).toFixed(2)),
    total_engineers,
    active_engineers,
  };
  
  // Generate monthly metrics for charts
  const monthlyMetrics = generateMonthlyMetrics(userId, months);
  
  // Generate rating distribution
  const ratingRng = new SeededRandom(userId + '-ratings');
  const rating_distribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: rating >= 4 ? ratingRng.nextInt(20, 100) : ratingRng.nextInt(5, 30),
  }));
  
  // Generate job type distribution
  const typeRng = new SeededRandom(userId + '-jobtypes');
  const job_type_distribution = JOB_TYPES.map(type => {
    const count = typeRng.nextInt(20, 150);
    return {
      type,
      count,
      percentage: 0, // Will be calculated below
    };
  });
  
  // Calculate percentages
  const totalJobTypes = job_type_distribution.reduce((sum, item) => sum + item.count, 0);
  job_type_distribution.forEach(item => {
    item.percentage = parseFloat(((item.count / totalJobTypes) * 100).toFixed(1));
  });
  
  return {
    summary,
    charts: {
      jobs_trend: monthlyMetrics.map(m => ({
        month: m.month,
        completed: m.completed,
        cancelled: m.cancelled,
        total: m.total,
      })),
      revenue_trend: monthlyMetrics.map(m => ({
        month: m.month,
        revenue: m.revenue,
        avg_job_value: m.avg_job_value,
      })),
      rating_distribution,
      job_type_distribution,
    },
    trends: {
      jobs_growth: parseFloat(rng.nextFloat(RANGES.JOBS_GROWTH.min, RANGES.JOBS_GROWTH.max).toFixed(1)),
      revenue_growth: parseFloat(rng.nextFloat(RANGES.REVENUE_GROWTH.min, RANGES.REVENUE_GROWTH.max).toFixed(1)),
      rating_change: parseFloat(rng.nextFloat(RANGES.RATING_CHANGE.min, RANGES.RATING_CHANGE.max).toFixed(2)),
    },
  };
}

/**
 * Generates a list of demo jobs with varied types and statuses
 * @param userId - User ID to use as seed
 * @param count - Number of jobs to generate
 * @returns Array of Job objects
 */
export function generateJobs(userId: string, count: number = 20): Partial<Job>[] {
  const jobs: Partial<Job>[] = [];
  // Use a fixed reference date for deterministic generation
  const now = new Date(2024, 11, 1, 7, 0, 0, 0); // Fixed date: Dec 1, 2024
  
  for (let i = 0; i < count; i++) {
    const jobRng = new SeededRandom(userId + '-job-' + i);
    
    // Generate timestamp within last 365 days
    const daysAgo = jobRng.nextInt(0, 365);
    const created_at = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    
    const status = jobRng.pick(JOB_STATUSES);
    const job_type = jobRng.pick(JOB_TYPES);
    
    jobs.push({
      id: `demo-job-${userId}-${i}`,
      job_number: `JOB-${String(1000 + i).padStart(5, '0')}`,
      client_name: `${jobRng.pick(FIRST_NAMES)} ${jobRng.pick(LAST_NAMES)}`,
      client_phone: `+91${jobRng.nextInt(7000000000, 9999999999)}`,
      job_type,
      equipment_type: jobRng.pick(EQUIPMENT_TYPES),
      site_location: {
        address: `${jobRng.nextInt(1, 999)} MG Road`,
        city: jobRng.pick(['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata']),
        state: jobRng.pick(['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal']),
        pincode: String(jobRng.nextInt(100000, 999999)),
        lat: jobRng.nextFloat(8.0, 35.0),
        lng: jobRng.nextFloat(68.0, 97.0),
      },
      status,
      urgency: jobRng.pick(JOB_URGENCIES),
      service_fee: jobRng.nextInt(RANGES.SERVICE_FEE.min, RANGES.SERVICE_FEE.max),
      payment_status: status === 'completed' ? 'paid' : 'pending',
      client_rating: status === 'completed' ? (jobRng.nextInt(7, 10) / 2) as 1 | 2 | 3 | 4 | 5 : undefined,
      created_at,
      updated_at: created_at,
      required_skill_level: jobRng.nextInt(1, 5) as SkillLevel,
    });
  }
  
  return jobs;
}

/**
 * Generates a list of demo engineers with varied performance metrics
 * @param userId - User ID to use as seed
 * @param count - Number of engineers to generate
 * @returns Array of Engineer objects
 */
export function generateEngineers(userId: string, count: number = 15): Partial<Engineer>[] {
  const engineers: Partial<Engineer>[] = [];
  // Use a fixed reference date for deterministic generation
  const now = new Date(2024, 11, 1, 7, 0, 0, 0); // Fixed date: Dec 1, 2024
  
  for (let i = 0; i < count; i++) {
    const engRng = new SeededRandom(userId + '-eng-' + i);
    
    const firstName = engRng.pick(FIRST_NAMES);
    const lastName = engRng.pick(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    
    // Generate timestamp within last 365 days
    const daysAgo = engRng.nextInt(0, 365);
    const created_at = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    
    const total_jobs_completed = engRng.nextInt(RANGES.ENGINEER_JOBS.min, RANGES.ENGINEER_JOBS.max);
    const total_ratings = Math.max(1, Math.round(total_jobs_completed * engRng.nextFloat(0.6, 0.9)));
    const average_rating = parseFloat(engRng.nextFloat(RANGES.ENGINEER_RATING.min, RANGES.ENGINEER_RATING.max).toFixed(2));
    
    engineers.push({
      id: `demo-eng-${userId}-${i}`,
      agency_id: `demo-agency-${userId}`,
      name,
      phone: `+91${engRng.nextInt(7000000000, 9999999999)}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      skill_level: engRng.nextInt(1, 5) as SkillLevel,
      specializations: engRng.shuffle(EQUIPMENT_TYPES).slice(0, engRng.nextInt(2, 4)),
      availability_status: engRng.pick(AVAILABILITY_STATUSES),
      total_jobs_completed,
      average_rating,
      total_ratings,
      success_rate: parseFloat(engRng.nextFloat(0.85, 0.99).toFixed(2)),
      employment_type: engRng.pick(['full_time', 'part_time', 'gig'] as const),
      created_at,
      updated_at: created_at,
      certifications: [],
    });
  }
  
  return engineers;
}
