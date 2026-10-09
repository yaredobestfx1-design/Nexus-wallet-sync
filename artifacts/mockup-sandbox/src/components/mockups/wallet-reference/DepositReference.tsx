import { WalletUi } from "./_reference/WalletUi";

export function DepositReference() {
  return (
    <WalletUi
      balanceLabel="$1,307.46"
      depositAmountLabel="100.00"
      initialTab="deposit"
      depositExtraFields={
        <>
          <label className="nw-label" htmlFor="nw-deposit-proof-preview">Payment screenshot</label>
          <div className="nw-input-wrap">
            <span aria-hidden="true">⇪</span>
            <input id="nw-deposit-proof-preview" placeholder="Upload payment screenshot" readOnly />
          </div>
          <label className="nw-label" htmlFor="nw-deposit-txid-preview">Transaction hash (TXID)</label>
          <input id="nw-deposit-txid-preview" className="nw-mono" placeholder="Paste transaction hash" readOnly />
          <div style={{ height: 17 }} />
        </>
      }
      onDepositContinue={() => undefined}
    />
  );
}
