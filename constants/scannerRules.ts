/**
 * Regras do leitor de código de barras (definidas antes da implementação da feature).
 * Ajuste estes valores quando for integrar o scanner no app.
 */
export const SCANNER_RULES = {
  /** Se false, o produto pode existir sem código de barras. */
  codigoBarrasObrigatorio: false,
  /** Se false, não permite dois produtos com o mesmo código (quando houver campo). */
  permitirCodigoDuplicado: false,
  /** Uso previsto: apenas busca, apenas cadastro, ou ambos. */
  uso: 'busca_e_cadastro' as const,
} as const;
