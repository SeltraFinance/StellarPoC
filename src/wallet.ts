import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit-tech/stellar-wallets-kit/modules/utils";
import {
  KitEventType,
  Networks,
  SwkAppDarkTheme,
} from "@creit-tech/stellar-wallets-kit/types";

let initialized = false;

export function initializeWalletKit(): void {
  if (initialized) return;

  StellarWalletsKit.init({
    modules: defaultModules(),
    network: Networks.TESTNET,
    theme: SwkAppDarkTheme,
    authModal: {
      hideUnsupportedWallets: false,
      showInstallLabel: true,
    },
  });

  initialized = true;
}

export async function connectWallet(): Promise<string> {
  initializeWalletKit();
  const { address } = await StellarWalletsKit.authModal();
  return address;
}

export async function disconnectWallet(): Promise<void> {
  initializeWalletKit();
  await StellarWalletsKit.disconnect();
}

export function watchWalletAddress(callback: (address?: string) => void): () => void {
  initializeWalletKit();
  const unsubscribeState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
    callback(event.payload.address);
  });
  const unsubscribeDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
    callback(undefined);
  });

  return () => {
    unsubscribeState();
    unsubscribeDisconnect();
  };
}

export function walletErrorMessage(error: unknown): string {
  if (typeof error === "object" && error && "message" in error) {
    return String(error.message);
  }
  return "The wallet connection was not completed.";
}
