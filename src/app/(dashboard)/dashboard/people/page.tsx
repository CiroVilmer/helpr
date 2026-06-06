import { Plus, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/dashboard/page-header";
import { dashboardService } from "@/services/dashboard/dashboard.service";

export default async function PeoplePage() {
  const people = await dashboardService.getPeople();

  return (
    <div className="px-5 py-8 sm:px-8 lg:py-10">
      <PageHeader
        title="Personas"
        subtitle="Tu equipo y sus números de WhatsApp."
        action={
          <Button>
            <Plus aria-hidden="true" />
            Agregar persona
          </Button>
        }
      />

      <div className="mt-6 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 shadow-[var(--shadow-card)]">
        <ul className="divide-y divide-linea">
          {people.map((person) => (
            <li
              key={person.id}
              className="flex items-center gap-4 px-4 py-3.5 sm:px-5"
            >
              <Avatar>
                <AvatarFallback className="bg-bosque text-xs font-semibold text-crema-base">
                  {person.initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {person.name}
                </p>
                <p className="truncate text-sm text-tinta-suave">
                  {person.role}
                </p>
              </div>

              <a
                href={`https://wa.me/${person.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 text-sm text-tinta-suave tabular-nums transition-colors hover:bg-muted hover:text-bosque"
              >
                <Phone className="size-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">{person.phone}</span>
                <span className="sm:hidden">WhatsApp</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
