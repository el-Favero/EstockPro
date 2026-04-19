import { collection, doc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../src/firebaseConfig';

const COLECAO = 'observacoesDia';

function getCurrentUserId(): string {
  const user = auth.currentUser;
  if (!user) {
    return "";
  }
  return user.uid;
}

export async function fetchObservacoesPorDia(): Promise<Record<string, string>> {
  const userId = getCurrentUserId();
  if (!userId) {
    return {};
  }
  const q = query(collection(db, COLECAO), where('userId', '==', userId));
  const snap = await getDocs(q);
  const map: Record<string, string> = {};
  snap.forEach((d) => {
    const texto = d.data()?.texto;
    if (typeof texto === 'string') {
      map[d.id] = texto;
    }
  });
  return map;
}

export async function saveObservacaoDia(dataKey: string, texto: string): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('Usuário não está logado');
  }
  await setDoc(doc(db, COLECAO, dataKey), {
    userId,
    texto,
    atualizadoEm: new Date().toISOString(),
  });
}
