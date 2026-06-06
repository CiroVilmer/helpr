"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  MessageCircle,
  Phone,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BotShareCard({
  phone,
  shareUrl,
}: {
  // E.164 number (e.g. "+5491155555555") or null when env var isn't set.
  phone: string | null;
  // Full wa.me URL, or null when phone is missing.
  shareUrl: string | null;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  const configured = Boolean(phone && shareUrl);

  return (
    <div className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-bosque/10 text-bosque">
          <MessageCircle className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold text-tinta">
            Compartir el bot
          </h2>
          <p className="mt-1 text-sm text-tinta-suave">
            Mandales este link a tu equipo para que empiecen a chatear con el
            bot por WhatsApp. Cada mensaje queda registrado y se convierte en
            tareas en este panel.
          </p>

          {configured ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-linea bg-muted/40 px-3 py-2 text-sm">
              <Phone
                className="size-4 shrink-0 text-tinta-suave"
                aria-hidden="true"
              />
              <span className="truncate font-mono text-tinta">{phone}</span>
            </div>
          ) : (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-lg bg-ambar/15 px-3 py-2.5 text-sm text-[#7a4d00]"
            >
              <AlertCircle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              Para activar el botón configurá <code className="rounded bg-ambar/20 px-1 py-0.5 font-mono text-xs">BOT_WHATSAPP_NUMBER</code> en las variables de entorno.
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {configured && shareUrl ? (
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants())}
                aria-label="Abrir el chat del bot en WhatsApp"
              >
                <MessageCircle aria-hidden="true" />
                Abrir chat del bot
              </a>
            ) : (
              <Button disabled>
                <MessageCircle aria-hidden="true" />
                Abrir chat del bot
              </Button>
            )}

            <Button variant="outline" onClick={copy} disabled={!configured}>
              {copied ? (
                <>
                  <Check aria-hidden="true" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy aria-hidden="true" />
                  Copiar link
                </>
              )}
            </Button>
          </div>

          {configured && shareUrl && (
            <code className="mt-3 block truncate rounded-md bg-muted px-2 py-1.5 font-mono text-xs text-tinta-suave">
              {shareUrl}
            </code>
          )}
        </div>
      </div>
    </div>
  );
}
