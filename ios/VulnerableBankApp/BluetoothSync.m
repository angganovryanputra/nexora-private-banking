#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(BluetoothSync, NSObject)

RCT_EXTERN_METHOD(simulatePhoneBeacon:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getLastSyncData:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

