import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BackgroundImage from './components/BackgroundImage';
import { AdminConfig } from '../src/services/ActionHandler';
import { apiFetch } from '../src/utils/api';

const ActionControlsScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AdminConfig>({
    email: {
      enabled: true,
      requireVerification: true,
      logInAudit: true,
      roles: { admin: true, office: true, technician: true, customer: false },
    },
    phone: {
      enabled: true,
      callEnabled: true,
      smsEnabled: true,
      whatsappEnabled: true,
      logInAudit: true,
      roles: { admin: true, office: true, technician: true, customer: false },
    },
    location: {
      enabled: true,
      currentLocationEnabled: true,
      distanceCalculationEnabled: true,
      roles: { admin: true, office: true, technician: true, customer: false },
    },
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      // TODO: Fetch from backend API
      // const response = await apiFetch<{ data: AdminConfig }>('/api/admin/action-config');
      // setConfig(response.data);
    } catch (err) {
      console.error('Failed to load config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (section: keyof AdminConfig, key: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [key]: value,
      },
    }));
  };

  const handleRoleToggle = (
    section: keyof AdminConfig,
    role: string,
    value: boolean
  ) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        roles: {
          ...(prev[section]?.roles || {}),
          [role]: value,
        },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Save to backend API
      // await apiFetch('/api/admin/action-config', {
      //   method: 'POST',
      //   body: { adminActions: config },
      // });
      Alert.alert('Success', 'Configuration saved successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const renderSection = (
    title: string,
    icon: string,
    color: string,
    section: keyof AdminConfig
  ) => {
    const sectionConfig = config[section] as any;
    if (!sectionConfig) return null;

    return (
      <View className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 mb-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: `${color}20` }}
            >
              <Ionicons name={icon as any} size={24} color={color} />
            </View>
            <Text className="text-white text-xl font-bold">{title}</Text>
          </View>
          <Switch
            value={sectionConfig.enabled !== false}
            onValueChange={(value) => handleToggle(section, 'enabled', value)}
            trackColor={{ false: '#767577', true: color }}
            thumbColor="#fff"
          />
        </View>

        {sectionConfig.enabled !== false && (
          <>
            {/* Toggles */}
            {section === 'email' && (
              <>
                <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-white/10">
                  <Text className="text-white/80">Require Email Verification</Text>
                  <Switch
                    value={sectionConfig.requireVerification !== false}
                    onValueChange={(value) => handleToggle(section, 'requireVerification', value)}
                    trackColor={{ false: '#767577', true: color }}
                  />
                </View>
                <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-white/10">
                  <Text className="text-white/80">Log All Emails</Text>
                  <Switch
                    value={sectionConfig.logInAudit !== false}
                    onValueChange={(value) => handleToggle(section, 'logInAudit', value)}
                    trackColor={{ false: '#767577', true: color }}
                  />
                </View>
              </>
            )}

            {section === 'phone' && (
              <>
                <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-white/10">
                  <Text className="text-white/80">Enable Calls</Text>
                  <Switch
                    value={sectionConfig.callEnabled !== false}
                    onValueChange={(value) => handleToggle(section, 'callEnabled', value)}
                    trackColor={{ false: '#767577', true: color }}
                  />
                </View>
                <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-white/10">
                  <Text className="text-white/80">Enable SMS</Text>
                  <Switch
                    value={sectionConfig.smsEnabled !== false}
                    onValueChange={(value) => handleToggle(section, 'smsEnabled', value)}
                    trackColor={{ false: '#767577', true: color }}
                  />
                </View>
                <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-white/10">
                  <Text className="text-white/80">Enable WhatsApp</Text>
                  <Switch
                    value={sectionConfig.whatsappEnabled !== false}
                    onValueChange={(value) => handleToggle(section, 'whatsappEnabled', value)}
                    trackColor={{ false: '#767577', true: color }}
                  />
                </View>
                <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-white/10">
                  <Text className="text-white/80">Log Communications</Text>
                  <Switch
                    value={sectionConfig.logInAudit !== false}
                    onValueChange={(value) => handleToggle(section, 'logInAudit', value)}
                    trackColor={{ false: '#767577', true: color }}
                  />
                </View>
              </>
            )}

            {section === 'location' && (
              <>
                <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-white/10">
                  <Text className="text-white/80">Current Location Detection</Text>
                  <Switch
                    value={sectionConfig.currentLocationEnabled !== false}
                    onValueChange={(value) => handleToggle(section, 'currentLocationEnabled', value)}
                    trackColor={{ false: '#767577', true: color }}
                  />
                </View>
                <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-white/10">
                  <Text className="text-white/80">Distance Calculation</Text>
                  <Switch
                    value={sectionConfig.distanceCalculationEnabled !== false}
                    onValueChange={(value) => handleToggle(section, 'distanceCalculationEnabled', value)}
                    trackColor={{ false: '#767577', true: color }}
                  />
                </View>
              </>
            )}

            {/* Role Permissions */}
            <Text className="text-white/60 text-sm font-semibold mb-3 mt-2">Role Permissions:</Text>
            {['admin', 'office', 'technician', 'customer'].map((role) => (
              <View
                key={role}
                className="flex-row justify-between items-center mb-3"
              >
                <Text className="text-white capitalize">{role}</Text>
                <Switch
                  value={sectionConfig.roles?.[role] !== false}
                  onValueChange={(value) => handleRoleToggle(section, role, value)}
                  trackColor={{ false: '#767577', true: color }}
                />
              </View>
            ))}
          </>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <BackgroundImage>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </BackgroundImage>
    );
  }

  return (
    <BackgroundImage>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-12 pb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold flex-1">Action Controls</Text>
        </View>

        <ScrollView className="flex-1 px-6">
          {renderSection('Email Actions', 'mail-outline', '#60A5FA', 'email')}
          {renderSection('Phone Actions', 'call-outline', '#10B981', 'phone')}
          {renderSection('Location/Maps', 'location-outline', '#FF9800', 'location')}

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            className="bg-blue-600 rounded-xl py-4 items-center flex-row justify-center mb-8"
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Save Configuration</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </BackgroundImage>
  );
};

export default ActionControlsScreen;

