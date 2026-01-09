export const DOCUMENT_CATEGORIES = [
  "administrativos",
  "financieros",
  "fiscales",
  "recursos_humanos",
  "ventas",
  "compras",
  "operativos",
  "marketing",
  "tecnologia",
] as const;

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number];
