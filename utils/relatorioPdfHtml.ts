import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Produto } from '../types/produto';
import type { Movimentacao } from '../services/movimentacao/types';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

type Vencendo = Produto & { diasRestantes?: number };
type Vencido = Produto & { diasAtraso?: number };

export function buildRelatorioPdfHtml(opts: {
  tipo: 'validade' | 'movimentacoes' | 'categorias';
  produtos: Produto[];
  produtosVencendo: Vencendo[];
  produtosVencidos: Vencido[];
  movimentacoesPorDia: {
    dataFormatada: string;
    movimentacoes: Movimentacao[];
    totalEntradas: number;
    totalSaidas: number;
  }[];
  statsCategorias: { nome: string; total: number; produtos: number }[];
  periodoLabel: string;
}): string {
  const { tipo, produtos, produtosVencendo, produtosVencidos, movimentacoesPorDia, statsCategorias, periodoLabel } =
    opts;

  let body = '';

  if (tipo === 'validade') {
    body += '<h2>A vencer (7 dias)</h2><table>';
    if (produtosVencendo.length === 0) {
      body += '<tr><td>Nenhum produto próximo do vencimento</td></tr>';
    } else {
      produtosVencendo.forEach((p) => {
        const dias = p.diasRestantes ?? '—';
        const vd = p.validade ? format(parseISO(p.validade), 'dd/MM/yyyy') : '—';
        body += `<tr><td>${esc(p.nome)}</td><td>${esc(String(dias))} dias</td><td>${esc(vd)}</td></tr>`;
      });
    }
    body += '</table><h2>Vencidos</h2><table>';
    if (produtosVencidos.length === 0) {
      body += '<tr><td>Nenhum produto vencido</td></tr>';
    } else {
      produtosVencidos.forEach((p) => {
        const dias = p.diasAtraso ?? '—';
        const vd = p.validade ? format(parseISO(p.validade), 'dd/MM/yyyy') : '—';
        body += `<tr><td>${esc(p.nome)}</td><td>${esc(String(dias))} dias</td><td>${esc(vd)}</td></tr>`;
      });
    }
    body += `</table><p><strong>Total produtos:</strong> ${produtos.length}</p>`;
  } else if (tipo === 'movimentacoes') {
    body += `<h2>Movimentações — ${esc(periodoLabel)}</h2>`;
    if (movimentacoesPorDia.length === 0) {
      body += '<p>Nenhuma movimentação no período.</p>';
    } else {
      movimentacoesPorDia.forEach((dia) => {
        body += `<h3>${esc(dia.dataFormatada)}</h3><p>Entradas: ${dia.totalEntradas} · Saídas: ${dia.totalSaidas}</p><table>`;
        dia.movimentacoes.forEach((mov) => {
          const nome = produtos.find((p) => p.id === mov.produtoId)?.nome ?? 'Produto';
          const q = mov.quantidadeUnidades ?? mov.quantidadeKg ?? 0;
          const u = mov.quantidadeUnidades != null ? ' un' : ' kg';
          const tipo = mov.tipo === 'retirada' ? 'Saída' : 'Entrada';
          body += `<tr><td>${esc(nome)}</td><td>${tipo}</td><td>${esc(String(q))}${u}</td></tr>`;
        });
        body += '</table>';
      });
    }
  } else {
    body += '<h2>Produtos por categoria</h2><table>';
    statsCategorias.forEach((c) => {
      body += `<tr><td>${esc(c.nome)}</td><td>${c.produtos} prod.</td><td>${c.total} un.</td></tr>`;
    });
    body += '</table>';
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
    body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:20px;color:#111;}
    h1{font-size:20px;} h2{font-size:16px;margin-top:16px;} h3{font-size:14px;}
    table{width:100%;border-collapse:collapse;margin-top:8px;}
    td{padding:8px;border-bottom:1px solid #e5e7eb;font-size:13px;}
    p{font-size:13px;}
  </style></head><body>
  <h1>Relatório — MeuEstoque</h1>
  <p>Gerado em ${esc(format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR }))}</p>
  ${body}
  </body></html>`;
}
