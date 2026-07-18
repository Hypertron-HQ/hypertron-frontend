import { redirect } from "next/navigation";
import { DEMO_SANDBOX_OVERVIEW_PATH } from "@/lib/demo-routes";

export default function DemoIndexPage() {
  redirect(DEMO_SANDBOX_OVERVIEW_PATH);
}
