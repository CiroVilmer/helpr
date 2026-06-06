import { LinkIcon, LogOut } from "lucide-react";

import { signOut } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { HelprMark } from "@/components/brand/helpr-mark";

export function NoOrgEmptyState({ userEmail }: { userEmail: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-crema-base px-5 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 w-fit">
          <HelprMark size={40} withWordmark />
        </div>
        <div className="mx-auto mb-5 grid size-12 place-items-center rounded-full bg-bosque/10 text-bosque">
          <LinkIcon className="size-5" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl font-bold text-tinta">
          Tu cuenta todavía no está vinculada a una organización.
        </h1>
        <p className="mt-3 text-tinta-suave">
          Pedile al admin de tu equipo un link de invitación. Te van a mandar
          algo del estilo{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            /login?personaId=…
          </code>{" "}
          — entrá ahí con esta misma cuenta ({userEmail}) y queda lista.
        </p>
        <form action={signOut} className="mt-8">
          <Button type="submit" variant="outline" className="mx-auto">
            <LogOut aria-hidden="true" />
            Cerrar sesión
          </Button>
        </form>
      </div>
    </div>
  );
}
