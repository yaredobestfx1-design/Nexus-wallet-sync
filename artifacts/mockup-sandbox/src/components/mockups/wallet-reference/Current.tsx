import { WalletUi } from "./_shared/WalletUi";

export function Current() {
  return (
    <WalletUi
      balanceLabel="$13,126.95"
      activities={[]}
      withdrawalNetworks={["TRC20", "ERC20", "BSC"]}
    />
  );
}
