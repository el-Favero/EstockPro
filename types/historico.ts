// types/historico.ts
export type MovimentacaoHistorico = {
  id: string;
  produtoId: string;
  nomeProduto: string;
  categoria: string;
  tipo: 'retirada' | 'retorno';
  quantidadeUnidades?: number;
  quantidadeKg?: number;
  finalidade?: string;
  data: string; // ISO string
};

export type DiaHistorico = {
  data: string; // YYYY-MM-DD
  dataFormatada: string;
  diaSemana: string;
  movimentacoes: MovimentacaoHistorico[];
  totalUnidades: number;
  totalKg: number;
  observacao: string;
};

export type MesHistorico = {
  mes: string; // "Maio/2024"
  mesNumero: number;
  ano: number;
  dias: DiaHistorico[];
  totalCategorias: Record<string, { kg: number; unidades: number }>;
  totalProdutos: Array<{
    id: string;
    nome: string;
    categoria: string;
    totalKg: number;
    totalUnidades: number;
  }>;
  totais: {
    kg: number;
    unidades: number;
  };
};

export type ConsumoSemanal = {
  semana: number; // 1 a 5
  label: string; // "Semana 1"
  produtos: Array<{
    id: string;
    nome: string;
    kg: number;
    unidades: number;
  }>;
  totalKg: number;
  totalUnidades: number;
};