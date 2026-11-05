import SwiftUI

@main
struct NexoraWatchApp: App {
    @WKApplicationDelegateAdaptor(ExtensionDelegate.self) var delegate

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

class ExtensionDelegate: NSObject, WKApplicationDelegate {
    func applicationDidFinishLaunching() {
        // Initialize WatchConnectivity session on launch
        _ = WatchSessionManager.shared
        _ = WristSensorManager.shared
    }
}

