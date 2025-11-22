/**
 * Settings Screen
 * App settings and preferences
 */

import React from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, List, Divider, Switch } from 'react-native-paper';
import type { ProfileStackScreenProps } from '../../navigation/types';
import { supabase } from '../../lib/supabase';

type Props = ProfileStackScreenProps<'Settings'>;

export const SettingsScreen: React.FC<Props> = () => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [locationEnabled, setLocationEnabled] = React.useState(true);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            // Navigation will be handled by auth state change
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="titleMedium" style={styles.sectionHeader}>
        Notifications
      </Text>
      <List.Item
        title="Push Notifications"
        description="Receive job assignments and updates"
        left={(props) => <List.Icon {...props} icon="bell" />}
        right={() => (
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        )}
      />
      <Divider />

      <Text variant="titleMedium" style={styles.sectionHeader}>
        Location
      </Text>
      <List.Item
        title="Location Tracking"
        description="Share location during active jobs"
        left={(props) => <List.Icon {...props} icon="map-marker" />}
        right={() => (
          <Switch
            value={locationEnabled}
            onValueChange={setLocationEnabled}
          />
        )}
      />
      <Divider />

      <Text variant="titleMedium" style={styles.sectionHeader}>
        Account
      </Text>
      <List.Item
        title="Edit Profile"
        left={(props) => <List.Icon {...props} icon="account-edit" />}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => {
          Alert.alert('Coming Soon', 'Profile editing will be available soon');
        }}
      />
      <Divider />
      <List.Item
        title="Change Password"
        left={(props) => <List.Icon {...props} icon="lock" />}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => {
          Alert.alert('Coming Soon', 'Password change will be available soon');
        }}
      />
      <Divider />

      <Text variant="titleMedium" style={styles.sectionHeader}>
        About
      </Text>
      <List.Item
        title="App Version"
        description="1.0.0"
        left={(props) => <List.Icon {...props} icon="information" />}
      />
      <Divider />
      <List.Item
        title="Terms of Service"
        left={(props) => <List.Icon {...props} icon="file-document" />}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => {
          Alert.alert('Coming Soon', 'Terms of Service will be available soon');
        }}
      />
      <Divider />
      <List.Item
        title="Privacy Policy"
        left={(props) => <List.Icon {...props} icon="shield-account" />}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => {
          Alert.alert('Coming Soon', 'Privacy Policy will be available soon');
        }}
      />
      <Divider />

      <List.Item
        title="Logout"
        titleStyle={styles.logoutText}
        left={(props) => <List.Icon {...props} icon="logout" color="#F44336" />}
        onPress={handleLogout}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
  },
  logoutText: {
    color: '#F44336',
  },
});
