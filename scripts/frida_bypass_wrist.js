/**
 * Nexora OmniWear — Standalone watchOS Wrist-Off Sensor Bypass Script (V-AP05)
 * Hooks Objective-C runtime method -[WristSensorManager isWristAttachedToBody]
 * and forces return value to 1 (true).
 *
 * Usage on Mac with watch simulator:
 *   frida -n NexoraWatch -l scripts/frida_bypass_wrist.js
 *
 * Usage on physical Apple Watch via USB/CoreDevice:
 *   frida -D <Watch-Device-ID> -n NexoraWatch -l scripts/frida_bypass_wrist.js
 */

console.log("==========================================================");
console.log("  NEXORA WATCHOS WRIST SENSOR INSTRUMENTATION HOOK (V-AP05)");
console.log("==========================================================");

if (ObjC.available) {
    var wristManager = ObjC.classes.WristSensorManager;
    if (wristManager) {
        var hookTarget = wristManager["- isWristAttachedToBody"];
        if (hookTarget) {
            Interceptor.attach(hookTarget.implementation, {
                onEnter: function(args) {
                    // Method signature: id self, SEL _cmd
                },
                onLeave: function(retval) {
                    var original = retval.toInt32();
                    console.log("[*] Intercepted -[WristSensorManager isWristAttachedToBody]");
                    console.log("    -> Original retval: " + original);
                    console.log("    -> Patching retval to 1 (FORCED ATTACHED / UNLOCKED) 🔥");
                    retval.replace(ptr(1));
                }
            });
            console.log("[✓] Successfully attached hook to -[WristSensorManager isWristAttachedToBody]!");
        } else {
            console.log("[-] Method -[WristSensorManager isWristAttachedToBody] not found.");
        }
    } else {
        console.log("[-] Class WristSensorManager not found in runtime.");
    }

    // Secondary hook: -[InsecureStorage verifyPin:]
    var storage = ObjC.classes.InsecureStorage;
    if (storage) {
        var pinTarget = storage["- verifyPin:"];
        if (pinTarget) {
            Interceptor.attach(pinTarget.implementation, {
                onEnter: function(args) {
                    var inputPin = ObjC.Object(args[2]);
                    console.log("[*] Intercepted -[InsecureStorage verifyPin:] with PIN: " + inputPin.toString());
                },
                onLeave: function(retval) {
                    console.log("    -> Swizzling verifyPin return value to 1 (PASS) 🔥");
                    retval.replace(ptr(1));
                }
            });
            console.log("[✓] Successfully attached hook to -[InsecureStorage verifyPin:]!");
        }
    }
} else {
    console.log("[-] Objective-C runtime is not available.");
}
