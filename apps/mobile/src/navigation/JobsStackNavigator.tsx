/**
 * Jobs Stack Navigator
 * Handles navigation for job-related screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { JobsStackParamList } from './types';
import { CustomHeader } from '../components/navigation/CustomHeader';

// Import screens
import { JobsListScreen } from '../screens/jobs/JobsListScreen';
import { JobDetailScreen } from '../screens/jobs/JobDetailScreen';
import { JobStatusScreen } from '../screens/jobs/JobStatusScreen';
import { ServiceChecklistScreen } from '../screens/jobs/ServiceChecklistScreen';
import { PhotoCaptureScreen } from '../screens/jobs/PhotoCaptureScreen';
import { JobCompletionScreen } from '../screens/jobs/JobCompletionScreen';

const Stack = createNativeStackNavigator<JobsStackParamList>();

export const JobsStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        header: (props) => <CustomHeader {...props} />,
      }}
    >
      <Stack.Screen
        name="JobsList"
        component={JobsListScreen}
        options={{ title: 'My Jobs' }}
      />
      <Stack.Screen
        name="JobDetail"
        component={JobDetailScreen}
        options={{ title: 'Job Details' }}
      />
      <Stack.Screen
        name="JobStatus"
        component={JobStatusScreen}
        options={{ title: 'Update Status' }}
      />
      <Stack.Screen
        name="ServiceChecklist"
        component={ServiceChecklistScreen}
        options={{ title: 'Service Checklist' }}
      />
      <Stack.Screen
        name="PhotoCapture"
        component={PhotoCaptureScreen}
        options={{ title: 'Photos' }}
      />
      <Stack.Screen
        name="JobCompletion"
        component={JobCompletionScreen}
        options={{ title: 'Complete Job' }}
      />
    </Stack.Navigator>
  );
};


