/** Mensagens padronizadas para Alert / feedback (sucesso, erro, aviso). */

export const FEEDBACK = {
  success: {
    produtoCadastrado: 'Produto cadastrado com sucesso.',
    produtoAtualizado: 'Produto atualizado com sucesso.',
    movimentacaoRegistrada: 'Movimentação registrada com sucesso.',
    observacaoSalva: 'Observação salva com sucesso.',
    importacaoSucesso: 'Produtos importados com sucesso.',
  },
  error: {
    generico: 'Não foi possível concluir a operação. Tente novamente.',
    camposProduto: 'Preencha o nome, a categoria e a validade do produto.',
    quantidadeCadastro: 'Informe pelo menos uma quantidade em unidades ou em kg.',
    cadastrarProduto: 'Não foi possível cadastrar o produto.',
    atualizarProduto: 'Não foi possível atualizar o produto.',
    excluirProduto: 'Não foi possível excluir o produto.',
    selecionarProduto: 'Selecione um produto.',
    quantidadeMovimentacao: 'Preencha pelo menos unidades ou kg.',
    unidadesInteiras: 'Unidades deve ser um número inteiro positivo.',
    kgValido: 'Kg deve ser um número positivo (ex.: 1,5).',
    finalidadeRetirada: 'Informe a finalidade da retirada.',
    registrarMovimentacao: 'Não foi possível registrar a movimentação.',
    salvarObservacao: 'Não foi possível salvar a observação.',
    camposObrigatoriosEdicao: 'Preencha os campos obrigatórios.',
    importacaoErro: 'Erro ao importar produtos.',
  },
} as const;
