import { WalletUi } from "./_reference/WalletUi";

const referenceActivities = [
  { id: "license-order", title: "License order", kindLabel: "License", amountLabel: "$50.00", status: "paid", dateLabel: "10/6/2026, 9:54:26 AM", tone: "neutral" as const },
  { id: "license-activated", title: "License activated", kindLabel: "License", amountLabel: "$50.00", status: "completed", dateLabel: "10/6/2026, 9:54:26 AM", tone: "neutral" as const },
  { id: "balance-credited", title: "Balance credited", kindLabel: "Deposit", amountLabel: "+$100.00", status: "completed", dateLabel: "10/6/2026, 9:54:26 AM", tone: "positive" as const },
  { id: "deposit-order", title: "Deposit order", kindLabel: "Deposit", amountLabel: "$100.00", status: "expired", dateLabel: "10/5/2026, 2:20:46 PM", tone: "neutral" as const },
  { id: "withdrawal-fee", title: "Platform withdrawal fee", kindLabel: "Withdrawal Fee", amountLabel: "$150.00", status: "expired", dateLabel: "10/3/2026, 11:13:53 PM", tone: "neutral" as const },
];

export function ReferenceMatch() {
  return (
    <WalletUi
      balanceLabel="$1,307.46"
      activities={referenceActivities}
      withdrawalNetworks={["TRC20", "ERC20", "BSC"]}
    />
  );
}
