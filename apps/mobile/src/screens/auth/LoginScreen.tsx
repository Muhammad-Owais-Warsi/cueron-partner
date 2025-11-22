/**
 * Login Screen
 * Placeholder for authentication screen (to be implemented in task 41)
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'Auth'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const handleLogin = () => {
    // Placeholder - actual authentication will be implemented in task 41
    navigation.replace('Main');
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Cueron Engineer
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Field Service Application
      </Text>
      <Button mode="contained" onPress={handleLogin} style={styles.button}>
        Login (Placeholder)
      </Button>
      <Text variant="bodySmall" style={styles.note}>
        Authentication will be implemented in task 41
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 32,
    color: '#666',
  },
  button: {
    marginTop: 16,
    minWidth: 200,
  },
  note: {
    marginTop: 24,
    color: '#999',
    fontStyle: 'italic',
  },
});
