# Ranzo · Manifest de Producto (UI / Web)

> **Alcance de este documento:** define la identidad y el sistema de diseño de la **web de Ranzo** (landing, auth y dashboard). No cubre el bot de WhatsApp ni el motor de IA que corre por detrás — solo la superficie visual y de experiencia que ve la persona.
>
> _Documento de trabajo · Halketon 2026 · v1_

---

## 0. TL;DR

Ranzo es el **profe querido que le pone orden al grupo con buena onda**. La web es su "lugar de control": cálida pero sobria, familiar como WhatsApp pero en calma. Bosque profundo + lima + crema, Bricolage Grotesque + Inter, monograma sin mascota, y un tono rioplatense (vos) cálido y sin vueltas. WhatsApp es donde pasa la acción; la web es donde se ve y se ordena.

---

## 1. Esencia & personalidad

### 1.1 Origen
Ranzo es **una persona real**: un profe de colegio que estaba siempre que se hacía una acción con una ONG. Alegre y divertido, pero súper profesional, metido de lleno en ideas de impacto social positivo. El producto hereda ese carácter: Ranzo no es "un bot", es *ese colega que se involucra, ordena el quilombo y nunca te hace sentir vigilado*.

### 1.2 Arquetipo
**El Cuidador con oficio** (Caregiver × Sage). Acompaña, ordena y recuerda; sabe lo que hace pero nunca te lo restriega. Está para que el equipo trabaje mejor, no para lucirse.

### 1.3 Atributos de marca
| Atributo | Significa | No significa |
|---|---|---|
| **Cálido** | Humano, cercano, en primera persona | Meloso, infantil |
| **Sobrio** | Confiable, prolijo, discreto | Frío, corporativo, acartonado |
| **Claro** | Directo, sin jerga, una idea a la vez | Seco, robótico |
| **Confiable** | Muestra de dónde sacó las cosas, pide confirmación | Sabelotodo, opaco |
| **Con buena onda** | Algún guiño justo, optimista | Payaso, chistoso forzado |

### 1.4 Qué es / qué no es
| Ranzo **es** | Ranzo **no es** |
|---|---|
| Una capa de memoria sobre WhatsApp | Otro task manager que exige cambiar hábitos |
| Un colega que coordina y recuerda | Un chatbot generalista |
| Un panel para *revisar* lo que ya pasa en el grupo | Una web que todos tienen que usar todo el día |
| Un asistente que pide confirmación cuando duda | Un sistema de vigilancia del equipo |

### 1.5 Marca verbal (propuestas)
- **Wordmark:** `Ranzo` (Bricolage Grotesque).
- **Tagline principal (propuesta):** *"Tu grupo de WhatsApp, con memoria."*
- **Alternativas:** *"Ranzo se acuerda por todos."* · *"La coordinación ya pasa en el grupo. Ranzo le da memoria."*
- **Frase de posicionamiento (pitch):** *"Convertimos los grupos de WhatsApp de tu ONG en memoria operativa —tareas, decisiones y responsables— sin cambiar la forma en que el equipo ya trabaja."*

---

## 2. Principios de diseño UX

1. **Calma sobre caos.** El grupo es ruidoso y efímero; la web es ordenada y memoriosa. Cada pantalla baja la ansiedad, no la sube. Espacios que respiran, una cosa importante por vista.
2. **Puente, no migración.** Todo lo familiar de WhatsApp (burbujas redondeadas, lectura rápida, baja fricción) se respeta. Nada exige aprender una herramienta nueva. La web *complementa*, no reemplaza.
3. **Confianza visible.** Cuando Ranzo propone algo, **siempre muestra de dónde lo sacó** (mensaje fuente, autor, hora) y **deja a la persona decidir** (confirmar / editar / descartar). La IA sugiere; el humano cierra.
4. **Nunca invasivo.** El tono y la UI coordinan, no controlan. Se evita el lenguaje de vigilancia ("detectamos que no hiciste…") y el ruido innecesario.
5. **Mobile-first.** Quien usa WhatsApp está en el celular. La web se diseña primero para pantallas chicas y voluntarios poco técnicos; el desktop es la versión cómoda, no la única.
6. **Accesible para todos los voluntarios.** Contraste alto, tipografías grandes, targets generosos, lenguaje simple. Incluye a gente mayor y poco técnica.

> **Principio rector:** *WhatsApp es el lugar de acción; la web es el lugar de control.*

---

## 3. Sistema de color

Dirección: **Bosque profundo + lima + crema**. Bosque como base seria, lima como energía/impacto, crema para la calidez y las superficies. El crema le saca lo frío al verde oscuro y deja respirar al lima.

### 3.1 Tokens

| Token | Hex | Uso |
|---|---|---|
| `--bosque` | `#0F3D2C` | Color de marca primario. Nav, sidebar, botones primarios, texto sobre crema. |
| `--bosque-hondo` | `#082A1E` | Fondos oscuros, estados hover de superficies bosque, footers. |
| `--lima` | `#B6E84A` | Acento de energía. Monograma, highlights, CTA sobre fondo oscuro, foco. |
| `--lima-suave` | `#D7F38C` | Fondos de chips/estados "ok", tintes suaves. |
| `--crema-base` | `#F6F0E2` | Fondo principal de la app/landing. |
| `--crema-superficie` | `#FCF8EF` | Tarjetas, paneles, inputs. |
| `--blanco` | `#FFFFFF` | Superficie elevada, cards sobre crema, modales. |
| `--ambar` | `#E0A33E` | **Alerta / atención** (vence pronto, requiere revisión). |
| `--clay` | `#C8553D` | **Riesgo / urgente / destructivo** (vencido, sin responsable, borrar). |
| `--tinta` | `#11241A` | Texto principal. |
| `--tinta-suave` | `#5E6B61` | Texto secundario, labels, metadatos. |
| `--linea` | `#E6E0D2` | Bordes y divisores sobre crema. |
| `--linea-oscura` | `#1C3A2C` | Bordes y divisores sobre bosque. |

### 3.2 Roles semánticos
- **Primario / acción:** `--bosque` (relleno) con texto `--blanco`. En hover, `--bosque-hondo`.
- **Acento / energía / foco:** `--lima`. **Solo sobre fondos oscuros** o como relleno con texto `--tinta`/`--bosque` encima.
- **Éxito / al día:** `--lima-suave` (fondo) + `#2C4A0A` (texto).
- **Atención:** `--ambar` (fondo) + tinta oscura.
- **Riesgo / destructivo:** `--clay` (fondo) + `--blanco`.
- **Superficies:** página = `--crema-base`; tarjetas = `--crema-superficie` o `--blanco`.

### 3.3 Accesibilidad de color (reglas duras)
- **Texto de cuerpo:** siempre `--tinta` sobre crema/blanco, o `--blanco`/`--lima-suave` sobre bosque. Cumple AA holgado.
- **El lima es brillante:** **nunca usar lima como texto sobre crema/blanco** (contraste insuficiente). Lima es para rellenos sobre oscuro, bordes de foco, o fondos grandes con texto oscuro encima.
- **Ámbar y clay:** usar como **relleno de chip/badge** con texto de alto contraste, no como texto fino sobre crema. Para texto de estado, acompañar siempre con un ícono o palabra (no depender solo del color → daltonismo).
- **Anillo de foco:** `--lima` de 2–3px sobre fondos oscuros; `--bosque` sobre fondos claros. Visible siempre, nunca `outline:none` sin reemplazo.
- Objetivo general: **WCAG 2.1 AA** mínimo para texto e íconos significativos.

### 3.4 Variables CSS (referencia de implementación)
```css
:root {
  --bosque:#0F3D2C; --bosque-hondo:#082A1E;
  --lima:#B6E84A; --lima-suave:#D7F38C;
  --crema-base:#F6F0E2; --crema-superficie:#FCF8EF; --blanco:#FFFFFF;
  --ambar:#E0A33E; --clay:#C8553D;
  --tinta:#11241A; --tinta-suave:#5E6B61;
  --linea:#E6E0D2; --linea-oscura:#1C3A2C;
}
```

---

## 4. Tipografía

| Rol | Familia | Notas |
|---|---|---|
| **Display / titulares / wordmark** | **Bricolage Grotesque** | Grotesca con carácter: moderna, amistosa, con energía que dialoga con el lima. Pesos 700/800. |
| **UI / datos / cuerpo** | **Inter** | Legible, neutra, ideal para dashboard y números. Pesos 400/500/600/700, `font-feature-settings:"tnum"` para datos tabulares. |

### 4.1 Escala tipográfica
| Estilo | Familia / Peso | Tamaño / Interlineado | Uso |
|---|---|---|---|
| Display XL | Bricolage 800 | 56 / 1.05 | Hero de landing |
| Display L | Bricolage 800 | 40 / 1.1 | Encabezados de sección landing |
| H1 | Bricolage 700 | 32 / 1.15 | Título de página (dashboard) |
| H2 | Bricolage 700 | 24 / 1.2 | Subtítulos / títulos de panel |
| H3 | Inter 600 | 20 / 1.3 | Encabezados de tarjeta |
| Body L | Inter 400 | 18 / 1.55 | Texto destacado / lead |
| Body | Inter 400 | 16 / 1.55 | Texto base |
| Body S | Inter 400 | 14 / 1.5 | Texto secundario |
| Label | Inter 600 | 12 / 1.4 · uppercase · tracking .06em | Etiquetas, metadatos |
| Dato | Inter 700 `tnum` | 24–32 | Métricas, contadores |

Regla: **un solo titular display por vista**. La jerarquía la hacen tamaño + peso + color, no muchas familias.

---

## 5. Marca & monograma

### 5.1 Concepto
El monograma es la **"R" en Bricolage Grotesque (800), lima sobre bosque, dentro de un cuadrado de esquinas redondeadas** (radio ~28%). El contenedor redondeado evoca deliberadamente una **foto de perfil / burbuja de WhatsApp**: Ranzo aparece como un contacto más del grupo. Ése es el puente visual con WhatsApp, sin copiar su verde.

```
┌──────────┐
│   ███    │   Cuadrado redondeado (avatar)
│   █ █    │   Fondo: --bosque
│   ███    │   Letra "R": --lima, Bricolage 800
│   █ █    │
└──────────┘
```

### 5.2 Variantes
- **Sobre bosque:** R lima. (principal)
- **Sobre crema/blanco:** contenedor bosque, R lima. Nunca R lima directa sobre crema.
- **Monocromo:** contenedor tinta, R crema (para usos de bajo color / impresión).
- **Wordmark + monograma:** monograma + "Ranzo" en Bricolage 700 a la derecha.

### 5.3 Reglas
- **Zona de seguridad:** margen libre = altura de la "R" alrededor del monograma.
- **Tamaño mínimo:** 24px (digital).
- **No hacer:** deformar, rotar, cambiar la letra por otra fuente, poner la R lima sobre fondo claro, agregarle sombras duras o degradés ruidosos.

---

## 6. Forma, espaciado & iconografía

### 6.1 Radios (lenguaje "burbuja redondeada")
- Chips / badges: `999px` (pill).
- Botones / inputs: `10px`.
- Tarjetas / paneles: `12–14px`.
- Avatar / monograma: cuadrado con `~28%`.
- Modales: `16px`.

### 6.2 Espaciado
Base **8pt** con incrementos de 4 para ajustes finos:
`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`. Respiración generosa; preferí espacio en blanco antes que líneas divisorias.

### 6.3 Iconografía
- Estilo **línea**, trazo **1.75–2px**, **terminaciones redondeadas** (coherente con la forma redondeada general).
- Grilla de **24px**. Set sugerido: **Lucide** (open source, redondeado, gran cobertura).
- Color: heredan `--tinta` / `--tinta-suave`; activos en `--bosque`; nunca en lima sobre claro.
- Densidad baja: usar íconos para reforzar, no para decorar.

### 6.4 Elevación
Sombras suaves y de baja opacidad, tono verde-oscuro (no negro puro): `0 1px 2px rgba(8,42,30,.06)` (cards), `0 6px 22px rgba(8,42,30,.18)` (modales/flotantes). La jerarquía la da el color de superficie antes que la sombra.

---

## 7. Movimiento

Calmo y servicial — coherente con "calma sobre caos".
- **Duraciones:** micro-interacciones 150ms; transiciones de panel/entrada 200–250ms.
- **Easing:** `ease-out` para entradas; `ease-in-out` para cambios de estado.
- **Principios:** nada rebota de forma exagerada; sin parpadeos ni animaciones que distraigan. Entradas con leve fade + desplazamiento corto (8–12px).
- **Ranzo "pensando":** indicador sutil (puntos suaves o barra tenue en lima) acompañado de copy en primera persona ("Estoy leyendo los últimos mensajes…"). Nunca un spinner agresivo a pantalla completa.
- Respetar `prefers-reduced-motion`: desactivar desplazamientos, mantener solo fades mínimos.

---

## 8. Voz & tono

**Idioma:** español rioplatense, **voseo**. **Persona:** Ranzo habla en **primera persona** cuando actúa ("lo anoté", "te dejo el resumen"). **Registro:** cálido con toques justos — claridad primero, calidez siempre, algún guiño ocasional, nunca payaso. **Sin emojis en la web** (quedan para WhatsApp); las señales van por íconos y color.

### 8.1 Do's / Don'ts
| Hacé | Evitá |
|---|---|
| Vos, cercano: "¿Querés que lo anote?" | Usted / neutro: "¿Desea registrarlo?" |
| Breve y concreto | Párrafos largos, jerga corporativa |
| Primera persona de Ranzo: "Listo, lo anoté." | Voz de sistema impersonal: "Registro creado." |
| Nombrar la fuente: "de un mensaje de Lu" | Afirmar sin respaldo |
| Optimista y tranquilo | Alarmista / urgente de más |
| Pedir confirmación ante la duda | Dar por hecho / cerrar solo |

**Nunca:** lenguaje de vigilancia ("detecté que no cumpliste…"), signos de exclamación en cadena, mayúsculas para gritar, culpar a la persona.

### 8.2 Ejemplos de microcopy (en vos)
- **Botón primario:** `Conectar WhatsApp` · `Anotar tarea` · `Entrar`
- **Confirmación:** *"Listo, lo anoté."* · *"Hecho. Marqué la tarea como terminada."*
- **Vacío (tareas):** *"Todavía no hay tareas por acá. Cuando el grupo arranque a coordinar, las voy anotando yo."*
- **Vacío (memoria):** *"Acá va a quedar guardado lo que el grupo vaya decidiendo. Por ahora, nada que recordar."*
- **Sugerencia de Ranzo:** *"Me parece que esto es una tarea. ¿La sumo?"*
- **Pidiendo confirmación (baja confianza):** *"Esto no lo tengo del todo claro. ¿Lo dejo como tarea de Nico o lo descarto?"*
- **Cargando / pensando:** *"Estoy leyendo los últimos mensajes…"*
- **Error:** *"Uh, algo no salió. Probá de nuevo en un toque."*
- **Onboarding (conectar grupo):** *"Sumame a tu grupo y me quedo escuchando. Lo que se vaya hablando, lo voy ordenando acá."*

---

## 9. Componentes firma

Los patrones que hacen reconocible a Ranzo. Implementan los principios de **confianza visible** y **humano en el loop**.

### 9.1 Tarjeta de sugerencia de Ranzo ⭐ (el sello)
La pieza más importante. Cuando Ranzo detecta algo en el chat:
- **Encabezado:** monograma + *"Ranzo detectó una tarea"* (o decisión / responsable / riesgo).
- **Contenido propuesto:** el ítem en lenguaje claro.
- **Confianza:** indicador sutil (Alta / Media / Baja, o barra tenue). Si es baja, el copy lo dice.
- **Fuente citada:** *"de un mensaje de Lu · mar 14:32"* con enlace al mensaje original.
- **Acciones (humano decide):** `Confirmar` (primario bosque) · `Editar` · `Descartar`.
- Tono: propone, no impone.

### 9.2 Kanban
Columnas **Por hacer / Haciendo / Listo**. Cada tarjeta: título, avatar del responsable, chip de vencimiento (`--ambar` si vence pronto, `--clay` si está vencido, `--lima-suave` si está al día), y link a la fuente. Drag & drop opcional (placeholder en MVP).

### 9.3 Carga por persona
Lista de integrantes con su cantidad de tareas activas y una barra de carga. Resalta en `--clay` a quien esté sobrecargado, para que la dirección redistribuya. Sin tono acusatorio: *"Lu tiene bastante encima esta semana."*

### 9.4 Memoria / línea de tiempo
Buscador de decisiones y acuerdos. Cada resultado muestra la decisión, la fecha y la **fuente citada**. Responde el "¿qué se había decidido sobre X?".

---

## 10. Superficies a construir (MVP Halketon)

Tres pantallas. Para el hackathon, **auth y datos son dummy/placeholder** (sin backend real); el foco es demostrar la identidad y el "momento mágico".

### 10.1 Landing page (pública)
Marketing de una sola página, mobile-first. Aplica Bricolage en hero sobre crema, secciones en bosque con acentos lima, monograma presente.
- **Hero:** tagline (*"Tu grupo de WhatsApp, con memoria."*) + subcopy + CTA primario (`Conectar WhatsApp` / `Probar Ranzo`) + visual del monograma o un mock del dashboard.
- **El problema:** las ONGs vuelven siempre a WhatsApp; se pierde memoria, tareas y responsables (apoyado en los dolores del brief).
- **Cómo funciona (3 pasos):** 1) Sumás a Ranzo al grupo con un QR → 2) Ranzo escucha y ordena → 3) Lo ves todo en la web.
- **Qué hace Ranzo:** memoria, tareas, responsables, resúmenes (tarjetas con íconos).
- **Posicionamiento:** bloque "No somos / Somos" (del brief).
- **CTA final + footer** (con nota de privacidad: grupos autorizados, consentimiento, datos sensibles cuidados).

### 10.2 Auth — login dummy
Pantalla minimalista, tarjeta centrada sobre crema (o panel bosque a un lado en desktop).
- Monograma + título cálido: *"Entrá a Ranzo."*
- Campos **dummy**: email + contraseña (sin validación real / sin backend).
- Botón `Entrar` → navega directo al dashboard.
- Opcional: botón secundario `Conectar con QR de WhatsApp` (placeholder visual del flujo WAHA).
- Tono y forma coherentes con el sistema; nada de friccionar.

### 10.3 Dashboard simple — con placeholders
El "lugar de control". Layout: **sidebar bosque** (Tablero · Tareas · Personas · Memoria · Grupos) con monograma arriba + **top bar** + contenido sobre crema. Todo con **datos de ejemplo / placeholders**.
- **Resumen (cards):** Pendientes · En curso · Sin responsable (con chips de estado ámbar/clay/lima-suave).
- **Kanban placeholder:** las tres columnas con tarjetas de ejemplo.
- **Sugerencias de Ranzo (placeholder):** una o dos tarjetas firma (§9.1) con fuente citada y acciones.
- **Actividad reciente / memoria (placeholder):** lista breve.
- Responsive: en mobile, el sidebar colapsa a una barra inferior o menú; las cards se apilan.

---

## 11. Checklist de aplicación (resumen accionable)

- [ ] Fondo de app y landing: `--crema-base`. Tarjetas: `--crema-superficie` / `--blanco`.
- [ ] Nav/sidebar y botones primarios: `--bosque`. Acentos y foco: `--lima` (solo sobre oscuro).
- [ ] Titulares y wordmark: **Bricolage Grotesque**. Resto y datos: **Inter** (`tnum` en números).
- [ ] Monograma "R" lima sobre bosque, en cuadrado redondeado, presente en las 3 superficies.
- [ ] Bordes redondeados (10–14px), espaciado 8pt, íconos Lucide de línea.
- [ ] Copy en vos, cálido y breve; **sin emojis** en la web; Ranzo en primera persona.
- [ ] Toda sugerencia de IA muestra **fuente** + deja **confirmar/editar/descartar**.
- [ ] AA de contraste; foco siempre visible; estados no dependen solo del color.
- [ ] Mobile-first; `prefers-reduced-motion` respetado.

---

_Las propuestas de tagline y el concepto de monograma quedan abiertas a iteración. Todo lo demás (color, tipografía, tono, principios) está validado en el proceso de brainstorming._
