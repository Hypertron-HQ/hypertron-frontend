import { redirect } from "next/navigation";
import { homeLaunchPath } from "@/lib/launch-auth";

type Props = {
  searchParams?: { returnUrl?: string };
};

/** Sign-in lives on the home Launch dialog — never render this page. */
export default function SignInPage({ searchParams }: Props) {
  redirect(homeLaunchPath(searchParams?.returnUrl));
}
