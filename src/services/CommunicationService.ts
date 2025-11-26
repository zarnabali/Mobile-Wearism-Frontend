import { API_BASE_URL } from '../utils/api';

export interface EmailCommunication {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: 'sent' | 'failed' | 'pending';
  timestamp: string;
  error?: string;
}

export interface CallCommunication {
  id: string;
  phone: string;
  duration: number; // seconds
  notes?: string;
  timestamp: string;
  type: 'call' | 'sms' | 'whatsapp';
}

export interface LocationView {
  id: string;
  address: string;
  latitude?: number;
  longitude?: number;
  distance?: number; // in km
  timestamp: string;
}

class CommunicationService {
  // Email Methods
  async sendEmail(params: {
    to: string;
    subject: string;
    body: string;
    entityType: string;
    entityId: string;
  }): Promise<EmailCommunication> {
    const response = await fetch(`${API_BASE_URL}/api/communications/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return response.json();
  }

  async getEmailHistory(recordId: string): Promise<EmailCommunication[]> {
    const response = await fetch(`${API_BASE_URL}/api/communications/emails/${recordId}`);
    
    if (!response.ok) {
      return []; // Return empty array if no history
    }

    return response.json();
  }

  // Phone Methods
  async logCall(params: {
    phone: string;
    duration: number;
    notes?: string;
    entityType: string;
    entityId: string;
  }): Promise<CallCommunication> {
    const response = await fetch(`${API_BASE_URL}/api/communications/calls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to log call');
    }

    return response.json();
  }

  async logSMS(params: {
    phone: string;
    message: string;
    entityType: string;
    entityId: string;
  }): Promise<CallCommunication> {
    const response = await fetch(`${API_BASE_URL}/api/communications/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...params, type: 'sms' }),
    });

    if (!response.ok) {
      throw new Error('Failed to log SMS');
    }

    return response.json();
  }

  async getCallHistory(recordId: string): Promise<CallCommunication[]> {
    const response = await fetch(`${API_BASE_URL}/api/communications/calls/${recordId}`);
    
    if (!response.ok) {
      return []; // Return empty array if no history
    }

    return response.json();
  }

  // Location Methods
  async logLocationView(params: {
    address: string;
    userLatitude?: number;
    userLongitude?: number;
    distance?: number;
    entityType: string;
    entityId: string;
  }): Promise<LocationView> {
    const response = await fetch(`${API_BASE_URL}/api/communications/location-views`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to log location view');
    }

    return response.json();
  }

  async getLocationHistory(recordId: string): Promise<LocationView[]> {
    const response = await fetch(`${API_BASE_URL}/api/communications/location-views/${recordId}`);
    
    if (!response.ok) {
      return []; // Return empty array if no history
    }

    return response.json();
  }
}

export const communicationService = new CommunicationService();
