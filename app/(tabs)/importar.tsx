import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import * as Sharing from "expo-sharing";
import { Paths, File } from "expo-file-system";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useEstoque } from "../../context/estoqueStorage";
import { toast } from "../../utils/toast";
import { FEEDBACK } from "../../constants/feedbackMessages";
import {
  CSV_TEMPLATE,
  parseCSV,
  linhasCSVValidas,
  linhasInvalidas,
  LinhaCSV,
} from "../../utils/csvUtils";
import {
  importarProdutosEmMassa,
  ImportacaoResultado,
} from "../../services/produtoService";

type Passo = "input" | "preview" | "importando" | "resultado";

export default function ImportarProdutos() {
  const { colors } = useTheme();
  const { carregarProdutos } = useEstoque();

  const [csvTexto, setCsvTexto] = useState("");
  const [linhasParseadas, setLinhasParseadas] = useState<LinhaCSV[]>([]);
  const [resultado, setResultado] = useState<ImportacaoResultado | null>(null);
  const [passo, setPasso] = useState<Passo>("input");
  const [importando, setImportando] = useState(false);

  const handleVoltar = () => router.back();

  const handleAnalisar = () => {
    if (!csvTexto.trim()) {
      Alert.alert("Erro", "Cole os dados do CSV para continuar.");
      return;
    }

    const parseadas = parseCSV(csvTexto);
    const validas = linhasCSVValidas(parseadas);
    const invalidas = linhasInvalidas(parseadas);

    if (validas.length === 0) {
      Alert.alert(
        "Erro",
        "Nenhum produto válido encontrado. Verifique o formato dos dados."
      );
      return;
    }

    setLinhasParseadas(parseadas);
    setResultado(null);
    setPasso("preview");

    if (invalidas.length > 0) {
      Alert.alert(
        "Atenção",
        `${validas.length} produtos válidos encontrados.\n${invalidas.length} linhas com erro serão ignoradas.`
      );
    }
  };

  const handleImportar = async () => {
    const validas = linhasCSVValidas(linhasParseadas);
    if (validas.length === 0) {
      Alert.alert("Erro", "Nenhum produto para importar.");
      return;
    }

    setImportando(true);
    setPasso("importando");

    try {
      const res = await importarProdutosEmMassa(validas);
      setResultado(res);
      setPasso("resultado");
      await carregarProdutos();

      if (res.erros.length > 0) {
        toast.error(`${res.sucesso} importados, ${res.erros.length} erros`);
      } else {
        toast.success(`${res.sucesso} produtos importados com sucesso!`);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "";
      toast.error(msg || FEEDBACK.error.cadastrarProduto);
      setPasso("preview");
    } finally {
      setImportando(false);
    }
  };

  const handleNovo = () => {
    setCsvTexto("");
    setLinhasParseadas([]);
    setResultado(null);
    setPasso("input");
  };

  const handleDownloadTemplate = async () => {
    try {
      const fileName = "template_importacao.csv";
      const csvFile = new File(Paths.cache, fileName);
      await csvFile.write(CSV_TEMPLATE);
      await Sharing.shareAsync(csvFile.uri, {
        mimeType: "text/csv",
        dialogTitle: "Baixar modelo de importação",
      });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível baixar o modelo.");
    }
  };

  const validas = linhasCSVValidas(linhasParseadas);
  const invalidas = linhasInvalidas(linhasParseadas);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 16 }}>
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 8 }}>
            <Pressable onPress={handleVoltar} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={24} color={colors.icon} />
            </Pressable>
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: colors.title,
              textAlign: "center",
            }}
          >
            Importar Produtos
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.subtitle,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            Cadastre vários produtos de uma vez
          </Text>
        </View>

        {passo === "input" && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.title,
                marginBottom: 8,
              }}
            >
              Cole os dados do CSV
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.subtitle,
                marginBottom: 12,
              }}
            >
              O formato esperado: nome, categoria, validade (DDMMAAAA), quantidadeUnidades,
              quantidadeKg, codigoBarras, descricao
            </Text>

            <TextInput
              style={{
                backgroundColor: "#f8fafc",
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 12,
                fontSize: 14,
                color: "#0f172a",
                minHeight: 200,
                textAlignVertical: "top",
                fontFamily: "monospace",
              }}
              placeholder={CSV_TEMPLATE}
              placeholderTextColor="#94a3b8"
              multiline
              value={csvTexto}
              onChangeText={setCsvTexto}
            />

            <TouchableOpacity
              onPress={handleDownloadTemplate}
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.title, fontWeight: "600" }}>
                📥 Baixar Modelo CSV
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAnalisar}
              disabled={!csvTexto.trim()}
              style={{
                marginTop: 12,
                backgroundColor: csvTexto.trim() ? "#4f46e5" : "#94a3b8",
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                Analisar Dados
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {passo === "preview" && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: colors.title,
                marginBottom: 16,
              }}
            >
              Resumo da Importação
            </Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text style={{ color: colors.title }}>Produtos válidos:</Text>
              <Text style={{ fontWeight: "bold", color: "#16a34a" }}>
                {validas.length}
              </Text>
            </View>

            {invalidas.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: colors.title }}>Linhas com erro:</Text>
                <Text style={{ fontWeight: "bold", color: "#ef4444" }}>
                  {invalidas.length}
                </Text>
              </View>
            )}

            {invalidas.length > 0 && (
              <View
                style={{
                  backgroundColor: "#fef2f2",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                  maxHeight: 150,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: "#991b1b",
                    fontWeight: "600",
                    marginBottom: 4,
                  }}
                >
                  Erros encontrados:
                </Text>
                {invalidas.slice(0, 5).map((l, i) => (
                  <Text
                    key={i}
                    style={{ fontSize: 11, color: "#991b1b" }}
                  >
                    Linha {l.linha}:{" "}
                    {!linhasParseadas[l.linha - 1]?.dados?.nome
                      ? "sem nome"
                      : !linhasParseadas[l.linha - 1]?.dados?.categoria
                      ? "sem categoria"
                      : !linhasParseadas[l.linha - 1]?.dados?.validade
                      ? "sem validade"
                      : "quantidade inválida"}
                  </Text>
                ))}
                {invalidas.length > 5 && (
                  <Text style={{ fontSize: 11, color: "#991b1b" }}>
                    ...e mais {invalidas.length - 5} erros
                  </Text>
                )}
              </View>
            )}

            <Text
              style={{
                fontSize: 12,
                color: colors.subtitle,
                marginBottom: 16,
              }}
            >
              Os produtos com erro serão ignorados durante a importação.
            </Text>

            <TouchableOpacity
              onPress={handleImportar}
              disabled={validas.length === 0}
              style={{
                backgroundColor: validas.length > 0 ? "#16a34a" : "#94a3b8",
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                Importar {validas.length} Produtos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNovo}
              style={{
                marginTop: 12,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.subtitle, fontWeight: "600" }}>
                Voltar
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {passo === "importando" && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 32,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text
              style={{
                fontSize: 16,
                color: colors.title,
                marginTop: 16,
                fontWeight: "600",
              }}
            >
              Importando produtos...
            </Text>
            <Text style={{ fontSize: 14, color: colors.subtitle, marginTop: 8 }}>
              Por favor,aguarde
            </Text>
          </View>
        )}

        {passo === "resultado" && resultado && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.title,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              Importação Concluída
            </Text>

            <View
              style={{
                backgroundColor: "#dcfce7",
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 40, fontWeight: "bold", color: "#16a34a" }}>
                {resultado.sucesso}
              </Text>
              <Text style={{ fontSize: 14, color: "#166534" }}>
                produtos importados
              </Text>
            </View>

            {resultado.erros.length > 0 && (
              <View
                style={{
                  backgroundColor: "#fef2f2",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#991b1b",
                    marginBottom: 8,
                  }}
                >
                  Erros ({resultado.erros.length}):
                </Text>
                {resultado.erros.slice(0, 5).map((e, i) => (
                  <Text
                    key={i}
                    style={{ fontSize: 12, color: "#991b1b" }}
                  >
                    Linha {e.linha}: {e.erro}
                  </Text>
                ))}
              </View>
            )}

            <TouchableOpacity
              onPress={handleNovo}
              style={{
                backgroundColor: "#4f46e5",
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                Importar Mais Produtos
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}