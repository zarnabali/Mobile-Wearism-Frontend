import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PermissionChip from './PermissionChip';

type WidgetBoolean = boolean | undefined | null;

export type WidgetPermissionsConfig = {
  email?: {
    sendAllowed?: WidgetBoolean;
    requiresVerification?: WidgetBoolean;
    logInAudit?: WidgetBoolean;
  };
  phone?: {
    callAllowed?: WidgetBoolean;
    smsAllowed?: WidgetBoolean;
    whatsappAllowed?: WidgetBoolean;
  };
  location?: {
    viewAllowed?: WidgetBoolean;
    showCurrentLocation?: WidgetBoolean;
    showDistance?: WidgetBoolean;
  };
};

export interface WidgetPermissionSummaryProps {
  widgetPermissions?: WidgetPermissionsConfig | null;
}

const widgetMeta = {
  email: {
    title: 'Email Actions',
    icon: 'mail-outline',
    color: '#60A5FA',
    permissions: [
      { key: 'sendAllowed', label: 'Send Email', icon: 'send-outline' },
      { key: 'requiresVerification', label: 'Requires Verification', icon: 'shield-checkmark-outline' },
      { key: 'logInAudit', label: 'Audit Logging', icon: 'document-text-outline' },
    ],
  },
  phone: {
    title: 'Phone Actions',
    icon: 'call-outline',
    color: '#34D399',
    permissions: [
      { key: 'callAllowed', label: 'Call Allowed', icon: 'call-outline' },
      { key: 'smsAllowed', label: 'SMS Allowed', icon: 'chatbubble-ellipses-outline' },
      { key: 'whatsappAllowed', label: 'WhatsApp Allowed', icon: 'logo-whatsapp' },
    ],
  },
  location: {
    title: 'Location Actions',
    icon: 'location-outline',
    color: '#A855F7',
    permissions: [
      { key: 'viewAllowed', label: 'View Location', icon: 'map-outline' },
      { key: 'showCurrentLocation', label: 'Current Location', icon: 'navigate-outline' },
      { key: 'showDistance', label: 'Show Distance', icon: 'speedometer-outline' },
    ],
  },
} as const;

const WidgetPermissionSummary: React.FC<WidgetPermissionSummaryProps> = ({ widgetPermissions }) => {
  const permissions = widgetPermissions || {};

  return (
    <View style={styles.wrapper}>
      {Object.entries(widgetMeta).map(([key, meta]) => {
        const group = (permissions as any)[key] || {};
        const isActive =
          Object.values(group).some((value) => value === true) ||
          Object.values(group).every((value) => value === undefined);

        return (
          <View key={key} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: `${meta.color}20` }]}>
                <Ionicons name={meta.icon as any} size={20} color={meta.color} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.cardTitle}>{meta.title}</Text>
                <Text style={styles.cardSubtitle}>{isActive ? 'Enabled' : 'Disabled'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.chipContainer}>
              {meta.permissions.map((permission) => {
                const value = group[permission.key as keyof typeof group];
                return (
                  <PermissionChip
                    key={permission.key}
                    label={permission.label}
                    icon={permission.icon}
                    active={value === undefined ? true : Boolean(value)}
                    color={meta.color}
                  />
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    shadowColor: 'rgba(15, 23, 42, 0.9)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: 'rgba(148, 163, 184, 0.9)',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    marginVertical: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default WidgetPermissionSummary;

