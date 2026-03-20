"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div
              style={{
                width: "4rem",
                height: "4rem",
                backgroundColor: "#FEE2E2",
                borderRadius: "9999px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <svg
                style={{ width: "2rem", height: "2rem", color: "#DC2626" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "#111827",
                marginBottom: "0.5rem",
              }}
            >
              Error inesperado
            </h2>
            <p
              style={{
                color: "#4B5563",
                marginBottom: "1.5rem",
                fontSize: "0.875rem",
              }}
            >
              Ocurrió un problema grave en la aplicación. Puedes intentar de
              nuevo o recargar la página.
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <button
                onClick={reset}
                style={{
                  backgroundColor: "#16A34A",
                  color: "white",
                  padding: "0.5rem 1.5rem",
                  borderRadius: "0.5rem",
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
