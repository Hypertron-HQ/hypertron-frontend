"use client";

import { useState } from "react";
import {
  BookOpen,
  CheckCheck,
  ChevronDown,
  Loader2,
  Mail,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { useHubPageMeta } from "@/components/dashboard/workspace-hub/hub-page-meta-context";
import { hubNavBreadcrumbs } from "@/lib/hub-nav-routes";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { hubThemeClasses } from "@/components/dashboard/workspace-hub/workspace-hub-theme-classes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils";

const CHANNELS = [
  {
    icon: MessageCircle,
    title: "Live chat",
    description: "Chat with our team in real time, Mon–Fri.",
    action: "Start a chat",
    href: "#",
  },
  {
    icon: Mail,
    title: "Email support",
    description: "Reach us at support@hypertron.io anytime.",
    action: "Send an email",
    href: "mailto:support@hypertron.io",
  },
  {
    icon: BookOpen,
    title: "Documentation",
    description: "Browse guides and step-by-step help for Hypertron.",
    action: "Open docs",
    href: "/doc",
  },
];

const FAQS = [
  {
    q: "How do I create a new workspace?",
    a: "From the Workspaces hub, click “Create Workspace” and follow the onboarding steps. You can also start from a template to get set up faster.",
  },
  {
    q: "How do I change my plan?",
    a: "Go to Billing & Plans in the sidebar, pick the tier that fits your needs, and click “Update plan”. Changes take effect immediately.",
  },
  {
    q: "How is my data secured?",
    a: "All sensitive documents are stored in the Secure Vault with encryption at rest, and wallet authentication is handled through Freighter.",
  },
  {
    q: "Can I invite team members?",
    a: "Yes. Open a workspace, go to Employee Management, and invite members by email or wallet address with role-based access.",
  },
];

export default function SupportPage() {
  const { theme } = useDashboardTheme();
  const t = hubThemeClasses(theme);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useHubPageMeta({
    breadcrumbs: hubNavBreadcrumbs("Support"),
    title: "Support",
    subtitle: "Get help, browse answers, or reach out to our team.",
  });

  const inputCls = cn(
    "rounded-lg border shadow-none",
    t.dark
      ? "border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 focus:border-blue-500/40 focus:ring-blue-500/20"
      : "border-ui-border/80 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500/40 focus:ring-blue-500/20"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setSubject("");
      setMessage("");
      setTimeout(() => setSent(false), 3000);
    }, 800);
  };

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-3">
        {CHANNELS.map(({ icon: Icon, title, description, action, href }) => (
          <a
            key={title}
            href={href}
            className={cn(
              "group flex flex-col rounded-2xl border p-5 transition-colors hover:border-blue-300/60",
              t.card
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <p className={cn("mt-3 text-sm font-semibold", t.cardTitle)}>{title}</p>
            <p className={cn("mt-1 flex-1 text-xs leading-relaxed", t.cardMeta)}>{description}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600">
              {action}
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
          </a>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className={cn("overflow-hidden rounded-2xl border shadow-none lg:col-span-3", t.card)}>
          <div className={cn("border-b px-5 py-4", t.cardDivider)}>
            <p className={cn("text-sm font-semibold", t.cardTitle)}>Frequently asked questions</p>
            <p className={cn("mt-0.5 text-xs", t.cardMeta)}>Quick answers to common questions.</p>
          </div>
          <div className={cn("divide-y", t.cardDivider)}>
            {FAQS.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={faq.q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left"
                  >
                    <span className={cn("text-sm font-medium", t.cardTitle)}>{faq.q}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform",
                        t.cardMuted,
                        open && "rotate-180"
                      )}
                    />
                  </button>
                  {open ? (
                    <p className={cn("px-5 pb-4 text-sm leading-relaxed", t.cardMeta)}>{faq.a}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className={cn("rounded-2xl border shadow-none lg:col-span-2", t.card)}>
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <p className={cn("text-sm font-semibold", t.cardTitle)}>Send us a message</p>
                <p className={cn("mt-0.5 text-xs", t.cardMeta)}>
                  We typically reply within one business day.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="support-subject" className={cn("text-xs", t.cardMeta)}>
                  Subject
                </Label>
                <Input
                  id="support-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What do you need help with?"
                  className={cn("h-10", inputCls)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="support-message" className={cn("text-xs", t.cardMeta)}>
                  Message
                </Label>
                <Textarea
                  id="support-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail…"
                  className={cn("min-h-[120px] resize-none", inputCls)}
                />
              </div>

              <Button
                type="submit"
                disabled={sending || !subject.trim() || !message.trim()}
                className={cn(
                  "h-10 rounded-xl text-sm font-semibold shadow-none",
                  sent
                    ? "bg-emerald-600 text-white hover:bg-emerald-600"
                    : "hub-cta bg-blue-600 text-white hover:bg-blue-500"
                )}
              >
                {sent ? (
                  <>
                    <CheckCheck className="mr-1.5 h-4 w-4" /> Message sent
                  </>
                ) : sending ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  "Send message"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
