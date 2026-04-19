import { db } from "../src/firebaseConfig";
import { collection, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB71ldSWFmmZnF2ug2Ar3kp4nwCd4uv9fQ",
  authDomain: "appestoque-b0d21.firebaseapp.com",
  projectId: "appestoque-b0d21",
};

async function migrarUserId() {
  console.log("⚠️Script de migração - ADICIONE O UID DO USUARIO ABAIXO:");
  console.log("Copie o UID do Firebase Console → Authentication");
  console.log("Exemplo: 'abc123xyz...'");
  console.log("");
  
  const userId = "SEU_UID_AQUI"; // <-- SUBSTITUA ISTO
  
  if (userId === "SEU_UID_AQUI") {
    console.error("❌ Edite este arquivo e coloque seu UID primeiro!");
    process.exit(1);
  }

  const batch = writeBatch(db);
  let count = 0;

  // Migrar produtos
  const produtosSnap = await getDocs(collection(db, "produtos"));
  console.log(`📦 Produtos encontrados: ${produtosSnap.size}`);
  
  for (const docSnap of produtosSnap.docs) {
    if (!docSnap.data().userId) {
      const docRef = doc(db, "produtos", docSnap.id);
      batch.update(docRef, { userId });
      count++;
    }
  }

  // Migrar movimentações
  const movSnap = await getDocs(collection(db, "movimentacoes"));
  console.log(`📝 Movimentações encontradas: ${movSnap.size}`);
  
  for (const docSnap of movSnap.docs) {
    if (!docSnap.data().userId) {
      const docRef = doc(db, "movimentacoes", docSnap.id);
      batch.update(docRef, { userId });
      count++;
    }
  }

  if (count > 0) {
    await batch.commit();
    console.log(`✅ ${count} documentos atualizados com userId`);
  } else {
    console.log("ℹ️ Nenhum documento precisava de migração");
  }
}

migrarUserId().catch(console.error);