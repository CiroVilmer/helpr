import { Hammer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { HelprMark } from "@/components/brand/helpr-mark";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 py-24 text-center sm:px-8 sm:py-32">
      <div className="relative mb-8">
        <HelprMark size={64} />
        <span className="absolute -right-2 -bottom-2 grid size-8 place-items-center rounded-full bg-ambar text-bosque-hondo ring-4 ring-crema-base">
          <Hammer className="size-4" strokeWidth={2.25} aria-hidden="true" />
        </span>
      </div>

      <Badge variant="warning" className="mb-5">
        En construcción
      </Badge>

      <h1 className="max-w-xl font-display text-3xl font-bold leading-tight text-tinta sm:text-4xl">
        El panel está en obra.
      </h1>
      <p className="mt-4 max-w-md text-lg leading-relaxed text-tinta-suave">
        Estoy ordenando todo por acá. Muy pronto vas a ver tus tareas,
        decisiones y responsables —cada cosa con su mensaje de origen.
      </p>

      <p className="mt-8 text-sm text-tinta-suave">
        Ya entraste bien. Por ahora, dejame seguir poniendo orden.
      </p>
    </div>
  );
}
