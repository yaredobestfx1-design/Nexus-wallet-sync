import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Transaction } from "@/lib/wallet-store";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tx: Transaction | null;
  userName: string;
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function EmailNotification({ open, onOpenChange, tx, userName }: Props) {
  if (!tx) return null;
  const isDeposit = tx.kind === "deposit";
  const brand = isDeposit ? "#10b981" : "#3b82f6";
  const title = isDeposit ? "Deposit Confirmed" : "Withdrawal Request Received";
  const preheader = isDeposit
    ? `Your deposit of ${tx.amount} USDT has been credited to your account.`
    : `Your withdrawal request of ${tx.amount} USDT is being processed.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden border-white/10 bg-[#0f1621] p-0 text-white">
        <DialogTitle className="sr-only">Email confirmation from Bloomberg Wallet</DialogTitle>

        {/* Simulated email client chrome */}
        <div className="border-b border-white/10 bg-[#0a0f1a] px-4 py-3">
          <div className="flex items-center justify-between gap-2 text-xs text-white/60">
            <span className="font-semibold text-white/80">Inbox · Bloomberg Wallet</span>
            <span>{formatDate(tx.createdAt)}</span>
          </div>
          <div className="mt-2 text-sm font-semibold text-white">{title}</div>
          <div className="mt-0.5 text-xs text-white/60">
            From: <span className="text-white/80">noreply@bloombergtradingai.com</span>
          </div>
          <div className="text-xs text-white/60">
            To: <span className="text-white/80">{tx.email}</span>
          </div>
        </div>

        {/* Email body (light theme, like real crypto exchange emails) */}
        <div className="max-h-[70vh] overflow-y-auto bg-white text-slate-800">
          <div style={{ background: brand }} className="px-6 py-5 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15 text-sm font-black">
                B
              </div>
              <div className="text-sm font-semibold tracking-wide">BLOOMBERG WALLET</div>
            </div>
            <h1 className="mt-3 text-xl font-semibold">{title}</h1>
            <p className="mt-1 text-sm text-white/85">{preheader}</p>
          </div>

          <div className="px-6 py-5 text-sm leading-relaxed">
            <p>Hi {userName},</p>
            <p className="mt-2">
              {isDeposit
                ? `We've received and credited your deposit of ${tx.amount.toLocaleString()} USDT on the ${tx.network} network. Your funds are now available in your wallet.`
                : `We've received your withdrawal request of ${tx.amount.toLocaleString()} USDT on the ${tx.network} network. Our team is reviewing this transaction and it will be processed shortly.`}
            </p>

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <Row label="Amount" value={`${tx.amount.toLocaleString()} USDT`} />
              <Row label="Network" value={tx.network} />
              <Row label="Transaction ID" value={tx.txid} mono />
              <Row label="Destination" value={tx.address} mono />
              <Row label="Date & Time" value={formatDate(tx.createdAt)} />
              <Row
                label="Status"
                value={tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
              />
            </div>

            <p className="mt-5 text-xs text-slate-500">
              If you did not initiate this transaction, please contact support immediately. This
              email was sent to {tx.email}.
            </p>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Bloomberg Trading AI · Institutional Grade Liquidity
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200 py-2 last:border-b-0">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span
        className={
          "min-w-0 break-all text-right text-slate-800" + (mono ? " font-mono text-[12px]" : "")
        }
      >
        {value}
      </span>
    </div>
  );
}
