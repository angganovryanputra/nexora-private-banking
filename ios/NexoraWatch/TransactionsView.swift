import SwiftUI

/// Transaction history for Apple watchOS — pulls the real ledger from
/// GET /transactions/<acct> (BOLA/IDOR: any account number is accepted).
struct TransactionsView: View {
    @Binding var currentScreen: String

    @State private var transactions: [[String: Any]] = []
    @State private var isLoading: Bool = true
    @State private var errorMessage: String = ""

    private var myAccount: String { InsecureStorage.shared.getAccountNumber() }

    var body: some View {
        ScrollView {
            VStack(spacing: 5) {
                HStack(spacing: 4) {
                    Image(systemName: "list.bullet.rectangle.portrait.fill")
                        .foregroundColor(WatchTheme.gold)
                        .font(.system(size: 10))
                    Text("History")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                    Spacer()
                    Button(action: load) {
                        Image(systemName: "arrow.clockwise")
                            .font(.system(size: 9))
                            .foregroundColor(WatchTheme.gold)
                    }
                    .buttonStyle(PlainButtonStyle())
                }

                if isLoading {
                    ProgressView().padding(.top, 8)
                } else if !errorMessage.isEmpty {
                    Text(errorMessage)
                        .font(.system(size: 8))
                        .foregroundColor(WatchTheme.ruby)
                        .multilineTextAlignment(.center)
                } else if transactions.isEmpty {
                    Text("No transactions yet")
                        .font(.system(size: 8))
                        .foregroundColor(WatchTheme.textMuted)
                        .padding(.top, 8)
                } else {
                    ForEach(Array(transactions.enumerated()), id: \.offset) { _, tx in
                        row(tx)
                    }
                }

                Button(action: { currentScreen = "balance" }) {
                    Text("Back")
                        .font(.system(size: 8))
                        .foregroundColor(WatchTheme.textMuted)
                        .padding(.top, 2)
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding(.horizontal, 4)
        }
        .onAppear(perform: load)
    }

    @ViewBuilder
    private func row(_ tx: [String: Any]) -> some View {
        let amount = (tx["amount"] as? Double) ?? 0
        let from = (tx["from_account"] as? String) ?? "?"
        let to = (tx["to_account"] as? String) ?? "?"
        let desc = (tx["description"] as? String) ?? ""
        let isDebit = from == myAccount
        let tint = isDebit ? WatchTheme.ruby : WatchTheme.emerald

        HStack(spacing: 6) {
            Image(systemName: isDebit ? "arrow.up.right" : "arrow.down.left")
                .font(.system(size: 9, weight: .bold))
                .foregroundColor(tint)
            VStack(alignment: .leading, spacing: 1) {
                Text(desc.isEmpty ? (isDebit ? "To \(to)" : "From \(from)") : desc)
                    .font(.system(size: 8, weight: .semibold))
                    .foregroundColor(.white)
                    .lineLimit(1)
                Text(isDebit ? to : from)
                    .font(.system(size: 6.5, design: .monospaced))
                    .foregroundColor(WatchTheme.textMuted)
            }
            Spacer()
            Text("\(isDebit ? "-" : "+")\(WatchTheme.formatRupiah(abs(amount)))")
                .font(.system(size: 8, weight: .heavy, design: .rounded))
                .foregroundColor(tint)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .padding(.vertical, 4)
        .padding(.horizontal, 6)
        .background(WatchTheme.surface)
        .cornerRadius(7)
    }

    private func load() {
        isLoading = true
        errorMessage = ""
        WatchNetworkManager.shared.fetchTransactions { result in
            isLoading = false
            switch result {
            case .success(let list): transactions = list
            case .failure(let error): errorMessage = error.localizedDescription
            }
        }
    }
}
