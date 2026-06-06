"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  Copy,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SelectMenu } from "@/components/dashboard/select-menu";

type Rol = "admin" | "volunteer";

type DraftRow = {
  key: string;
  nombre: string;
  apellido: string;
  telefono: string;
  rol: Rol;
};

type CreatedPersona = {
  id: string;
  nombre: string;
  apellido: string | null;
  telefono: string;
};

type ApiOk = { data: CreatedPersona[] };
type ApiErr = {
  error: { statusCode: number; message: string; userMessage: string };
};

function emptyRow(): DraftRow {
  return {
    key: crypto.randomUUID(),
    nombre: "",
    apellido: "",
    telefono: "",
    rol: "volunteer",
  };
}

export function NewPersonasDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<DraftRow[]>([emptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedPersona[] | null>(null);

  function reset() {
    setRows([emptyRow()]);
    setError(null);
    setCreated(null);
    setSubmitting(false);
  }

  function updateRow<K extends keyof DraftRow>(
    key: string,
    field: K,
    value: DraftRow[K]
  ) {
    setRows((rs) =>
      rs.map((r) => (r.key === key ? { ...r, [field]: value } : r))
    );
  }

  function addRow() {
    setRows((rs) => [...rs, emptyRow()]);
  }

  function removeRow(key: string) {
    setRows((rs) => (rs.length === 1 ? rs : rs.filter((r) => r.key !== key)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const personas = rows
      .map((r) => ({
        nombre: r.nombre.trim(),
        apellido: r.apellido.trim() || undefined,
        telefono: r.telefono.trim(),
        rol: r.rol,
      }))
      .filter((p) => p.nombre || p.telefono);

    if (personas.length === 0) {
      setError("Cargá al menos una persona con nombre y teléfono.");
      return;
    }
    const incomplete = personas.find((p) => !p.nombre || !p.telefono);
    if (incomplete) {
      setError("Cada persona necesita nombre y teléfono.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/personas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ personas }),
      });
      const json: ApiOk | ApiErr = await res.json();
      if (!res.ok) {
        setError(
          "error" in json ? json.error.userMessage : "No pude crear las personas."
        );
        return;
      }
      setCreated((json as ApiOk).data);
      router.refresh();
    } catch {
      setError("No pude conectarme. Probá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <Plus aria-hidden="true" />
            Agregar persona
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        {created ? (
          <CreatedPanel created={created} onClose={() => setOpen(false)} />
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="size-4" aria-hidden="true" />
                Nuevas personas
              </DialogTitle>
              <DialogDescription>
                Cargá una o varias. Después les mandás el link de invitación
                para que se vinculen con su cuenta.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              {rows.map((row, i) => (
                <PersonaRow
                  key={row.key}
                  row={row}
                  index={i}
                  canRemove={rows.length > 1}
                  onChange={updateRow}
                  onRemove={removeRow}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
              className="w-fit"
            >
              <Plus aria-hidden="true" />
              Agregar fila
            </Button>

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-clay/10 px-3 py-2.5 text-sm text-clay"
              >
                <AlertCircle
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                {error}
              </p>
            )}

            <div className="-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creando…" : "Crear y generar invitaciones"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PersonaRow({
  row,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  row: DraftRow;
  index: number;
  canRemove: boolean;
  onChange: <K extends keyof DraftRow>(
    key: string,
    field: K,
    value: DraftRow[K]
  ) => void;
  onRemove: (key: string) => void;
}) {
  const baseId = `p-${row.key}`;
  return (
    <div className="rounded-lg border border-linea p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">
          Persona {index + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Quitar persona ${index + 1}`}
          disabled={!canRemove}
          onClick={() => onRemove(row.key)}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id={`${baseId}-nombre`}
          label="Nombre"
          required
          value={row.nombre}
          onChange={(v) => onChange(row.key, "nombre", v)}
          autoComplete="given-name"
        />
        <Field
          id={`${baseId}-apellido`}
          label="Apellido"
          value={row.apellido}
          onChange={(v) => onChange(row.key, "apellido", v)}
          autoComplete="family-name"
        />
        <Field
          id={`${baseId}-telefono`}
          label="Teléfono (WhatsApp)"
          placeholder="+54 9 11 5555-5555"
          required
          value={row.telefono}
          onChange={(v) => onChange(row.key, "telefono", v)}
          autoComplete="tel"
          inputMode="tel"
        />
        <RolField
          id={`${baseId}-rol`}
          value={row.rol}
          onChange={(v) => onChange(row.key, "rol", v)}
        />
      </div>
    </div>
  );
}

function RolField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: Rol;
  onChange: (v: Rol) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-tinta-suave">
        Rol
      </Label>
      <SelectMenu
        id={id}
        ariaLabel="Rol"
        value={value}
        onValueChange={(v) => onChange(v as Rol)}
        options={[
          { value: "volunteer", label: "Voluntaria/o" },
          { value: "admin", label: "Admin (puede invitar)" },
        ]}
      />
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  required,
  placeholder,
  autoComplete,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "tel" | "text";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-tinta-suave">
        {label}
        {required && <span className="ml-0.5 text-clay">*</span>}
      </Label>
      <Input
        id={id}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function CreatedPanel({
  created,
  onClose,
}: {
  created: CreatedPersona[];
  onClose: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Check className="size-4 text-bosque" aria-hidden="true" />
          {created.length === 1
            ? "Persona creada"
            : `${created.length} personas creadas`}
        </DialogTitle>
        <DialogDescription>
          Mandales el link a cada quien. Al entrar y registrarse, su cuenta
          queda vinculada.
        </DialogDescription>
      </DialogHeader>

      <ul className="flex min-w-0 max-h-[50vh] flex-col gap-2 overflow-y-auto">
        {created.map((p) => (
          <InviteRow key={p.id} persona={p} />
        ))}
      </ul>

      <div className="-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
        <Button onClick={onClose}>Listo</Button>
      </div>
    </div>
  );
}

function InviteRow({ persona }: { persona: CreatedPersona }) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/login?personaId=${persona.id}`
      : `/login?personaId=${persona.id}`;
  const fullName = persona.apellido
    ? `${persona.nombre} ${persona.apellido}`
    : persona.nombre;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <li className="min-w-0 rounded-lg border border-linea p-3">
      <p className="text-sm font-medium text-foreground">{fullName}</p>
      <p className="text-xs text-tinta-suave">{persona.telefono}</p>
      <div className="mt-2 flex min-w-0 items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-1.5 font-mono text-xs text-tinta-suave">
          {url}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copy}
          aria-label={`Copiar invitación de ${fullName}`}
        >
          {copied ? (
            <>
              <Check aria-hidden="true" />
              Copiado
            </>
          ) : (
            <>
              <Copy aria-hidden="true" />
              Copiar
            </>
          )}
        </Button>
      </div>
    </li>
  );
}
