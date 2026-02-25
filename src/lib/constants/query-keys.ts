export const QUERY_KEYS = {
  terrenos: (proyectoId: string) => ['terrenos', proyectoId],
  proyectos: (usuarioId: string) => ['proyectos', usuarioId],
  catalogo: (proyectoId: string) => ['catalogo', proyectoId],
}
