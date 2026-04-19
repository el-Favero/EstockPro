import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Produto } from "../types/produto";
import {
  getProdutos,
  updateProduto,
  deleteProduto,
} from "../services/produtoService";
import { validadeParaExibicao, validadeParaISO, formatarDataInput } from "../utils/validadeUtils";

const ProdutoList: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editCategoria, setEditCategoria] = useState("");
  const [editValidade, setEditValidade] = useState("");
  const [editQuantidade, setEditQuantidade] = useState("");
  const [editQuantidadeKg, setEditQuantidadeKg] = useState("");

  const carregarDados = async () => {
    setLoading(true);
    try {
      const data = await getProdutos();
      setProdutos(data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const abrirEdicao = (item: Produto) => {
    setEditando(item);
    setEditNome(item.nome);
    setEditCategoria(item.categoria);
    setEditValidade(item.validade ? validadeParaExibicao(item.validade) : "");
    setEditQuantidade(String(item.quantidade ?? 0));
    setEditQuantidadeKg(item.quantidadeKg != null ? String(item.quantidadeKg) : "");
  };

  const fecharEdicao = () => {
    setEditando(null);
    setEditNome("");
    setEditCategoria("");
    setEditValidade("");
    setEditQuantidade("");
    setEditQuantidadeKg("");
  };

  const handleSalvarEdicao = async () => {
    if (!editando) return;
    if (!editNome.trim() || !editCategoria.trim() || !editValidade.trim()) {
      Alert.alert("Erro", "Preencha nome, categoria e validade.");
      return;
    }
    const unidades = Number(editQuantidade.replace(",", ".")) || 0;
    const kg = Number(editQuantidadeKg.replace(",", ".")) || 0;
    if (unidades <= 0 && kg <= 0) {
      Alert.alert("Erro", "Informe pelo menos uma quantidade (unidades ou kg).");
      return;
    }

    try {
      await updateProduto(editando.id, {
        nome: editNome.trim(),
        categoria: editCategoria.trim(),
        validade: validadeParaISO(editValidade),
        quantidade: unidades,
        quantidadeKg: kg > 0 ? kg : undefined,
      });
      await carregarDados();
      fecharEdicao();
      Alert.alert("Sucesso", "Produto atualizado.");
    } catch (error: any) {
      Alert.alert("Erro", "Falha ao atualizar: " + (error.message || ""));
    }
  };

  const handleDeleteProduto = async (id: string) => {
    Alert.alert(
      "Excluir produto",
      "Tem certeza que deseja excluir este produto?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProduto(id);
              setProdutos((prev) => prev.filter((p) => p.id !== id));
            } catch (error) {
              console.error("Erro ao deletar produto:", error);
              Alert.alert("Erro", "Não foi possível excluir.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#0000ff"
        style={{ marginTop: 50 }}
      />
    );
  }

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        📦 Produtos
      </Text>

      <FlatList
        data={produtos}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 30 }}>
            Nenhum produto cadastrado.
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={{
              padding: 15,
              backgroundColor: "#f8fafc",
              borderRadius: 12,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: "#e2e8f0",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
              {item.nome}
            </Text>
            <Text style={{ color: "#64748b", fontSize: 14 }}>
              Categoria: {item.categoria} • Qtd: {item.quantidade ?? 0}
              {item.quantidadeKg != null ? ` • ${item.quantidadeKg} kg` : ""}
              {item.validade ? ` • Validade: ${validadeParaExibicao(item.validade)}` : ""}
            </Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 10,
              }}
            >
              <TouchableOpacity
                onPress={() => abrirEdicao(item)}
                style={{
                  backgroundColor: "#3b82f6",
                  padding: 10,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Editar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDeleteProduto(item.id)}
                style={{
                  backgroundColor: "#ef4444",
                  padding: 10,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Excluir
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal
        visible={!!editando}
        animationType="slide"
        transparent
        onRequestClose={fecharEdicao}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: "85%",
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              Editar produto
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 4 }}>Nome *</Text>
              <TextInput
                style={{
                  backgroundColor: "#f8fafc",
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  marginBottom: 12,
                }}
                placeholder="Nome do produto"
                value={editNome}
                onChangeText={setEditNome}
              />

              <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 4 }}>Categoria *</Text>
              <TextInput
                style={{
                  backgroundColor: "#f8fafc",
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  marginBottom: 12,
                }}
                placeholder="Categoria"
                value={editCategoria}
                onChangeText={setEditCategoria}
              />

              <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 4 }}>Validade *</Text>
              <TextInput
                style={{
                  backgroundColor: "#f8fafc",
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  marginBottom: 12,
                }}
                placeholder="DD/MM/AAAA (ex: 01012026)"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={10}
                value={editValidade}
                onChangeText={(t) => setEditValidade(formatarDataInput(t))}
              />

              <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 4 }}>Quantidade (unidades)</Text>
              <TextInput
                style={{
                  backgroundColor: "#f8fafc",
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  marginBottom: 12,
                }}
                placeholder="0"
                keyboardType="numeric"
                value={editQuantidade}
                onChangeText={setEditQuantidade}
              />

              <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 4 }}>Quantidade (kg)</Text>
              <TextInput
                style={{
                  backgroundColor: "#f8fafc",
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  marginBottom: 20,
                }}
                placeholder="0"
                keyboardType="numeric"
                value={editQuantidadeKg}
                onChangeText={setEditQuantidadeKg}
              />

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={fecharEdicao}
                  style={{
                    flex: 1,
                    backgroundColor: "#e2e8f0",
                    padding: 14,
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontWeight: "600", color: "#475569" }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSalvarEdicao}
                  style={{
                    flex: 1,
                    backgroundColor: "#3b82f6",
                    padding: 14,
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontWeight: "600", color: "#fff" }}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProdutoList;
