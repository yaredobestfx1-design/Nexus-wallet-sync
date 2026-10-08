import { CheckCircle2, Download, Printer } from "lucide-react";

import bloombergLogo from "@/assets/bloomberg-logo-v2.png.asset.json";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Transaction } from "@/lib/wallet-store";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tx: Transaction | null;
}

function fmt(ms: number) {
  return new Date(ms).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function receiptNumber(tx: Transaction) {
  return `INV-${new Date(tx.createdAt).getFullYear()}-${tx.id
    .replace(/[^a-z0-9]/gi, "")
    .slice(-8)
    .toUpperCase()}`;
}

export function InvoiceReceipt({ open, onOpenChange, tx }: Props) {
  if (!tx) return null;
  const fee = +(tx.amount * 0.001).toFixed(2); // 0.1% network fee
  const net = +(tx.amount - fee).toFixed(2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden border-white/10 bg-white p-0 text-slate-900">
        <DialogTitle className="sr-only">Withdrawal invoice receipt</DialogTitle>

        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#0a0f1a] via-[#0f1a2e] to-[#0a0f1a] px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <img src={bloombergLogo.url} alt="Bloomberg" className="h-8 w-auto object-contain" />
            <div className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
              Approved
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-inset ring-emerald-400/40">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                Withdrawal Receipt
              </div>
              <div className="text-lg font-semibold">Transaction Successful</div>
            </div>
          </div>
        </div>

        {/* Amount block */}
        <div className="border-b border-slate-200 px-6 py-5 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Amount Withdrawn
          </div>
          <div className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
            <span className="text-lg font-semibold text-slate-500">USDT</span>
          </div>
          <div className="mt-0.5 text-[12px] text-slate-500">via {tx.network} Network</div>
        </div>

        {/* Line items */}
        <div className="px-6 py-4 text-[13px]">
          <Row label="Receipt No." value={receiptNumber(tx)} mono />
          <Row label="Transaction Hash" value={tx.txid} mono truncate />
          <Row label="Destination" value={tx.address} mono truncate />
          <Row label="Recipient Email" value={tx.email} />
          <Row label="Date &amp; Time" value={fmt(tx.createdAt)} />
          <div className="my-3 border-t border-dashed border-slate-200" />
          <Row label="Gross Amount" value={`${tx.amount.toFixed(2)} USDT`} />
          <Row label="Network Fee (0.1%)" value={`${fee.toFixed(2)} USDT`} />
          <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-semibold text-slate-900">
            <span>Net Received</span>
            <span>{net.toFixed(2)} USDT</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.print()}
              className="flex-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-slate-900 text-white hover:bg-slate-800"
            >
              <Download className="mr-2 h-4 w-4" />
              Save Receipt
            </Button>
          </div>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">
            This is an official receipt from Bloomberg Trading AI. Keep it for your records.
            <br />© {new Date().getFullYear()} Bloomberg Wallet · Institutional Grade Liquidity
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  mono,
  truncate,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span
        className={
          "min-w-0 text-right text-slate-800 " +
          (mono ? "font-mono text-[11.5px] " : "") +
          (truncate ? "truncate" : "break-all")
        }
      >
        {value}
      </span>
    </div>
  );
}
