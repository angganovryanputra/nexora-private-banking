#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PinnedNetwork, NSObject)

RCT_EXTERN_METHOD(testPinnedRequest:(NSString *)urlString
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
