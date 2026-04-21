// constants/categorias.ts
export const CATEGORIAS = [
  'Secos',
  'Congelados',
  'Laticínios',
  'Bebidas',
  'Proteínas',
  'Higiene',
  'Limpeza',
  'Grãos',
  'Farinha',
  'Temperos',
  'Outros',
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const isCategoriaValida = (cat: string): boolean => {
  return CATEGORIAS.some((c) => c.toLowerCase() === cat.toLowerCase());
};