import { Movimentacao } from '../services/movimentacao/types';
import type { Produto } from '../types/produto';

export interface MovimentacaoCSV {
  data: string;
  tipo: string;
  produto: string;
  quantidade: string;
  unidade: string;
  finalidade?: string;
  observacao?: string;
}

export function gerarCSVMovimentacoes(
  movimentacoes: Movimentacao[],
  produtos: Produto[]
): string {
  const linhas: string[] = ['Data,Tipo,Produto,Quantidade,Unidade,Finalidade,Observação'];

  for (const mov of movimentacoes) {
    const produto = produtos.find((p) => p.id === mov.produtoId);
    const nomeProduto = produto?.nome || 'Produto';
    const tipo = mov.tipo === 'retirada' ? 'Saída' : 'Entrada';
    const qtd = mov.quantidadeUnidades ?? mov.quantidadeKg ?? 0;
    const unidade = mov.quantidadeUnidades != null ? 'un' : 'kg';
    const finalidade = mov.finalidade || '';
    const observacao = mov.observacao || '';

    linhas.push(
      `"${new Date(mov.data).toLocaleDateString('pt-BR')}","${tipo}","${nomeProduto}","${qtd}","${unidade}","${finalidade}","${observacao}"`
    );
  }

  return linhas.join('\n');
}