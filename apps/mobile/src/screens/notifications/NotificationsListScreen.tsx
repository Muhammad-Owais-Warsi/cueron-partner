/**
 * Notifications List Screen
 * Displays list of notifications with real API integration
 * 
 * Requirements:
 * - 14.1: Display push notifications
 * - 14.5: Include relevant job details and action links
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Card, Avatar, Badge, Button, Chip, IconButton, ActivityIndicator } from 'react-native-paper';
import type { NotificationsStackScreenProps } from '../../navigation/types';
import { supabase } from '../../lib/supabase';

type Props = NotificationsStackScreenProps<'NotificationsList'>;

type NotificationType =
  | 'job_assigned'
  | 'job_accepted'
  | 'job_status_update'
  | 'job_completed'
  | 'payment_received'
  | 'payment_pending'
  | 'engineer_added'
  | 'agency_approved'
  | 'system_alert';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  read_at?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: string;
}

type FilterType = 'all' | 'unread' | 'job_related';

export const NotificationsListScreen: React.FC<Props> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session');
        return;
      }

      // Get API URL from environment
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

      // Build query parameters based on filter
      const params = new URLSearchParams();
      if (filter === 'unread') {
        params.append('unread_only', 'true');
      }
      if (filter === 'job_related') {
        params.append('type', 'job_assigned');
      }

      const response = await fetch(
        `${apiUrl}/api/notifications?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(false);
  }, [fetchNotifications]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

      const response = await fetch(
        `${apiUrl}/api/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

      const response = await fetch(
        `${apiUrl}/api/notifications/read-all`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
        Alert.alert('Success', 'All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  // Handle notification tap
  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type and related entity
    if (notification.related_entity_type === 'job' && notification.related_entity_id) {
      // Navigate to Jobs tab and then to JobDetail screen
      navigation.navigate('JobsTab', {
        screen: 'JobDetail',
        params: { jobId: notification.related_entity_id },
      } as any);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
      case 'job_assigned':
        return 'briefcase-plus';
      case 'job_accepted':
        return 'briefcase-check';
      case 'job_status_update':
        return 'update';
      case 'job_completed':
        return 'check-circle';
      case 'payment_received':
        return 'cash-check';
      case 'payment_pending':
        return 'cash-clock';
      case 'engineer_added':
        return 'account-plus';
      case 'agency_approved':
        return 'check-decagram';
      case 'system_alert':
        return 'alert-circle';
      default:
        return 'bell';
    }
  };

  // Get icon color based on notification type
  const getIconColor = (type: NotificationType): string => {
    switch (type) {
      case 'job_assigned':
      case 'job_accepted':
        return '#2196F3';
      case 'job_completed':
        return '#4CAF50';
      case 'payment_received':
        return '#4CAF50';
      case 'payment_pending':
        return '#FF9800';
      case 'system_alert':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Render notification item
  const renderNotification = ({ item }: { item: Notification }) => (
    <Card
      style={[styles.card, !item.is_read && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
    >
      <Card.Content style={styles.cardContent}>
        <Avatar.Icon
          size={40}
          icon={getNotificationIcon(item.type)}
          style={[styles.avatar, { backgroundColor: getIconColor(item.type) }]}
        />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text variant="titleSmall" style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.is_read && <Badge size={8} style={styles.badge} />}
          </View>
          <Text variant="bodyMedium" numberOfLines={2} style={styles.message}>
            {item.message}
          </Text>
          <View style={styles.footer}>
            <Text variant="bodySmall" style={styles.time}>
              {formatTimestamp(item.created_at)}
            </Text>
            {item.related_entity_type === 'job' && (
              <Chip
                mode="outlined"
                compact
                style={styles.actionChip}
                textStyle={styles.actionChipText}
              >
                View Job
              </Chip>
            )}
          </View>
        </View>
        {!item.is_read && (
          <IconButton
            icon="check"
            size={20}
            onPress={(e) => {
              e.stopPropagation();
              markAsRead(item.id);
            }}
          />
        )}
      </Card.Content>
    </Card>
  );

  // Render empty state
  const renderEmpty = () => (
    <View style={styles.empty}>
      <Avatar.Icon size={64} icon="bell-outline" style={styles.emptyIcon} />
      <Text variant="titleMedium" style={styles.emptyTitle}>
        No notifications
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        {filter === 'unread'
          ? "You're all caught up!"
          : 'Notifications will appear here'}
      </Text>
    </View>
  );

  // Render header with filters
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.filterContainer}>
        <Chip
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
          style={styles.filterChip}
        >
          All {filter === 'all' && `(${notifications.length})`}
        </Chip>
        <Chip
          selected={filter === 'unread'}
          onPress={() => setFilter('unread')}
          style={styles.filterChip}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </Chip>
        <Chip
          selected={filter === 'job_related'}
          onPress={() => setFilter('job_related')}
          style={styles.filterChip}
        >
          Jobs
        </Chip>
      </View>
      {unreadCount > 0 && (
        <Button
          mode="text"
          onPress={markAllAsRead}
          compact
          style={styles.markAllButton}
        >
          Mark all as read
        </Button>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading notifications...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          notifications.length === 0 && styles.emptyList,
        ]}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  headerContainer: {
    paddingBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  markAllButton: {
    alignSelf: 'flex-end',
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#2196F3',
    marginLeft: 8,
  },
  message: {
    color: '#424242',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    color: '#757575',
  },
  actionChip: {
    height: 24,
  },
  actionChipText: {
    fontSize: 11,
    marginVertical: 0,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyIcon: {
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyText: {
    color: '#757575',
    textAlign: 'center',
  },
});
