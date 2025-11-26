import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface PermissionChipProps {
  label: string;
  icon: string;
  active?: boolean;
  color?: string;
  size?: number;
}

const hexToRgba = (hex: string, alpha: number) => {
  let sanitized = hex.replace('#', '').trim();

  if (sanitized.length === 3) {
    sanitized = sanitized
      .split('')
      .map((char) => char + char)
      .join('');
  }

  if (sanitized.length !== 6) {
    return `rgba(148, 163, 184, ${alpha})`;
  }

  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const PermissionChip: React.FC<PermissionChipProps> = ({
  label,
  icon,
  active = true,
  color = '#60A5FA',
  size = 14,
}) => {
  const backgroundColor = active ? hexToRgba(color, 0.18) : 'rgba(71, 85, 105, 0.35)';
  const borderColor = active ? hexToRgba(color, 0.5) : 'rgba(71, 85, 105, 0.55)';
  const textColor = active ? color : 'rgba(148, 163, 184, 0.9)';
  const iconColor = active ? color : 'rgba(148, 163, 184, 0.9)';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <Ionicons name={icon as any} size={size} color={iconColor} style={styles.icon} />
      <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: 'rgba(15, 23, 42, 0.6)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default PermissionChip;
export { hexToRgba };

