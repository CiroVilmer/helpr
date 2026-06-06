"use client";

import { useEffect } from "react";

/**
 * Observa los elementos `.reveal` y los muestra (con un fade + leve subida)
 * cuando entran al viewport. Montado una vez en el layout de marketing.
 *
 * - Cualquier elemento ya visible (incl. al saltar por anchor #seccion) se
 *   revela igual → nunca queda contenido escondido.
 * - Respeta prefers-reduced-motion (los muestra de una).
 */
export function RevealObserver() {
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal:not([data-shown])")
    );
    if (els.length === 0) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.setAttribute("data-shown", ""));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-shown", "");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
