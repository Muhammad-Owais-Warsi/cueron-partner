/**
 * FCM Formatter Tests
 * Tests for notification content formatting
 * 
 * Requirement 14.5: Notification content formatting
 */

import {
  formatJobAssignmentNotification,
  formatJobStatusNotification,
  formatPaymentNotification,
  formatSystemAlertNotification,
  validateNotificationContent,
} from './formatter';

describe('FCM Formatter', () => {
  describe('formatJobAssignmentNotification', () => {
    it('should format basic job assignment notification', () => {
      const content = formatJobAssignmentNotification({
        job_id: 'job-123',
        job_number: 'JOB-2025-1234',
        client_name: 'ABC Cold Storage',
        urgency: 'normal',
      });

      expect(content.title).toBe('New Job Assignment');
      expect(content.body).toContain('JOB-2025-1234');
      expect(content.body).toContain('ABC Cold Storage');
      expect(content.priority).toBe('normal');
      expect(content.data?.type).toBe('job_assigned');
      expect(content.data?.action).toBe('view_job');
    });

    it('should format emergency job assignment with urgent styling', () => {
      const content = formatJobAssignmentNotification({
        job_id: 'job-123',
        job_number: 'JOB-2025-1234',
        client_name: 'ABC Cold Storage',
        urgency: 'emergency',
      });

      expect(content.title).toBe('Emergency Job Assignment');
      expect(content.body).toContain('🚨 URGENT');
      expect(content.priority).toBe('high');
      expect(content.sound).toBe('urgent');
    });

    it('should include scheduled time in notification', () => {
      const scheduledTime = '2025-01-20T10:00:00Z';
      const content = formatJobAssignmentNotification({
        job_id: 'job-123',
        job_number: 'JOB-2025-1234',
        client_name: 'ABC Cold Storage',
        urgency: 'normal',
        scheduled_time: scheduledTime,
      });

      expect(content.body).toContain('Scheduled for');
    });

    it('should include location data', () => {
      const content = formatJobAssignmentNotification({
        job_id: 'job-123',
        job_number: 'JOB-2025-1234',
        client_name: 'ABC Cold Storage',
        urgency: 'normal',
        location: {
          address: '123 Main St, Mumbai',
          lat: 19.0760,
          lng: 72.8777,
        },
      });

      expect(content.data?.location).toBeDefined();
      expect(content.data?.location.address).toBe('123 Main St, Mumbai');
    });
  });

  describe('formatJobStatusNotification', () => {
    it('should format job status change notification', () => {
      const content = formatJobStatusNotification({
        job_id: 'job-123',
        job_number: 'JOB-2025-1234',
        old_status: 'assigned',
        new_status: 'travelling',
        engineer_name: 'Rajesh Kumar',
      });

      expect(content.title).toBe('Job Status Update');
      expect(content.body).toContain('JOB-2025-1234');
      expect(content.body).toContain('is on the way');
      expect(content.body).toContain('Rajesh Kumar');
      expect(content.data?.type).toBe('job_status_changed');
    });

    it('should use correct status messages', () => {
      const statuses = [
        { status: 'assigned', message: 'has been assigned' },
        { status: 'accepted', message: 'has been accepted' },
        { status: 'travelling', message: 'is on the way' },
        { status: 'onsite', message: 'has arrived on site' },
        { status: 'completed', message: 'has been completed' },
        { status: 'cancelled', message: 'has been cancelled' },
      ];

      statuses.forEach(({ status, message }) => {
        const content = formatJobStatusNotification({
          job_id: 'job-123',
          job_number: 'JOB-2025-1234',
          old_status: 'assigned',
          new_status: status,
        });

        expect(content.body).toContain(message);
      });
    });

    it('should not include engineer name for completed status', () => {
      const content = formatJobStatusNotification({
        job_id: 'job-123',
        job_number: 'JOB-2025-1234',
        old_status: 'onsite',
        new_status: 'completed',
        engineer_name: 'Rajesh Kumar',
      });

      expect(content.body).not.toContain('by Rajesh Kumar');
    });
  });

  describe('formatPaymentNotification', () => {
    it('should format pending payment notification', () => {
      const content = formatPaymentNotification({
        payment_id: 'payment-123',
        amount: 5000,
        status: 'pending',
      });

      expect(content.title).toBe('Payment Pending');
      expect(content.body).toContain('₹5,000');
      expect(content.body).toContain('is pending');
      expect(content.data?.type).toBe('payment_pending');
    });

    it('should format received payment notification', () => {
      const content = formatPaymentNotification({
        payment_id: 'payment-123',
        amount: 5000,
        status: 'completed',
      });

      expect(content.title).toBe('Payment Received');
      expect(content.body).toContain('₹5,000');
      expect(content.body).toContain('has been received');
      expect(content.data?.type).toBe('payment_received');
    });

    it('should format amount in Indian currency', () => {
      const content = formatPaymentNotification({
        payment_id: 'payment-123',
        amount: 123456,
        status: 'completed',
      });

      expect(content.body).toContain('₹1,23,456');
    });

    it('should mention job when job_id is provided', () => {
      const content = formatPaymentNotification({
        payment_id: 'payment-123',
        job_id: 'job-123',
        amount: 5000,
        status: 'completed',
      });

      expect(content.body).toContain('for your completed job');
    });
  });

  describe('formatSystemAlertNotification', () => {
    it('should format system alert notification', () => {
      const content = formatSystemAlertNotification(
        'System Maintenance',
        'The system will be under maintenance from 2 AM to 4 AM.',
        { maintenance_window: '2025-01-20T02:00:00Z' }
      );

      expect(content.title).toBe('System Maintenance');
      expect(content.body).toBe('The system will be under maintenance from 2 AM to 4 AM.');
      expect(content.data?.type).toBe('system_alert');
      expect(content.data?.maintenance_window).toBe('2025-01-20T02:00:00Z');
      expect(content.priority).toBe('high');
    });
  });

  describe('validateNotificationContent', () => {
    it('should validate valid notification content', () => {
      const content = {
        title: 'Valid Title',
        body: 'Valid body text',
        priority: 'normal' as const,
      };

      expect(validateNotificationContent(content)).toBe(true);
    });

    it('should reject empty title', () => {
      const content = {
        title: '',
        body: 'Valid body text',
        priority: 'normal' as const,
      };

      expect(validateNotificationContent(content)).toBe(false);
    });

    it('should reject empty body', () => {
      const content = {
        title: 'Valid Title',
        body: '',
        priority: 'normal' as const,
      };

      expect(validateNotificationContent(content)).toBe(false);
    });

    it('should reject title longer than 65 characters', () => {
      const content = {
        title: 'A'.repeat(66),
        body: 'Valid body text',
        priority: 'normal' as const,
      };

      expect(validateNotificationContent(content)).toBe(false);
    });

    it('should reject body longer than 240 characters', () => {
      const content = {
        title: 'Valid Title',
        body: 'A'.repeat(241),
        priority: 'normal' as const,
      };

      expect(validateNotificationContent(content)).toBe(false);
    });

    it('should accept title with exactly 65 characters', () => {
      const content = {
        title: 'A'.repeat(65),
        body: 'Valid body text',
        priority: 'normal' as const,
      };

      expect(validateNotificationContent(content)).toBe(true);
    });

    it('should accept body with exactly 240 characters', () => {
      const content = {
        title: 'Valid Title',
        body: 'A'.repeat(240),
        priority: 'normal' as const,
      };

      expect(validateNotificationContent(content)).toBe(true);
    });

    it('should reject whitespace-only title', () => {
      const content = {
        title: '   ',
        body: 'Valid body text',
        priority: 'normal' as const,
      };

      expect(validateNotificationContent(content)).toBe(false);
    });

    it('should reject whitespace-only body', () => {
      const content = {
        title: 'Valid Title',
        body: '   ',
        priority: 'normal' as const,
      };

      expect(validateNotificationContent(content)).toBe(false);
    });
  });
});
