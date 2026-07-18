import { redirect } from "next/navigation";
import { homeLaunchPath } from "@/lib/launch-auth";

type Props = {
  searchParams?: { returnUrl?: string; plan?: string };
};

/** Sign-up lives on the home Launch dialog — never render this page. */
export default function SignUpPage({ searchParams }: Props) {
  redirect(homeLaunchPath(searchParams?.returnUrl));
}
