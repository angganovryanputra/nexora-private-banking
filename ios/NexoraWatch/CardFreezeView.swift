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
        ("NX-VIRT-4401", "Nexora Platinum Visa", "Limit: Rp 50.000.000", "VISA"),
        ("NX-VIRT-9812", "Nexora World Elite", "Limit: Rp 250.000.000", "MC WORLD")
    ]
    
    public init(currentScreen: Binding<String>) {
        self._currentScreen = currentScreen
    }
    
    public var body: some View {
        GeometryReader { geometry in
            let isSmallWatch = geometry.size.height < 210
            let btnHeight = WatchTheme.buttonHeight(screenHeight: geometry.size.height)
            let card = cards[selectedCardIndex]
            
            ScrollView {
                VStack(spacing: 5) {
                    // Header Bar
                    HStack {
                        Button(action: {
                            WatchTheme.playHaptic(.click)
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
                    
                    // Luxury Virtual Card Frame (Obsidian & Emerald Metallic Gradient)
                    VStack(alignment: .leading, spacing: 3) {
                        // Top row: EMV Chip & Contactless Wave + Status Badge
                        HStack(spacing: 4) {
                            // EMV Chip Icon
                            ZStack {
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(LinearGradient(
                                        colors: [WatchTheme.gold, Color(red: 217/255, green: 119/255, blue: 6/255)],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ))
                                    .frame(width: 14, height: 10)
                                Image(systemName: "cpu")
                                    .font(.system(size: 6))
                                    .foregroundColor(.black)
                            }
                            
                            Image(systemName: "wave.3.right")
                                .font(.system(size: 7))
                                .foregroundColor(WatchTheme.gold.opacity(0.85))
                            
                            Spacer()
                            
                            Text(isFrozen ? "FROZEN" : "ACTIVE")
                                .font(.system(size: 6.5, weight: .heavy))
                                .foregroundColor(isFrozen ? WatchTheme.ruby : WatchTheme.emerald)
                                .padding(.horizontal, 4)
                                .padding(.vertical, 1)
                                .background((isFrozen ? WatchTheme.ruby : WatchTheme.emerald).opacity(0.2))
                                .cornerRadius(4)
                        }
                        
                        // Middle: Virtual Card Identifier
                        Text(card.0)
                            .font(.system(size: isSmallWatch ? 8.5 : 10, weight: .bold, design: .monospaced))
                            .foregroundColor(.white)
                            .tracking(1)
                            .padding(.top, 1)
                        
                        // Bottom: Tier Name, Brand Badge, and Limit
                        HStack {
                            VStack(alignment: .leading, spacing: 1) {
                                Text(card.1)
                                    .font(.system(size: 7, weight: .semibold))
                                    .foregroundColor(WatchTheme.textLight)
                                Text(card.2)
                                    .font(.system(size: 6))
                                    .foregroundColor(WatchTheme.textMuted)
                            }
                            Spacer()
                            Text(card.3)
                                .font(.system(size: 6.5, weight: .black, design: .rounded))
                                .foregroundColor(WatchTheme.gold)
                                .padding(.horizontal, 3)
                                .padding(.vertical, 1)
                                .background(WatchTheme.surfaceElevated)
                                .cornerRadius(3)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(6)
                    .background(
                        LinearGradient(
                            colors: isFrozen ?
                                [Color(red: 45/255, green: 15/255, blue: 18/255), Color(red: 22/255, green: 10/255, blue: 12/255)] :
                                [Color(red: 12/255, green: 25/255, blue: 22/255), Color(red: 18/255, green: 38/255, blue: 42/255)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(
                                LinearGradient(
                                    colors: isFrozen ?
                                        [WatchTheme.ruby, WatchTheme.ruby.opacity(0.35)] :
                                        [WatchTheme.emerald, WatchTheme.gold.opacity(0.5)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1.2
                            )
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
                        WatchTheme.playHaptic(.click)
                        withAnimation(.easeInOut(duration: 0.2)) {
                            selectedCardIndex = (selectedCardIndex + 1) % cards.count
                            isFrozen = InsecureStorage.shared.isCardFrozen(cardId: selectedCardIndex + 1)
                        }
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
            isFrozen = InsecureStorage.shared.isCardFrozen(cardId: selectedCardIndex + 1)
        }
    }
    
    private func toggleCardFreezeState() {
        let newStatus = !isFrozen
        isProcessing = true
        statusMessage = "Updating card status in Core..."
        WatchTheme.playHaptic(.notification)
        withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
            isFrozen = newStatus
        }
        
        WatchNetworkManager.shared.toggleCardFreeze(cardId: selectedCardIndex + 1, frozen: newStatus) { result in
            DispatchQueue.main.async {
                self.isProcessing = false
                switch result {
                case .success(let data):
                    InsecureStorage.shared.setCardFrozen(newStatus, cardId: self.selectedCardIndex + 1)
                    let s = data["status"] as? String ?? (newStatus ? "FROZEN" : "ACTIVE")
                    self.statusMessage = "Core: Card \(self.cards[self.selectedCardIndex].0) is \(s) ✓"
                case .failure:
                    // Offline fallback
                    InsecureStorage.shared.setCardFrozen(newStatus, cardId: self.selectedCardIndex + 1)
                    self.statusMessage = "Offline status: \(newStatus ? "FROZEN" : "ACTIVE")"
                }
            }
        }
    }
    
    private func simulateDesyncExploit() {
        WatchTheme.playHaptic(.warning)
        // [Skenario 9 Desync POC]: Mark frozen only on wrist without calling backend API
        withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
            isFrozen = true
        }
        InsecureStorage.shared.setCardFrozen(true, cardId: selectedCardIndex + 1)
        statusMessage = "[V-W09 EXPLOIT] Local wrist FROZEN, but backend card is still ACTIVE!"
    }
}
