import { isConnected, requestAccess } from "@stellar/freighter-api";

export const FREIGHTER_INSTALL_URL = "https://www.freighter.app/";

export type FreighterConnectResult =
  | { ok: true; walletAddress: string }
  | { ok: false; error: string; needsInstall?: boolean };

/**
 * Frontend-only Freighter connect: request access and return the public key.
 *
 * TODO(auth):
 * - After connect, request a server challenge, Freighter signMessage, then verify
 *   (same shape as legacy SEP-53 wallet sign-in).
 * - On success, establish HttpOnly session cookie; stop treating connect-only as login.
 */
export async function connectFreighter(
  onStatus?: (message: string) => void
): Promise<FreighterConnectResult> {
  onStatus?.("Checking Freighter…");

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

  onStatus?.("Connecting to Freighter…");
  const access = await requestAccess();
  if (access?.error || !access?.address) {
    const message = access?.error?.message ?? "Could not get wallet address.";
    const needsInstall =
      message.toLowerCase().includes("not installed") ||
      message.toLowerCase().includes("freighter");
    return { ok: false, error: message, needsInstall };
  }

  return { ok: true, walletAddress: access.address };
}
