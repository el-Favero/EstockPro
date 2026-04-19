import { ProdutoCSV } from "../services/produtoService";

export const CSV_TEMPLATE = `nome,categoria,validade,quantidadeUnidades,quantidadeKg,codigoBarras,descricao
Fubá de milho,Grãos,01012026,50,,7891234567890,Marca X
Óleo de soja,Cozinha,15062025,100,,7891234567891,3 litros
Sal refinado,Cozinha,31122028,200,,,
Sabão líquido,Limpeza,30122027,30,5.5,,5 galoes`;

export interface LinhaCSV {
  linha: number;
  dados: Partial<ProdutoCSV>;
  erro?: string;
}

function limparCSV(texto: string): string {
  return texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function parseLinha(linha: string, numeroLinha: number): LinhaCSV {
  const partes: string[] = [];
  let atual = "";
  let aspas = false;

  for (let i = 0; i < linha.length; i++) {
    const char = linha[i];
    if (char === '"') {
      aspas = !aspas;
    } else if (char === "," && !aspas) {
      partes.push(atual.trim());
      atual = "";
    } else {
      atual += char;
    }
  }
  partes.push(atual.trim());

  const [
    nome = "",
    categoria = "",
    validade = "",
    quantidadeUnidades = "",
    quantidadeKg = "",
    codigoBarras = "",
    descricao = "",
  ] = partes;

  const dados: Partial<ProdutoCSV> = {};
  if (nome) dados.nome = nome;
  if (categoria) dados.categoria = categoria;
  if (validade) dados.validade = validade;
  if (quantidadeUnidades) {
    const qtd = Number(quantidadeUnidades.replace(",", "."));
    if (!isNaN(qtd)) dados.quantidadeUnidades = qtd;
  }
  if (quantidadeKg) {
    const qtd = Number(quantidadeKg.replace(",", "."));
    if (!isNaN(qtd)) dados.quantidadeKg = qtd;
  }
  if (codigoBarras) dados.codigoBarras = codigoBarras;
  if (descricao) dados.descricao = descricao;

  return { linha: numeroLinha, dados };
}

export function parseCSV(texto: string): LinhaCSV[] {
  const textoLimpo = limparCSV(texto);
  const linhas = textoLimpo.split("\n").filter((l) => l.trim());

  if (linhas.length === 0) {
    return [];
  }

  const primeiraLinha = linhas[0].toLowerCase();
  const comCabecalho =
    primeiraLinha.includes("nome") &&
    primeiraLinha.includes("categoria");

  const inicio = comCabecalho ? 1 : 0;
  const resultado: LinhaCSV[] = [];

  for (let i = inicio; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (linha) {
      resultado.push(parseLinha(linha, i + 1));
    }
  }

  return resultado;
}

export function linhasCSVValidas(linhas: LinhaCSV[]): ProdutoCSV[] {
  const validos: ProdutoCSV[] = [];

  for (const linha of linhas) {
    const { dados } = linha;
    if (
      dados.nome?.trim() &&
      dados.categoria?.trim() &&
      dados.validade?.trim() &&
      ((dados.quantidadeUnidades ?? 0) > 0 || (dados.quantidadeKg ?? 0) > 0)
    ) {
      validos.push(dados as ProdutoCSV);
    }
  }

  return validos;
}

export function linhasInvalidas(linhas: LinhaCSV[]): LinhaCSV[] {
  return linhas.filter((l) => {
    const { dados } = l;
    return (
      !dados.nome?.trim() ||
      !dados.categoria?.trim() ||
      !dados.validade?.trim() ||
      ((dados.quantidadeUnidades ?? 0) <= 0 && (dados.quantidadeKg ?? 0) <= 0)
    );
  });
}