interface GuiaHeroProps {
  onEmpezar: () => void;
}

export function GuiaHero({ onEmpezar }: GuiaHeroProps) {
  return (
    <section className="bg-gradient-to-br from-amber-700 via-amber-600 to-amber-800 rounded-2xl p-6 sm:p-8 text-white">
      <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
        Bienvenido a tu finca digital
      </h1>
      <p className="text-amber-100 mt-2 text-sm sm:text-base leading-relaxed max-w-lg">
        Aquí te explicamos cada herramienta de AgriPlan. Toca cualquier paso
        para ver qué logras y cómo funciona.
      </p>
      <button
        type="button"
        onClick={onEmpezar}
        className="mt-5 w-full sm:w-auto px-6 py-3 bg-white text-amber-800 rounded-xl text-sm font-bold hover:bg-amber-50 transition-colors"
      >
        Empezar por Configurar
      </button>
    </section>
  );
}
