import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Paths, File, Directory } from 'expo-file-system';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Produto } from '../types/produto';
import type { Movimentacao } from '../services/movimentacao/types';

function esc(s: string): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function generateAndSharePdf(opts: {
  tipo: 'validade' | 'movimentacoes' | 'categorias' | 'produtos';
  produtos: Produto[];
  produtosVencendo: { produto: Produto; diasRestantes: number }[];
  produtosVencidos: { produto: Produto; diasAtraso: number }[];
  movimentacoes: Movimentacao[];
  periodoLabel: string;
}): Promise<void> {
  const { tipo, produtos, produtosVencendo, produtosVencidos, movimentacoes, periodoLabel } = opts;

  let body = '';

  if (tipo === 'validade') {
    body += '<h2>Produtos próximos do vencimento (7 dias)</h2><table>';
    if (produtosVencendo.length === 0) {
      body += '<tr><td colspan="3">Nenhum produto próximo do vencimento</td></tr>';
    } else {
      produtosVencendo.forEach((p) => {
        const vd = p.produto.validade ? format(parseISO(p.produto.validade), 'dd/MM/yyyy') : '—';
        const qtd = p.produto.quantidade ?? p.produto.quantidadeKg ?? 0;
        const un = p.produto.quantidade != null ? ' un' : ' kg';
        body += `<tr><td>${esc(p.produto.nome)}</td><td>${p.diasRestantes} dias</td><td>${vd}</td><td>${qtd}${un}</td></tr>`;
      });
    }
    body += '</table><h2>Produtos vencidos</h2><table>';
    if (produtosVencidos.length === 0) {
      body += '<tr><td colspan="3">Nenhum produto vencido</td></tr>';
    } else {
      produtosVencidos.forEach((p) => {
        const vd = p.produto.validade ? format(parseISO(p.produto.validade), 'dd/MM/yyyy') : '—';
        const qtd = p.produto.quantidade ?? p.produto.quantidadeKg ?? 0;
        const un = p.produto.quantidade != null ? ' un' : ' kg';
        body += `<tr><td>${esc(p.produto.nome)}</td><td>${p.diasAtraso} dias</td><td>${vd}</td><td>${qtd}${un}</td></tr>`;
      });
    }
    body += `</table><p><strong>Total de produtos:</strong> ${produtos.length}</p>`;
  } else if (tipo === 'movimentacoes') {
    body += `<h2>Movimentações — ${esc(periodoLabel)}</h2>`;
    if (movimentacoes.length === 0) {
      body += '<p>Nenhuma movimentação no período.</p>';
    } else {
      const entradas = movimentacoes.filter((m) => m.tipo === 'retorno').reduce((acc, m) => acc + (m.quantidadeUnidades ?? m.quantidadeKg ?? 0), 0);
      const saidas = movimentacoes.filter((m) => m.tipo === 'retirada').reduce((acc, m) => acc + (m.quantidadeUnidades ?? m.quantidadeKg ?? 0), 0);
      body += `<p><strong>Total entradas:</strong> ${entradas} &nbsp;&nbsp; <strong>Total saídas:</strong> ${saidas}</p>`;
      body += '<table><tr><th>Data</th><th>Tipo</th><th>Produto</th><th>Qtd</th><th>Finalidade</th></tr>';
      movimentacoes.forEach((mov) => {
        const produto = produtos.find((p) => p.id === mov.produtoId);
        const nome = produto?.nome || 'Produto';
        const q = mov.quantidadeUnidades ?? mov.quantidadeKg ?? 0;
        const u = mov.quantidadeUnidades != null ? 'un' : 'kg';
        const tipo = mov.tipo === 'retirada' ? 'Saída' : 'Entrada';
        const data = format(parseISO(mov.data), 'dd/MM/yyyy');
        body += `<tr><td>${data}</td><td>${tipo}</td><td>${esc(nome)}</td><td>${q} ${u}</td><td>${esc(mov.finalidade || '—')}</td></tr>`;
      });
      body += '</table>';
    }
  } else {
    const categorias: Record<string, { total: number; count: number }> = {};
    produtos.forEach((p) => {
      const cat = p.categoria || 'Sem categoria';
      if (!categorias[cat]) {
        categorias[cat] = { total: 0, count: 0 };
      }
      categorias[cat].count++;
      categorias[cat].total += p.quantidade ?? p.quantidadeKg ?? 0;
    });
    body += '<h2>Produtos por categoria</h2><table><tr><th>Categoria</th><th>Produtos</th><th>Total</th></tr>';
    Object.entries(categorias).forEach(([nome, dados]) => {
      body += `<tr><td>${esc(nome)}</td><td>${dados.count}</td><td>${dados.total}</td></tr>`;
    });
    body += '</table>';
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
    body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:20px;color:#111;}
    h1{font-size:20px;margin-bottom:4px;} h2{font-size:16px;margin-top:16px;} h3{font-size:14px;}
    table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px;}
    th{background:#f3f4f6;text-align:left;padding:8px;}
    td{padding:8px;border-bottom:1px solid #e5e7eb;}
    p{font-size:13px;}
    @media print { body { padding: 0; } }
  </style></head><body>
    <h1>Relatório — MeuEstoque</h1>
    <p>Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
    ${body}
  </body></html>`;

  const { uri } = await Print.printToFileAsync({ html });
  const fileName = `relatorio_${tipo}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
  const pdfFile = new File(Paths.cache, fileName);
  const originalFile = new File(uri);
  await originalFile.move(pdfFile);
  await Sharing.shareAsync(pdfFile.uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar PDF' });
}

export async function generateAndShareCsv(opts: {
  tipo: 'validade' | 'movimentacoes' | 'categorias' | 'produtos';
  produtos: Produto[];
  produtosVencendo: { produto: Produto; diasRestantes: number }[];
  produtosVencidos: { produto: Produto; diasAtraso: number }[];
  movimentacoes: Movimentacao[];
}): Promise<void> {
  const { tipo, produtos, produtosVencendo, produtosVencidos, movimentacoes } = opts;
  const linhas: string[] = [];

  if (tipo === 'produtos') {
    linhas.push('Nome,Categoria,Quantidade,QuantidadeKg,Validade,CodigoBarras,Descricao');
    produtos.forEach((p) => {
      const vd = p.validade ? format(parseISO(p.validade), 'dd/MM/yyyy') : '';
      linhas.push(`"${p.nome}","${p.categoria}",${p.quantidade || ''},${p.quantidadeKg || ''},"${vd}","${p.codigoBarras || ''}","${p.descricao || ''}"`);
    });
  } else if (tipo === 'validade') {
    linhas.push('Nome,Validade,Dias Restantes,Quantidade,Categoria');
    produtosVencendo.forEach((p) => {
      const vd = p.produto.validade ? format(parseISO(p.produto.validade), 'dd/MM/yyyy') : '';
      const qtd = p.produto.quantidade ?? p.produto.quantidadeKg ?? 0;
      linhas.push(`"${p.produto.nome}","${vd}",${p.diasRestantes},${qtd},"${p.produto.categoria}"`);
    });
    produtosVencidos.forEach((p) => {
      const vd = p.produto.validade ? format(parseISO(p.produto.validade), 'dd/MM/yyyy') : '';
      const qtd = p.produto.quantidade ?? p.produto.quantidadeKg ?? 0;
      linhas.push(`"${p.produto.nome}","${vd}",-${p.diasAtraso},${qtd},"${p.produto.categoria}"`);
    });
  } else if (tipo === 'movimentacoes') {
    linhas.push('Data,Tipo,Produto,Quantidade,Unidade,Finalidade');
    movimentacoes.forEach((mov) => {
      const produto = produtos.find((p) => p.id === mov.produtoId);
      const nome = produto?.nome || 'Produto';
      const q = mov.quantidadeUnidades ?? mov.quantidadeKg ?? 0;
      const u = mov.quantidadeUnidades != null ? 'un' : 'kg';
      const tipoLabel = mov.tipo === 'retirada' ? 'Saída' : 'Entrada';
      const data = format(parseISO(mov.data), 'dd/MM/yyyy');
      linhas.push(`"${data}","${tipoLabel}","${nome}",${q},${u},"${mov.finalidade || ''}"`);
    });
  } else {
    linhas.push('Categoria,Quantidade de Produtos,Total em Estoque');
    const categorias: Record<string, { total: number; count: number }> = {};
    produtos.forEach((p) => {
      const cat = p.categoria || 'Sem categoria';
      if (!categorias[cat]) {
        categorias[cat] = { total: 0, count: 0 };
      }
      categorias[cat].count++;
      categorias[cat].total += p.quantidade ?? p.quantidadeKg ?? 0;
    });
    Object.entries(categorias).forEach(([nome, dados]) => {
      linhas.push(`"${nome}",${dados.count},${dados.total}`);
    });
  }

  const csvContent = linhas.join('\n');
  const fileName = `relatorio_${tipo}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
  const csvFile = new File(Paths.cache, fileName);
  await csvFile.write(csvContent);
  await Sharing.shareAsync(csvFile.uri, { mimeType: 'text/csv', dialogTitle: 'Compartilhar CSV' });
}