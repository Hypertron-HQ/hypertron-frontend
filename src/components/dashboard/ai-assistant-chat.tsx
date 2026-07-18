"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/utils";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTED_PROMPTS = [
  "Help me with payment links",
  "Explain compliance requirements",
  "Draft a customer email",
  "Summarize my recent activity",
];

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-4",
        isUser ? "bg-muted/30" : "bg-transparent"
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0 rounded-md">
          <AvatarFallback className="rounded-md bg-primary/20">
            <Bot className="h-4 w-4 text-primary" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "min-w-0 flex-1 space-y-1",
          isUser && "flex justify-end"
        )}
      >
        <div
          className={cn(
            "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "ml-auto bg-primary text-primary-foreground"
              : "rounded-bl-md bg-muted text-foreground"
          )}
        >
          {message.content}
        </div>
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 shrink-0 rounded-full">
          <AvatarFallback className="rounded-full bg-muted text-xs">
            You
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

export function AiAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Placeholder: simulate assistant reply (replace with real API later)
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "This is a placeholder response. Connect an AI API to get real answers about your payments, compliance, and business.",
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const empty = messages.length === 0;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-3xl">
            {empty ? (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h2 className="mb-1 text-xl font-semibold">
                  Custom AI Assistant
                </h2>
                <p className="mb-8 max-w-sm text-sm text-muted-foreground">
                  Ask anything about payments, compliance, or your business.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {isLoading && (
                  <div className="flex gap-3 px-4 py-4">
                    <Avatar className="h-8 w-8 shrink-0 rounded-md">
                      <AvatarFallback className="rounded-md bg-primary/20">
                        <Bot className="h-4 w-4 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-muted px-4 py-2.5">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-muted-foreground" />
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-muted-foreground [animation-delay:0.2s]" />
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-muted-foreground [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t border-border bg-background">
          <div className="mx-auto max-w-3xl px-4 py-4">
            <form onSubmit={handleSubmit} className="relative flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Custom AI Assistant..."
                className="min-h-[52px] max-h-[200px] resize-none pr-12 py-3"
                rows={1}
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-2 bottom-2 h-9 w-9 shrink-0 rounded-lg"
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
    </div>
  );
}
