import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API Base URL (Default to localhost:5000 on iOS / Simulator, 10.0.2.2:5000 on Android emulator)
export let API_BASE = Platform.OS === 'ios' ? 'http://localhost:5000' : 'http://10.0.2.2:5000';

// Initialize from storage if user saved a custom backend host
AsyncStorage.getItem('custom_api_base').then((stored) => {
  if (stored) {
    API_BASE = stored;
  }
}).catch(() => {});

export const setApiBase = async (url: string) => {
  API_BASE = url;
  try {
    await AsyncStorage.setItem('custom_api_base', url);
  } catch {}
};

export const getApiBase = () => API_BASE;

// API Endpoints
export const ENDPOINTS = {
  login: '/login',
  register: '/register',
  checkBalance: (accountNumber: string) => `/check_balance/${accountNumber}`,
  transfer: '/transfer',
  transactions: (accountNumber: string) => `/transactions/${accountNumber}`,
  requestLoan: '/request_loan',
  virtualCards: {
    list: '/api/virtual-cards',
    create: '/api/virtual-cards/create',
    toggleFreeze: (cardId: number | string) => `/api/virtual-cards/${cardId}/toggle-freeze`,
    transactions: (cardId: number | string) => `/api/virtual-cards/${cardId}/transactions`,
    updateLimit: (cardId: number | string) => `/api/virtual-cards/${cardId}/update-limit`,
  },
  billPayments: {
    categories: '/api/bill-categories',
    billersByCategory: (categoryId: number | string) => `/api/billers/by-category/${categoryId}`,
    create: '/api/bill-payments/create',
    history: '/api/bill-payments/history',
  },
  admin: {
    users: '/sup3r_s3cr3t_admin',
    createAdmin: '/admin/create_admin',
    deleteAccount: (userId: number | string) => `/admin/delete_account/${userId}`,
    approveLoan: (loanId: number | string) => `/admin/approve_loan/${loanId}`,
    pendingLoans: '/api/bill-categories',
  },
  profile: {
    get: '/profile',
    update: '/profile/update',
  },
  resetPassword: {
    request: '/api/v2/forgot-password',
    reset: '/api/v2/reset-password',
  },
  wearable: {
    pair: '/api/wearable/pair',
    devices: '/api/wearable/devices',
    dispatch: '/api/wearable/dispatch',
    events: (deviceId: string) => `/api/wearable/events/${deviceId}`,
    resolveEvent: '/api/wearable/resolve-event',
    packets: '/api/wearable/packets',
  },
  compliance: '/api/compliance/report',
};

interface RequestOptions {
  method?: string;
  token?: string | null;
  body?: any;
  headers?: Record<string, string>;
}

export const apiRequest = async (
  endpoint: string, 
  options: RequestOptions = {}
): Promise<any> => {
  const { 
    method = 'GET', 
    token = null, 
    body = null,
    headers: customHeaders = {}
  } = options;

  try {
    const headers: Record<string, string> = {
      ...customHeaders,
    };

    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const requestOptions: RequestInit = {
      method,
      headers,
    };

    if (body) {
      requestOptions.body = body instanceof FormData 
        ? body 
        : JSON.stringify(body);
    }

    const currentBase = getApiBase();
    const response = await fetch(`${currentBase}${endpoint}`, requestOptions);
    const data = await response.json();
    
    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: { message: 'Network error or server unavailable' },
      error,
    };
  }
};

export const get = (endpoint: string, token: string | null = null, headers = {}) => {
  return apiRequest(endpoint, { method: 'GET', token, headers });
};

export const post = (endpoint: string, body: any = null, token: string | null = null, headers = {}) => {
  return apiRequest(endpoint, { method: 'POST', body, token, headers });
};

export const put = (endpoint: string, body: any = null, token: string | null = null, headers = {}) => {
  return apiRequest(endpoint, { method: 'PUT', body, token, headers });
};

export const del = (endpoint: string, token: string | null = null, headers = {}) => {
  return apiRequest(endpoint, { method: 'DELETE', token, headers });
};

// Wearable Companion Bridge Helpers
export const pairWearable = (pairingCode = '839-201', deviceName = 'Wear OS Watch', deviceType = 'WEAR_OS_WATCH') => {
  return post(ENDPOINTS.wearable.pair, {
    pairing_code: pairingCode,
    device_name: deviceName,
    device_type: deviceType,
  });
};

export const dispatchWearableEvent = (targetDeviceId: string, action: string, payload: any) => {
  return post(ENDPOINTS.wearable.dispatch, {
    target_device_id: targetDeviceId,
    action,
    payload,
  });
};

export const pollWearableEvents = (deviceId: string) => {
  return get(ENDPOINTS.wearable.events(deviceId));
};

export const resolveWearableEvent = (eventId: number, resolution: 'APPLIED' | 'REJECTED') => {
  return post(ENDPOINTS.wearable.resolveEvent, {
    event_id: eventId,
    resolution,
  });
};

export const getWearablePackets = () => {
  return get(ENDPOINTS.wearable.packets);
};

export const getComplianceReport = () => {
  return get(ENDPOINTS.compliance);
};
