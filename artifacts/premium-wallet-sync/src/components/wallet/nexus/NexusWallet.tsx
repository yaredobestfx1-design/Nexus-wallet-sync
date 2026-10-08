import { useState, type ReactNode, type RefObject, type ChangeEvent } from "react";
import "./nexus-wallet.css";
import type { WithdrawalDraft, WithdrawalView } from "./WalletUi";
import type { Transaction } from "@/lib/wallet-store";

type Tab = "overview" | "deposit" | "withdraw" | "history";

const NETWORK_NAMES: Record<string, string> = {
  TRC20: "Tron", ERC20: "Ethereum", BEP20: "BNB Smart Chain", BTC: "Bitcoin", LTC: "Litecoin",
  BCH: "Bitcoin Cash", DOGE: "Dogecoin", SOL: "Solana", MATIC: "Polygon", ARBITRUM: "Arbitrum One",
  OPTIMISM: "Optimism", AVAXC: "Avalanche C-Chain", BASE: "Base", TON: "The Open Network", XRP: "XRP Ledger",
  ADA: "Cardano", DOT: "Polkadot", NEAR: "NEAR Protocol", ATOM: "Cosmos", ALGO: "Algorand", XLM: "Stellar", FTM: "Fantom",
};

const COINS: [string, string, string][] = [
  ["BTC", "₿", "linear-gradient(135deg,#f7b13a,#f2891c)"],
  ["ETH", "Ξ", "linear-gradient(135deg,#8f9cf5,#5d6fe0)"],
  ["USDT", "₮", "linear-gradient(135deg,#3fd3a0,#1a9b74)"],
  ["USDC", "$", "linear-gradient(135deg,#4f8fe8,#2765c9)"],
  ["BNB", "B", "linear-gradient(135deg,#f7cd4a,#e9a91a)"],
  ["SOL", "S", "linear-gradient(135deg,#c35cf2,#7a3ee0)"],
  ["XRP", "X", "linear-gradient(135deg,#4fb6f0,#2a7fd6)"],
  ["TRX", "T", "linear-gradient(135deg,#ff5a6a,#d7213a)"],
  ["TON", "T", "linear-gradient(135deg,#46b4f5,#1f86d8)"],
  ["ADA", "A", "linear-gradient(135deg,#3d6ff0,#1f3fb8)"],
];

const I = {
  card: <svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10.5h18" /></svg>,
  bell: <svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></svg>,
  grid: <svg viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></svg>,
  down: <svg viewBox="0 0 24 24"><path d="M12 4v15M6 13l6 6 6-6" /></svg>,
  up: <svg viewBox="0 0 24 24"><path d="M12 20V5M6 11l6-6 6 6" /></svg>,
  hist: <svg viewBox="0 0 24 24"><path d="M4 5v5h5" /><path d="M5 10a8 8 0 1 1-1 4" /><path d="M12 8v4l3 2" /></svg>,
  swap: <svg viewBox="0 0 24 24"><path d="M4 8h15l-4-4M20 16H5l4 4" /></svg>,
  chev: <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>,
  home: <svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" /></svg>,
  chart: <svg viewBox="0 0 24 24"><path d="M4 4v16h16" /><path d="M7 15l4-4 3 3 5-6" /></svg>,
  bot: <svg viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="11" rx="3" /><path d="M12 4v4M9 13v1M15 13v1M2 13v2M22 13v2" /></svg>,
  wallet: <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="15" rx="3" /><path d="M3 9h18M16 14h2" /></svg>,
  tag: <svg viewBox="0 0 24 24"><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.3" /></svg>,
  check: <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>,
};

export interface NexusWalletProps {
  balance: number;
  email: string;
  transactions: Transaction[];
  onBalanceClick: () => void;
  networks: string[];
  withdrawalView: WithdrawalView;
  onReviewWithdrawal: (d: WithdrawalDraft) => void;
  onConfirmWithdrawal: (d: WithdrawalDraft) => void;
  onCancelConfirmation: () => void;
  onDone: () => void;
  deposit: {
    submitting: boolean;
    screenshotName: string | null;
    onPickFile: (e: ChangeEvent<HTMLInputElement>) => void;
    onClearFile: () => void;
    txid: string;
    onTxid: (v: string) => void;
    fileRef: RefObject<HTMLInputElement | null>;
    onSubmit: (amount: string) => void;
  };
}

const usd = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function NexusWallet(p: NexusWalletProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const [whole, cents] = usd(p.balance).split(".");
  const tabs: [Tab, string, ReactNode][] = [
    ["overview", "Overview", I.grid],
    ["deposit", "Deposit", I.down],
    ["withdraw", "Withdraw", I.up],
    ["history", "History", I.hist],
  ];

  return (
    <div className="nx">
      <header className="nx-top">
        <div className="nx-brand"><span className="nx-logo">B</span><b>Bloomberg</b></div>
        <div className="nx-top__right">
          <span className="nx-pill">Social</span>
          <span className="nx-user"><span className="nx-avatar">A</span><span className="nx-user__name">{p.email}</span></span>
        </div>
      </header>

      <main className="nx-main">
        <section className="nx-heading">
          <span className="nx-heading__icon">{I.card}</span>
          <div>
            <h1>Wallet</h1>
            <p>Manage your balances, deposits, and withdrawals</p>
          </div>
        </section>

        <section className="nx-card nx-balance">
          <p className="nx-eyebrow"><span className="nx-dot" /> AVAILABLE BALANCE</p>
          <p className="nx-amount" onClick={p.onBalanceClick}>${whole}<small>.{cents}</small></p>
          <p className="nx-sub">Persistent Terminal balance · available for trading and withdrawals · {p.email}</p>
          <div className="nx-balance__actions">
            <button className="nx-btn nx-btn--ghost" onClick={() => setTab("withdraw")}>Withdraw</button>
            <button className="nx-btn nx-btn--primary" onClick={() => setTab("deposit")}>Deposit funds</button>
          </div>
        </section>

        <section className="nx-card nx-notice">
          <div className="nx-notice__row">
            <span className="nx-iconbox">{I.bell}</span>
            <div>
              <h3>Withdrawal system notifications</h3>
              <p>Exchange and email alerts are active for every deposit and withdrawal.</p>
            </div>
          </div>
          <button className="nx-notice__btn" type="button">{I.bell} Notifications enabled</button>
        </section>

        <nav className="nx-tabs">
          {tabs.map(([id, label, icon]) => (
            <button key={id} className={`nx-tab${tab === id ? " is-active" : ""}`} onClick={() => setTab(id)} aria-label={label}>
              {icon}{id !== "history" && <span>{label.toUpperCase()}</span>}
            </button>
          ))}
        </nav>

        <div className="nx-panel" key={tab}>
          {tab === "overview" && <Overview transactions={p.transactions} onFund={() => setTab("deposit")} />}
          {tab === "deposit" && <Deposit {...p.deposit} />}
          {tab === "withdraw" && <Withdraw {...p} />}
          {tab === "history" && <Activity transactions={p.transactions} />}
        </div>
      </main>

      <footer className="nx-footer">
        <div className="nx-brand nx-brand--center"><span className="nx-logo">B</span><b>Bloomberg</b></div>
        <p>© {new Date().getFullYear()} Bloomberg Terminal. All rights reserved.</p>
      </footer>

      <nav className="nx-bottom">
        {([["Home", I.home], ["Terminal", I.chart], ["AI", I.bot], ["Wallet", I.wallet], ["Plans", I.tag]] as const).map(([l, ic]) => (
          <span key={l} className={l === "Wallet" ? "is-active" : ""}>{ic}{l}</span>
        ))}
      </nav>
    </div>
  );
}

function Stat({ label, value, note }: { label?: string; value: string; note: string }) {
  return (
    <div className="nx-stat">
      {label && <p className="nx-stat__label">{label}</p>}
      <p className="nx-stat__value">{value}</p>
      <p className="nx-stat__note">{note}</p>
    </div>
  );
}

function Overview({ transactions, onFund }: { transactions: Transaction[]; onFund: () => void }) {
  return (
    <>
      <section className="nx-card nx-hero">
        <p className="nx-kicker">EXCHANGE &amp; LIQUIDITY NETWORK</p>
        <h2>Institutional-grade liquidity, routed across 40+ venues in real time</h2>
        <p className="nx-lead">Deep books, sub-millisecond routing and audited reserves — the same execution stack used by desks trading nine figures a day.</p>
        <Stat label="24H VOLUME" value="$1.42B+" note="Aggregated across venues" />
        <Stat label="MATCH LATENCY" value="<2.4ms" note="Colocated matching engine" />
        <Stat label="MAKER / TAKER" value="0.02% / 0.06%" note="Volume-tiered pricing" />
        <Stat label="PROOF OF RESERVES" value="1:1 Backed" note="Merkle-audited monthly" />
        <button className="nx-btn nx-btn--primary nx-btn--cta" onClick={onFund}>Fund Account &amp; Start Trading →</button>
      </section>
      {[
        ["Global Liquidity", "Smart order routing sweeps 40+ exchanges to fill at the best available price."],
        ["Institutional Security", "Cold-storage custody, proof-of-reserves attestation and withdrawal allow-lists."],
        ["Instant Settlement", "Crypto deposits credit on-chain confirmation with instant balance updates."],
      ].map(([t, d]) => (
        <section key={t} className="nx-card nx-feature"><h3>{t}</h3><p>{d}</p></section>
      ))}
      <Activity transactions={transactions} />
    </>
  );
}

function Activity({ transactions }: { transactions: Transaction[] }) {
  const list = transactions.filter((t) => t.status !== "pending");
  return (
    <section className="nx-card nx-activity">
      <h3>Recent activity</h3>
      <p className="nx-muted">Latest deposits, withdrawals &amp; balance updates</p>
      {list.length === 0 ? (
        <p className="nx-empty">No activity yet. Your deposits and withdrawals will appear here.</p>
      ) : (
        <ul>
          {list.map((t) => {
            const dep = t.kind === "deposit";
            return (
              <li key={t.id}>
                <span className={`nx-act-icon${dep ? " is-pos" : ""}`}>{dep ? I.down : I.swap}</span>
                <div className="nx-act-body">
                  <b>{dep ? "Balance credited" : "Withdrawal sent"}</b>
                  <span>{new Date(t.createdAt).toLocaleString("en-US")} · {t.status === "approved" ? "completed" : "rejected"}</span>
                </div>
                <span className={`nx-act-amt${dep ? " is-pos" : ""}`}>{dep ? "+" : ""}${usd(t.amount)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Deposit(d: NexusWalletProps["deposit"]) {
  const [amount, setAmount] = useState("100.00");
  return (
    <>
      <section className="nx-card nx-hero">
        <span className="nx-badge"><span className="nx-dot" /> INSTANT USDT DEPOSITS</span>
        <h2>One wallet. <span className="nx-grad">Every major crypto.</span></h2>
        <p className="nx-lead">Send USDT to your deposit address, upload your payment screenshot and transaction hash, and your balance is credited in USD.</p>
        <Stat value="0%" note="No deposit processing fee" />
        <Stat value="Instant" note="Settlement on confirmation" />
        <Stat value="Multi-asset" note="22 supported transfer networks" />
        <div className="nx-coins">
          {COINS.map(([n, s, bg]) => (
            <span key={n} className="nx-coin"><i style={{ background: bg }}>{s}</i>{n}</span>
          ))}
          <span className="nx-coin nx-coin--more">+ more</span>
        </div>
        <ul className="nx-checks">
          <li>✓ Secure, non-custodial deposit — funds go straight to settlement</li>
          <li>✓ Payment proof verified with screenshot and transaction hash</li>
          <li>✓ Instant confirmation, balance updates automatically</li>
        </ul>
      </section>

      <form className="nx-card nx-form" onSubmit={(e) => { e.preventDefault(); d.onSubmit(amount); }}>
        <h3>Deposit funds</h3>
        <p className="nx-muted">Enter an amount and confirm your payment</p>
        <label className="nx-label">AMOUNT (USD)</label>
        <div className="nx-presets">
          {["100", "250", "500"].map((v) => (
            <button type="button" key={v} className="nx-preset" onClick={() => setAmount(`${v}.00`)}>${v}</button>
          ))}
        </div>
        <div className="nx-field nx-field--big"><span>$</span><input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></div>

        <label className="nx-label">PAYMENT SCREENSHOT</label>
        <input ref={d.fileRef} type="file" accept="image/*" onChange={d.onPickFile} hidden />
        <div className="nx-field" onClick={() => d.fileRef.current?.click()} style={{ cursor: "pointer" }}>
          <span>⇪</span>
          <input readOnly value={d.screenshotName ?? ""} placeholder="Upload payment screenshot" style={{ cursor: "pointer" }} />
          {d.screenshotName && <button type="button" className="nx-link" onClick={(e) => { e.stopPropagation(); d.onClearFile(); }}>Remove</button>}
        </div>

        <label className="nx-label">TRANSACTION HASH (TXID)</label>
        <div className="nx-field"><input className="nx-mono" value={d.txid} onChange={(e) => d.onTxid(e.target.value.trim())} placeholder="Paste transaction hash" autoComplete="off" /></div>

        <div className="nx-rows">
          <div><span>Minimum deposit</span><b>None</b></div>
          <div><span>Processing fee</span><b>0%</b></div>
        </div>
        <button className="nx-btn nx-btn--primary nx-btn--block" type="submit" disabled={d.submitting}>
          {d.submitting ? "Processing…" : "Deposit funds"}
        </button>
        <p className="nx-info"><span className="nx-dot" /> Your deposit is verified with the <b>screenshot</b> and <b>transaction hash</b> you provide, then credited to your balance.</p>
      </form>
    </>
  );
}

function Withdraw(p: NexusWalletProps) {
  const v = p.withdrawalView;
  const [network, setNetwork] = useState(v.draft?.network ?? "TRC20");
  const [address, setAddress] = useState(v.draft?.address ?? "");
  const [amount, setAmount] = useState(v.draft?.amount ?? "");

  if (v.step === "confirmation" && v.draft) {
    return (
      <section className="nx-card nx-form">
        <h3>Confirm withdrawal</h3>
        <p className="nx-muted">Review the details before sending.</p>
        <div className="nx-rows nx-rows--box">
          <div><span>Amount</span><b>{Number(v.draft.amount).toLocaleString()} USDT</b></div>
          <div><span>Network</span><b>{v.draft.network}</b></div>
          <div><span>Address</span><b className="nx-break">{v.draft.address}</b></div>
        </div>
        <p className="nx-warn">Double-check the network and address. Withdrawals sent to the wrong network cannot be recovered.</p>
        <button className="nx-btn nx-btn--confirm nx-btn--block" onClick={() => p.onConfirmWithdrawal(v.draft!)}>Confirm Withdrawal</button>
        <button className="nx-btn nx-btn--ghost nx-btn--block" style={{ marginTop: 12 }} onClick={p.onCancelConfirmation}>Back</button>
      </section>
    );
  }
  if (v.step === "processing") {
    return (
      <section className="nx-card nx-form nx-center">
        <span className="nx-spinner" />
        <h3>Processing withdrawal</h3>
        <p className="nx-muted">{v.processingMessage}</p>
      </section>
    );
  }
  if (v.step === "success" && v.receipt) {
    const r = v.receipt;
    return (
      <section className="nx-card nx-form">
        <div className="nx-center"><span className="nx-success">{I.check}</span><h3>Withdrawal completed</h3><p className="nx-muted">Your USDT has been sent.</p></div>
        <div className="nx-rows nx-rows--box">
          <div><span>Reference</span><b>{r.reference}</b></div>
          <div><span>Amount</span><b>{r.amountLabel}</b></div>
          <div><span>Network</span><b>{r.network}</b></div>
          <div><span>Address</span><b className="nx-break">{r.addressLabel}</b></div>
          <div><span>Status</span><b className="nx-pos">{r.statusLabel}</b></div>
          <div><span>Submitted</span><b>{r.submittedLabel}</b></div>
        </div>
        <button className="nx-btn nx-btn--primary nx-btn--block" onClick={p.onDone}>Done</button>
      </section>
    );
  }

  return (
    <form className="nx-card nx-form" onSubmit={(e) => { e.preventDefault(); p.onReviewWithdrawal({ amount, network, address }); }}>
      <h3>Withdraw USDT</h3>
      <p className="nx-muted">Send USDT to an external wallet.</p>
      <div className="nx-avail">Available balance: <b>{usd(p.balance)} USD</b></div>
      <label className="nx-label">ASSET</label>
      <div className="nx-field nx-field--static"><b className="nx-mono">USDT — Tether</b></div>
      <label className="nx-label">NETWORK</label>
      <div className="nx-field nx-select">
        <select value={network} onChange={(e) => setNetwork(e.target.value)}>
          {p.networks.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        {I.chev}
      </div>
      <p className="nx-hint">{NETWORK_NAMES[network] ?? network}</p>
      <label className="nx-label">DESTINATION ADDRESS</label>
      <div className="nx-field"><input className="nx-mono" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Paste USDT wallet address" autoComplete="off" /></div>
      <label className="nx-label">AMOUNT (USDT)</label>
      <div className="nx-field nx-field--big"><span>₮</span><input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" /></div>
      <div className="nx-req">
        <div><span>Requested withdrawal</span><b>{Number(amount) > 0 ? `${Number(amount).toLocaleString()} USDT` : "—"}</b></div>
        <p>The requested amount is deducted from your available balance when the withdrawal is confirmed.</p>
      </div>
      {v.step === "form" && v.errorMessage && <p className="nx-error">{v.errorMessage}</p>}
      <p className="nx-warn">Double-check the network and address. Withdrawals sent to the wrong network cannot be recovered.</p>
      <button className="nx-btn nx-btn--confirm nx-btn--block" type="submit">Confirm Withdrawal</button>
    </form>
  );
}
