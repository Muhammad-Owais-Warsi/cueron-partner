/**
 * Tab Bar Icon Component
 * Custom icon component for bottom tab navigation
 */

import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TabBarIconProps {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  size?: number;
  focused?: boolean;
}

/**
 * Tab bar icon with consistent sizing and styling
 */
export const TabBarIcon: React.FC<TabBarIconProps> = ({
  name,
  color,
  size = 24,
  focused = false,
}) => {
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color}
      style={{ opacity: focused ? 1 : 0.7 }}
    />
  );
};
