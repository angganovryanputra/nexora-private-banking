import SwiftUI

/// Wire-transfer screen for Apple watchOS — posts a real `/transfer` to the Flask
/// backend (same ledger as the phone/Wear OS app). The server performs no
/// positive-amount validation (negative-amount logic flaw is intentional).
struct TransferView: View {
    @Binding var currentScreen: String

    @State private var recipient: String = "NX-7391048"
    @State private var amountText: String = ""
    @State private var statusMessage: String = ""
    @State private var isSending: Bool = false
    @State private var didSucceed: Bool = false

    private let presetRecipients = ["NX-7391048", "NX-9201482", "NX-5182930", "NX-6302914"]

    var body: some View {
        GeometryReader { geometry in
            let btnHeight = WatchTheme.buttonHeight(screenHeight: geometry.size.height)

            ScrollView {
                VStack(spacing: 6) {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.up.right.circle.fill")
                            .foregroundColor(WatchTheme.gold)
                            .font(.system(size: 11))
                        Text("Transfer")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                        Spacer()
                    }

                    // Recipient picker
                    VStack(alignment: .leading, spacing: 2) {
                        Text("TO ACCOUNT")
                            .font(.system(size: 6.5, weight: .bold))
                            .foregroundColor(WatchTheme.textMuted)
                            .tracking(0.5)
                        Picker("Recipient", selection: $recipient) {
                            ForEach(presetRecipients, id: \.self) { acct in
                                Text(acct).font(.system(size: 10, design: .monospaced)).tag(acct)
                            }
                        }
                        .frame(height: 34)
                    }
                    .padding(.horizontal, 6)
                    .padding(.vertical, 4)
                    .background(WatchTheme.surface)
                    .cornerRadius(8)

                    // Amount entry
                    VStack(alignment: .leading, spacing: 2) {
                        Text("AMOUNT (IDR)")
                            .font(.system(size: 6.5, weight: .bold))
                            .foregroundColor(WatchTheme.textMuted)
                            .tracking(0.5)
                        TextField("0", text: $amountText)
                            .font(.system(size: 15, weight: .heavy, design: .rounded))
                            .foregroundColor(WatchTheme.gold)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.horizontal, 6)
                    .padding(.vertical, 4)
                    .background(WatchTheme.surface)
                    .cornerRadius(8)

                    // Quick amount chips
                    HStack(spacing: 4) {
                        ForEach([100_000.0, 1_000_000.0, 5_500_000.0], id: \.self) { amt in
                            Button(action: { amountText = String(Int(amt)) }) {
                                Text(shortIDR(amt))
                                    .font(.system(size: 8, weight: .bold))
                                    .frame(maxWidth: .infinity, minHeight: 20)
                                    .background(WatchTheme.surfaceElevated)
                                    .foregroundColor(WatchTheme.emerald)
                                    .cornerRadius(10)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }

                    if !statusMessage.isEmpty {
                        Text(statusMessage)
                            .font(.system(size: 8, weight: .semibold))
                            .foregroundColor(didSucceed ? WatchTheme.emerald : WatchTheme.ruby)
                            .multilineTextAlignment(.center)
                    }

                    // Send
                    Button(action: send) {
                        HStack(spacing: 4) {
                            if isSending {
                                ProgressView().scaleEffect(0.6)
                            } else {
                                Image(systemName: "paperplane.fill").font(.system(size: 9))
                            }
                            Text(isSending ? "Sending…" : "Send Transfer")
                                .font(.system(size: 9, weight: .bold))
                        }
                        .frame(maxWidth: .infinity, minHeight: btnHeight)
                        .background(WatchTheme.gold)
                        .foregroundColor(.black)
                        .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                    .disabled(isSending)

                    Button(action: { currentScreen = "balance" }) {
                        Text("Back")
                            .font(.system(size: 8))
                            .foregroundColor(WatchTheme.textMuted)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                .padding(.horizontal, 4)
            }
        }
    }

    private func send() {
        guard let amount = Double(amountText), !recipient.isEmpty else {
            statusMessage = "Enter a valid amount"
            didSucceed = false
            return
        }
        isSending = true
        statusMessage = ""
        WatchNetworkManager.shared.transfer(toAccount: recipient, amount: amount, note: "Apple Watch transfer") { result in
            isSending = false
            switch result {
            case .success(let json):
                didSucceed = (json["status"] as? String) == "success"
                statusMessage = (json["message"] as? String) ?? "Transfer complete"
            case .failure(let error):
                didSucceed = false
                statusMessage = error.localizedDescription
            }
        }
    }

    private func shortIDR(_ value: Double) -> String {
        if value >= 1_000_000 { return "\(Int(value / 1_000_000))jt" }
        if value >= 1_000 { return "\(Int(value / 1_000))rb" }
        return "\(Int(value))"
    }
}
