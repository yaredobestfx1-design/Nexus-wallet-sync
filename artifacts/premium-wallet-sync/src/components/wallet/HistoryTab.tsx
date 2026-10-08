import { AnimatePresence, motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { useState } from "react";

import { EmailNotification } from "./EmailNotification";
import type { Transaction } from "@/lib/wallet-store";

interface Props {
  transactions: Transaction[];
  userName: string;
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US");
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusStyles: Record<Transaction["status"], string> = {
  pending: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/25",
  approved: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/25",
  rejected: "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/25",
};

export function HistoryTab({ transactions, userName }: Props) {
  const visible = transactions.filter((t) => t.status !== "pending");
  const [selected, setSelected] = useState<Transaction | null>(null);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h3 className="text-lg font-semibold text-white">Transaction History</h3>

        {visible.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#0a0f1a] px-6 py-12 text-center">
            <Inbox className="h-8 w-8 text-white/30" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-white/80">No transactions yet</p>
            <p className="mt-1 text-xs text-white/50">
              Your deposits and withdrawals will appear here.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            <AnimatePresence initial={false}>
              {visible.map((tx) => {
                const isDeposit = tx.kind === "deposit";
                return (
                  <motion.li
                    key={tx.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(tx)}
                      className="block w-full rounded-xl border border-white/10 bg-[#0a0f1a] p-4 text-left transition-colors hover:border-white/20 hover:bg-white/[0.02] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={
                            "text-sm font-semibold " +
                            (isDeposit ? "text-emerald-400" : "text-blue-400")
                          }
                        >
                          {isDeposit ? "Deposit" : "Withdraw"}
                        </div>
                        <span
                          className={
                            "rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize " +
                            statusStyles[tx.status]
                          }
                        >
                          {tx.status}
                        </span>
                      </div>
                      <div
                        className={
                          "mt-1 text-base font-semibold " +
                          (isDeposit ? "text-emerald-400" : "text-amber-400")
                        }
                      >
                        ${tx.amount.toLocaleString()}
                      </div>
                      <div className="mt-0.5 text-[12px] text-white/60">
                        {tx.currency} ({tx.network}) · {formatDate(tx.createdAt)} ·{" "}
                        {formatTime(tx.createdAt)}
                      </div>
                      <div className="mt-1 truncate font-mono text-[11px] text-white/40">
                        TXID: {tx.txid}
                      </div>
                      <div className="mt-0.5 truncate font-mono text-[11px] text-white/40">
                        To: {tx.address}
                      </div>
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </motion.div>

      <EmailNotification
        open={selected !== null}
        onOpenChange={(o) => !o && setSelected(null)}
        tx={selected}
        userName={userName}
      />
    </>
  );
}
