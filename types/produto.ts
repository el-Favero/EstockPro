// types/produto.ts
export type LoteProduto = {
  id: string; // ID único do lote
  validade: string; // formato ISO (YYYY-MM-DD)
  quantidadeUnidades?: number;
  quantidadeKg?: number;
  dataEntrada?: string; // Data de entrada (ISO)
  // preco?: number; // Reservado para uso futuro
  estoqueMinimoUnidades?: number;
  estoqueMinimoKg?: number;
};

export type Produto = {
  id: string;
  userId: string; // UID do usuário que criou o produto (para regras de segurança)
  nome: string;
  quantidade: number; // estoque total em unidades
  quantidadeKg?: number; // estoque total em kg
  categoria: string;
  /** Código de barras (EAN, UPC, etc.) para busca e scanner */
  codigoBarras?: string;
  descricao?: string;
  validade?: string; // validade principal (pode ser a mais próxima)
  minimo?: number;
  pesoPorUnidade?: number;
  unidadePeso?: "kg" | "g";
  tipoControle?: "unidade" | "kg" | "ambos";
  lotes?: LoteProduto[]; // diferentes validades para o mesmo produto
};