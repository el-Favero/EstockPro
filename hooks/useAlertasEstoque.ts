// hooks/useAlertasEstoque.ts
import { useMemo } from 'react';
import { useEstoque } from '../context/estoqueStorage';
import { Produto, LoteProduto } from '../types/produto';

interface AlertaEstoque {
  produto: Produto;
  lote?: LoteProduto;
  tipo: 'estoqueMinimo' | 'validade';
  mensagem: string;
  gravidade: 'baixa' | 'media' | 'alta';
}

export function useAlertasEstoque() {
  const { produtos, carregarProdutos, produtosLoading } = useEstoque();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loading = produtosLoading;

  // Função para calcular dias restantes até a validade
  const calcularDiasRestantes = (validade: string): number => {
    if (!validade) return 999;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataValidade = new Date(validade);
    dataValidade.setHours(0, 0, 0, 0);
    
    const diffTime = dataValidade.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Alertas de validade POR LOTE (não mais por produto)
  const alertasValidade = useMemo((): AlertaEstoque[] => {
    const alertas: AlertaEstoque[] = [];
    
    for (const p of produtos) {
      const lotes = p.lotes || [];
      
      for (const lote of lotes) {
        const dias = calcularDiasRestantes(lote.validade);
        
        if (dias < 0) {
          // Lote VENCIDO
          alertas.push({
            produto: p,
            lote,
            tipo: 'validade',
            mensagem: `${p.nome} (${new Date(lote.validade).toLocaleDateString('pt-BR')}) vencido há ${Math.abs(dias)} dias`,
            gravidade: 'alta'
          });
        } else if (dias <= 60) {
          // Lote vencendo em breve (2 meses = 60 dias)
          let gravidade: 'baixa' | 'media' | 'alta' = 'baixa';
          let mensagem = '';
          
          if (dias <= 7) {
            gravidade = 'alta';
            mensagem = `${p.nome} (${new Date(lote.validade).toLocaleDateString('pt-BR')}) vence em ${dias} dias!`;
          } else if (dias <= 30) {
            gravidade = 'media';
            mensagem = `${p.nome} (${new Date(lote.validade).toLocaleDateString('pt-BR')}) vence em ${dias} dias`;
          } else {
            mensagem = `${p.nome} (${new Date(lote.validade).toLocaleDateString('pt-BR')}) vence em ${dias} dias`;
          }
          
          alertas.push({ produto: p, lote, tipo: 'validade', mensagem, gravidade });
        }
      }
    }
    
    return alertas.sort((a, b) => {
      const peso = { alta: 3, media: 2, baixa: 1 };
      return peso[b.gravidade] - peso[a.gravidade];
    });
  }, [produtos]);

  // Alertas de estoque mínimo
  const alertasEstoqueMinimo = useMemo((): AlertaEstoque[] => {
    const alertas: AlertaEstoque[] = [];
    
    for (const p of produtos) {
      // Verifica estoques mínimos por lote
      const lotes = p.lotes || [];
      
      for (const lote of lotes) {
        if (lote.estoqueMinimoUnidades && (lote.quantidadeUnidades || 0) <= lote.estoqueMinimoUnidades) {
          const atual = lote.quantidadeUnidades || 0;
          const min = lote.estoqueMinimoUnidades;
          const percentual = Math.round((atual / min) * 100);
          
          let gravidade: 'baixa' | 'media' | 'alta' = 'baixa';
          if (percentual <= 25) gravidade = 'alta';
          else if (percentual <= 50) gravidade = 'media';
          
          alertas.push({
            produto: p,
            lote,
            tipo: 'estoqueMinimo',
            mensagem: `${p.nome}: ${atual}/${min} un (${percentual}%)`,
            gravidade
          });
        }
        
        if (lote.estoqueMinimoKg && (lote.quantidadeKg || 0) <= lote.estoqueMinimoKg) {
          const atual = lote.quantidadeKg || 0;
          const min = lote.estoqueMinimoKg;
          const percentual = Math.round((atual / min) * 100);
          
          let gravidade: 'baixa' | 'media' | 'alta' = 'baixa';
          if (percentual <= 25) gravidade = 'alta';
          else if (percentual <= 50) gravidade = 'media';
          
          alertas.push({
            produto: p,
            lote,
            tipo: 'estoqueMinimo',
            mensagem: `${p.nome}: ${atual}/${min} kg (${percentual}%)`,
            gravidade
          });
        }
      }
    }
    
    return alertas;
  }, [produtos]);

  // Todos os alertas juntos
  const todosAlertas = useMemo((): AlertaEstoque[] => {
    return [...alertasValidade, ...alertasEstoqueMinimo].sort((a, b) => {
      const peso = { alta: 3, media: 2, baixa: 1 };
      return peso[b.gravidade] - peso[a.gravidade];
    });
  }, [alertasValidade, alertasEstoqueMinimo]);

  return {
    loading,
    alertasValidade,
    alertasEstoqueMinimo,
    todosAlertas,
    totalAlertas: todosAlertas.length,
    totalVencendo: alertasValidade.filter(a => a.gravidade !== 'alta').length,
    totalVencidos: alertasValidade.filter(a => a.gravidade === 'alta').length,
    calcularDiasRestantes
  };
}