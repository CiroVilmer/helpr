import { ShieldCheck } from "lucide-react";

import { HelprMark } from "@/components/brand/helpr-mark";
import { Container } from "@/components/marketing/section";

export function Footer() {
  return (
    <footer className="bg-bosque-hondo text-crema-base/80">
      <Container className="flex flex-col gap-10 py-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <HelprMark size={36} withWordmark tone="light" />
            <p className="mt-4 text-sm leading-relaxed text-crema-base/70">
              Tu equipo ya coordina por WhatsApp. Helpr le da memoria —tareas,
              decisiones y responsables— sin cambiar cómo trabaja cada persona.
            </p>
          </div>

          {/* Nota de privacidad — MANIFEST §10.1 / §20 */}
          <div className="max-w-sm rounded-2xl bg-bosque/50 p-5 ring-1 ring-linea-oscura">
            <div className="flex items-center gap-2 text-lima">
              <ShieldCheck className="size-4" strokeWidth={2} aria-hidden="true" />
              <span className="text-xs font-semibold tracking-[0.14em] uppercase">
                Cuidamos los datos
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-crema-base/70">
              Cada persona le escribe a Helpr desde su propio chat y con su
              consentimiento. Helpr no entra a ningún grupo ni lee a nadie sin
              permiso: cada tarea o decisión queda ligada a su mensaje de origen.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-linea-oscura pt-6 text-xs text-crema-base/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Helpr · Halketon</p>
          <p>Hecho con buena onda para las ONGs.</p>
        </div>
      </Container>
    </footer>
  );
}
