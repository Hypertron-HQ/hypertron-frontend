import { deriveSpendKey, deriveViewingKey } from "@/lib/hypertron-viewkey";
import { fullScan } from "@/lib/hypertron-note-scan";
import { listNotesV2 } from "@/lib/hypertron-note-store-v2";
import {
  confirmSettledLinks,
  type PaymentLinkListItem,
} from "@/lib/payment-links";

function needsMerchantConfirm(link: PaymentLinkListItem): boolean {
  return Boolean(
    link.claimedAt &&
      link.claimOutCommitment &&
      !link.paidAt &&
      !link.confirmedAt,
  );
}

/**
 * Same settle Treasury already runs: scan blobs with the merchant viewing key,
 * then POST /confirm for every claimed link whose output note we can see.
 */
export async function settleClaimedPaymentLinks(input: {
  walletAddress: string;
  links: PaymentLinkListItem[];
}): Promise<{ confirmed: number; error?: string }> {
  const claimed = input.links.filter(needsMerchantConfirm);
  if (claimed.length === 0) return { confirmed: 0 };

  const viewKeys = await deriveViewingKey(input.walletAddress);
  if (!viewKeys.ok) return { confirmed: 0, error: viewKeys.error };

  const spendKeys = await deriveSpendKey(input.walletAddress);
  if (!spendKeys.ok) return { confirmed: 0, error: spendKeys.error };

  const scan = await fullScan(
    input.walletAddress,
    viewKeys.keys.viewSecret,
    spendKeys.keys.spendSecret,
  );
  if (scan.state === "indexer_down") {
    return { confirmed: 0, error: scan.error ?? "Indexer unavailable" };
  }

  const notes = await listNotesV2(input.walletAddress);
  const settled = notes
    .filter((note) => note.leafIndex != null)
    .map((note) => note.commitment);

  const confirmed = await confirmSettledLinks(input.links, settled);
  return { confirmed };
}
