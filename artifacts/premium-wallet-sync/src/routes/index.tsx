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
import { addDeposit, addWithdraw, DEPOSIT_ADDRESS, setBalance, useWallet, type Transaction } from "@/lib/wallet-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wallet — Bloomberg Trading AI" },
      { name: "description", content: "Manage your balance, deposits, withdrawals and activity." },
      { property: "og:title", content: "Wallet — Bloomberg Trading AI" },
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
    const isDeposit = tx.kind === "deposit";
    const amountLabel = `${tx.amount.toLocaleString()} USDT`;

    // Exchange-style push notification after 10s — timestamps captured at fire time
    const t1 = setTimeout(() => {
      const now = Date.now();
      const stamp = fmtTime(now);
      pushNotif({
        id: `${tx.id}-ex`,
        variant: "exchange",
        title: isDeposit ? "USDT Deposit Successful" : "USDT Withdrawal Submitted",
        body: isDeposit
          ? `You have successfully deposited ${amountLabel} at ${stamp}. If…`
          : `Your withdrawal request of ${amountLabel} at ${stamp} is being processed. If…`,
        time: stamp,
      });
    }, 10000);

    // Email-style push notification 2s after the exchange one
    const t2 = setTimeout(() => {
      const now = Date.now();
      const stamp = fmtTime(now);
      pushNotif({
        id: `${tx.id}-mail`,
        variant: "email",
        title: "Gmail",
        subtitle: tx.email,
        body: isDeposit
          ? `[Binance] USDT Deposit Confirmed — ${stamp} — ${amountLabel}`
          : `[Binance] USDT Withdrawal Received — ${stamp} — ${amountLabel}`,
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

  const [depositTxid, setDepositTxid] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function clearScreenshot() {
    setScreenshot(null);
    setScreenshotName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("Screenshot must be an image file");
    if (file.size > 5 * 1024 * 1024) return void toast.error("Screenshot must be under 5MB");
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshot(String(reader.result));
      setScreenshotName(file.name);
    };
    reader.onerror = () => toast.error("Failed to read screenshot");
    reader.readAsDataURL(file);
  }

  async function handleDeposit(amountStr: string) {
    const amt = Number(String(amountStr).replace(/[^0-9.]/g, ""));
    if (depositSubmitting) return;
    if (!(amt > 0)) return void toast.error("Enter a valid deposit amount");
    if (!screenshot) return void toast.error("Payment screenshot is required");
    if (depositTxid.trim().length < 10) return void toast.error("Enter a valid transaction hash");
    setDepositSubmitting(true);
    await new Promise((r) => setTimeout(r, 1400));
    const tx = addDeposit({
      amount: amt,
      address: DEPOSIT_ADDRESS,
      txid: depositTxid.trim(),
      email: state.user.email,
      screenshot,
    });
    setDepositSubmitting(false);
    setDepositTxid("");
    clearScreenshot();
    toast.success(`Deposit of ${amt.toLocaleString()} USDT credited`);
    triggerNotifications(tx);
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
        onBalanceClick={() => {
          const input = window.prompt("Set total balance (USD):", String(state.balance));
          if (input === null) return;
          const n = parseFloat(input.replace(/,/g, ""));
          if (!isNaN(n) && n >= 0) setBalance(n);
        }}
        activities={activities}
        withdrawalView={withdrawalView}
        withdrawalNetworks={NETWORKS}
        depositSubmitting={depositSubmitting}
        depositExtraFields={
          <DepositProofFields
            screenshotName={screenshotName}
            onPickFile={handleFile}
            onClearFile={clearScreenshot}
            txid={depositTxid}
            onTxid={setDepositTxid}
            fileRef={fileRef}
          />
        }
        onDepositContinue={handleDeposit}
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

function DepositProofFields({
  screenshotName,
  onPickFile,
  onClearFile,
  txid,
  onTxid,
  fileRef,
}: {
  screenshotName: string | null;
  onPickFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
  txid: string;
  onTxid: (v: string) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      <label className="nw-label" htmlFor="nw-deposit-proof">Payment screenshot</label>
      <input ref={fileRef} id="nw-deposit-proof" type="file" accept="image/*" onChange={onPickFile} style={{ display: "none" }} />
      <div className="nw-input-wrap">
        <span aria-hidden="true">⇪</span>
        <input
          readOnly
          placeholder="Upload payment screenshot"
          value={screenshotName ?? ""}
          onClick={() => fileRef.current?.click()}
          style={{ cursor: "pointer" }}
        />
        {screenshotName && (
          <button className="nw-text-button" type="button" onClick={onClearFile}>Remove</button>
        )}
      </div>
      <label className="nw-label" htmlFor="nw-deposit-txid">Transaction hash (TXID)</label>
      <input
        autoComplete="off"
        id="nw-deposit-txid"
        className="nw-mono"
        placeholder="Paste transaction hash"
        value={txid}
        onChange={(e) => onTxid(e.target.value.trim())}
      />
      <div style={{ height: 17 }} />
    </>
  );
}

const NETWORKS = [
  "TRC20", "ERC20", "BEP20", "BTC", "LTC", "BCH", "DOGE", "SOL", "MATIC", "ARBITRUM", "OPTIMISM",
  "AVAXC", "BASE", "TON", "XRP", "ADA", "DOT", "NEAR", "ATOM", "ALGO", "XLM", "FTM",
];
