import { WalletUi } from "./_reference/WalletUi";

export function WithdrawReference() {
  return (
    <WalletUi
      balanceLabel="$1,307.46"
      initialTab="withdraw"
      withdrawalNetworks={["TRC20", "ERC20", "BEP20", "BTC", "LTC", "BCH", "DOGE", "SOL", "MATIC", "ARBITRUM", "OPTIMISM", "AVAXC", "BASE", "TON", "XRP", "ADA", "DOT", "NEAR", "ATOM", "ALGO", "XLM", "FTM"]}
    />
  );
}
