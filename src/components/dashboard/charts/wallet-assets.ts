/**
 * Wallet assets config – logos from project ratings (frontend).
 * Extend this list when you add more tokens; wire to your wallet/API for balances.
 */
export type WalletAssetId = "xlm" | "pyusd" | "eurc";

export interface WalletAsset {
  id: WalletAssetId;
  name: string;
  ticker: string;
  logo: string;
}

export const WALLET_ASSETS: WalletAsset[] = [
  {
    id: "xlm",
    name: "Stellar",
    ticker: "XLM",
    logo: "https://coin-images.coingecko.com/coins/images/100/large/fmpFRHHQ_400x400.jpg?1735231350",
  },
  {
    id: "pyusd",
    name: "PayPal USD",
    ticker: "PYUSD",
    logo: "https://coin-images.coingecko.com/coins/images/31212/large/PYUSD_Token_Logo_2x.png?1765987788",
  },
  {
    id: "eurc",
    name: "EURC",
    ticker: "EURC",
    logo: "https://coin-images.coingecko.com/coins/images/26045/large/EURC.png?1769615705",
  },
];
