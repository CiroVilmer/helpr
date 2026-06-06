import Link from "next/link";
import {
  Brain,
  ListChecks,
  Users,
  FileText,
  MessagesSquare,
  ArrowRight,
  Play,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { HelprMark } from "@/components/brand/helpr-mark";
import { SuggestionCard } from "@/components/brand/suggestion-card";
import { Section, Container, Eyebrow } from "@/components/marketing/section";
import { FeatureCard } from "@/components/marketing/feature-card";
import { StepCard } from "@/components/marketing/step-card";
import { PositioningBlock } from "@/components/marketing/positioning";

export default function LandingPage() {
  return (
    <>
      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Atmósfera: glows suaves, calma sobre caos (MANIFEST §6.4 / §7) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute -top-32 -right-24 size-[28rem] rounded-full bg-lima/20 blur-3xl" />
          <div className="absolute top-40 -left-32 size-[26rem] rounded-full bg-bosque/10 blur-3xl" />
        </div>

        <Container className="grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div className="flex flex-col items-start gap-6 fill-mode-both animate-in fade-in slide-in-from-bottom-3 duration-700">
            <Eyebrow>Memoria operativa para ONGs</Eyebrow>

            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-tinta sm:text-5xl lg:text-6xl">
              Tu equipo en WhatsApp,{" "}
              <span className="box-decoration-clone rounded-lg bg-lima-suave px-2 text-bosque">
                con memoria.
              </span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-tinta-suave">
              Cada persona del equipo le escribe a Helpr por WhatsApp —por texto
              o audio— y él lo convierte en tareas, decisiones y responsables. Sin
              cambiar cómo trabaja nadie.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/login"
                className={buttonVariants({
                  className: "h-12 px-6 text-[15px]",
                })}
              >
                Conectar WhatsApp
                <ArrowRight aria-hidden="true" />
              </Link>
              <a
                href="#como-funciona"
                className={buttonVariants({
                  variant: "outline",
                  className: "h-12 px-6 text-[15px]",
                })}
              >
                Ver cómo funciona
              </a>
            </div>

            <p className="text-sm text-tinta-suave">
              Solo con chats autorizados · Cada cosa, ligada a su mensaje de
              origen.
            </p>
          </div>

          {/* Visual: el "momento mágico" — le escribís a Helpr → tarea ordenada */}
          <div className="fill-mode-both animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:160ms]">
            <HeroMock />
          </div>
        </Container>
      </section>

      {/* ─────────────────────── El problema ─────────────────────── */}
      <Section id="problema">
        <div className="reveal max-w-2xl">
          <Eyebrow>El problema</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-tinta sm:text-4xl">
            Todo pasa en WhatsApp. Y ahí, también, se pierde.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-tinta-suave">
            Tu equipo vive en WhatsApp: es rápido y está a mano. Pero entre
            mensajes y audios se diluyen las tareas, se olvida quién se
            comprometió a qué y nadie recuerda qué se había decidido.
          </p>
        </div>

        <div className="reveal mt-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Tareas que se evaporan",
              body: "Un “yo me encargo” a las 23:40 que nadie vuelve a ver.",
            },
            {
              title: "Sin memoria",
              body: "“¿Qué habíamos decidido sobre el evento?” Nadie sabe.",
            },
            {
              title: "Responsables difusos",
              body: "Todos dicen que sí, pero no queda claro quién hace qué.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-linea bg-card/60 p-5"
            >
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ────────────────────── Cómo funciona ────────────────────── */}
      <Section id="como-funciona" className="bg-crema-superficie/60 py-20 sm:py-28">
        <div className="reveal max-w-2xl">
          <Eyebrow>Cómo funciona</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-tinta sm:text-4xl">
            En tres pasos, sin aprender nada nuevo.
          </h2>
        </div>

        <div className="reveal mt-10 grid gap-5 md:grid-cols-3">
          <StepCard step={1} title="Tu equipo le escribe a Helpr">
            Cada persona le manda por WhatsApp lo que va pasando —texto o audio—,
            como a un contacto más. Lo sumás con un QR.
          </StepCard>
          <StepCard step={2} title="Helpr lo procesa y ordena">
            Convierte cada mensaje en tareas, decisiones y responsables. Cuando
            duda, te pregunta antes de anotar.
          </StepCard>
          <StepCard step={3} title="Lo ves todo en la web">
            Entrás al panel y encontrás todo lo que te contaron, claro y con la
            fuente de cada cosa.
          </StepCard>
        </div>
      </Section>

      {/* ─────────────────────── Qué hace ─────────────────────── */}
      <Section id="que-hace">
        <div className="reveal max-w-2xl">
          <Eyebrow>Qué hace Helpr</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-tinta sm:text-4xl">
            Una capa de orden sobre el canal que ya usan.
          </h2>
        </div>

        <div className="reveal mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard icon={Brain} title="Memoria">
            Guarda las decisiones y acuerdos del equipo. Preguntale “¿qué se
            decidió sobre X?” y te lo trae con su fuente.
          </FeatureCard>
          <FeatureCard icon={ListChecks} title="Tareas">
            Detecta lo que hay que hacer y lo ordena en un tablero claro, con
            estado y vencimiento.
          </FeatureCard>
          <FeatureCard icon={Users} title="Responsables">
            Identifica quién se comprometió a qué y muestra la carga de cada
            persona, sin tono acusatorio.
          </FeatureCard>
          <FeatureCard icon={FileText} title="Resúmenes">
            Te deja al día en un toque: lo importante de lo que pasó, sin tener
            que leer todo.
          </FeatureCard>
        </div>
      </Section>

      {/* ────────────────────── Posicionamiento ────────────────────── */}
      <Section id="posicionamiento" tone="bosque">
        <div className="reveal max-w-2xl">
          <Eyebrow tone="bosque">Posicionamiento</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-crema-base sm:text-4xl">
            No somos otra herramienta que tenés que mantener.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-crema-base/70">
            Somos un colega que coordina y recuerda. La IA sugiere; vos cerrás.
          </p>
        </div>

        <div className="reveal mt-10">
          <PositioningBlock />
        </div>
      </Section>

      {/* ─────────────────────── CTA final ─────────────────────── */}
      <section id="cta" className="bg-bosque-hondo">
        <Container className="reveal flex flex-col items-center gap-7 py-20 text-center sm:py-24">
          <HelprMark size={56} />
          <h2 className="max-w-2xl font-display text-3xl font-bold leading-tight text-crema-base sm:text-4xl">
            ¿Sumás Helpr a tu equipo?
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-crema-base/70">
            Probalo con tu equipo en minutos. Cada uno sigue en WhatsApp; yo me
            ocupo de que no se pierda nada.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/login" />}
              className="h-12 bg-lima px-6 text-[15px] text-bosque-hondo hover:bg-lima/90"
            >
              Conectar WhatsApp
              <ArrowRight aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="h-12 px-6 text-[15px] text-crema-base hover:bg-bosque/60 hover:text-crema-base"
            >
              <MessagesSquare aria-hidden="true" />
              Hablar con el equipo
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}

/** Mock del hero: un chat 1:1 con Helpr que se convierte en tarea ordenada. */
function HeroMock() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Snippet del chat con el bot */}
      <div className="overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/10 shadow-[var(--shadow-float)]">
        <div className="flex items-center gap-3 bg-bosque px-4 py-3 text-crema-base">
          <HelprMark size={36} />
          <div className="leading-tight">
            <p className="text-sm font-semibold">Helpr</p>
            <p className="text-xs text-crema-base/60">en línea</p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 bg-crema-base/40 px-4 py-5">
          <OutgoingBubble time="14:31">
            Hola Helpr, quedó pendiente coordinar la entrega de donaciones del
            viernes.
          </OutgoingBubble>
          <AudioBubble duration="0:14" time="14:32" />
        </div>
      </div>

      {/* Helpr lo procesa → aparece en el panel */}
      <div className="relative z-10 -mt-3 px-3">
        <SuggestionCard
          kind="tarea"
          title="Coordinar la entrega de donaciones — viernes"
          detail="Confirmar cantidad de cajas antes del jueves."
          confidence="alta"
          source={{ author: "Lu", when: "mar 14:32" }}
        />
      </div>
    </div>
  );
}

function OutgoingBubble({
  time,
  children,
}: {
  time: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-lima-suave px-3.5 py-2.5 text-tinta">
      <p className="text-sm leading-snug">{children}</p>
      <span className="mt-1 block text-right text-[10px] text-tinta-suave tabular-nums">
        {time}
      </span>
    </div>
  );
}

// Mensaje de voz — guiño a que Helpr también entiende audios.
const WAVE = [6, 11, 16, 9, 14, 18, 10, 7, 13, 17, 11, 8, 15, 9, 12, 6];

function AudioBubble({ duration, time }: { duration: string; time: string }) {
  return (
    <div className="ml-auto flex max-w-[85%] items-center gap-3 rounded-2xl rounded-tr-md bg-lima-suave px-3.5 py-2.5 text-tinta">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-bosque text-lima">
        <Play className="size-3.5 fill-current" aria-hidden="true" />
      </span>
      <span className="flex flex-1 items-center gap-[3px]" aria-hidden="true">
        {WAVE.map((h, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-bosque/35"
            style={{ height: h }}
          />
        ))}
      </span>
      <span className="text-[11px] tabular-nums text-tinta-suave">
        {duration} · {time}
      </span>
    </div>
  );
}
