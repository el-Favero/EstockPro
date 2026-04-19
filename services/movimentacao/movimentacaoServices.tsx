import { db, auth } from '../../src/firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, where } from 'firebase/firestore';
import { getProduto, saidaEstoqueFIFO, adicionarLoteOuCriarProduto, SaidaFIFOResult } from '../produtoService';
import { Movimentacao, MovimentacaoInput } from './types';

function getCurrentUserId(): string {
  const user = auth.currentUser;
  if (!user) {
    return "";
  }
  return user.uid;
}

export const registrarMovimentacao = async (data: MovimentacaoInput) => {
  try {
    const userId = getCurrentUserId();
    
    // 1. Buscar o produto atual
    const produto = await getProduto(data.produtoId);
    
    // 2. Verificar se o produto existe
    if (!produto) {
      throw new Error('Produto não encontrado');
    }
    
    // 3. Validar estoque total (para retirada)
    if (data.tipo === 'retirada') {
      const qtdTotal = produto.quantidade || 0;
      const kgTotal = produto.quantidadeKg || 0;
      if (data.quantidadeUnidades && data.quantidadeUnidades > qtdTotal) {
        throw new Error(`Unidades insuficientes. Disponível: ${qtdTotal}`);
      }
      if (data.quantidadeKg && data.quantidadeKg > kgTotal) {
        throw new Error(`Peso insuficiente. Disponível: ${kgTotal} kg`);
      }
    }
    
    let resultadoFIFO: SaidaFIFOResult | null = null;
    let estoqueAnterior = {
      quantidade: produto.quantidade,
      quantidadeKg: produto.quantidadeKg
    };
    let estoqueNovo = {
      quantidade: produto.quantidade,
      quantidadeKg: produto.quantidadeKg
    };
    
    // 4. Se for retirada, usar FIFO automático
    if (data.tipo === 'retirada') {
      resultadoFIFO = await saidaEstoqueFIFO({
        produtoId: data.produtoId,
        quantidadeUnidades: data.quantidadeUnidades,
        quantidadeKg: data.quantidadeKg,
      });
      
      // Buscar produto atualizado para ter valores reais
      const produtoAtualizado = await getProduto(data.produtoId);
      if (produtoAtualizado) {
        estoqueNovo = {
          quantidade: produtoAtualizado.quantidade,
          quantidadeKg: produtoAtualizado.quantidadeKg
        };
      }
    }
    
    // 5. Se for retorno (entrada), usar adicionarLoteOuCriarProduto
    if (data.tipo === 'retorno') {
      // O retorno cria um novo lote (entrada de mercadoria)
      // Se observacao contém uma data de validade, usa ela; caso contrário usa hoje + 30 dias
      let validade = data.observacao;
      if (!validade) {
        validade = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      } else {
        // Converter de DD/MM/YYYY para YYYY-MM-DD se necessário
        const parts = validade.split('/');
        if (parts.length === 3) {
          validade = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      
      await adicionarLoteOuCriarProduto({
        nome: produto.nome,
        categoria: produto.categoria,
        descricao: data.finalidade,
        validade: validade,
        quantidadeUnidades: data.quantidadeUnidades || 0,
        quantidadeKg: data.quantidadeKg,
      });
      
      // Buscar produto atualizado
      const produtoAtualizado = await getProduto(data.produtoId);
      if (produtoAtualizado) {
        estoqueNovo = {
          quantidade: produtoAtualizado.quantidade,
          quantidadeKg: produtoAtualizado.quantidadeKg
        };
      }
    }
    
    // 6. Determinar a quantidade principal
    const quantidadePrincipal = data.quantidadeUnidades || data.quantidadeKg || 0;
    
    // 7. Criar objeto completo da movimentação (removendo undefined)
    const movimentacaoCompleta: Record<string, any> = {
      ...data,
      userId,
      quantidade: quantidadePrincipal,
      data: new Date().toISOString(),
      estoqueAnterior,
      estoqueNovo,
    };
    
    // Add optional fields only if they have values
    if (resultadoFIFO?.lotesAfetados) {
      movimentacaoCompleta.lotesAfetados = JSON.stringify(resultadoFIFO.lotesAfetados);
    }
    
    // Remove any undefined values
    Object.keys(movimentacaoCompleta).forEach(key => {
      if (movimentacaoCompleta[key] === undefined) {
        delete movimentacaoCompleta[key];
      }
    });
    
    // 8. Salvar no Firestore
    const movimentacaoRef = await addDoc(collection(db, 'movimentacoes'), movimentacaoCompleta);
    
    return movimentacaoRef.id;
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error);
    throw error;
  }
};

export const getTodasMovimentacoes = async (): Promise<Movimentacao[]> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.warn("getTodasMovimentacoes: Usuário não logado, retornando array vazio");
      return [];
    }
    // Sem orderBy para evitar índice - ordena no JavaScript
    const q = query(
      collection(db, 'movimentacoes'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    
    // Ordenar por data no JavaScript
    const movimentacoes = snapshot.docs
      .map(doc => {
        const data = doc.data();
        const quantidade = data.quantidadeUnidades || data.quantidadeKg || 0;
        return {
          id: doc.id,
          ...data,
          quantidade,
        } as Movimentacao;
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    
    return movimentacoes;
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    return [];
  }
};