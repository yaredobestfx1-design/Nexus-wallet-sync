import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  BinanceNotification,
  type BinanceNotificationData,
} from "@/components/wallet/BinanceNotification";
import {
  WalletUi,
  type WalletActivity,
  type WithdrawalDraft,
  type WithdrawalView,
} from "@/components/wallet/nexus/WalletUi";
import { addWithdraw, setBalance, useWallet, type Transaction } from "@/lib/wallet-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexus" },
      { name: "description", content: "Manage your balance, deposits, withdrawals and activity." },
      { property: "og:title", content: "Nexus" },
      { property: "og:description", content: "Manage your balance, deposits, withdrawals and activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WalletPage,
});

function fmtTime(ms: number) {
  return new Date(ms).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function WalletPage() {
  const state = useWallet();
  const [notifs, setNotifs] = useState<BinanceNotificationData[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const dismissNotif = useCallback((id: string) => {
    setNotifs((list) => list.filter((n) => n.id !== id));
  }, []);

  const pushNotif = useCallback((n: BinanceNotificationData) => {
    setNotifs((list) => [...list, n]);
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, []);


  function triggerNotifications(tx: Transaction) {
    if (tx.kind === "deposit" && tx.status !== "approved") return;
    if (tx.kind === "withdraw" && tx.status !== "approved") return;

    const isDeposit = tx.kind === "deposit";
    const amountLabel = `${tx.amount.toLocaleString()} USDT`;
    const transactionStamp = fmtTime(tx.createdAt);

    // Exchange-style push notification after 10s.
    const t1 = setTimeout(() => {
      const stamp = transactionStamp;
      pushNotif({
        id: `${tx.id}-ex`,
        variant: "exchange",
        title: "USDT Deposit Successful",
        body: isDeposit
          ? "Your USDT deposit has been credited to your account."
          : "Your USDT deposit has been credited to your account.",
        time: stamp,
      });
    }, 10000);

    // Email-style push notification 2s after the exchange one
    const t2 = setTimeout(() => {
      const stamp = transactionStamp;
      pushNotif({
        id: `${tx.id}-mail`,
        variant: "email",
        title: "Gmail",
        subtitle: tx.email,
        body: isDeposit
          ? `[Binance] USDT Deposit Confirmed — ${stamp} — ${amountLabel}`
          : `[Binance] USDT Deposit Confirmed — ${stamp} — ${amountLabel}`,
        time: stamp,
      });
    }, 18500);

    timersRef.current.push(t1, t2);
  }


  const [withdrawalView, setWithdrawalView] = useState<WithdrawalView>({ step: "form" });

  const fmtUsd = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const activities: WalletActivity[] = state.transactions
    .filter((t) => t.status !== "pending")
    .map((t) => ({
      id: t.id,
      title: `USDT · ${t.network}`,
      kindLabel: t.kind === "deposit" ? "Deposit" : "Withdrawal",
      amountLabel: `${t.kind === "deposit" ? "+" : "−"}${fmtUsd(t.amount)}`,
      status: t.status === "approved" ? "Completed" : "Rejected",
      dateLabel: new Date(t.createdAt).toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      }),
      tone: t.kind === "deposit" ? "positive" : "negative",
    }));

  function handleReview(draft: WithdrawalDraft) {
    const amt = Number(draft.amount);
    let err: string | undefined;
    if (draft.address.trim().length < 10) err = "Enter a valid wallet address";
    else if (!(amt > 0)) err = "Enter a valid amount";
    else if (amt > state.balance) err = `Insufficient Balance · Available ${fmtUsd(state.balance)}`;
    if (err) {
      setWithdrawalView({ step: "form", errorMessage: err });
      toast.error(err);
      return;
    }
    setWithdrawalView({ step: "confirmation", draft });
  }

  async function handleConfirm(draft: WithdrawalDraft) {
    const amt = Number(draft.amount);
    if (amt > state.balance) {
      setWithdrawalView({ step: "form", errorMessage: "Insufficient Balance" });
      return;
    }
    const stages = [
      "Verifying account & 2FA",
      "Signing transaction securely",
      `Broadcasting to ${draft.network} network`,
      "Confirming on-chain",
    ];
    for (const msg of stages) {
      setWithdrawalView({ step: "processing", draft, processingMessage: msg });
      await new Promise((r) => setTimeout(r, 900 + Math.random() * 250));
    }
    const tx = addWithdraw({
      amount: amt,
      address: draft.address.trim(),
      email: state.user.email,
    });
    toast.success("Withdrawal approved · Invoice generated");
    setWithdrawalView({
      step: "success",
      draft,
      receipt: {
        reference: tx.txid,
        amountLabel: `${amt.toLocaleString()} USDT`,
        network: draft.network,
        addressLabel: tx.address,
        statusLabel: "Completed",
        submittedLabel: new Date(tx.createdAt).toLocaleString("en-US"),
      },
    });
    triggerNotifications(tx);
  }

  return (
    <>
      <BinanceNotification notifications={notifs} onDismiss={dismissNotif} />
      <WalletUi
        balanceLabel={fmtUsd(state.balance)}
        accountEmail="ammarabdu039@gmail.com"
        onBalanceClick={() => {
          const input = window.prompt("Set total balance (USD):", String(state.balance));
          if (input === null) return;
          const n = parseFloat(input.replace(/,/g, ""));
          if (!isNaN(n) && n >= 0) setBalance(n);
        }}
        activities={activities}
        withdrawalView={withdrawalView}
        withdrawalNetworks={NETWORKS}
        onReviewWithdrawal={handleReview}
        onConfirmWithdrawal={handleConfirm}
        onCancelConfirmation={() => setWithdrawalView({ step: "form" })}
        onRetry={() => setWithdrawalView({ step: "form" })}
        onViewHistory={() =>
          setWithdrawalView((v) => (v.step === "success" || v.step === "error" ? { step: "form" } : v))
        }
      />
    </>
  );
}

const NETWORKS = [
  "TRC20", "ERC20", "BEP20", "BTC", "LTC", "BCH", "DOGE", "SOL", "MATIC", "ARBITRUM", "OPTIMISM",
  "AVAXC", "BASE", "TON", "XRP", "ADA", "DOT", "NEAR", "ATOM", "ALGO", "XLM", "FTM",
];
