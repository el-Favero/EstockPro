import { Produto } from "../../types/produto";

export const produtos: Produto[] = [
  {
    id: "1",
    userId: "mock-user-id",
    nome: "Arroz",
    categoria: "Secos",
    quantidade: 5,
    minimo: 2,
    validade: "2026-04-20",
  },
  {
    id: "2",
    userId: "mock-user-id",
    nome: "Frango congelado",
    categoria: "Proteínas",
    quantidade: 1,
    minimo: 3,
    validade: "2026-02-25",
  },
];