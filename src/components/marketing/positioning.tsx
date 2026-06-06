import { Check, X } from "lucide-react";

/**
 * Bloque "No somos / Somos" — MANIFEST §1.4.
 * Va sobre superficie bosque con acentos lima.
 */
const NO_SOMOS = [
  "Otro task manager que exige cambiar hábitos",
  "Un chatbot generalista",
  "Una web que todos tienen que usar todo el día",
  "Un sistema de vigilancia del equipo",
];

const SOMOS = [
  "Una capa de memoria sobre WhatsApp",
  "Un colega que coordina y recuerda",
  "Un panel para revisar lo que tu equipo te cuenta",
  "Un asistente que pide confirmación cuando duda",
];

export function PositioningBlock() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="rounded-2xl bg-bosque-hondo/60 p-6 ring-1 ring-linea-oscura sm:p-8">
        <h3 className="font-display text-xl font-bold text-crema-base/70">
          Helpr no es
        </h3>
        <ul className="mt-5 flex flex-col gap-3">
          {NO_SOMOS.map((item) => (
            <li key={item} className="flex items-start gap-3 text-crema-base/70">
              <X
                className="mt-0.5 size-4 shrink-0 text-clay"
                strokeWidth={2.25}
                aria-hidden="true"
              />
              <span className="text-sm leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl bg-crema-superficie p-6 text-tinta ring-1 ring-lima/40 sm:p-8">
        <h3 className="font-display text-xl font-bold text-bosque">Helpr es</h3>
        <ul className="mt-5 flex flex-col gap-3">
          {SOMOS.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-lima-suave">
                <Check
                  className="size-3 text-[#2c4a0a]"
                  strokeWidth={3}
                  aria-hidden="true"
                />
              </span>
              <span className="text-sm leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
