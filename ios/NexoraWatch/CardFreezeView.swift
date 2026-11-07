import SwiftUI

/// [Skenario 9 & 16] Emergency Wrist Card Freeze / Kill-Switch for Apple watchOS
/// Features:
/// - Instant 1-tap card lock/freeze directly from the user's wrist.
/// - Demonstrates Skenario 9: Wrist Kill-Switch Desynchronization Flaw (CWE-306).
public struct CardFreezeView: View {
    @Binding var currentScreen: String
    
    @State private var isFrozen: Bool = InsecureStorage.shared.isCardFrozen()
    @State private var selectedCardIndex: Int = 0
    @State private var statusMessage: String = "Tap to toggle emergency card kill-switch"
    @State private var isProcessing: Bool = false
    
    let cards = [
        ("NX-VIRT-4401", "Nexora Platinum Visa", "Limit: Rp 50.000.000"),
        ("NX-VIRT-9812", "Nexora World Elite", "Limit: Rp 250.000.000")
    ]
    
    public init(currentScreen: Binding<String>) {
        self._currentScreen = currentScreen
    }
    
    public var body: some View {
        GeometryReader { geometry in
            let isSmallWatch = geometry.size.height < 210
            let btnHeight = WatchTheme.buttonHeight(screenHeight: geometry.size.height)
            
            ScrollView {
                VStack(spacing: 5) {
                    // Header Bar
                    HStack {
                        Button(action: {
                            currentScreen = "balance"
                        }) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(WatchTheme.gold)
                                .frame(width: 22, height: 22)
                                .background(WatchTheme.surface)
                                .clipShape(Circle())
                        }
                        .buttonStyle(PlainButtonStyle())
                        
                        Spacer()
                        Text("Card Kill-Switch")
                            .font(.system(size: WatchTheme.scaledFont(10, geometry.size), weight: .bold))
                            .foregroundColor(.white)
                        Spacer()
                    }
                    
                    // Card Preview Badge
                    VStack(alignment: .leading, spacing: 2) {
                        HStack {
                            Image(systemName: "creditcard.fill")
                                .font(.system(size: 10))
                                .foregroundColor(isFrozen ? WatchTheme.ruby : WatchTheme.gold)
                            Text(cards[selectedCardIndex].0)
                                .font(.system(size: 8, weight: .bold, design: .monospaced))
                                .foregroundColor(.white)
                            Spacer()
                            Text(isFrozen ? "FROZEN" : "ACTIVE")
                                .font(.system(size: 7, weight: .heavy))
                                .foregroundColor(isFrozen ? WatchTheme.ruby : WatchTheme.emerald)
                                .padding(.horizontal, 4)
                                .padding(.vertical, 1)
                                .background((isFrozen ? WatchTheme.ruby : WatchTheme.emerald).opacity(0.2))
                                .cornerRadius(4)
                        }
                        
                        Text(cards[selectedCardIndex].1)
                            .font(.system(size: 7.5, weight: .medium))
                            .foregroundColor(WatchTheme.textLight)
                        
                        Text(cards[selectedCardIndex].2)
                            .font(.system(size: 6.5))
                            .foregroundColor(WatchTheme.textMuted)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(5)
                    .background(WatchTheme.surface)
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(isFrozen ? WatchTheme.ruby : WatchTheme.surfaceElevated, lineWidth: 1)
                    )
                    
                    // Status Output Line
                    Text(statusMessage)
                        .font(.system(size: 6.5, design: .monospaced))
                        .foregroundColor(WatchTheme.textLight)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 2)
                    
                    // Toggle Card Freeze Button
                    Button(action: {
                        toggleCardFreezeState()
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: isFrozen ? "lock.open.fill" : "lock.fill")
                                .font(.system(size: 9))
                            Text(isFrozen ? "UNFREEZE CARD" : "EMERGENCY FREEZE")
                                .font(.system(size: 8, weight: .heavy))
                        }
                        .frame(maxWidth: .infinity, minHeight: btnHeight)
                        .background(isFrozen ? WatchTheme.emerald : WatchTheme.ruby)
                        .foregroundColor(.black)
                        .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                    .disabled(isProcessing)
                    
                    // Card Selector (Toggle Between Card 1 and Card 2)
                    Button(action: {
                        selectedCardIndex = (selectedCardIndex + 1) % cards.count
                        statusMessage = "Switched to \(cards[selectedCardIndex].0)"
                    }) {
                        HStack(spacing: 3) {
                            Image(systemName: "rectangle.2.swap")
                                .font(.system(size: 8))
                            Text("Switch Card (\(selectedCardIndex + 1)/\(cards.count))")
                                .font(.system(size: 7.5))
                        }
                        .frame(maxWidth: .infinity, minHeight: isSmallWatch ? 20 : 22)
                        .background(WatchTheme.surfaceElevated)
                        .foregroundColor(WatchTheme.gold)
                        .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    // Exploit Trigger: Skenario 9 (Wrist Kill-Switch Desync)
                    Button(action: {
                        simulateDesyncExploit()
                    }) {
                        HStack(spacing: 3) {
                            Image(systemName: "exclamationmark.shield.fill")
                                .font(.system(size: 8))
                            Text("Exploit: Desync Kill-Switch")
                                .font(.system(size: 7.5, weight: .bold))
                        }
                        .frame(maxWidth: .infinity, minHeight: isSmallWatch ? 20 : 22)
                        .background(WatchTheme.ruby.opacity(0.15))
                        .foregroundColor(WatchTheme.ruby)
                        .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                .padding(.horizontal, 4)
            }
        }
        .onAppear {
            isFrozen = InsecureStorage.shared.isCardFrozen()
        }
    }
    
    private func toggleCardFreezeState() {
        let newStatus = !isFrozen
        isProcessing = true
        statusMessage = "Updating card status in Core..."
        
        WatchNetworkManager.shared.toggleCardFreeze(cardId: selectedCardIndex + 1, frozen: newStatus) { result in
            isProcessing = false
            switch result {
            case .success(let data):
                isFrozen = newStatus
                InsecureStorage.shared.setCardFrozen(newStatus)
                let s = data["status"] as? String ?? (newStatus ? "FROZEN" : "ACTIVE")
                statusMessage = "Core: Card \(cards[selectedCardIndex].0) is \(s) ✓"
            case .failure:
                // Offline fallback
                isFrozen = newStatus
                InsecureStorage.shared.setCardFrozen(newStatus)
                statusMessage = "Offline status: \(newStatus ? "FROZEN" : "ACTIVE")"
            }
        }
    }
    
    private func simulateDesyncExploit() {
        // [Skenario 9 Desync POC]: Mark frozen only on wrist without calling backend API
        isFrozen = true
        InsecureStorage.shared.setCardFrozen(true)
        statusMessage = "[V-W09 EXPLOIT] Local wrist FROZEN, but backend card is still ACTIVE!"
    }
}

