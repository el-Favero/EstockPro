import { db, auth } from "../src/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { Produto, LoteProduto } from "../types/produto";
import { validadeParaISO } from "../utils/validadeUtils";

function getCurrentUserId(): string {
  const user = auth.currentUser;
  if (!user) {
    return "";
  }
  return user.uid;
}

function removeUndefined<T extends Record<string, any>>(obj: T): T {
  const novo: Record<string, any> = {};
  Object.keys(obj).forEach((chave) => {
    const valor = obj[chave];
    if (valor !== undefined) {
      novo[chave] = valor;
    }
  });
  return novo as T;
}

function gerarIdLote(): string {
  return `lote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function encontrarIndiceLotePorValidade(lotes: LoteProduto[], validade: string): number {
  return lotes.findIndex((l) => l.validade === validade);
}

function ordenarLotesPorValidade(lotes: LoteProduto[]): LoteProduto[] {
  return [...lotes].sort(
    (a, b) => new Date(a.validade).getTime() - new Date(b.validade).getTime()
  );
}

export const createProduto = async (
  produto: Omit<Produto, "id" | "userId">
): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error("Usuário não está logado");
    }
    const docRef = await addDoc(collection(db, "produtos"), {
      ...produto,
      userId,
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    throw error;
  }
};

export const getProdutos = async (): Promise<Produto[]> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.warn("getProdutos: Usuário não logado, retornando array vazio");
      return [];
    }
    const q = query(collection(db, "produtos"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const produtos: Produto[] = [];
    querySnapshot.forEach((snap) => {
      produtos.push({ id: snap.id, ...snap.data() } as Produto);
    });
    return produtos;
  } catch (error) {
    console.error("Erro detalhado ao buscar produtos:", error);
    return [];
  }
};

export const getProduto = async (id: string): Promise<Produto | null> => {
  try {
    const produtoRef = doc(db, "produtos", id);
    const produtoSnap = await getDoc(produtoRef);
    if (produtoSnap.exists()) {
      return { id: produtoSnap.id, ...produtoSnap.data() } as Produto;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    throw error;
  }
};

export const updateProduto = async (
  id: string,
  updates: Partial<Omit<Produto, "id">>
): Promise<void> => {
  try {
    const produtoRef = doc(db, "produtos", id);
    const dados = removeUndefined(updates as Record<string, any>);
    await updateDoc(produtoRef, dados);
  } catch (error) {
    console.error("Erro detalhado ao atualizar produto:", error);
    throw error;
  }
};

export const deleteProduto = async (id: string): Promise<void> => {
  try {
    const produtoRef = doc(db, "produtos", id);
    await deleteDoc(produtoRef);
  } catch (error) {
    console.error("Erro detalhado ao deletar produto:", error);
    throw error;
  }
};

export const findProdutoPorNomeECategoria = async (
  nome: string,
  categoria: string
): Promise<Produto | null> => {
  const userId = getCurrentUserId();
  if (!userId) return null;
  const produtosRef = collection(db, "produtos");
  const q = query(
    produtosRef,
    where("userId", "==", userId),
    where("nome", "==", nome),
    where("categoria", "==", categoria)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Produto;
};

export const findProdutoPorCodigoBarras = async (
  codigo: string
): Promise<Produto | null> => {
  const c = codigo.trim();
  if (!c) return null;
  const userId = getCurrentUserId();
  if (!userId) return null;
  const produtosRef = collection(db, "produtos");
  const q = query(
    produtosRef,
    where("userId", "==", userId),
    where("codigoBarras", "==", c)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Produto;
};

export const adicionarLoteOuCriarProduto = async (params: {
  nome: string;
  categoria: string;
  descricao?: string;
  validade: string;
  quantidadeUnidades: number;
  quantidadeKg?: number;
  codigoBarras?: string;
}): Promise<string> => {
  const { nome, categoria, descricao, validade, quantidadeUnidades, quantidadeKg, codigoBarras } = params;
  const validadeISO = validadeParaISO(validade);
  const dataEntrada = new Date().toISOString();
  const existente = await findProdutoPorNomeECategoria(nome, categoria);

  if (!existente) {
    const userId = getCurrentUserId();
    const novoLote: LoteProduto = {
      id: gerarIdLote(),
      validade: validadeISO,
      quantidadeUnidades: quantidadeUnidades > 0 ? quantidadeUnidades : undefined,
      quantidadeKg: quantidadeKg && quantidadeKg > 0 ? quantidadeKg : undefined,
      dataEntrada,
    };
    const novoProduto: Omit<Produto, "id"> = removeUndefined({
      userId,
      nome,
      categoria,
      descricao,
      quantidade: quantidadeUnidades,
      quantidadeKg: quantidadeKg,
      validade: validadeISO,
      lotes: [novoLote],
      codigoBarras: codigoBarras?.trim() || undefined,
    });
    return await createProduto(novoProduto);
  }

  const lotesAtuais: LoteProduto[] = existente.lotes || [];
  const indiceLoteExistente = encontrarIndiceLotePorValidade(lotesAtuais, validadeISO);
  let novosLotes: LoteProduto[];
  let quantidadeTotalUnidades = existente.quantidade || 0;
  let quantidadeTotalKg = existente.quantidadeKg || 0;

  if (indiceLoteExistente >= 0) {
    const loteExistente = lotesAtuais[indiceLoteExistente];
    const novaQtdUnidades = (loteExistente.quantidadeUnidades || 0) + quantidadeUnidades;
    const novaQtdKg = (loteExistente.quantidadeKg || 0) + (quantidadeKg || 0);
    lotesAtuais[indiceLoteExistente] = {
      ...loteExistente,
      quantidadeUnidades: novaQtdUnidades > 0 ? novaQtdUnidades : undefined,
      quantidadeKg: novaQtdKg > 0 ? novaQtdKg : undefined,
    };
    novosLotes = lotesAtuais;
    quantidadeTotalUnidades += quantidadeUnidades;
    quantidadeTotalKg += quantidadeKg || 0;
  } else {
    const novoLote: LoteProduto = {
      id: gerarIdLote(),
      validade: validadeISO,
      quantidadeUnidades: quantidadeUnidades > 0 ? quantidadeUnidades : undefined,
      quantidadeKg: quantidadeKg && quantidadeKg > 0 ? quantidadeKg : undefined,
      dataEntrada,
    };
    novosLotes = [...lotesAtuais, novoLote];
    quantidadeTotalUnidades += quantidadeUnidades;
    quantidadeTotalKg += quantidadeKg || 0;
  }

  const lotesOrdenados = ordenarLotesPorValidade(novosLotes);
  const validadeMaisProxima = lotesOrdenados.find((l) => (l.quantidadeUnidades || 0) > 0)?.validade;

  const produtoRef = doc(db, "produtos", existente.id);
  const dadosAtualizados = removeUndefined({
    quantidade: quantidadeTotalUnidades,
    quantidadeKg: quantidadeTotalKg || undefined,
    validade: validadeMaisProxima,
    lotes: novosLotes,
    codigoBarras: codigoBarras?.trim() && !existente.codigoBarras ? codigoBarras.trim() : undefined,
  });

  await updateDoc(produtoRef, dadosAtualizados);
  return existente.id;
};

export interface SaidaFIFOInput {
  produtoId: string;
  quantidadeUnidades?: number;
  quantidadeKg?: number;
}

export interface SaidaFIFOResult {
  sucesso: boolean;
  lotesAfetados: {
    loteId: string;
    validade: string;
    quantidadeRemovida: number;
    quantidadeRestante: number;
  }[];
  message: string;
}

export const saidaEstoqueFIFO = async (input: SaidaFIFOInput): Promise<SaidaFIFOResult> => {
  const { produtoId, quantidadeUnidades, quantidadeKg } = input;
  const produto = await getProduto(produtoId);
  if (!produto) throw new Error("Produto não encontrado");

  const lotes = produto.lotes || [];
  if (lotes.length === 0) throw new Error("Produto sem lotes");

  const lotesOrdenados = ordenarLotesPorValidade(lotes);
  let qtdUnidadesRemover = quantidadeUnidades || 0;
  let qtdKgRemover = quantidadeKg || 0;
  const lotesAfetados: SaidaFIFOResult["lotesAfetados"] = [];
  const novosLotes: LoteProduto[] = [];

  for (const lote of lotesOrdenados) {
    if (qtdUnidadesRemover <= 0 && qtdKgRemover <= 0) {
      novosLotes.push(lote);
      continue;
    }
    const qtdLoteUnidades = lote.quantidadeUnidades || 0;
    const qtdLoteKg = lote.quantidadeKg || 0;
    let removidoUnidades = 0;
    let removidoKg = 0;
    let restanteUnidades = qtdLoteUnidades;
    let restanteKg = qtdLoteKg;

    if (qtdUnidadesRemover > 0 && qtdLoteUnidades > 0) {
      removidoUnidades = Math.min(qtdUnidadesRemover, qtdLoteUnidades);
      restanteUnidades = qtdLoteUnidades - removidoUnidades;
      qtdUnidadesRemover -= removidoUnidades;
    }
    if (qtdKgRemover > 0 && qtdLoteKg > 0) {
      removidoKg = Math.min(qtdKgRemover, qtdLoteKg);
      restanteKg = qtdLoteKg - removidoKg;
      qtdKgRemover -= removidoKg;
    }
    if (restanteUnidades > 0 || restanteKg > 0) {
      lotesAfetados.push({
        loteId: lote.id,
        validade: lote.validade,
        quantidadeRemovida: removidoUnidades || removidoKg,
        quantidadeRestante: restanteUnidades || restanteKg,
      });
      novosLotes.push({
        ...lote,
        quantidadeUnidades: restanteUnidades > 0 ? restanteUnidades : undefined,
        quantidadeKg: restanteKg > 0 ? restanteKg : undefined,
      });
    } else {
      lotesAfetados.push({
        loteId: lote.id,
        validade: lote.validade,
        quantidadeRemovida: removidoUnidades || removidoKg,
        quantidadeRestante: 0,
      });
    }
  }

  if (qtdUnidadesRemover > 0 || qtdKgRemover > 0) {
    const msg = qtdUnidadesRemover > 0 ? `Estoque insuficiente: faltam ${qtdUnidadesRemover} un` : `Estoque insuficiente: faltam ${qtdKgRemover} kg`;
    throw new Error(msg);
  }

  const novaQuantidadeTotal = novosLotes.reduce((acc, l) => acc + (l.quantidadeUnidades || 0), 0);
  const novaQuantidadeKgTotal = novosLotes.reduce((acc, l) => acc + (l.quantidadeKg || 0), 0);
  const lotesComEstoque = novosLotes.filter((l) => (l.quantidadeUnidades || 0) > 0 || (l.quantidadeKg || 0) > 0);
  const validadeMaisProxima = lotesComEstoque.length > 0 ? ordenarLotesPorValidade(lotesComEstoque)[0].validade : undefined;

  const produtoRef = doc(db, "produtos", produtoId);
  await updateDoc(produtoRef, {
    quantidade: novaQuantidadeTotal,
    quantidadeKg: novaQuantidadeKgTotal || undefined,
    validade: validadeMaisProxima,
    lotes: novosLotes,
  });

  const lotesMsg = lotesAfetados.map((l) => `${l.validade}: -${l.quantidadeRemovida}`).join(", ");
  return { sucesso: true, lotesAfetados, message: `Removido: ${lotesMsg}` };
};

export const buscarProdutosPorNome = async (nome: string): Promise<Produto[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  const q = query(collection(db, "produtos"), where("userId", "==", userId), where("nome", ">=", nome), where("nome", "<=", nome + "\uf8ff"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Produto));
};

export interface ProdutoCSV {
  nome: string;
  categoria: string;
  validade: string;
  quantidadeUnidades?: number;
  quantidadeKg?: number;
  codigoBarras?: string;
  descricao?: string;
}

export interface ImportacaoResultado {
  sucesso: number;
  erros: { linha: number; erro: string }[];
}

export const importarProdutosEmMassa = async (
  produtos: ProdutoCSV[]
): Promise<ImportacaoResultado> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("Usuário não está logado");
  }

  const batch = writeBatch(db);
  let sucesso = 0;
  const erros: { linha: number; erro: string }[] = [];
  const dataEntrada = new Date().toISOString();

  // Primeiro, buscar todos os produtos existentes para verificar duplicatas
  const produtosExistentes = await getProdutos();
  const produtosExistentesMap = new Map<string, Produto>();
  produtosExistentes.forEach(p => {
    const key = `${p.nome.toLowerCase()}_${p.categoria.toLowerCase()}`;
    produtosExistentesMap.set(key, p);
  });

  for (let i = 0; i < produtos.length; i++) {
    const p = produtos[i];
    const linha = i + 1;

    if (!p.nome?.trim()) {
      erros.push({ linha, erro: "Nome vazio" });
      continue;
    }
    if (!p.categoria?.trim()) {
      erros.push({ linha, erro: "Categoria vazia" });
      continue;
    }
    if (!p.validade?.trim()) {
      erros.push({ linha, erro: "Validade vazia" });
      continue;
    }

    const validadeISO = validadeParaISO(p.validade);
    if (!validadeISO) {
      erros.push({ linha, erro: "Validade inválida" });
      continue;
    }

    const qtdUnidades = p.quantidadeUnidades ?? 0;
    const qtdKg = p.quantidadeKg ?? 0;
    if (qtdUnidades <= 0 && qtdKg <= 0) {
      erros.push({ linha, erro: "Quantidade inválida" });
      continue;
    }

    // Verificar se o produto já existe pelo nome + categoria
    const key = `${p.nome.trim().toLowerCase()}_${p.categoria.trim().toLowerCase()}`;
    const produtoExistente = produtosExistentesMap.get(key);

    if (produtoExistente) {
      // Produto existe - adicionar como novo lote
      const novoLote: LoteProduto = {
        id: gerarIdLote(),
        validade: validadeISO,
        quantidadeUnidades: qtdUnidades > 0 ? qtdUnidades : undefined,
        quantidadeKg: qtdKg > 0 ? qtdKg : undefined,
        dataEntrada,
      };

      const lotesAtuais: LoteProduto[] = produtoExistente.lotes || [];
      const indiceLoteExistente = lotesAtuais.findIndex((l) => l.validade === validadeISO);
      let novosLotes: LoteProduto[];
      let quantidadeTotalUnidades = produtoExistente.quantidade || 0;
      let quantidadeTotalKg = produtoExistente.quantidadeKg || 0;

      if (indiceLoteExistente >= 0) {
        const loteExistente = lotesAtuais[indiceLoteExistente];
        const novaQtdUnidades = (loteExistente.quantidadeUnidades || 0) + qtdUnidades;
        const novaQtdKg = (loteExistente.quantidadeKg || 0) + (qtdKg || 0);
        lotesAtuais[indiceLoteExistente] = {
          ...loteExistente,
          quantidadeUnidades: novaQtdUnidades > 0 ? novaQtdUnidades : undefined,
          quantidadeKg: novaQtdKg > 0 ? novaQtdKg : undefined,
        };
        novosLotes = lotesAtuais;
        quantidadeTotalUnidades += qtdUnidades;
        quantidadeTotalKg += qtdKg || 0;
      } else {
        novosLotes = [...lotesAtuais, novoLote];
        quantidadeTotalUnidades += qtdUnidades;
        quantidadeTotalKg += qtdKg || 0;
      }

      const produtoRef = doc(db, "produtos", produtoExistente.id);
      batch.update(produtoRef, {
        quantidade: quantidadeTotalUnidades,
        quantidadeKg: quantidadeTotalKg || undefined,
        lotes: novosLotes,
      });
      sucesso++;
    } else {
      // Produto não existe - criar novo
      const novoLote: LoteProduto = {
        id: gerarIdLote(),
        validade: validadeISO,
        quantidadeUnidades: qtdUnidades > 0 ? qtdUnidades : undefined,
        quantidadeKg: qtdKg > 0 ? qtdKg : undefined,
        dataEntrada,
      };

      const novoProduto: Omit<Produto, "id"> = {
        userId,
        nome: p.nome.trim(),
        categoria: p.categoria.trim(),
        descricao: p.descricao?.trim(),
        quantidade: qtdUnidades,
        quantidadeKg: qtdKg > 0 ? qtdKg : undefined,
        validade: validadeISO,
        lotes: [novoLote],
        codigoBarras: p.codigoBarras?.trim() || undefined,
      };

      const docRef = doc(collection(db, "produtos"));
      batch.set(docRef, novoProduto);
      sucesso++;
    }
  }

  if (sucesso > 0) {
    await batch.commit();
  }

  return { sucesso, erros };
};