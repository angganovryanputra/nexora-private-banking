import SwiftUI

/// Loans screen for Apple watchOS — lists existing loans and submits a new loan
/// request to the backend (GET /loans/<acct>, POST /request_loan).
struct LoansView: View {
    @Binding var currentScreen: String

    @State private var loans: [[String: Any]] = []
    @State private var isLoading: Bool = true
    @State private var statusMessage: String = ""
    @State private var requestedAmount: Double = 50_000_000

    var body: some View {
        GeometryReader { geometry in
            let btnHeight = WatchTheme.buttonHeight(screenHeight: geometry.size.height)
            ScrollView {
                VStack(spacing: 5) {
                    HStack(spacing: 4) {
                        Image(systemName: "building.columns.fill")
                            .foregroundColor(WatchTheme.gold)
                            .font(.system(size: 10))
                        Text("Loans")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                        Spacer()
                    }

                    if isLoading {
                        ProgressView().padding(.top, 6)
                    } else if loans.isEmpty {
                        Text("No active loans")
                            .font(.system(size: 8))
                            .foregroundColor(WatchTheme.textMuted)
                            .padding(.top, 4)
                    } else {
                        ForEach(Array(loans.enumerated()), id: \.offset) { _, loan in
                            loanRow(loan)
                        }
                    }

                    Divider().background(WatchTheme.surfaceElevated)

                    // New loan request
                    Text("REQUEST LOAN")
                        .font(.system(size: 6.5, weight: .bold))
                        .foregroundColor(WatchTheme.textMuted)
                        .tracking(0.5)

                    Text(WatchTheme.formatRupiah(requestedAmount))
                        .font(.system(size: 13, weight: .heavy, design: .rounded))
                        .foregroundColor(WatchTheme.gold)

                    HStack(spacing: 4) {
                        ForEach([10_000_000.0, 50_000_000.0, 100_000_000.0], id: \.self) { amt in
                            Button(action: { requestedAmount = amt }) {
                                Text("\(Int(amt / 1_000_000))jt")
                                    .font(.system(size: 8, weight: .bold))
                                    .frame(maxWidth: .infinity, minHeight: 20)
                                    .background(requestedAmount == amt ? WatchTheme.gold.opacity(0.25) : WatchTheme.surfaceElevated)
                                    .foregroundColor(WatchTheme.emerald)
                                    .cornerRadius(10)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }

                    if !statusMessage.isEmpty {
                        Text(statusMessage)
                            .font(.system(size: 8, weight: .semibold))
                            .foregroundColor(WatchTheme.emerald)
                            .multilineTextAlignment(.center)
                    }

                    Button(action: submit) {
                        Text("Submit Request")
                            .font(.system(size: 9, weight: .bold))
                            .frame(maxWidth: .infinity, minHeight: btnHeight)
                            .background(WatchTheme.gold)
                            .foregroundColor(.black)
                            .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())

                    Button(action: { currentScreen = "balance" }) {
                        Text("Back").font(.system(size: 8)).foregroundColor(WatchTheme.textMuted)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                .padding(.horizontal, 4)
            }
        }
        .onAppear(perform: load)
    }

    @ViewBuilder
    private func loanRow(_ loan: [String: Any]) -> some View {
        let amount = (loan["amount"] as? Double) ?? 0
        let status = (loan["status"] as? String) ?? "pending"
        HStack {
            VStack(alignment: .leading, spacing: 1) {
                Text(WatchTheme.formatRupiah(amount))
                    .font(.system(size: 9, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                Text(status.capitalized)
                    .font(.system(size: 6.5, weight: .semibold))
                    .foregroundColor(status == "approved" ? WatchTheme.emerald : WatchTheme.gold)
            }
            Spacer()
            Image(systemName: status == "approved" ? "checkmark.seal.fill" : "clock.fill")
                .font(.system(size: 10))
                .foregroundColor(status == "approved" ? WatchTheme.emerald : WatchTheme.gold)
        }
        .padding(.vertical, 4)
        .padding(.horizontal, 6)
        .background(WatchTheme.surface)
        .cornerRadius(7)
    }

    private func load() {
        isLoading = true
        WatchNetworkManager.shared.fetchLoans { result in
            isLoading = false
            if case .success(let list) = result { loans = list }
        }
    }

    private func submit() {
        statusMessage = ""
        WatchNetworkManager.shared.requestLoan(amount: requestedAmount) { result in
            switch result {
            case .success(let json):
                statusMessage = (json["message"] as? String) ?? "Loan requested"
                load()
            case .failure(let error):
                statusMessage = error.localizedDescription
            }
        }
    }
}
