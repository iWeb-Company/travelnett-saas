export function FormSkeleton() {
  return (
    <div role="status" aria-label="Cargando datos" className="animate-pulse w-full max-w-3xl mx-auto space-y-5 p-5">
      <div className="h-7 w-1/3 rounded bg-gray-200" />
      {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-12 rounded-lg bg-gray-200" />)}
      <div className="h-32 rounded-lg bg-gray-200" />
      <span className="sr-only">Cargando datos…</span>
    </div>
  );
}
