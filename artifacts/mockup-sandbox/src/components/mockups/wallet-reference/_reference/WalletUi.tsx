import { useState, type FormEvent, type ReactNode } from "react";
import "./wallet-ui-reset.css";
import "./wallet-ui.css";

export type WalletTab = "overview" | "deposit" | "withdraw" | "history";

export type WithdrawalDraft = {
  amount: string;
  network: string;
  address: string;
};

export type WithdrawalReceipt = {
  reference?: string;
  amountLabel: string;
  network: string;
  addressLabel: string;
  feeLabel?: string;
  feeStatusLabel?: string;
  statusLabel: string;
  submittedLabel?: string;
  note?: string;
};

export type WithdrawalStep =
  | "form"
  | "confirmation"
  | "processing"
  | "pending"
  | "success"
  | "error";

export type WithdrawalView = {
  step: WithdrawalStep;
  draft?: WithdrawalDraft;
  receipt?: WithdrawalReceipt;
  errorMessage?: string;
  processingMessage?: string;
};

export type WalletActivity = {
  id: string;
  title: string;
  kindLabel: string;
  amountLabel: string;
  status: string;
  dateLabel: string;
  tone?: "positive" | "neutral" | "negative";
};

export type WalletNotificationPreview = {
  channel: "in-app" | "email";
  status: "pending" | "completed" | "rejected" | "expired";
  timestampLabel?: string;
};

export type WalletUiProps = {
  balanceLabel: string;
  balanceCaption?: string;
  balanceState?: "ready" | "loading" | "unavailable";
  activities?: WalletActivity[];
  withdrawalView?: WithdrawalView;
  notificationPreview?: WalletNotificationPreview | null;
  withdrawalNetworks?: string[];
  withdrawalFeeLabel?: string;
  depositAmountLabel?: string;
  depositDescription?: string;
  onReviewWithdrawal?: (draft: WithdrawalDraft) => void;
  onConfirmWithdrawal?: (draft: WithdrawalDraft) => void;
  onCancelConfirmation?: () => void;
  onRetry?: () => void;
  onDepositContinue?: (amount: string) => void;
  onViewHistory?: () => void;
  onBalanceClick?: () => void;
  depositExtraFields?: ReactNode;
  depositSubmitting?: boolean;
};

const defaultNetworks = ["TRC20", "ERC20", "BSC"];

const statusCopy: Record<WalletNotificationPreview["status"], string> = {
  pending: "pending",
  completed: "completed",
  rejected: "rejected",
  expired: "expired",
};

function Icon({
  name,
  className = "",
}: {
  name: "wallet" | "overview" | "deposit" | "withdraw" | "history" | "arrow" | "check" | "alert" | "close" | "bell" | "activity";
  className?: string;
}) {
  const paths: Record<typeof name, ReactNode> = {
    wallet: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 9h18" /><path d="M16 14h2" /></>,
    overview: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></>,
    deposit: <><path d="M12 3v13" /><path d="m7 11 5 5 5-5" /><path d="M4 20h16" /></>,
    withdraw: <><path d="M12 21V8" /><path d="m7 13 5-5 5 5" /><path d="M4 4h16" /></>,
    history: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    alert: <><path d="M12 3 2.8 19h18.4L12 3Z" /><path d="M12 9v4" /><path d="M12 16h.01" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    activity: <><path d="m16 3 4 4-4 4" /><path d="M20 7H4" /><path d="m8 21-4-4 4-4" /><path d="M4 17h16" /></>,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized.includes("complete") || normalized === "paid" || normalized === "success"
      ? "success"
      : normalized.includes("reject") || normalized.includes("fail")
        ? "danger"
        : normalized.includes("expir")
          ? "muted"
          : "warning";

  return <span className={`nw-status nw-status--${tone}`}>{status}</span>;
}

function EmptyActivity() {
  return (
    <div className="nw-empty">
      <span className="nw-empty__icon"><Icon name="history" /></span>
      <strong>No activity to show</strong>
      <span>Your wallet activity will appear here.</span>
    </div>
  );
}

function ActivityList({ items, overview = false }: { items: WalletActivity[]; overview?: boolean }) {
  if (items.length === 0) return <EmptyActivity />;

  return (
    <div className="nw-activity-list">
      {items.map((item) => (
        <article className={`nw-activity${overview ? " nw-activity--overview" : ""}`} key={item.id}>
          <span className={`nw-activity__icon nw-activity__icon--${item.tone ?? "neutral"}`}>
            {item.tone === "positive" ? <Icon name="deposit" /> : overview ? <Icon name="activity" /> : <Icon name="history" />}
          </span>
          <div className="nw-activity__main">
            <strong>{item.title}</strong>
            {overview ? (
              <span aria-label={`${item.kindLabel} · ${item.dateLabel} · ${item.status}`}>
                {item.dateLabel} · {item.status}
              </span>
            ) : (
              <span>{item.kindLabel} · {item.dateLabel}</span>
            )}
          </div>
          <div className="nw-activity__end">
            <strong className={`nw-amount nw-amount--${item.tone ?? "neutral"}`}>{item.amountLabel}</strong>
            {!overview && <StatusPill status={item.status} />}
          </div>
        </article>
      ))}
    </div>
  );
}

function ReceiptDetails({ receipt }: { receipt: WithdrawalReceipt }) {
  return (
    <dl className="nw-details">
      {receipt.reference && (
        <div><dt>Request reference</dt><dd className="nw-mono">{receipt.reference}</dd></div>
      )}
      <div><dt>Amount</dt><dd>{receipt.amountLabel}</dd></div>
      <div><dt>Network</dt><dd>{receipt.network}</dd></div>
      <div className="nw-details__wide"><dt>Destination address</dt><dd className="nw-mono nw-break">{receipt.addressLabel}</dd></div>
      {receipt.feeLabel && <div><dt>Fee</dt><dd>{receipt.feeLabel}</dd></div>}
      {receipt.feeStatusLabel && <div><dt>Fee status</dt><dd>{receipt.feeStatusLabel}</dd></div>}
      <div><dt>Request status</dt><dd><StatusPill status={receipt.statusLabel} /></dd></div>
      {receipt.submittedLabel && <div><dt>Submitted</dt><dd>{receipt.submittedLabel}</dd></div>}
      {receipt.note && <div className="nw-details__wide"><dt>Update</dt><dd>{receipt.note}</dd></div>}
    </dl>
  );
}

function NotificationPreview({ preview }: { preview: WalletNotificationPreview }) {
  const status = statusCopy[preview.status];
  const copy = `Your withdrawal request is marked ${status}. Open your wallet to review the request details.`;

  if (preview.channel === "email") {
    return (
      <aside className="nw-email-preview" aria-label="Email notification preview, not sent">
        <div className="nw-email-preview__top">
          <span className="nw-email-preview__mark"><Icon name="wallet" /></span>
          <div>
            <strong>Wallet status update</strong>
            <span>Email preview · not sent</span>
          </div>
        </div>
        <div className="nw-email-preview__body">
          <p className="nw-email-preview__subject">Withdrawal status update</p>
          <p>{copy}</p>
          {preview.timestampLabel && <time>{preview.timestampLabel}</time>}
        </div>
      </aside>
    );
  }

  return (
    <aside className="nw-push-preview" role="status" aria-label="In-app notification preview, not sent">
      <span className="nw-push-preview__icon"><Icon name="wallet" /></span>
      <span className="nw-push-preview__copy">
        <strong>Wallet · now</strong>
        <span>{copy}</span>
      </span>
      <span className="nw-preview-tag">Preview only</span>
    </aside>
  );
}

export function WalletUi({
  balanceLabel,
  balanceCaption = "Available balance",
  balanceState = "ready",
  activities = [],
  withdrawalView = { step: "form" },
  notificationPreview = null,
  withdrawalNetworks = defaultNetworks,
  withdrawalFeeLabel,
  depositAmountLabel,
  depositDescription = "Add funds using the funding flow provided by your app.",
  onReviewWithdrawal,
  onConfirmWithdrawal,
  onCancelConfirmation,
  onRetry,
  onDepositContinue,
  onViewHistory,
  onBalanceClick,
  depositExtraFields,
  depositSubmitting = false,
}: WalletUiProps) {
  const [tab, setTab] = useState<WalletTab>("overview");
  const [draft, setDraft] = useState<WithdrawalDraft>({
    amount: "",
    network: withdrawalNetworks[0] ?? "TRC20",
    address: "",
  });
  const [depositAmount, setDepositAmount] = useState(depositAmountLabel ?? "");
  const visibleDraft = withdrawalView.draft ?? draft;
  const receipt = withdrawalView.receipt;

  const selectTab = (next: WalletTab) => {
    setTab(next);
    if (next === "history") onViewHistory?.();
  };

  const submitForReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onReviewWithdrawal?.(draft);
  };

  const navItems: { id: WalletTab; label: string; icon: "overview" | "deposit" | "withdraw" | "history" }[] = [
    { id: "overview", label: "Overview", icon: "overview" },
    { id: "deposit", label: "Deposit", icon: "deposit" },
    { id: "withdraw", label: "Withdraw", icon: "withdraw" },
    { id: "history", label: "History", icon: "history" },
  ];

  return (
    <div className="nw-wallet">
      <div className="nw-wallet__ambient" aria-hidden="true" />
      <main className="nw-shell">
        <div className="nw-brandbar" aria-hidden="true">
          <div className="nw-brandbar__identity">
            <span className="nw-brandbar__mark">N</span>
            <span className="nw-brandbar__name">Nexus</span>
          </div>
          <div className="nw-brandbar__controls">
            <span className="nw-brandbar__social">Social</span>
            <span className="nw-brandbar__account">
              <span className="nw-brandbar__avatar">A</span>
              <span className="nw-brandbar__handle">ammarabdu...</span>
            </span>
          </div>
        </div>
        <header className="nw-page-heading">
          <span className="nw-page-heading__icon"><Icon name="wallet" /></span>
          <div>
            <h1>Wallet</h1>
            <p className="nw-muted">Manage your balances, deposits, and withdrawals.</p>
          </div>
        </header>

        <section className="nw-balance-card" aria-label="Wallet balance">
          <div>
            <p className="nw-eyebrow"><span className="nw-live-dot" />{balanceCaption}</p>
            <p className={`nw-balance nw-balance--${balanceState}`} onClick={onBalanceClick} style={onBalanceClick ? { cursor: "pointer" } : undefined}>
              {balanceState === "loading" ? "Loading…" : balanceState === "unavailable" ? "Unavailable" : balanceLabel}
            </p>
            <p className="nw-muted nw-balance-card__caption">
              Available in your account · balance supplied by the host app
            </p>
          </div>
          <div className="nw-balance-card__actions">
            <button className="nw-button nw-button--outline" type="button" onClick={() => selectTab("withdraw")}>
              <Icon name="withdraw" /> Withdraw
            </button>
            <button className="nw-button nw-button--primary" type="button" onClick={() => selectTab("deposit")}>
              <Icon name="deposit" /> Deposit funds
            </button>
          </div>
        </section>

        {tab === "overview" && (
          <aside className="nw-system-notifications" aria-label="Withdrawal system notifications">
            <span className="nw-system-notifications__icon"><Icon name="bell" /></span>
            <div className="nw-system-notifications__copy">
              <strong>Withdrawal system notifications</strong>
              <p>System notifications are not configured on the server yet.</p>
            </div>
            <button className="nw-system-notifications__button" type="button" disabled>
              <Icon name="bell" /> Enable notifications
            </button>
          </aside>
        )}

        <nav className="nw-tabs" aria-label="Wallet sections">
          {navItems.map((item) => (
            <button
              aria-current={tab === item.id ? "page" : undefined}
              className={`nw-tab${tab === item.id ? " nw-tab--active" : ""}`}
              key={item.id}
              onClick={() => selectTab(item.id)}
              type="button"
            >
              <Icon name={item.icon} /> {item.label}
            </button>
          ))}
        </nav>

        {notificationPreview && (
          <div className="nw-notification-slot">
            <NotificationPreview preview={notificationPreview} />
          </div>
        )}

        {tab === "overview" && (
          <section className="nw-view nw-overview">
            <section className="nw-card nw-overview__hero">
              <p className="nw-eyebrow">EXCHANGE &amp; LIQUIDITY NETWORK</p>
              <h2>Institutional-grade liquidity, routed across 40+ venues in real time</h2>
              <p className="nw-muted">
                Deep books, sub-millisecond routing and audited reserves — the same execution stack used by desks trading nine figures a day.
              </p>
              <div className="nw-overview__metrics">
                <article className="nw-overview__metric">
                  <span>24H VOLUME</span>
                  <strong>$1.42B+</strong>
                  <small>Aggregated across venues</small>
                </article>
                <article className="nw-overview__metric">
                  <span>MATCH LATENCY</span>
                  <strong>&lt;2.4ms</strong>
                  <small>Colocated matching engine</small>
                </article>
                <article className="nw-overview__metric">
                  <span>MAKER / TAKER</span>
                  <strong>0.02% / 0.06%</strong>
                  <small>Volume-tiered pricing</small>
                </article>
                <article className="nw-overview__metric">
                  <span>PROOF OF RESERVES</span>
                  <strong>1:1 Backed</strong>
                  <small>Merkle-audited monthly</small>
                </article>
              </div>
              <button
                className="nw-button nw-button--primary nw-overview__cta"
                type="button"
                onClick={() => selectTab("deposit")}
              >
                Fund Account &amp; Start Trading <Icon name="arrow" />
              </button>
            </section>
            <div className="nw-overview__features">
              <article className="nw-card">
                <h3>Global Liquidity</h3>
                <p>Smart order routing sweeps 40+ exchanges to fill at the best available price.</p>
              </article>
              <article className="nw-card">
                <h3>Institutional Security</h3>
                <p>Cold-storage custody, proof-of-reserves attestation and withdrawal allow-lists.</p>
              </article>
              <article className="nw-card">
                <h3>Instant Settlement</h3>
                <p>Crypto deposits credit on-chain confirmation with 0.4% network processing.</p>
              </article>
            </div>
            <section className="nw-card nw-recent-activity">
              <div className="nw-section-heading">
                <div><h2>Recent activity</h2><p className="nw-muted">Latest deposits, payments &amp; license activations</p></div>
              </div>
              <ActivityList items={activities.slice(0, 5)} overview />
            </section>
          </section>
        )}

        {tab === "deposit" && (
          <section className="nw-view nw-deposit-grid">
            <div className="nw-card nw-deposit-intro">
              <p className="nw-eyebrow">FUND YOUR WALLET</p>
              <h2>Deposit funds</h2>
              <p className="nw-muted">{depositDescription}</p>
              <div className="nw-deposit-points">
                <span><Icon name="check" /> Funding instructions come from your app</span>
                <span><Icon name="check" /> This component does not create a payment or invoice</span>
              </div>
            </div>
            <form
              className="nw-card nw-form-card"
              onSubmit={(event) => {
                event.preventDefault();
                onDepositContinue?.(depositAmount);
              }}
            >
              <h2>Deposit amount</h2>
              <label className="nw-label" htmlFor="nw-deposit-amount">Amount</label>
              <div className="nw-input-wrap">
                <span aria-hidden="true">$</span>
                <input
                  autoComplete="off"
                  id="nw-deposit-amount"
                  inputMode="decimal"
                  onChange={(event) => setDepositAmount(event.target.value)}
                  placeholder="Enter amount"
                  value={depositAmount}
                />
              </div>
              {depositExtraFields}
              <button className="nw-button nw-button--primary nw-button--full" type="submit" disabled={depositSubmitting}>
                {depositSubmitting ? "Processing…" : "Continue"} <Icon name="arrow" />
              </button>
              <p className="nw-form-note">Your app handles amount rules and the next step.</p>
            </form>
          </section>
        )}

        {tab === "withdraw" && (
          <section className="nw-view">
            {withdrawalView.step === "form" && (
              <form className="nw-card nw-form-card nw-withdraw-form" onSubmit={submitForReview}>
                <div className="nw-form-heading">
                  <div><p className="nw-eyebrow">SEND FUNDS</p><h2>Withdraw USDT</h2></div>
                  <span className="nw-token-mark">₮</span>
                </div>
                <p className="nw-muted">Send USDT to an external wallet.</p>
                <div className="nw-available-line"><span>Available balance</span><strong>{balanceLabel}</strong></div>
                <label className="nw-label" htmlFor="nw-network">Network</label>
                <select
                  id="nw-network"
                  onChange={(event) => setDraft((current) => ({ ...current, network: event.target.value }))}
                  value={draft.network}
                >
                  {withdrawalNetworks.map((network) => <option key={network} value={network}>{network}</option>)}
                </select>
                <label className="nw-label" htmlFor="nw-address">Destination address</label>
                <input
                  autoComplete="off"
                  id="nw-address"
                  onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))}
                  placeholder="Paste wallet address"
                  value={draft.address}
                />
                <label className="nw-label" htmlFor="nw-withdraw-amount">Amount (USDT)</label>
                <div className="nw-input-wrap">
                  <span aria-hidden="true">₮</span>
                  <input
                    autoComplete="off"
                    id="nw-withdraw-amount"
                    inputMode="decimal"
                    onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
                    placeholder="Enter amount"
                    value={draft.amount}
                  />
                </div>
                {withdrawalFeeLabel && (
                  <div className="nw-fee-row"><span>Fee estimate</span><strong>{withdrawalFeeLabel}</strong></div>
                )}
                {withdrawalView.errorMessage && <p className="nw-inline-error" role="alert">{withdrawalView.errorMessage}</p>}
                <button className="nw-button nw-button--primary nw-button--full" type="submit">
                  Review withdrawal <Icon name="arrow" />
                </button>
                <p className="nw-form-note">The host app validates and submits withdrawal requests.</p>
              </form>
            )}

            {withdrawalView.step === "confirmation" && (
              <div className="nw-card nw-state-card">
                <span className="nw-state-icon nw-state-icon--info"><Icon name="history" /></span>
                <p className="nw-eyebrow">REVIEW REQUEST</p>
                <h2>Confirm withdrawal details</h2>
                <p className="nw-muted">Check the destination and request details before continuing.</p>
                <div className="nw-confirm-summary">
                  <div><span>Amount</span><strong>{visibleDraft.amount || "—"} USDT</strong></div>
                  <div><span>Network</span><strong>{visibleDraft.network || "—"}</strong></div>
                  <div><span>Destination</span><strong className="nw-mono nw-break">{visibleDraft.address || "—"}</strong></div>
                  {withdrawalFeeLabel && <div><span>Fee estimate</span><strong>{withdrawalFeeLabel}</strong></div>}
                </div>
                {withdrawalView.errorMessage && <p className="nw-inline-error" role="alert">{withdrawalView.errorMessage}</p>}
                <div className="nw-button-row">
                  <button className="nw-button nw-button--outline" onClick={onCancelConfirmation} type="button">Back to form</button>
                  <button className="nw-button nw-button--primary" onClick={() => onConfirmWithdrawal?.(visibleDraft)} type="button">
                    Confirm request <Icon name="arrow" />
                  </button>
                </div>
              </div>
            )}

            {withdrawalView.step === "processing" && (
              <div className="nw-card nw-state-card" role="status" aria-live="polite">
                <span className="nw-spinner" aria-hidden="true" />
                <p className="nw-eyebrow">REQUEST IN PROGRESS</p>
                <h2>Processing withdrawal</h2>
                <p className="nw-muted">{withdrawalView.processingMessage ?? "Your app is processing this request."}</p>
              </div>
            )}

            {(withdrawalView.step === "pending" || withdrawalView.step === "success" || withdrawalView.step === "error") && (
              <div className="nw-card nw-receipt-card">
                <div className="nw-receipt-heading">
                  <span className={`nw-state-icon nw-state-icon--${withdrawalView.step}`}>
                    <Icon name={withdrawalView.step === "success" ? "check" : withdrawalView.step === "error" ? "alert" : "history"} />
                  </span>
                  <div>
                    <p className="nw-eyebrow">
                      {withdrawalView.step === "pending" ? "REQUEST RECEIVED" : withdrawalView.step === "success" ? "STATUS UPDATE" : "ACTION NEEDED"}
                    </p>
                    <h2>
                      {withdrawalView.step === "pending" ? "Withdrawal pending" : withdrawalView.step === "success" ? "Withdrawal marked complete" : "Withdrawal needs attention"}
                    </h2>
                  </div>
                  {receipt && <StatusPill status={receipt.statusLabel} />}
                </div>
                <p className={`nw-state-message nw-state-message--${withdrawalView.step}`} role={withdrawalView.step === "error" ? "alert" : "status"}>
                  {withdrawalView.step === "pending"
                    ? "Your request is pending. Check back for status updates from your app."
                    : withdrawalView.step === "success"
                      ? "Your app reports this request as complete. Review the receipt and transaction details."
                      : withdrawalView.errorMessage ?? "Your app could not complete this request. Review the details or try again."}
                </p>
                {receipt && <ReceiptDetails receipt={receipt} />}
                <div className="nw-button-row nw-receipt-actions">
                  {withdrawalView.step === "error" && (
                    <button className="nw-button nw-button--primary" onClick={onRetry} type="button">Try again</button>
                  )}
                  <button className="nw-button nw-button--outline" onClick={() => selectTab("history")} type="button">
                    View wallet activity
                  </button>
                  <button className="nw-text-button" onClick={() => selectTab("overview")} type="button">
                    Back to wallet
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === "history" && (
          <section className="nw-view nw-card">
            <div className="nw-section-heading">
              <div><p className="nw-eyebrow">ACCOUNT</p><h2>Wallet activity</h2><p className="nw-muted">Transaction history supplied by the host app.</p></div>
            </div>
            <ActivityList items={activities} />
          </section>
        )}

        <footer className="nw-footer">
          <span className="nw-footer__brand">
            <span className="nw-footer__mark">N</span>
            <strong>Nexus</strong>
          </span>
          <span className="nw-footer__copy">© 2026 Nexus Terminal. Simulated demo environment for illustrative purposes.</span>
        </footer>
      </main>
      <div className="nw-app-dock" aria-hidden="true">
        <span className="nw-app-dock__item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m3.5 10 8.5-7 8.5 7v10a1 1 0 0 1-1 1h-5v-7h-5v7h-5a1 1 0 0 1-1-1z" /></svg>
          <span>Home</span>
        </span>
        <span className="nw-app-dock__item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5M4 19h17" /><path d="m7 15 4-4 3 2 5-6" /></svg>
          <span>Terminal</span>
        </span>
        <span className="nw-app-dock__item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="7" width="16" height="13" rx="2" /><path d="M9 7V4h6v3M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></svg>
          <span>AI</span>
        </span>
        <span className="nw-app-dock__item nw-app-dock__item--active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 9h18M16 14h2" /></svg>
          <span>Wallet</span>
        </span>
        <span className="nw-app-dock__item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m20.6 13.4-8.9 8.1a2 2 0 0 1-2.8-.1L2.6 15a2 2 0 0 1-.1-2.8l8.1-8.9a2 2 0 0 1 1.5-.7h6.3a2 2 0 0 1 2 2v6.3a2 2 0 0 1-.7 1.5Z" /><circle cx="16.5" cy="7.5" r="1" /></svg>
          <span>Plans</span>
        </span>
      </div>
    </div>
  );
}
