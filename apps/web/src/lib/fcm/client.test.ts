/**
 * FCM Client Tests
 * Tests for Firebase Cloud Messaging client functionality
 */

import { FCMClient, createFCMClient, getFCMClient, resetFCMClient } from './client';
import type { PushNotificationContent } from './types';

// Mock fetch
global.fetch = jest.fn();

describe('FCMClient', () => {
  const mockServerKey = 'test_server_key_12345';
  const mockToken = 'test_fcm_token_abcdef';

  beforeEach(() => {
    jest.clearAllMocks();
    resetFCMClient();
  });

  describe('constructor', () => {
    it('should create client with provided server key', () => {
      const client = new FCMClient(mockServerKey);
      expect(client).toBeInstanceOf(FCMClient);
    });

    it('should throw error with invalid server key', () => {
      expect(() => new FCMClient('')).toThrow('FCM_SERVER_KEY environment variable is not set');
    });
  });

  describe('sendToDevice', () => {
    it('should send notification to single device', async () => {
      const mockResponse = {
        success: 1,
        failure: 0,
        results: [{ message_id: 'msg_123' }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const client = new FCMClient(mockServerKey);
      const content: PushNotificationContent = {
        title: 'Test Notification',
        body: 'This is a test',
        priority: 'high',
      };

      const response = await client.sendToDevice(mockToken, content);

      expect(response.success).toBe(1);
      expect(response.failure).toBe(0);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://fcm.googleapis.com/fcm/send',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: `key=${mockServerKey}`,
          }),
        })
      );
    });

    it('should include notification data in request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: 1, failure: 0 }),
      });

      const client = new FCMClient(mockServerKey);
      const content: PushNotificationContent = {
        title: 'Test',
        body: 'Test body',
        data: {
          job_id: 'job-123',
          action: 'view_job',
        },
      };

      await client.sendToDevice(mockToken, content);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.to).toBe(mockToken);
      expect(requestBody.notification.title).toBe('Test');
      expect(requestBody.notification.body).toBe('Test body');
      expect(requestBody.data).toEqual({
        job_id: 'job-123',
        action: 'view_job',
      });
    });

    it('should handle FCM API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const client = new FCMClient(mockServerKey);
      const content: PushNotificationContent = {
        title: 'Test',
        body: 'Test body',
      };

      await expect(client.sendToDevice(mockToken, content)).rejects.toThrow(
        'FCM request failed with status 401'
      );
    });
  });

  describe('sendToDevices', () => {
    it('should send notification to multiple devices', async () => {
      const mockResponse = {
        success: 3,
        failure: 0,
        results: [
          { message_id: 'msg_1' },
          { message_id: 'msg_2' },
          { message_id: 'msg_3' },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const client = new FCMClient(mockServerKey);
      const tokens = ['token1', 'token2', 'token3'];
      const content: PushNotificationContent = {
        title: 'Broadcast',
        body: 'Broadcast message',
      };

      const response = await client.sendToDevices(tokens, content);

      expect(response.success).toBe(3);
      expect(response.failure).toBe(0);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.registration_ids).toEqual(tokens);
    });

    it('should return empty response for empty token array', async () => {
      const client = new FCMClient(mockServerKey);
      const content: PushNotificationContent = {
        title: 'Test',
        body: 'Test body',
      };

      const response = await client.sendToDevices([], content);

      expect(response.success).toBe(0);
      expect(response.failure).toBe(0);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should throw error for more than 1000 tokens', async () => {
      const client = new FCMClient(mockServerKey);
      const tokens = Array(1001).fill('token');
      const content: PushNotificationContent = {
        title: 'Test',
        body: 'Test body',
      };

      await expect(client.sendToDevices(tokens, content)).rejects.toThrow(
        'Cannot send to more than 1000 devices at once'
      );
    });
  });

  describe('sendDataMessage', () => {
    it('should send data-only message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: 1, failure: 0 }),
      });

      const client = new FCMClient(mockServerKey);
      const data = {
        action: 'sync_data',
        timestamp: '2025-01-20T10:00:00Z',
      };

      await client.sendDataMessage(mockToken, data);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.to).toBe(mockToken);
      expect(requestBody.notification).toBeUndefined();
      expect(requestBody.data).toEqual({
        action: 'sync_data',
        timestamp: '2025-01-20T10:00:00Z',
      });
    });
  });

  describe('data serialization', () => {
    it('should serialize complex data to strings', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: 1, failure: 0 }),
      });

      const client = new FCMClient(mockServerKey);
      const content: PushNotificationContent = {
        title: 'Test',
        body: 'Test body',
        data: {
          string_value: 'text',
          number_value: 123,
          boolean_value: true,
          object_value: { nested: 'data' },
          array_value: [1, 2, 3],
        },
      };

      await client.sendToDevice(mockToken, content);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.data.string_value).toBe('text');
      expect(requestBody.data.number_value).toBe('123');
      expect(requestBody.data.boolean_value).toBe('true');
      expect(requestBody.data.object_value).toBe('{"nested":"data"}');
      expect(requestBody.data.array_value).toBe('[1,2,3]');
    });

    it('should filter out null and undefined values', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: 1, failure: 0 }),
      });

      const client = new FCMClient(mockServerKey);
      const content: PushNotificationContent = {
        title: 'Test',
        body: 'Test body',
        data: {
          valid: 'value',
          null_value: null,
          undefined_value: undefined,
        },
      };

      await client.sendToDevice(mockToken, content);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.data).toEqual({ valid: 'value' });
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance from getFCMClient', () => {
      process.env.FCM_SERVER_KEY = mockServerKey;

      const client1 = getFCMClient();
      const client2 = getFCMClient();

      expect(client1).toBe(client2);
    });

    it('should create new instance after reset', () => {
      process.env.FCM_SERVER_KEY = mockServerKey;

      const client1 = getFCMClient();
      resetFCMClient();
      const client2 = getFCMClient();

      expect(client1).not.toBe(client2);
    });
  });

  describe('createFCMClient', () => {
    it('should create new client instance', () => {
      const client1 = createFCMClient(mockServerKey);
      const client2 = createFCMClient(mockServerKey);

      expect(client1).not.toBe(client2);
      expect(client1).toBeInstanceOf(FCMClient);
      expect(client2).toBeInstanceOf(FCMClient);
    });
  });
});
