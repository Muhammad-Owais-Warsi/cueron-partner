/**
 * Custom Header Component
 * Reusable header for navigation screens
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';

interface CustomHeaderProps extends NativeStackHeaderProps {
  showBackButton?: boolean;
  rightAction?: {
    icon: string;
    onPress: () => void;
    label?: string;
  };
}

/**
 * Custom header component with consistent styling
 * Provides back navigation and optional right actions
 */
export const CustomHeader: React.FC<CustomHeaderProps> = ({
  navigation,
  route,
  options,
  back,
  showBackButton = true,
  rightAction,
}) => {
  const theme = useTheme();
  const title = options.headerTitle !== undefined 
    ? options.headerTitle 
    : options.title !== undefined 
    ? options.title 
    : route.name;

  return (
    <Appbar.Header
      style={[
        styles.header,
        { backgroundColor: theme.colors.primary },
      ]}
    >
      {back && showBackButton && (
        <Appbar.BackAction
          onPress={navigation.goBack}
          color={theme.colors.onPrimary}
        />
      )}
      <Appbar.Content
        title={typeof title === 'string' ? title : String(title)}
        titleStyle={[styles.title, { color: theme.colors.onPrimary }]}
      />
      {rightAction && (
        <Appbar.Action
          icon={rightAction.icon}
          onPress={rightAction.onPress}
          color={theme.colors.onPrimary}
          accessibilityLabel={rightAction.label}
        />
      )}
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  header: {
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});
