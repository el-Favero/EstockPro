// context/estoqueStorage.tsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { auth } from '../src/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { Produto } from '../types/produto';
import {
  getProdutos,
  createProduto,
  updateProduto,
  deleteProduto,
  adicionarLoteOuCriarProduto as adicionarLoteOuCriarProdutoService,
} from '../services/produtoService';
import { registrarMovimentacao as registrarMovimentacaoService } from '../services/movimentacao/movimentacaoServices';
import { MovimentacaoInput, Movimentacao } from '../services/movimentacao/types';
import { getTodasMovimentacoes } from '../services/movimentacao/movimentacaoServices';
import { fetchObservacoesPorDia, saveObservacaoDia } from '../services/observacaoDiaService';

export type CadastroLoteParams = {
  nome: string;
  categoria: string;
  descricao?: string;
  validade: string;
  quantidadeUnidades: number;
  quantidadeKg?: number;
  codigoBarras?: string;
  preco?: number; // Opcional - por enquanto não usado
};

interface EstoqueContextType {
  produtos: Produto[];
  movimentacoes: Movimentacao[];
  observacoesPorDia: Record<string, string>;
  produtosLoading: boolean;
  movimentacoesLoading: boolean;
  carregarProdutos: (options?: { showLoading?: boolean }) => Promise<void>;
  carregarMovimentacoes: (options?: { showLoading?: boolean }) => Promise<void>;
  adicionarProduto: (produto: Omit<Produto, 'id'>) => Promise<string>;
  cadastrarProdutoComLote: (params: CadastroLoteParams) => Promise<string>;
  editarProduto: (id: string, updates: Partial<Omit<Produto, 'id'>>) => Promise<void>;
  removerProduto: (id: string) => Promise<void>;
  registrarMovimentacao: (data: MovimentacaoInput) => Promise<string>;
  salvarObservacao: (data: string, texto: string) => Promise<void>;
}

const EstoqueContext = createContext<EstoqueContextType>({} as EstoqueContextType);

export const EstoqueProvider = ({ children }: { children: React.ReactNode }) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [observacoesPorDia, setObservacoesPorDia] = useState<Record<string, string>>({});
  const [produtosLoading, setProdutosLoading] = useState(true);
  const [movimentacoesLoading, setMovimentacoesLoading] = useState(true);

  // Safe array getters
  const safeProdutos = produtos || [];
  const safeMovimentacoes = movimentacoes || [];

  const carregarProdutos = useCallback(async (options?: { showLoading?: boolean }) => {
    const showLoading = options?.showLoading !== false;
    if (showLoading) setProdutosLoading(true);
    try {
      const dados = await getProdutos();
      setProdutos(dados || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProdutos([]);
    } finally {
      if (showLoading) setProdutosLoading(false);
    }
  }, []);

  const carregarMovimentacoes = useCallback(async (options?: { showLoading?: boolean }) => {
    const showLoading = options?.showLoading !== false;
    if (showLoading) setMovimentacoesLoading(true);
    try {
      const dados = await getTodasMovimentacoes();
      setMovimentacoes(dados);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
    } finally {
      if (showLoading) setMovimentacoesLoading(false);
    }
  }, []);

  const carregarObservacoes = useCallback(async () => {
    try {
      const map = await fetchObservacoesPorDia();
      setObservacoesPorDia(map);
    } catch (error) {
      console.error('Erro ao carregar observações:', error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth changed:", user?.uid);
      if (user) {
        carregarProdutos();
        carregarMovimentacoes();
        carregarObservacoes();
      } else {
        setProdutos([]);
        setMovimentacoes([]);
        setObservacoesPorDia({});
      }
    });
    return unsubscribe;
  }, [carregarProdutos, carregarMovimentacoes, carregarObservacoes]);

  const adicionarProduto = async (produto: Omit<Produto, 'id'>) => {
    const id = await createProduto(produto);
    // Atualiza estado local diretamente - sem refetch
    const novoProduto = { ...produto, id, userId: produto.userId || '' } as Produto;
    setProdutos((prev) => [...prev, novoProduto]);
    return id;
  };

  const cadastrarProdutoComLote = async (params: CadastroLoteParams) => {
    const id = await adicionarLoteOuCriarProdutoService(params);
    // Atualiza estado local - busca apenas o produto criado
    try {
      const { getProduto } = await import('../services/produtoService');
      const novoProduto = await getProduto(id);
      if (novoProduto) {
        setProdutos((prev) => {
          const exists = prev.some(p => p.id === id);
          if (exists) return prev;
          return [...prev, novoProduto];
        });
      }
    } catch (e) {
      // Se falhar, faz refetch completo
      await carregarProdutos({ showLoading: false });
    }
    return id;
  };

  const editarProduto = async (id: string, updates: Partial<Omit<Produto, 'id'>>) => {
    try {
      await updateProduto(id, updates);
      // Atualiza estado local diretamente - sem refetch
      setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    } catch (error) {
      console.error('Erro ao editar produto:', error);
      throw error;
    }
  };

  const removerProduto = async (id: string) => {
    try {
      await deleteProduto(id);
      // Atualiza estado local diretamente - sem refetch
      setProdutos((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      throw error;
    }
  };

  const registrarMovimentacao = async (data: MovimentacaoInput) => {
    try {
      const movimentacaoId = await registrarMovimentacaoService(data);
      
      // Atualiza movimentações localmente
      const { getTodasMovimentacoes } = await import('../services/movimentacao/movimentacaoServices');
      const novasMovimentacoes = await getTodasMovimentacoes();
      setMovimentacoes(novasMovimentacoes);
      
      // Atualiza produtos localmente - busca apenas o produto afetado
      try {
        const { getProduto } = await import('../services/produtoService');
        const produtoAtualizado = await getProduto(data.produtoId);
        if (produtoAtualizado) {
          setProdutos((prev) => prev.map((p) => 
            p.id === data.produtoId ? produtoAtualizado : p
          ));
        }
      } catch (e) {
        // Se falhar, faz refetch completo
        await carregarProdutos({ showLoading: false });
      }
      
      return movimentacaoId;
    } catch (error) {
      console.error('Erro no contexto ao registrar movimentação:', error);
      throw error;
    }
  };

  const salvarObservacao = async (data: string, texto: string) => {
    await saveObservacaoDia(data, texto);
    setObservacoesPorDia((prev) => ({ ...prev, [data]: texto }));
  };

  return (
    <EstoqueContext.Provider
      value={{
        produtos,
        movimentacoes,
        observacoesPorDia,
        produtosLoading,
        movimentacoesLoading,
        carregarProdutos,
        carregarMovimentacoes,
        adicionarProduto,
        cadastrarProdutoComLote,
        editarProduto,
        removerProduto,
        registrarMovimentacao,
        salvarObservacao,
      }}
    >
      {children}
    </EstoqueContext.Provider>
  );
};

export const useEstoque = () => useContext(EstoqueContext);
