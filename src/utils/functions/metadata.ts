import { Metadata } from "next";

export const generateMetadata = ({
    title = `${process.env.NEXT_PUBLIC_APP_NAME || "Hypertron"} - B2B operations & payments on Stellar`,
    description = `${process.env.NEXT_PUBLIC_APP_NAME || "Hypertron"} unifies onboarding, compliance, and Stellar settlement in one operations layer, with AI-assisted workflows and a programmable privacy pool for B2B teams.`,
    image = "/thumbnail.png",
    icons = [
        {
            rel: "apple-touch-icon",
            url: "/logo.png"
        },
        {
            rel: "icon",
            url: "/logo.png"
        },
    ],
    noIndex = false
}: {
    title?: string;
    description?: string;
    image?: string | null;
    icons?: Metadata["icons"];
    noIndex?: boolean;
} = {}): Metadata => {
    const metadataBase =
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      (process.env.NODE_ENV === "production"
        ? "https://www.hypertron.space"
        : "http://localhost:3000");
    return {
    title,
    description,
    icons,
    metadataBase: new URL(metadataBase),
    openGraph: {
        title,
        description,
        ...(image && { images: [{ url: image }] }),
    },
    twitter: {
        title,
        description,
        ...(image && { card: "summary_large_image", images: [image] }),
        creator: "@shreyassihasane",
    },
    ...(noIndex && { robots: { index: false, follow: false } }),
    };
};
