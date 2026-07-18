"use client";

import { REVIEWS } from "@/utils/constants/misc";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "./section-header";
import { glassCard } from "./glass-card";
import { cn } from "@/utils";

const ROW_A = REVIEWS.slice(0, 5);
const ROW_B = REVIEWS.slice(5);

function TestimonialCard({ r }: { r: (typeof REVIEWS)[number] }) {
  return (
    <Card className={cn("mr-4 w-[340px] shrink-0 sm:w-[380px]", glassCard)}>
      <CardContent className="flex h-full flex-col gap-4 p-6">
        <div className="flex items-center gap-1 text-amber-300">
          {Array.from({ length: r.rating }).map((_, i) => (
            <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden>
              <path d="M10 1.5l2.6 5.3 5.9.85-4.25 4.14 1 5.86L10 14.9l-5.25 2.76 1-5.86L1.5 7.65l5.9-.85L10 1.5z" />
            </svg>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-white/75">&ldquo;{r.review}&rdquo;</p>
        <div className="mt-auto flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={r.avatar}
            alt={r.name}
            className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10"
          />
          <div>
            <p className="text-sm font-medium text-white">{r.name}</p>
            <p className="text-xs text-white/50">{r.username}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Marquee({ items, reverse = false }: { items: typeof REVIEWS; reverse?: boolean }) {
  const list = [...items, ...items];
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-black/90 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-black/90 to-transparent" />
      <div
        className={`flex w-max shrink-0 ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}
        style={{ "--duration": "55s" } as React.CSSProperties}
      >
        {list.map((r, i) => (
          <TestimonialCard key={`${r.username}-${i}`} r={r} />
        ))}
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="relative border-t border-border/30 py-24 md:py-32"
    >
      <div className="mx-auto mb-14 max-w-6xl px-6 md:px-8">
        <SectionHeader
          eyebrow="Loved by operators"
          title={
            <>
              Teams shipping faster with{" "}
              <span className="font-serif font-normal italic">one</span> pipeline
            </>
          }
        />
      </div>

      <div className="flex flex-col gap-4">
        <Marquee items={ROW_A as unknown as typeof REVIEWS} />
        <Marquee items={ROW_B as unknown as typeof REVIEWS} reverse />
      </div>
    </section>
  );
}
