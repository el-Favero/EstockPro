# Guia de Segurança - MeuEstoqueApp

## Regras do Firebase já criadas

Este projeto inclui arquivos de configuração de segurança:

### 1. firestore.rules
Regras de segurança para o Firestore que garantem:
- Cada usuário só acessa seus propios produtos e movimentações
- O campo `userId` é obligatorio em todos os documentos
- Operações de create/update/delete verificam ownership

### 2. storage.rules
Regras para o Firebase Storage (preparação para uso futuro):
- Usuários só podem ler/escrever seus propios arquivos
- Estrutura: `/usuarios/{userId}/...`

### 3. firestore.indexes.json
Índices compostos necessários para as queries do app:
- produtos: (userId, nome, categoria)
- produtos: (userId, codigoBarras)
- movimentacoes: (userId, data DESC)

---

## Como aplicar as regras

### Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Storage Rules
```bash
firebase deploy --only storage
```

### Índices
```bash
firebase deploy --only firestore:indexes
```

---

## App Check (Opcional - Recomendado para produção)

App Check é uma camada extra de segurança que ajuda a proteger seu app contra acesso não autorizado.

### Ativação no Firebase Console
1. Vá para Firebase Console → App Check
2. Selecione Firestore
3. Clique em "Registar app" para Android/iOS
4. Siga as instruções para configurar

### Código necessário (se aplicável)
Para ativar no código, você precisaria adicionar:

```typescript
// src/firebaseConfig.ts (adicionar)
import { initializeAppCheck, reCAPTCHAv3Provider } from "firebase/app-check";

const appCheck = initializeAppCheck(app, {
  provider: new reCAPTCHAv3Provider('YOUR_SITE_KEY'),
  isTokenAutoRefreshEnabled: true,
});
```

### Quando usar App Check
- Em produção (Google Play / App Store)
- Após validar que o app funciona corretamente sem ele
- Recomendado: ativar após testes de QA

---

## Recomendações finais de segurança

1. **Não faça deploy de reglas permissivas** em produção
2. **Teste localmente** antes de enviar para produção
3. **Mantenha as regras** atualizadas conforme o app cresce
4. **Monitore logs** do Firebase Console para detectar problemas