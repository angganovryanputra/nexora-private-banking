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

/**
 * Health-check the backend relay. Used by the Pentest Lab "Test Connection"
 * button and the Companion screen so researchers can confirm/fix the target URL
 * instead of only seeing a generic "backend unreachable" popup.
 */
export const pingBackend = async (
  base?: string,
  timeoutMs = 4000,
): Promise<{ ok: boolean; status: number; base: string; message: string }> => {
  const target = (base || getApiBase()).replace(/\/+$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${target}/api/compliance/report`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return {
      ok: res.ok,
      status: res.status,
      base: target,
      message: res.ok ? 'Backend reachable ✓' : `Reached host but got HTTP ${res.status}`,
    };
  } catch (e: any) {
    clearTimeout(timer);
    const aborted = e?.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      base: target,
      message: aborted
        ? 'Timeout — no response from host'
        : 'Unreachable — check the IP/port and that python backend/server.py is running',
    };
  }
};

// API Endpoints
export const ENDPOINTS = {
  login: '/login',
  register: '/register',
  checkBalance: (accountNumber: string) => `/check_balance/${accountNumber}`,
  transfer: '/transfer',
  transactions: (accountNumber: string) => `/transactions/${accountNumber}`,
  requestLoan: '/request_loan',
  loans: (accountNumber: string) => `/loans/${accountNumber}`,
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
    pendingLoans: '/admin/pending_loans',
  },
  qris: {
    checkout: '/api/qris/checkout',
  },
  atm: {
    generateCashToken: '/api/atm/cardless-cash/generate',
    verifyCashToken: '/api/atm/cardless-cash/verify',
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
    cardFreeze: '/api/wearable/card-freeze',
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

export const generateCardlessCash = (accountNumber = 'NX-8492014', amount = 100000.0) => {
  return post(ENDPOINTS.atm.generateCashToken, {
    account_number: accountNumber,
    amount,
  });
};

export const verifyCardlessCash = (token: string) => {
  return post(ENDPOINTS.atm.verifyCashToken, { token });
};

export const triggerWearableCardFreeze = (cardId = 1, isFrozen = 1) => {
  return post(ENDPOINTS.wearable.cardFreeze, {
    card_id: cardId,
    is_frozen: isFrozen,
  });
};
