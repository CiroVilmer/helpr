import { PageHeader } from "@/components/dashboard/page-header";
import { BotShareCard } from "@/components/dashboard/bot-share-card";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

// wa.me requires digits only — strip the leading '+', spaces, dashes, parens. If nothing's
// left after stripping, treat the env value as malformed and act as if it weren't set.
function toWaMeUrl(raw: string | undefined): {
  display: string | null;
  url: string | null;
} {
  if (!raw) return { display: null, url: null };
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return { display: null, url: null };
  return { display: trimmed, url: `https://wa.me/${digits}` };
}

export default function SettingsPage() {
  const env = getEnv();
  const { display, url } = toWaMeUrl(env.BOT_WHATSAPP_NUMBER);

  return (
    <div className="px-5 py-8 sm:px-8 lg:py-10">
      <PageHeader
        title="Ajustes"
        subtitle="Configuración del panel y del bot."
      />

      <BotShareCard phone={display} shareUrl={url} />
    </div>
  );
}
