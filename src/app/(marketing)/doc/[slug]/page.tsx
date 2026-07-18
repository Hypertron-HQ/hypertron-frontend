import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DocPageView } from "@/components/doc/doc-page-view";
import { DOC_PAGES, getAllDocSlugs } from "@/lib/doc/doc-pages";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return getAllDocSlugs()
    .filter((slug) => slug !== "introduction")
    .map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const page = DOC_PAGES[params.slug];
  if (!page) return { title: "Documentation" };
  return {
    title: `${page.title} | Hypertron Docs`,
    description: page.subtitle,
  };
}

export default function DocSlugPage({ params }: Props) {
  const page = DOC_PAGES[params.slug];
  if (!page || params.slug === "introduction") notFound();
  return <DocPageView page={page} />;
}
