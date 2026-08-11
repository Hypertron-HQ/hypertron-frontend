import {
  isConnected,
  requestAccess,
  signMessage,
} from "@stellar/freighter-api";
import { requestAuthChallenge, verifyAuth } from "@/lib/auth";

export const FREIGHTER_INSTALL_URL = "https://www.freighter.app/";

export type WalletSignInResult =
  | { ok: true; walletAddress: string }
  | { ok: false; error: string; needsInstall?: boolean };

function encodeSignedMessage(signedMessage: string | Uint8Array): string {
  if (typeof signedMessage === "string") return signedMessage;

  let bin = "";
  for (let i = 0; i < signedMessage.length; i++) {
    bin += String.fromCharCode(signedMessage[i]!);
  }
  return btoa(bin);
}

/**
 * Freighter connect → SEP-53 challenge → sign → verify against core backend.
 * On success the browser stores the HttpOnly `ht_dashboard` cookie.
 */
export async function runWalletSignInFlow(
  onStatus?: (message: string) => void,
): Promise<WalletSignInResult> {
  onStatus?.("Connecting…");

  let connected: Awaited<ReturnType<typeof isConnected>>;
  try {
    connected = await isConnected();
  } catch {
    return {
      ok: false,
      error: "Install the Freighter browser extension to continue.",
      needsInstall: true,
    };
  }

  if (!connected?.isConnected) {
    return {
      ok: false,
      error: "Install the Freighter browser extension to continue.",
      needsInstall: true,
    };
  }

  const access = await requestAccess();
  if (access?.error || !access?.address) {
    const message = access?.error?.message ?? "Could not get wallet address.";
    const needsInstall =
      message.toLowerCase().includes("not installed") ||
      message.toLowerCase().includes("freighter");
    return { ok: false, error: message, needsInstall };
  }

  const walletAddress = access.address;

  onStatus?.("Requesting challenge…");
  const challenge = await requestAuthChallenge(walletAddress);
  if (!challenge.ok) {
    return { ok: false, error: challenge.error };
  }

  onStatus?.("Sign in Freighter…");
  let signResult: Awaited<ReturnType<typeof signMessage>>;
  try {
    signResult = await signMessage(challenge.challenge.message, {
      address: walletAddress,
    });
  } catch {
    return { ok: false, error: "Signing failed." };
  }

  if (signResult?.error || signResult?.signedMessage == null) {
    return {
      ok: false,
      error: signResult?.error?.message ?? "Signing failed.",
    };
  }

  const signedMessage = encodeSignedMessage(
    signResult.signedMessage as string | Uint8Array,
  );

  onStatus?.("Verifying…");
  const verified = await verifyAuth({
    challengeId: challenge.challenge.challengeId,
    walletAddress,
    signedMessage,
  });

  if (!verified.ok) {
    return { ok: false, error: verified.error };
  }

  return { ok: true, walletAddress: verified.walletAddress };
}
