import { db } from "@/lib/db";
import type { EntradaAgua } from "@/types";

export const aguaDAL = {
  getEntradasByTerrenoId: (terrenoId: string) =>
    db.entradas_agua
      .where("terreno_id")
      .equals(terrenoId)
      .reverse()
      .sortBy("fecha"),

  addEntrada: (entrada: EntradaAgua) => db.entradas_agua.add(entrada),
};
