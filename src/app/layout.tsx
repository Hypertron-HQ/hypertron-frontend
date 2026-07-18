import Providers from "@/components/providers/providers";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import { DASHBOARD_THEME_BOOTSTRAP_SCRIPT } from "@/lib/dashboard-theme";
import { aeonik, cn, generateMetadata, instrumentSerif, inter } from "@/utils";
import { Analytics } from "@vercel/analytics/next";

/*
 * Optional background snippets (not rendered). Previously lived after `RootLayout`'s closing
 * brace, which is invalid TSX at module scope—kept here for reference if you re-enable.
 *
 * <div className="absolute top-0 z-[-2] h-screen w-screen bg-background bg-[radial-gradient(100%_50%_at_50%_0%,rgba(168,85,247,0.13)_0,rgba(168,85,247,0)_50%,rgba(168,85,247,0)_100%)]" />
 *
 * <AnimatedBackground
 *   numSquares={6}
 *   maxOpacity={0.2}
 *   duration={10}
 *   repeatDelay={10}
 *   className={cn(
 *     "[mask-image:radial-gradient(800px_circle_at_center,black,transparent)]",
 *     "inset-0 w-full h-[100%] inset-y-[-30%] hidden md:block",
 *   )}
 * />
 */

export const metadata = generateMetadata();

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="scrollbar" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: DASHBOARD_THEME_BOOTSTRAP_SCRIPT }} />
            </head>
            <body
                className={cn(
                    "min-h-screen bg-background text-foreground antialiased !font-default overflow-x-hidden",
                    aeonik.variable,
                    inter.variable,
                    instrumentSerif.variable,
                )}
            >
                <Providers>
                    <Toaster richColors theme="dark" position="top-right" />
                    {children}
                </Providers>
                <Analytics />
            </body>
        </html>
    );
}