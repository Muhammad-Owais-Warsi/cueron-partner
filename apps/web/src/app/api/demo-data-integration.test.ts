/**
 * Integration Tests for Demo Data API Endpoints
 * 
 * Tests demo data integration across analytics, earnings, jobs, and engineers endpoints.
 * Verifies consistency across multiple requests for demo users.
 * 
 * Requirements: 1.1, 1.5, 6.5
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { generateDashboardData, generateEarnings, generateJobs, generateEngineers } from '@/lib/demo-data/generator';
import { isDemoUser } from '@/lib/demo-data/middleware';

describe('Demo Data Integration Tests', () => {
  const mockUserId = 'test-user-123';

  describe('Analytics Endpoint Demo Data', () => {
    it('should generate consistent analytics data for the same user across multiple calls', () => {
      const data1 = generateDashboardData(mockUserId, '6months');
      const data2 = generateDashboardData(mockUserId, '6months');

      expect(data1).toEqual(data2);
      expect(data1.summary.total_jobs_completed).toBe(data2.summary.total_jobs_completed);
      expect(data1.summary.total_revenue).toBe(data2.summary.total_revenue);
      expect(data1.summary.avg_rating).toBe(data2.summary.avg_rating);
    });

    it('should generate valid analytics data structure', () => {
      const data = generateDashboardData(mockUserId, '6months');

      expect(data.summary).toBeDefined();
      expect(data.summary.total_jobs_completed).toBeGreaterThanOrEqual(0);
      expect(data.summary.total_revenue).toBeGreaterThanOrEqual(0);
      expect(data.summary.avg_rating).toBeGreaterThanOrEqual(3.5);
      expect(data.summary.avg_rating).toBeLessThanOrEqual(5.0);
      expect(data.summary.total_engineers).toBeGreaterThanOrEqual(0);
      expect(data.summary.active_engineers).toBeGreaterThanOrEqual(0);
      expect(data.summary.active_engineers).toBeLessThanOrEqual(data.summary.total_engineers);
    });
  });

  describe('Earnings Endpoint Demo Data', () => {
    it('should generate consistent earnings data for the same user across multiple calls', () => {
      const earnings1 = generateEarnings(mockUserId);
      const earnings2 = generateEarnings(mockUserId);

      expect(earnings1).toEqual(earnings2);
      expect(earnings1.daily.earnings).toBe(earnings2.daily.earnings);
      expect(earnings1.monthly.earnings).toBe(earnings2.monthly.earnings);
      expect(earnings1.yearly.earnings).toBe(earnings2.yearly.earnings);
    });

    it('should generate valid earnings data structure', () => {
      const earnings = generateEarnings(mockUserId);

      expect(earnings.daily).toBeDefined();
      expect(earnings.monthly).toBeDefined();
      expect(earnings.yearly).toBeDefined();
      
      expect(earnings.daily.earnings).toBeGreaterThanOrEqual(5000);
      expect(earnings.daily.earnings).toBeLessThanOrEqual(25000);
      expect(earnings.daily.jobs_completed).toBeGreaterThanOrEqual(2);
      expect(earnings.daily.jobs_completed).toBeLessThanOrEqual(8);
      
      expect(earnings.monthly.earnings).toBeGreaterThanOrEqual(150000);
      expect(earnings.monthly.earnings).toBeLessThanOrEqual(600000);
      expect(earnings.monthly.jobs_completed).toBeGreaterThanOrEqual(50);
      expect(earnings.monthly.jobs_completed).toBeLessThanOrEqual(200);
      
      expect(earnings.yearly.earnings).toBeGreaterThanOrEqual(1800000);
      expect(earnings.yearly.earnings).toBeLessThanOrEqual(7200000);
      expect(earnings.yearly.jobs_completed).toBeGreaterThanOrEqual(600);
      expect(earnings.yearly.jobs_completed).toBeLessThanOrEqual(2400);
    });
  });

  describe('Jobs Endpoint Demo Data', () => {
    it('should generate consistent jobs data for the same user across multiple calls', () => {
      const jobs1 = generateJobs(mockUserId, 20);
      const jobs2 = generateJobs(mockUserId, 20);

      expect(jobs1).toEqual(jobs2);
      expect(jobs1.length).toBe(jobs2.length);
      
      for (let i = 0; i < jobs1.length; i++) {
        expect(jobs1[i].id).toBe(jobs2[i].id);
        expect(jobs1[i].job_number).toBe(jobs2[i].job_number);
        expect(jobs1[i].status).toBe(jobs2[i].status);
        expect(jobs1[i].service_fee).toBe(jobs2[i].service_fee);
      }
    });

    it('should generate valid jobs data structure', () => {
      const jobs = generateJobs(mockUserId, 20);

      expect(jobs.length).toBe(20);
      
      jobs.forEach(job => {
        expect(job.id).toBeDefined();
        expect(job.job_number).toBeDefined();
        expect(job.client_name).toBeDefined();
        expect(job.client_phone).toBeDefined();
        expect(job.job_type).toBeDefined();
        expect(job.equipment_type).toBeDefined();
        expect(job.site_location).toBeDefined();
        expect(job.status).toBeDefined();
        expect(job.urgency).toBeDefined();
        expect(job.service_fee).toBeGreaterThanOrEqual(2000);
        expect(job.service_fee).toBeLessThanOrEqual(15000);
        expect(job.created_at).toBeDefined();
      });
    });

    it('should generate jobs with variety in statuses', () => {
      const jobs = generateJobs(mockUserId, 50);
      const statuses = new Set(jobs.map(j => j.status));
      
      // Should have at least 2 different statuses
      expect(statuses.size).toBeGreaterThanOrEqual(2);
    });

    it('should generate jobs with variety in job types', () => {
      const jobs = generateJobs(mockUserId, 50);
      const jobTypes = new Set(jobs.map(j => j.job_type));
      
      // Should have at least 2 different job types
      expect(jobTypes.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Engineers Endpoint Demo Data', () => {
    it('should generate consistent engineers data for the same user across multiple calls', () => {
      const engineers1 = generateEngineers(mockUserId, 15);
      const engineers2 = generateEngineers(mockUserId, 15);

      expect(engineers1).toEqual(engineers2);
      expect(engineers1.length).toBe(engineers2.length);
      
      for (let i = 0; i < engineers1.length; i++) {
        expect(engineers1[i].id).toBe(engineers2[i].id);
        expect(engineers1[i].name).toBe(engineers2[i].name);
        expect(engineers1[i].phone).toBe(engineers2[i].phone);
        expect(engineers1[i].average_rating).toBe(engineers2[i].average_rating);
      }
    });

    it('should generate valid engineers data structure', () => {
      const engineers = generateEngineers(mockUserId, 15);

      expect(engineers.length).toBe(15);
      
      engineers.forEach(engineer => {
        expect(engineer.id).toBeDefined();
        expect(engineer.name).toBeDefined();
        expect(engineer.phone).toBeDefined();
        expect(engineer.email).toBeDefined();
        expect(engineer.skill_level).toBeDefined();
        expect(engineer.specializations).toBeDefined();
        expect(engineer.availability_status).toBeDefined();
        expect(engineer.total_jobs_completed).toBeGreaterThanOrEqual(10);
        expect(engineer.total_jobs_completed).toBeLessThanOrEqual(150);
        expect(engineer.average_rating).toBeGreaterThanOrEqual(3.5);
        expect(engineer.average_rating).toBeLessThanOrEqual(5.0);
        expect(engineer.success_rate).toBeGreaterThanOrEqual(0.85);
        expect(engineer.success_rate).toBeLessThanOrEqual(0.99);
      });
    });

    it('should generate engineers with variety in availability statuses', () => {
      const engineers = generateEngineers(mockUserId, 50);
      const statuses = new Set(engineers.map(e => e.availability_status));
      
      // Should have at least 2 different availability statuses
      expect(statuses.size).toBeGreaterThanOrEqual(2);
    });

    it('should generate engineers with valid name format', () => {
      const engineers = generateEngineers(mockUserId, 15);
      
      engineers.forEach(engineer => {
        expect(engineer.name).toBeDefined();
        expect(engineer.name!.length).toBeGreaterThan(0);
        expect(engineer.name!.length).toBeLessThanOrEqual(50);
        // Name should contain only letters and spaces
        expect(engineer.name).toMatch(/^[a-zA-Z\s]+$/);
      });
    });
  });

  describe('Demo User Detection', () => {
    it('should correctly identify demo users', () => {
      const demoSession = {
        user_id: 'user-123',
        agency_id: 'agency-123',
        role: 'admin' as const,
        is_demo_user: true,
      };

      expect(isDemoUser(demoSession)).toBe(true);
    });

    it('should correctly identify non-demo users', () => {
      const regularSession = {
        user_id: 'user-123',
        agency_id: 'agency-123',
        role: 'admin' as const,
        is_demo_user: false,
      };

      expect(isDemoUser(regularSession)).toBe(false);
    });

    it('should treat null session as non-demo user', () => {
      expect(isDemoUser(null)).toBe(false);
    });

    it('should treat session without is_demo_user flag as non-demo user', () => {
      const sessionWithoutFlag = {
        user_id: 'user-123',
        agency_id: 'agency-123',
        role: 'admin' as const,
      };

      expect(isDemoUser(sessionWithoutFlag)).toBe(false);
    });
  });

  describe('Cross-Endpoint Consistency', () => {
    it('should generate different data for different users', () => {
      const user1Id = 'user-1';
      const user2Id = 'user-2';

      const earnings1 = generateEarnings(user1Id);
      const earnings2 = generateEarnings(user2Id);

      // Data should be different for different users
      expect(earnings1).not.toEqual(earnings2);
    });

    it('should maintain consistency across all endpoints for the same user', () => {
      const userId = 'consistent-user';

      // Generate data multiple times
      const analytics1 = generateDashboardData(userId, '6months');
      const analytics2 = generateDashboardData(userId, '6months');
      
      const earnings1 = generateEarnings(userId);
      const earnings2 = generateEarnings(userId);
      
      const jobs1 = generateJobs(userId, 10);
      const jobs2 = generateJobs(userId, 10);
      
      const engineers1 = generateEngineers(userId, 10);
      const engineers2 = generateEngineers(userId, 10);

      // All should be consistent
      expect(analytics1).toEqual(analytics2);
      expect(earnings1).toEqual(earnings2);
      expect(jobs1).toEqual(jobs2);
      expect(engineers1).toEqual(engineers2);
    });
  });
});
