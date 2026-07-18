import type { Metadata } from "next";
import { DocPageView } from "@/components/doc/doc-page-view";
import { DOC_PAGES } from "@/lib/doc/doc-pages";

export const metadata: Metadata = {
  title: "Introduction | Hypertron Docs",
  description: DOC_PAGES.introduction.subtitle,
};

export default function DocIndexPage() {
  return <DocPageView page={DOC_PAGES.introduction} />;
}
