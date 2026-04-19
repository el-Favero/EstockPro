/**
 * Converte validade no formato DD/MM/AAAA para ISO (AAAA-MM-DD).
 * Se já estiver em ISO (contém "-"), devolve igual.
 * Se formato inválido, retorna data atual como fallback.
 */
export function validadeParaISO(validade: string): string {
  const t = validade.trim();
  if (t.includes("-") && /^\d{4}-\d{2}-\d{2}/.test(t)) return t.split("T")[0];
  const limpo = t.replace(/\D/g, "");
  if (limpo.length !== 8) {
    // Tentar interpretar como data inválida mas conversível
    if (limpo.length >= 6) {
      const dia = limpo.slice(0, 2);
      const mes = limpo.slice(2, 4);
      const ano = limpo.length === 6 ? "20" + limpo.slice(4, 6) : limpo.slice(4, 8);
      if (Number(dia) <= 31 && Number(mes) <= 12) {
        return `${ano}-${mes}-${dia}`;
      }
    }
    return "";
  }
  const dia = limpo.slice(0, 2);
  const mes = limpo.slice(2, 4);
  const ano = limpo.slice(4, 8);
  return `${ano}-${mes}-${dia}`;
}

/**
 * Converte validade em ISO (AAAA-MM-DD) para exibição DD/MM/AAAA.
 * Se já estiver no formato DD/MM/AAAA (dados antigos), devolve igual.
 */
export function validadeParaExibicao(validade: string): string {
  if (!validade || !validade.trim()) return "";
  if (validade.includes("/")) return validade.trim(); // já é DD/MM/AAAA
  const [ano, mes, dia] = validade.split(/[-T]/);
  if (!ano || !mes || !dia) return validade;
  return `${dia}/${mes}/${ano}`;
}

/**
 * Formata digitação para DD/MM/AAAA (máscara).
 */
export function formatarDataInput(value: string): string {
  const limpo = value.replace(/\D/g, "").slice(0, 8);
  if (limpo.length <= 2) return limpo;
  if (limpo.length <= 4) return limpo.replace(/(\d{2})(\d{0,2})/, "$1/$2");
  return limpo.replace(/(\d{2})(\d{2})(\d{0,4})/, "$1/$2/$3");
}
