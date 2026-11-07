#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SecurityCheck, NSObject)

RCT_EXTERN_METHOD(getRuntimeSecurityReport:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(toggleClientRootBypass:(BOOL)enable
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(bruteForcePin:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
