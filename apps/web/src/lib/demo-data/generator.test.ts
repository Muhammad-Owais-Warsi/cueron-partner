/**
 * Property-Based Tests for Demo Data Generator
 * 
 * These tests verify correctness properties that should hold across all valid inputs
 * using the fast-check property-based testing library.
 */

import * as fc from 'fast-check';
import {
  generateEarnings,
  generateDashboardData,
  generateMonthlyMetrics,
  generateJobs,
  generateEngineers,
} from './generator';

// Arbitrary for generating valid user IDs
const userIdArbitrary = fc.string({ minLength: 1, maxLength: 50 });

describe('Demo Data Generator - Property-Based Tests', () => {
  // **Feature: dashboard-demo-data, Property 6: Deterministic generation**
  // **Validates: Requirements 1.5, 5.1**
  describe('Property 6: Deterministic generation', () => {
    it('generateEarnings produces identical results for the same user ID', () => {
      fc.assert(
        fc.property(userIdArbitrary, (userId) => {
          const result1 = generateEarnings(userId);
          const result2 = generateEarnings(userId);
          
          expect(result1).toEqual(result2);
        }),
        { numRuns: 100 }
      );
    });

    it('generateDashboardData produces identical results for the same user ID', () => {
      fc.assert(
        fc.property(userIdArbitrary, (userId) => {
          const result1 = generateDashboardData(userId);
          const result2 = generateDashboardData(userId);
          
          expect(result1).toEqual(result2);
        }),
        { numRuns: 100 }
      );
    });

    it('generateMonthlyMetrics produces identical results for the same user ID', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 1, max: 24 }), (userId, months) => {
          const result1 = generateMonthlyMetrics(userId, months);
          const result2 = generateMonthlyMetrics(userId, months);
          
          expect(result1).toEqual(result2);
        }),
        { numRuns: 100 }
      );
    });

    it('generateJobs produces identical results for the same user ID', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 1, max: 50 }), (userId, count) => {
          const result1 = generateJobs(userId, count);
          const result2 = generateJobs(userId, count);
          
          expect(result1).toEqual(result2);
        }),
        { numRuns: 100 }
      );
    });

    it('generateEngineers produces identical results for the same user ID', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 1, max: 50 }), (userId, count) => {
          const result1 = generateEngineers(userId, count);
          const result2 = generateEngineers(userId, count);
          
          expect(result1).toEqual(result2);
        }),
        { numRuns: 100 }
      );
    });
  });
});

  // **Feature: dashboard-demo-data, Property 3: Numeric value realism**
  // **Validates: Requirements 1.2, 2.1, 4.1, 4.2**
  describe('Property 3: Numeric value realism', () => {
    it('generateEarnings produces values within realistic ranges', () => {
      fc.assert(
        fc.property(userIdArbitrary, (userId) => {
          const earnings = generateEarnings(userId);
          
          // Check daily earnings range
          expect(earnings.daily.earnings).toBeGreaterThanOrEqual(5000);
          expect(earnings.daily.earnings).toBeLessThanOrEqual(25000);
          expect(earnings.daily.jobs_completed).toBeGreaterThanOrEqual(2);
          expect(earnings.daily.jobs_completed).toBeLessThanOrEqual(8);
          
          // Check monthly earnings range
          expect(earnings.monthly.earnings).toBeGreaterThanOrEqual(150000);
          expect(earnings.monthly.earnings).toBeLessThanOrEqual(600000);
          expect(earnings.monthly.jobs_completed).toBeGreaterThanOrEqual(50);
          expect(earnings.monthly.jobs_completed).toBeLessThanOrEqual(200);
          
          // Check yearly earnings range
          expect(earnings.yearly.earnings).toBeGreaterThanOrEqual(1800000);
          expect(earnings.yearly.earnings).toBeLessThanOrEqual(7200000);
          expect(earnings.yearly.jobs_completed).toBeGreaterThanOrEqual(600);
          expect(earnings.yearly.jobs_completed).toBeLessThanOrEqual(2400);
        }),
        { numRuns: 100 }
      );
    });

    it('generateDashboardData produces values within realistic ranges', () => {
      fc.assert(
        fc.property(userIdArbitrary, (userId) => {
          const dashboard = generateDashboardData(userId);
          
          // Check summary ranges
          expect(dashboard.summary.total_jobs_completed).toBeGreaterThanOrEqual(100);
          expect(dashboard.summary.total_jobs_completed).toBeLessThanOrEqual(1000);
          expect(dashboard.summary.total_revenue).toBeGreaterThanOrEqual(500000);
          expect(dashboard.summary.total_revenue).toBeLessThanOrEqual(5000000);
          expect(dashboard.summary.avg_rating).toBeGreaterThanOrEqual(3.5);
          expect(dashboard.summary.avg_rating).toBeLessThanOrEqual(5.0);
          expect(dashboard.summary.total_engineers).toBeGreaterThanOrEqual(10);
          expect(dashboard.summary.total_engineers).toBeLessThanOrEqual(50);
          expect(dashboard.summary.active_engineers).toBeGreaterThanOrEqual(0);
          expect(dashboard.summary.active_engineers).toBeLessThanOrEqual(dashboard.summary.total_engineers);
          
          // Check trends ranges
          expect(dashboard.trends.jobs_growth).toBeGreaterThanOrEqual(-20);
          expect(dashboard.trends.jobs_growth).toBeLessThanOrEqual(30);
          expect(dashboard.trends.revenue_growth).toBeGreaterThanOrEqual(-15);
          expect(dashboard.trends.revenue_growth).toBeLessThanOrEqual(35);
          expect(dashboard.trends.rating_change).toBeGreaterThanOrEqual(-0.3);
          expect(dashboard.trends.rating_change).toBeLessThanOrEqual(0.3);
        }),
        { numRuns: 100 }
      );
    });

    it('generateJobs produces service fees within realistic ranges', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 1, max: 50 }), (userId, count) => {
          const jobs = generateJobs(userId, count);
          
          jobs.forEach(job => {
            expect(job.service_fee).toBeGreaterThanOrEqual(2000);
            expect(job.service_fee).toBeLessThanOrEqual(15000);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('generateEngineers produces performance metrics within realistic ranges', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 1, max: 50 }), (userId, count) => {
          const engineers = generateEngineers(userId, count);
          
          engineers.forEach(engineer => {
            expect(engineer.total_jobs_completed).toBeGreaterThanOrEqual(10);
            expect(engineer.total_jobs_completed).toBeLessThanOrEqual(150);
            expect(engineer.average_rating).toBeGreaterThanOrEqual(3.5);
            expect(engineer.average_rating).toBeLessThanOrEqual(5.0);
            expect(engineer.success_rate).toBeGreaterThanOrEqual(0.85);
            expect(engineer.success_rate).toBeLessThanOrEqual(0.99);
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: dashboard-demo-data, Property 2: Data structure completeness**
  // **Validates: Requirements 1.2, 2.4**
  describe('Property 2: Data structure completeness', () => {
    it('generateEarnings returns all required fields with correct types', () => {
      fc.assert(
        fc.property(userIdArbitrary, (userId) => {
          const earnings = generateEarnings(userId);
          
          // Check structure
          expect(earnings).toHaveProperty('daily');
          expect(earnings).toHaveProperty('monthly');
          expect(earnings).toHaveProperty('yearly');
          
          // Check daily fields
          expect(typeof earnings.daily.earnings).toBe('number');
          expect(typeof earnings.daily.jobs_completed).toBe('number');
          
          // Check monthly fields
          expect(typeof earnings.monthly.earnings).toBe('number');
          expect(typeof earnings.monthly.jobs_completed).toBe('number');
          
          // Check yearly fields
          expect(typeof earnings.yearly.earnings).toBe('number');
          expect(typeof earnings.yearly.jobs_completed).toBe('number');
        }),
        { numRuns: 100 }
      );
    });

    it('generateDashboardData returns all required fields with correct types', () => {
      fc.assert(
        fc.property(userIdArbitrary, (userId) => {
          const dashboard = generateDashboardData(userId);
          
          // Check top-level structure
          expect(dashboard).toHaveProperty('summary');
          expect(dashboard).toHaveProperty('charts');
          expect(dashboard).toHaveProperty('trends');
          
          // Check summary fields
          expect(typeof dashboard.summary.total_jobs_completed).toBe('number');
          expect(typeof dashboard.summary.total_revenue).toBe('number');
          expect(typeof dashboard.summary.avg_rating).toBe('number');
          expect(typeof dashboard.summary.total_engineers).toBe('number');
          expect(typeof dashboard.summary.active_engineers).toBe('number');
          
          // Check charts structure
          expect(Array.isArray(dashboard.charts.jobs_trend)).toBe(true);
          expect(Array.isArray(dashboard.charts.revenue_trend)).toBe(true);
          expect(Array.isArray(dashboard.charts.rating_distribution)).toBe(true);
          expect(Array.isArray(dashboard.charts.job_type_distribution)).toBe(true);
          
          // Check trends fields
          expect(typeof dashboard.trends.jobs_growth).toBe('number');
          expect(typeof dashboard.trends.revenue_growth).toBe('number');
          expect(typeof dashboard.trends.rating_change).toBe('number');
        }),
        { numRuns: 100 }
      );
    });

    it('generateJobs returns all required fields with correct types', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 1, max: 20 }), (userId, count) => {
          const jobs = generateJobs(userId, count);
          
          expect(jobs.length).toBe(count);
          
          jobs.forEach(job => {
            expect(typeof job.id).toBe('string');
            expect(typeof job.job_number).toBe('string');
            expect(typeof job.client_name).toBe('string');
            expect(typeof job.client_phone).toBe('string');
            expect(typeof job.job_type).toBe('string');
            expect(typeof job.equipment_type).toBe('string');
            expect(typeof job.status).toBe('string');
            expect(typeof job.urgency).toBe('string');
            expect(typeof job.service_fee).toBe('number');
            expect(typeof job.payment_status).toBe('string');
            expect(typeof job.created_at).toBe('string');
            expect(typeof job.updated_at).toBe('string');
            expect(job.site_location).toHaveProperty('address');
            expect(job.site_location).toHaveProperty('city');
            expect(job.site_location).toHaveProperty('state');
            expect(job.site_location).toHaveProperty('pincode');
            expect(job.site_location).toHaveProperty('lat');
            expect(job.site_location).toHaveProperty('lng');
          });
        }),
        { numRuns: 100 }
      );
    });

    it('generateEngineers returns all required fields with correct types', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 1, max: 20 }), (userId, count) => {
          const engineers = generateEngineers(userId, count);
          
          expect(engineers.length).toBe(count);
          
          engineers.forEach(engineer => {
            expect(typeof engineer.id).toBe('string');
            expect(typeof engineer.agency_id).toBe('string');
            expect(typeof engineer.name).toBe('string');
            expect(typeof engineer.phone).toBe('string');
            expect(typeof engineer.email).toBe('string');
            expect(typeof engineer.skill_level).toBe('number');
            expect(Array.isArray(engineer.specializations)).toBe(true);
            expect(typeof engineer.availability_status).toBe('string');
            expect(typeof engineer.total_jobs_completed).toBe('number');
            expect(typeof engineer.average_rating).toBe('number');
            expect(typeof engineer.total_ratings).toBe('number');
            expect(typeof engineer.success_rate).toBe('number');
            expect(typeof engineer.employment_type).toBe('string');
            expect(typeof engineer.created_at).toBe('string');
            expect(typeof engineer.updated_at).toBe('string');
            expect(Array.isArray(engineer.certifications)).toBe(true);
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: dashboard-demo-data, Property 5: Time-series completeness**
  // **Validates: Requirements 1.4, 2.5**
  describe('Property 5: Time-series completeness', () => {
    it('generateMonthlyMetrics produces chronologically ordered data', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 2, max: 24 }), (userId, months) => {
          const metrics = generateMonthlyMetrics(userId, months);
          
          // Check correct number of data points
          expect(metrics.length).toBe(months);
          
          // Check chronological ordering by parsing dates
          for (let i = 1; i < metrics.length; i++) {
            const prevDate = new Date(metrics[i - 1].month);
            const currDate = new Date(metrics[i].month);
            expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
          }
          
          // Check all required fields are present
          metrics.forEach(metric => {
            expect(metric).toHaveProperty('month');
            expect(metric).toHaveProperty('completed');
            expect(metric).toHaveProperty('cancelled');
            expect(metric).toHaveProperty('total');
            expect(metric).toHaveProperty('revenue');
            expect(metric).toHaveProperty('avg_job_value');
          });
        }),
        { numRuns: 100 }
      );
    });

    it('generateDashboardData chart data is chronologically ordered', () => {
      fc.assert(
        fc.property(userIdArbitrary, (userId) => {
          const dashboard = generateDashboardData(userId);
          
          // Check jobs_trend ordering
          for (let i = 1; i < dashboard.charts.jobs_trend.length; i++) {
            const prevDate = new Date(dashboard.charts.jobs_trend[i - 1].month);
            const currDate = new Date(dashboard.charts.jobs_trend[i].month);
            expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
          }
          
          // Check revenue_trend ordering
          for (let i = 1; i < dashboard.charts.revenue_trend.length; i++) {
            const prevDate = new Date(dashboard.charts.revenue_trend[i - 1].month);
            const currDate = new Date(dashboard.charts.revenue_trend[i].month);
            expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
          }
        }),
        { numRuns: 100 }
      );
    });

    it('generateMonthlyMetrics spans the full requested period', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 1, max: 24 }), (userId, months) => {
          const metrics = generateMonthlyMetrics(userId, months);
          
          // Should have exactly the requested number of months
          expect(metrics.length).toBe(months);
          
          // Check that months are consecutive
          if (months > 1) {
            for (let i = 1; i < metrics.length; i++) {
              const prevDate = new Date(metrics[i - 1].month);
              const currDate = new Date(metrics[i].month);
              
              // Calculate month difference
              const monthDiff = (currDate.getFullYear() - prevDate.getFullYear()) * 12 + 
                                (currDate.getMonth() - prevDate.getMonth());
              
              // Should be exactly 1 month apart
              expect(monthDiff).toBe(1);
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: dashboard-demo-data, Property 7: Collection variety**
  // **Validates: Requirements 2.2, 2.3**
  describe('Property 7: Collection variety', () => {
    it('generateJobs produces varied job types', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 10, max: 50 }), (userId, count) => {
          const jobs = generateJobs(userId, count);
          
          // Collect unique job types
          const jobTypes = new Set(jobs.map(job => job.job_type));
          
          // Should have at least 2 different job types
          expect(jobTypes.size).toBeGreaterThanOrEqual(2);
        }),
        { numRuns: 100 }
      );
    });

    it('generateJobs produces varied job statuses', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 10, max: 50 }), (userId, count) => {
          const jobs = generateJobs(userId, count);
          
          // Collect unique statuses
          const statuses = new Set(jobs.map(job => job.status));
          
          // Should have at least 2 different statuses
          expect(statuses.size).toBeGreaterThanOrEqual(2);
        }),
        { numRuns: 100 }
      );
    });

    it('generateJobs produces varied urgency levels', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 10, max: 50 }), (userId, count) => {
          const jobs = generateJobs(userId, count);
          
          // Collect unique urgency levels
          const urgencies = new Set(jobs.map(job => job.urgency));
          
          // Should have at least 2 different urgency levels
          expect(urgencies.size).toBeGreaterThanOrEqual(2);
        }),
        { numRuns: 100 }
      );
    });

    it('generateEngineers produces varied availability statuses', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 10, max: 50 }), (userId, count) => {
          const engineers = generateEngineers(userId, count);
          
          // Collect unique availability statuses
          const statuses = new Set(engineers.map(eng => eng.availability_status));
          
          // Should have at least 2 different availability statuses
          expect(statuses.size).toBeGreaterThanOrEqual(2);
        }),
        { numRuns: 100 }
      );
    });

    it('generateEngineers produces varied employment types', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 10, max: 50 }), (userId, count) => {
          const engineers = generateEngineers(userId, count);
          
          // Collect unique employment types
          const types = new Set(engineers.map(eng => eng.employment_type));
          
          // Should have at least 2 different employment types
          expect(types.size).toBeGreaterThanOrEqual(2);
        }),
        { numRuns: 100 }
      );
    });

    it('generateEngineers produces varied specializations', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 5, max: 20 }), (userId, count) => {
          const engineers = generateEngineers(userId, count);
          
          // Collect all specializations across all engineers
          const allSpecializations = new Set<string>();
          engineers.forEach(eng => {
            eng.specializations?.forEach(spec => allSpecializations.add(spec));
          });
          
          // Should have at least 2 different specializations across all engineers
          expect(allSpecializations.size).toBeGreaterThanOrEqual(2);
        }),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: dashboard-demo-data, Property 13: Seed-based uniqueness**
  // **Validates: Requirements 5.5**
  describe('Property 13: Seed-based uniqueness', () => {
    it('generateEarnings produces different data for different user IDs', () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          userIdArbitrary,
          (userId1, userId2) => {
            // Skip if user IDs are the same
            fc.pre(userId1 !== userId2);
            
            const earnings1 = generateEarnings(userId1);
            const earnings2 = generateEarnings(userId2);
            
            // At least one value should be different
            const isDifferent = 
              earnings1.daily.earnings !== earnings2.daily.earnings ||
              earnings1.daily.jobs_completed !== earnings2.daily.jobs_completed ||
              earnings1.monthly.earnings !== earnings2.monthly.earnings ||
              earnings1.monthly.jobs_completed !== earnings2.monthly.jobs_completed ||
              earnings1.yearly.earnings !== earnings2.yearly.earnings ||
              earnings1.yearly.jobs_completed !== earnings2.yearly.jobs_completed;
            
            expect(isDifferent).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('generateDashboardData produces different data for different user IDs', () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          userIdArbitrary,
          (userId1, userId2) => {
            // Skip if user IDs are the same
            fc.pre(userId1 !== userId2);
            
            const dashboard1 = generateDashboardData(userId1);
            const dashboard2 = generateDashboardData(userId2);
            
            // At least one summary value should be different
            const isDifferent = 
              dashboard1.summary.total_jobs_completed !== dashboard2.summary.total_jobs_completed ||
              dashboard1.summary.total_revenue !== dashboard2.summary.total_revenue ||
              dashboard1.summary.avg_rating !== dashboard2.summary.avg_rating ||
              dashboard1.summary.total_engineers !== dashboard2.summary.total_engineers ||
              dashboard1.summary.active_engineers !== dashboard2.summary.active_engineers;
            
            expect(isDifferent).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('generateJobs produces different data for different user IDs', () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          userIdArbitrary,
          fc.integer({ min: 5, max: 20 }),
          (userId1, userId2, count) => {
            // Skip if user IDs are the same
            fc.pre(userId1 !== userId2);
            
            const jobs1 = generateJobs(userId1, count);
            const jobs2 = generateJobs(userId2, count);
            
            // At least one job should have different properties
            let foundDifference = false;
            for (let i = 0; i < count; i++) {
              if (jobs1[i].client_name !== jobs2[i].client_name ||
                  jobs1[i].service_fee !== jobs2[i].service_fee ||
                  jobs1[i].job_type !== jobs2[i].job_type) {
                foundDifference = true;
                break;
              }
            }
            
            expect(foundDifference).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('generateEngineers produces different data for different user IDs', () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          userIdArbitrary,
          fc.integer({ min: 5, max: 20 }),
          (userId1, userId2, count) => {
            // Skip if user IDs are the same
            fc.pre(userId1 !== userId2);
            
            const engineers1 = generateEngineers(userId1, count);
            const engineers2 = generateEngineers(userId2, count);
            
            // At least one engineer should have different properties
            let foundDifference = false;
            for (let i = 0; i < count; i++) {
              if (engineers1[i].name !== engineers2[i].name ||
                  engineers1[i].average_rating !== engineers2[i].average_rating ||
                  engineers1[i].total_jobs_completed !== engineers2[i].total_jobs_completed) {
                foundDifference = true;
                break;
              }
            }
            
            expect(foundDifference).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: dashboard-demo-data, Property 10: Rating distribution constraints**
  // **Validates: Requirements 4.3**
  describe('Property 10: Rating distribution constraints', () => {
    it('generateDashboardData produces avg_rating between 3.5 and 5.0', () => {
      fc.assert(
        fc.property(userIdArbitrary, (userId) => {
          const dashboard = generateDashboardData(userId);
          
          expect(dashboard.summary.avg_rating).toBeGreaterThanOrEqual(3.5);
          expect(dashboard.summary.avg_rating).toBeLessThanOrEqual(5.0);
        }),
        { numRuns: 100 }
      );
    });

    it('generateJobs produces client_rating between 3.5 and 5.0 when present', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 10, max: 50 }), (userId, count) => {
          const jobs = generateJobs(userId, count);
          
          jobs.forEach(job => {
            if (job.client_rating !== undefined) {
              expect(job.client_rating).toBeGreaterThanOrEqual(3.5);
              expect(job.client_rating).toBeLessThanOrEqual(5.0);
            }
          });
        }),
        { numRuns: 100 }
      );
    });

    it('generateEngineers produces average_rating between 3.5 and 5.0', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 1, max: 50 }), (userId, count) => {
          const engineers = generateEngineers(userId, count);
          
          engineers.forEach(engineer => {
            expect(engineer.average_rating).toBeGreaterThanOrEqual(3.5);
            expect(engineer.average_rating).toBeLessThanOrEqual(5.0);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('generateDashboardData rating_distribution contains only valid ratings', () => {
      fc.assert(
        fc.property(userIdArbitrary, (userId) => {
          const dashboard = generateDashboardData(userId);
          
          dashboard.charts.rating_distribution.forEach(item => {
            expect(item.rating).toBeGreaterThanOrEqual(1);
            expect(item.rating).toBeLessThanOrEqual(5);
            expect(Number.isInteger(item.rating)).toBe(true);
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: dashboard-demo-data, Property 11: Name format validity**
  // **Validates: Requirements 4.4**
  describe('Property 11: Name format validity', () => {
    it('generateJobs produces valid client names', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 1, max: 50 }), (userId, count) => {
          const jobs = generateJobs(userId, count);
          
          jobs.forEach(job => {
            const name = job.client_name!;
            
            // Non-empty
            expect(name.length).toBeGreaterThan(0);
            
            // Contains only letters and spaces
            expect(/^[a-zA-Z\s]+$/.test(name)).toBe(true);
            
            // Length between 5 and 50 characters
            expect(name.length).toBeGreaterThanOrEqual(5);
            expect(name.length).toBeLessThanOrEqual(50);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('generateEngineers produces valid engineer names', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 1, max: 50 }), (userId, count) => {
          const engineers = generateEngineers(userId, count);
          
          engineers.forEach(engineer => {
            const name = engineer.name!;
            
            // Non-empty
            expect(name.length).toBeGreaterThan(0);
            
            // Contains only letters and spaces
            expect(/^[a-zA-Z\s]+$/.test(name)).toBe(true);
            
            // Length between 5 and 50 characters
            expect(name.length).toBeGreaterThanOrEqual(5);
            expect(name.length).toBeLessThanOrEqual(50);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('generated names have proper format (first and last name)', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 1, max: 20 }), (userId, count) => {
          const engineers = generateEngineers(userId, count);
          
          engineers.forEach(engineer => {
            const name = engineer.name!;
            const parts = name.split(' ');
            
            // Should have at least 2 parts (first and last name)
            expect(parts.length).toBeGreaterThanOrEqual(2);
            
            // Each part should be non-empty
            parts.forEach(part => {
              expect(part.length).toBeGreaterThan(0);
            });
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: dashboard-demo-data, Property 12: Timestamp recency**
  // **Validates: Requirements 4.5**
  describe('Property 12: Timestamp recency', () => {
    it('generateJobs produces timestamps within last 365 days', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 1, max: 50 }), (userId, count) => {
          const jobs = generateJobs(userId, count);
          // Use the same fixed reference date as the generator
          const referenceDate = new Date(2024, 11, 1, 7, 0, 0, 0); // Dec 1, 2024
          const oneYearAgo = new Date(referenceDate.getTime() - 365 * 24 * 60 * 60 * 1000);
          
          jobs.forEach(job => {
            const createdAt = new Date(job.created_at!);
            
            // Should be within last 365 days from reference date
            expect(createdAt.getTime()).toBeGreaterThanOrEqual(oneYearAgo.getTime());
            expect(createdAt.getTime()).toBeLessThanOrEqual(referenceDate.getTime());
          });
        }),
        { numRuns: 100 }
      );
    });

    it('generateEngineers produces timestamps within last 365 days', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 1, max: 50 }), (userId, count) => {
          const engineers = generateEngineers(userId, count);
          // Use the same fixed reference date as the generator
          const referenceDate = new Date(2024, 11, 1, 7, 0, 0, 0); // Dec 1, 2024
          const oneYearAgo = new Date(referenceDate.getTime() - 365 * 24 * 60 * 60 * 1000);
          
          engineers.forEach(engineer => {
            const createdAt = new Date(engineer.created_at!);
            
            // Should be within last 365 days from reference date
            expect(createdAt.getTime()).toBeGreaterThanOrEqual(oneYearAgo.getTime());
            expect(createdAt.getTime()).toBeLessThanOrEqual(referenceDate.getTime());
          });
        }),
        { numRuns: 100 }
      );
    });

    it('generated timestamps are valid ISO 8601 strings', () => {
      fc.assert(
        fc.property(userIdArbitrary, fc.integer({ min: 1, max: 20 }), (userId, count) => {
          const jobs = generateJobs(userId, count);
          
          jobs.forEach(job => {
            // Should be parseable as a date
            const date = new Date(job.created_at!);
            expect(date.toString()).not.toBe('Invalid Date');
            
            // Should be in ISO format
            expect(job.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
          });
        }),
        { numRuns: 100 }
      );
    });
  });
