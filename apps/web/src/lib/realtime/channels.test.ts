/**
 * Real-time Channel Manager Tests
 * Tests for Supabase Realtime channel management
 */

import { RealtimeChannelManager } from './channels';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('RealtimeChannelManager', () => {
  let mockSupabase: any;
  let mockChannel: any;
  let channelManager: RealtimeChannelManager;

  beforeEach(() => {
    // Mock Supabase channel
    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue({ error: null }),
    };

    // Mock Supabase client
    mockSupabase = {
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn().mockResolvedValue({ error: null }),
    } as unknown as SupabaseClient<any>;

    channelManager = new RealtimeChannelManager(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('subscribeToJob', () => {
    it('should create a job channel subscription', () => {
      const jobId = 'job-123';
      const callbacks = {
        onStatusUpdate: jest.fn(),
        onLocationUpdate: jest.fn(),
      };

      channelManager.subscribeToJob(jobId, callbacks);

      expect(mockSupabase.channel).toHaveBeenCalledWith(`job:${jobId}`);
      expect(mockChannel.on).toHaveBeenCalledTimes(2);
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should reuse existing channel if already subscribed', () => {
      const jobId = 'job-123';
      const callbacks = {
        onStatusUpdate: jest.fn(),
      };

      const channel1 = channelManager.subscribeToJob(jobId, callbacks);
      const channel2 = channelManager.subscribeToJob(jobId, callbacks);

      expect(channel1).toBe(channel2);
      expect(mockSupabase.channel).toHaveBeenCalledTimes(1);
    });

    it('should track active channels', () => {
      const jobId = 'job-123';
      
      expect(channelManager.getActiveChannelCount()).toBe(0);
      
      channelManager.subscribeToJob(jobId, {});
      
      expect(channelManager.getActiveChannelCount()).toBe(1);
      expect(channelManager.isSubscribed(`job:${jobId}`)).toBe(true);
    });
  });

  describe('subscribeToAgency', () => {
    it('should create an agency channel subscription', () => {
      const agencyId = 'agency-123';
      const callbacks = {
        onJobAssigned: jest.fn(),
        onJobStatusChanged: jest.fn(),
        onEngineerLocationUpdated: jest.fn(),
        onPaymentStatusChanged: jest.fn(),
      };

      channelManager.subscribeToAgency(agencyId, callbacks);

      expect(mockSupabase.channel).toHaveBeenCalledWith(`agency:${agencyId}`);
      expect(mockChannel.on).toHaveBeenCalledTimes(4);
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });
  });

  describe('subscribeToEngineer', () => {
    it('should create an engineer channel subscription', () => {
      const engineerId = 'engineer-123';
      const callbacks = {
        onJobAssigned: jest.fn(),
        onNotification: jest.fn(),
      };

      channelManager.subscribeToEngineer(engineerId, callbacks);

      expect(mockSupabase.channel).toHaveBeenCalledWith(`engineer:${engineerId}`);
      expect(mockChannel.on).toHaveBeenCalledTimes(2);
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });
  });

  describe('broadcast', () => {
    it('should send broadcast message to channel', async () => {
      const channelName = 'job:123';
      const event = 'status_update';
      const payload = { status: 'travelling' };

      await channelManager.broadcast(channelName, event, payload);

      expect(mockSupabase.channel).toHaveBeenCalledWith(channelName);
      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event,
        payload,
      });
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe from a specific channel', async () => {
      const jobId = 'job-123';
      const channelName = `job:${jobId}`;

      channelManager.subscribeToJob(jobId, {});
      expect(channelManager.isSubscribed(channelName)).toBe(true);

      await channelManager.unsubscribe(channelName);

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
      expect(channelManager.isSubscribed(channelName)).toBe(false);
    });

    it('should handle unsubscribe from non-existent channel', async () => {
      await channelManager.unsubscribe('non-existent');

      expect(mockSupabase.removeChannel).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribeAll', () => {
    it('should unsubscribe from all channels', async () => {
      channelManager.subscribeToJob('job-1', {});
      channelManager.subscribeToJob('job-2', {});
      channelManager.subscribeToAgency('agency-1', {});

      expect(channelManager.getActiveChannelCount()).toBe(3);

      await channelManager.unsubscribeAll();

      expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(3);
      expect(channelManager.getActiveChannelCount()).toBe(0);
    });
  });

  describe('subscribeToTableChanges', () => {
    it('should subscribe to database table changes', () => {
      const table = 'jobs';
      const filter = 'id=eq.123';
      const callbacks = {
        onInsert: jest.fn(),
        onUpdate: jest.fn(),
        onDelete: jest.fn(),
      };

      channelManager.subscribeToTableChanges(table, filter, callbacks);

      expect(mockSupabase.channel).toHaveBeenCalledWith(`table:${table}:${filter}`);
      expect(mockChannel.on).toHaveBeenCalledTimes(3);
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should only subscribe to specified events', () => {
      const table = 'jobs';
      const filter = 'id=eq.123';
      const callbacks = {
        onInsert: jest.fn(),
        // Only onInsert, no onUpdate or onDelete
      };

      channelManager.subscribeToTableChanges(table, filter, callbacks);

      expect(mockChannel.on).toHaveBeenCalledTimes(1);
    });
  });
});
