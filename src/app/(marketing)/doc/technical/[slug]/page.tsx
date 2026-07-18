import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DocTechnicalView } from "@/components/doc/doc-technical-view";
import { getAllTechnicalSlugs, getTechnicalPage } from "@/lib/doc/doc-technical-pages";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return getAllTechnicalSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const page = getTechnicalPage(params.slug);
  if (!page) return { title: "Technical architecture | Hypertron Docs" };
  return {
    title: `${page.title} | Hypertron Technical Docs`,
    description: page.subtitle,
  };
}

export default function DocTechnicalSlugPage({ params }: Props) {
  const page = getTechnicalPage(params.slug);
  if (!page) notFound();
  return <DocTechnicalView slug={params.slug} />;
}
