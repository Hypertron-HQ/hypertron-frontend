import { redirect } from "next/navigation";
import { homeLaunchPath, safeReturnUrl } from "@/lib/launch-auth";

type WalletSessionRedirectProps = {
  searchParams?: { returnUrl?: string };
};

/** Legacy URL — send users to the homepage Launch flow instead of a standalone sign-in page. */
export default function WalletSessionRedirect({ searchParams }: WalletSessionRedirectProps) {
  const returnUrl = safeReturnUrl(searchParams?.returnUrl);
  redirect(homeLaunchPath(returnUrl, { wallet: true }));
}
