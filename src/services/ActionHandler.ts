import { CommunicationService } from './CommunicationService';
import { Linking, Alert, Platform } from 'react-native';

export interface ActionPayload {
  actionId: string;
  fieldName?: string;
  value: any;
  payload?: Record<string, any>;
  recordId?: string;
}

export interface AdminConfig {
  email?: {
    enabled?: boolean;
    requireVerification?: boolean;
    logInAudit?: boolean;
    roles?: Record<string, boolean>;
  };
  phone?: {
    enabled?: boolean;
    callEnabled?: boolean;
    smsEnabled?: boolean;
    whatsappEnabled?: boolean;
    logInAudit?: boolean;
    roles?: Record<string, boolean>;
  };
  location?: {
    enabled?: boolean;
    currentLocationEnabled?: boolean;
    distanceCalculationEnabled?: boolean;
    roles?: Record<string, boolean>;
  };
}

export class ActionHandler {
  /**
   * Handle field actions based on action type
   */
  static async handleFieldAction(
    action: ActionPayload,
    userRole: string = 'customer',
    adminConfig?: AdminConfig
  ) {
    // Default config if not provided (all enabled)
    const config: AdminConfig = adminConfig || {
      email: { enabled: true, roles: { admin: true, office: true, technician: true, customer: true } },
      phone: { enabled: true, callEnabled: true, smsEnabled: true, whatsappEnabled: true, roles: { admin: true, office: true, technician: true, customer: true } },
      location: { enabled: true, roles: { admin: true, office: true, technician: true, customer: true } },
    };

    // Check if action is enabled and user has permission
    if (!this.isActionEnabled(action.actionId, config)) {
      throw new Error('This action is currently disabled by admin');
    }

    if (!this.hasRolePermission(action.actionId, userRole, config)) {
      throw new Error('You do not have permission to perform this action');
    }

    // Route to specific action handler
    switch (action.actionId) {
      case 'send_mail':
        return await CommunicationService.sendEmail({
          recipient: action.value,
          subject: action.payload?.subject || '',
          body: action.payload?.body || '',
          recordId: action.recordId,
          templateId: action.payload?.templateId,
        });

      case 'call':
        // Open native dialer first
        const phoneNumber = String(action.value).replace(/\D/g, '');
        const telUrl = `tel:${phoneNumber}`;
        
        try {
          const canOpen = await Linking.canOpenURL(telUrl);
          if (canOpen) {
            await Linking.openURL(telUrl);
            // Note: Actual call duration tracking would require native modules
            // For now, we'll log when the modal is closed with notes
          }
        } catch (err) {
          Alert.alert('Error', 'Could not open phone dialer');
          throw err;
        }
        
        // Log call if notes are provided (called after call ends)
        if (action.payload?.notes !== undefined || action.payload?.duration !== undefined) {
          return await CommunicationService.logCall({
            phone: action.value,
            duration: action.payload?.duration || 0,
            notes: action.payload?.notes || '',
            outcome: action.payload?.outcome || 'completed',
            recordId: action.recordId,
          });
        }
        return { success: true, message: 'Call initiated' };

      case 'sms':
        const smsUrl = `sms:${String(action.value).replace(/\D/g, '')}`;
        try {
          const canOpen = await Linking.canOpenURL(smsUrl);
          if (canOpen) {
            await Linking.openURL(smsUrl);
            return { success: true, message: 'SMS app opened' };
          }
        } catch (err) {
          Alert.alert('Error', 'Could not open SMS');
        }
        
        // Optionally send via backend if configured
        if (action.payload?.message) {
          return await CommunicationService.sendSMS({
            phone: action.value,
            message: action.payload.message,
            recordId: action.recordId,
          });
        }
        return { success: true, message: 'SMS app opened' };

      case 'whatsapp':
        const whatsappPhone = String(action.value).replace(/\D/g, '');
        const whatsappUrl = `whatsapp://send?phone=${whatsappPhone}${action.payload?.message ? `&text=${encodeURIComponent(action.payload.message)}` : ''}`;
        
        try {
          const canOpen = await Linking.canOpenURL(whatsappUrl);
          if (canOpen) {
            await Linking.openURL(whatsappUrl);
            return { success: true, message: 'WhatsApp opened' };
          } else {
            Alert.alert('Error', 'WhatsApp is not installed');
            throw new Error('WhatsApp not installed');
          }
        } catch (err) {
          throw err;
        }

      case 'view_map':
        // Log location view
        if (action.payload?.coordinates) {
          await CommunicationService.logLocationView({
            address: action.value,
            coordinates: action.payload.coordinates,
            recordId: action.recordId,
          });
        }
        
        // Open map
        const mapUrl = action.payload?.coordinates
          ? Platform.OS === 'ios'
            ? `maps://maps.google.com/maps?daddr=${action.payload.coordinates.latitude},${action.payload.coordinates.longitude}`
            : `geo:${action.payload.coordinates.latitude},${action.payload.coordinates.longitude}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(action.value)}`;
        
        try {
          const canOpen = await Linking.canOpenURL(mapUrl);
          if (canOpen) {
            await Linking.openURL(mapUrl);
          } else {
            // Fallback to web
            await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(action.value)}`);
          }
          return { success: true, message: 'Map opened' };
        } catch (err) {
          Alert.alert('Error', 'Could not open map');
          throw err;
        }

      default:
        throw new Error(`Unknown action: ${action.actionId}`);
    }
  }

  /**
   * Check if action is enabled in admin config
   */
  static isActionEnabled(actionId: string, config: AdminConfig): boolean {
    const actionMap: Record<string, string> = {
      send_mail: 'email',
      call: 'phone',
      sms: 'phone',
      whatsapp: 'phone',
      view_map: 'location',
    };

    const section = actionMap[actionId];
    if (!section || !config[section as keyof AdminConfig]) return true; // Default enabled

    const sectionConfig = config[section as keyof AdminConfig] as any;
    
    switch (actionId) {
      case 'send_mail':
        return sectionConfig.enabled !== false;
      case 'call':
        return sectionConfig.enabled !== false && sectionConfig.callEnabled !== false;
      case 'sms':
        return sectionConfig.enabled !== false && sectionConfig.smsEnabled !== false;
      case 'whatsapp':
        return sectionConfig.enabled !== false && sectionConfig.whatsappEnabled !== false;
      case 'view_map':
        return sectionConfig.enabled !== false;
      default:
        return true;
    }
  }

  /**
   * Check if user role has permission for action
   */
  static hasRolePermission(actionId: string, userRole: string, config: AdminConfig): boolean {
    const actionMap: Record<string, string> = {
      send_mail: 'email',
      call: 'phone',
      sms: 'phone',
      whatsapp: 'phone',
      view_map: 'location',
    };

    const section = actionMap[actionId];
    if (!section || !config[section as keyof AdminConfig]) return true; // Default allowed

    const sectionConfig = config[section as keyof AdminConfig] as any;
    return sectionConfig.roles?.[userRole] !== false; // Default allowed if not explicitly denied
  }
}

