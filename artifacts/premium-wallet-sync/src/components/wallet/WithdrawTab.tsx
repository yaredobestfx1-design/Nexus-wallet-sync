import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addWithdraw, type Transaction } from "@/lib/wallet-store";

import { InvoiceReceipt } from "./InvoiceReceipt";

interface Props {
  userEmail: string;
  availableBalance: number;
  onConfirmed: (tx: Transaction) => void;
}

const STAGES = [
  { key: "verify", label: "Verifying account & 2FA" },
  { key: "sign", label: "Signing transaction securely" },
  { key: "broadcast", label: "Broadcasting to TRC20 network" },
  { key: "confirm", label: "Confirming on-chain" },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

const NETWORKS = [
  { value: "TRC20", label: "Tron (TRC20) — USDT" },
  { value: "ERC20", label: "Ethereum (ERC20) — USDT / ETH" },
  { value: "BEP20", label: "BNB Smart Chain (BEP20)" },
  { value: "BTC", label: "Bitcoin (BTC)" },
  { value: "LTC", label: "Litecoin (LTC)" },
  { value: "BCH", label: "Bitcoin Cash (BCH)" },
  { value: "DOGE", label: "Dogecoin (DOGE)" },
  { value: "SOL", label: "Solana (SOL / SPL)" },
  { value: "MATIC", label: "Polygon (MATIC / POS)" },
  { value: "ARBITRUM", label: "Arbitrum One" },
  { value: "OPTIMISM", label: "Optimism" },
  { value: "AVAXC", label: "Avalanche C-Chain" },
  { value: "BASE", label: "Base" },
  { value: "TON", label: "TON (Toncoin)" },
  { value: "XRP", label: "Ripple (XRP)" },
  { value: "ADA", label: "Cardano (ADA)" },
  { value: "DOT", label: "Polkadot (DOT)" },
  { value: "NEAR", label: "NEAR Protocol" },
  { value: "ATOM", label: "Cosmos (ATOM)" },
  { value: "ALGO", label: "Algorand (ALGO)" },
  { value: "XLM", label: "Stellar (XLM)" },
  { value: "FTM", label: "Fantom Opera" },
] as const;

export function WithdrawTab({ userEmail, availableBalance, onConfirmed }: Props) {
  const [network, setNetwork] = useState<string>("TRC20");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState(userEmail);
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState<StageKey | "done" | null>(null);
  const [receipt, setReceipt] = useState<Transaction | null>(null);

  const numericAmount = Number(amount);
  const validAddress = address.trim().length >= 10;
  const validEmail = /\S+@\S+\.\S+/.test(email);
  const validAmount = numericAmount > 0;
  const canSubmit = !submitting && validAddress && validAmount && validEmail;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    if (numericAmount > availableBalance) {
      toast.error("Insufficient Balance");
      return;
    }
    setSubmitting(true);

    // Multi-stage professional loading (~4s total)
    for (const s of STAGES) {
      setStage(s.key);
      await new Promise((r) => setTimeout(r, 900 + Math.random() * 250));
    }
    setStage("done");
    await new Promise((r) => setTimeout(r, 350));

    const tx = addWithdraw({
      amount: numericAmount,
      address: address.trim(),
      email: email.trim(),
    });

    setSubmitting(false);
    setStage(null);
    setAddress("");
    setAmount("");
    toast.success("Withdrawal approved · Invoice generated");
    setReceipt(tx);
    onConfirmed(tx);
  }


  return (
    <>
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-5"
      >
        <div>
          <h3 className="text-lg font-semibold text-white">Funds Withdrawal</h3>
          <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Verification Requirements Met
          </div>
        </div>

        <Field label="Network" required>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            disabled={submitting}
            className="h-10 w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 text-sm text-white outline-none focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
          >
            {NETWORKS.map((n) => (
              <option key={n.value} value={n.value} className="bg-[#0a0f1a] text-white">
                {n.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] text-white/50">
            Select the main transfer network for your withdrawal.
          </p>
        </Field>


        <Field label="Your Wallet Address" required>
          <Input
            placeholder="Paste your USDT wallet address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={submitting}
            className="border-white/10 bg-[#0a0f1a] font-mono text-[13px] text-white placeholder:text-white/40"
          />
          <p className="mt-1.5 text-[11px] text-white/50">
            The address we will send your funds to after approval.
          </p>
        </Field>

        <Field label="Withdrawal Amount" required>
          <Input
            inputMode="decimal"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            disabled={submitting}
            className="border-white/10 bg-[#0a0f1a] text-white placeholder:text-white/40"
          />
          {amount && numericAmount > availableBalance && (
            <p className="mt-1.5 text-[11px] text-rose-400">
              Insufficient Balance · Available ${availableBalance.toLocaleString()}
            </p>
          )}
        </Field>

        <Field label="Your Email Address" required>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            className="border-white/10 bg-[#0a0f1a] text-white placeholder:text-white/40"
          />
          <p className="mt-1.5 text-[11px] text-white/50">
            For withdrawal confirmation and account matching.
          </p>
        </Field>

        <Button
          type="submit"
          disabled={!canSubmit}
          className="h-11 w-full bg-blue-600 text-white hover:bg-blue-500 disabled:bg-white/[0.04] disabled:text-white/40"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing withdrawal…
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </motion.form>

      <ProcessingOverlay stage={stage} />

      <InvoiceReceipt
        open={receipt !== null}
        onOpenChange={(o) => !o && setReceipt(null)}
        tx={receipt}
      />
    </>
  );
}

function ProcessingOverlay({ stage }: { stage: StageKey | "done" | null }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (stage === null) {
      setProgress(0);
      return;
    }
    if (stage === "done") {
      setProgress(100);
      return;
    }
    const idx = STAGES.findIndex((s) => s.key === stage);
    setProgress(((idx + 1) / STAGES.length) * 100);
  }, [stage]);

  return (
    <AnimatePresence>
      {stage !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.94, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0f1621] p-6 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-inset ring-blue-500/30">
                {stage === "done" ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  >
                    <Check className="h-5 w-5 text-emerald-400" />
                  </motion.div>
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                )}
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                  Secure Withdrawal
                </div>
                <div className="text-sm font-semibold text-white">
                  {stage === "done" ? "Approved · Generating receipt" : "Processing your request"}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            {/* Stage list */}
            <ul className="mt-5 space-y-2.5">
              {STAGES.map((s, i) => {
                const currentIdx =
                  stage === "done" ? STAGES.length : STAGES.findIndex((x) => x.key === stage);
                const status: "done" | "active" | "pending" =
                  i < currentIdx ? "done" : i === currentIdx ? "active" : "pending";
                return (
                  <li key={s.key} className="flex items-center gap-2.5 text-[13px]">
                    <span
                      className={
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full " +
                        (status === "done"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : status === "active"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-white/[0.05] text-white/30")
                      }
                    >
                      {status === "done" ? (
                        <Check className="h-3 w-3" />
                      ) : status === "active" ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <span className="h-1 w-1 rounded-full bg-current" />
                      )}
                    </span>
                    <span
                      className={
                        status === "pending"
                          ? "text-white/40"
                          : status === "active"
                            ? "text-white"
                            : "text-white/70 line-through decoration-white/20"
                      }
                    >
                      {s.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/60">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
    </div>
  );
}
