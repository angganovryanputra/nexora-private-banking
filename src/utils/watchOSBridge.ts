import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { WatchBridge } = NativeModules;

export interface WatchMessagePayload {
  action: string;
  payload?: any;
  [key: string]: any;
}

class WatchOSBridgeService {
  private eventEmitter: NativeEventEmitter | null = null;
  private isIOS: boolean = Platform.OS === 'ios';

  constructor() {
    if (this.isIOS && WatchBridge) {
      this.eventEmitter = new NativeEventEmitter(WatchBridge);
    }
  }

  public async isWatchSupported(): Promise<boolean> {
    if (!this.isIOS || !WatchBridge) return false;
    try {
      return await WatchBridge.isWatchSupported();
    } catch {
      return false;
    }
  }

  public async isWatchPaired(): Promise<boolean> {
    if (!this.isIOS || !WatchBridge) return false;
    try {
      return await WatchBridge.isWatchPaired();
    } catch {
      return false;
    }
  }

  public async sendMessageToWatch(message: WatchMessagePayload): Promise<any> {
    if (this.isIOS && WatchBridge) {
      return await WatchBridge.sendMessageToWatch(message);
    }
    // Fallback simulation for non-iOS or test environment
    return { status: 'SIMULATED_LOCAL', device: 'WatchOS Mock' };
  }

  public async updateWatchContext(context: Record<string, any>): Promise<any> {
    if (this.isIOS && WatchBridge) {
      return await WatchBridge.updateWatchContext(context);
    }
    return { status: 'SIMULATED_CONTEXT_UPDATED' };
  }

  public addMessageListener(listener: (data: any) => void) {
    if (this.eventEmitter) {
      return this.eventEmitter.addListener('WatchMessageReceived', listener);
    }
    return { remove: () => {} };
  }
}

export const watchOSBridge = new WatchOSBridgeService();
export default watchOSBridge;
