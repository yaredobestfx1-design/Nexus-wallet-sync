import { motion } from "framer-motion";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDeposit, DEPOSIT_ADDRESS, type Transaction } from "@/lib/wallet-store";

interface Props {
  userEmail: string;
  onConfirmed: (tx: Transaction) => void;
}

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024; // 5MB

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function DepositTab({ userEmail, onConfirmed }: Props) {
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState(userEmail);
  const [txid, setTxid] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const numericAmount = Number(amount);
  const validEmail = /\S+@\S+\.\S+/.test(email);
  const validTxid = txid.trim().length >= 10;
  const canSubmit =
    !submitting &&
    numericAmount > 0 &&
    validEmail &&
    validTxid &&
    screenshot !== null;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Screenshot must be an image file");
      return;
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      toast.error("Screenshot must be under 5MB");
      return;
    }
    try {
      const dataUrl = await readFileAsDataURL(file);
      setScreenshot(dataUrl);
      setScreenshotName(file.name);
    } catch {
      toast.error("Failed to read screenshot");
    }
  }

  function clearScreenshot() {
    setScreenshot(null);
    setScreenshotName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      if (!screenshot) toast.error("Payment screenshot is required");
      else if (!validTxid) toast.error("Enter a valid transaction hash");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1400));
    const tx = addDeposit({
      amount: numericAmount,
      address: DEPOSIT_ADDRESS,
      txid: txid.trim(),
      email: email.trim(),
      screenshot: screenshot ?? undefined,
    });
    setSubmitting(false);
    setAmount("");
    setTxid("");
    clearScreenshot();
    toast.success(`Deposit of ${numericAmount.toLocaleString()} USDT credited`);
    onConfirmed(tx);
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <Field label="Network">
        <div className="rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white">
          USDT (TRC20)
        </div>
      </Field>

      <Field label="Deposit Amount (USD)" required>
        <Input
          inputMode="decimal"
          placeholder="Enter deposit amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          className="border-white/10 bg-[#0a0f1a] text-white placeholder:text-white/40"
        />
      </Field>

      <Field label="Payment Screenshot" required>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
        {screenshot ? (
          <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#0a0f1a]">
            <img
              src={screenshot}
              alt="Payment proof preview"
              className="max-h-48 w-full object-contain"
            />
            <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2">
              <span className="truncate text-[11px] text-white/60">
                {screenshotName}
              </span>
              <button
                type="button"
                onClick={clearScreenshot}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-500/10"
              >
                <X className="h-3 w-3" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-[#0a0f1a] px-3 py-6 text-center text-white/60 transition-colors hover:border-blue-500/40 hover:text-white"
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-sm font-medium">Upload payment screenshot</span>
            <span className="text-[11px] text-white/40">PNG or JPG, up to 5MB</span>
          </button>
        )}
      </Field>

      <Field label="Transaction Hash (TXID)" required>
        <Input
          placeholder="Paste the on-chain transaction hash"
          value={txid}
          onChange={(e) => setTxid(e.target.value.trim())}
          className="border-white/10 bg-[#0a0f1a] font-mono text-[13px] text-white placeholder:text-white/40"
        />
      </Field>

      <Field label="Your Email Address" required>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-white/10 bg-[#0a0f1a] text-white placeholder:text-white/40"
        />
        <p className="mt-1.5 text-[11px] text-white/50">
          For deposit confirmation and account matching.
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
            Processing deposit…
          </>
        ) : (
          "Continue"
        )}
      </Button>
    </motion.form>
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
