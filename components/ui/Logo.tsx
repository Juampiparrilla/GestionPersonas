// Logo de la plataforma: un nodo (dirigente) que se ramifica en tres
// (punteros). Mismo dibujo que app/icon.svg. Caja de 56x56 con radio 16.
export function Logo({ size = 56 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 56 56"
      width={size}
      height={size}
      role="img"
      aria-label="Gestión de Personas"
    >
      <rect width="56" height="56" rx="16" fill="#17171a" />
      <g stroke="#f6f6f4" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M15 28C29 28 27 14 41 14M15 28H41M15 28C29 28 27 42 41 42" />
      </g>
      <g fill="#f6f6f4">
        <circle cx="14" cy="28" r="6" />
        <circle cx="42" cy="14" r="3.75" />
        <circle cx="42" cy="28" r="3.75" />
        <circle cx="42" cy="42" r="3.75" />
      </g>
    </svg>
  );
}
