import { useSyncExternalStore } from "react";

export type TxKind = "deposit" | "withdraw";
export type TxStatus = "pending" | "approved" | "rejected";

export interface Transaction {
  id: string;
  kind: TxKind;
  amount: number;
  currency: "USDT";
  network: "TRC20";
  address: string;
  txid: string;
  email: string;
  status: TxStatus;
  createdAt: number; // epoch ms
  confirmations?: number;
  note?: string;
  screenshot?: string; // data URL for deposit proof
}

interface WalletState {
  balance: number; // available balance (USD)
  transactions: Transaction[];
  user: { name: string; email: string; initial: string };
}

const STORAGE_KEY = "bloomberg_wallet_state_v1";

const DEFAULT_STATE: WalletState = {
  balance: 13126.95,
  user: { name: "Ammar", email: "ammartrades01@gmail.com", initial: "A" },
  transactions: [],
};

let state: WalletState = DEFAULT_STATE;
const listeners = new Set<() => void>();

function load(): WalletState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as WalletState;
    if (typeof parsed.balance !== "number" || !Array.isArray(parsed.transactions)) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

function emit() {
  for (const l of listeners) l();
}

let hydrated = false;
function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  state = load();
  hydrated = true;
}

function subscribe(fn: () => void) {
  ensureHydrated();
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot(): WalletState {
  ensureHydrated();
  return state;
}

function getServerSnapshot(): WalletState {
  return DEFAULT_STATE;
}

export function useWallet() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setBalance(amount: number) {
  setState((s) => ({ ...s, balance: +amount.toFixed(2) }));
}


function setState(updater: (s: WalletState) => WalletState) {
  state = updater(state);
  persist();
  emit();
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function makeTxid() {
  const chars = "abcdef0123456789";
  let s = "";
  for (let i = 0; i < 64; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function addDeposit(input: {
  amount: number;
  address: string;
  txid: string;
  email: string;
  screenshot?: string;
}): Transaction {
  const tx: Transaction = {
    id: makeId("dep"),
    kind: "deposit",
    amount: input.amount,
    currency: "USDT",
    network: "TRC20",
    address: input.address,
    txid: input.txid || makeTxid(),
    email: input.email,
    status: "approved",
    createdAt: Date.now(),
    confirmations: 32,
    screenshot: input.screenshot,
  };
  setState((s) => ({
    ...s,
    balance: +(s.balance + input.amount).toFixed(2),
    transactions: [tx, ...s.transactions],
  }));
  return tx;
}

export function addWithdraw(input: {
  amount: number;
  address: string;
  email: string;
  txid?: string;
}): Transaction {
  const tx: Transaction = {
    id: makeId("wd"),
    kind: "withdraw",
    amount: input.amount,
    currency: "USDT",
    network: "TRC20",
    address: input.address,
    txid: input.txid || makeTxid().slice(0, 12),
    email: input.email,
    status: "approved",
    createdAt: Date.now(),
  };
  setState((s) => ({
    ...s,
    balance: +(s.balance - input.amount).toFixed(2),
    transactions: [tx, ...s.transactions],
  }));
  return tx;
}

export function pendingTotal(txs: Transaction[]): number {
  return txs
    .filter((t) => t.status === "pending" && t.kind === "withdraw")
    .reduce((sum, t) => sum + t.amount, 0);
}

export const DEPOSIT_ADDRESS = "TD7d61sUg5C2sYf5iWdKdSjSXtUDqfwWim";
