import React, { useEffect, useMemo, useState } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export default function App() {
  const escolasPorMunicipio = {
    CAARAPÓ: [
      "EE ARCÊNIO ROJAS",
      "EE FREI JOÃO DAMASCENO",
      "EE PADRE JOSÉ DE ANCHIETA",
      "EE PROF. JOAQUIM ALFREDO SOARES VIANNA",
      "EE PROFª. CLEUZA APARECIDA V. GALHARDO",
      "EE TEN. AVIADOR ANTÔNIO JOÃO",
      "EE INDÍGENA DE EM YVY POTY"
    ],
    DEODÁPOLIS: [
      "EE 13 DE MAIO",
      "EE JOÃO BAPTISTA PEREIRA",
      "EE LAGOA BONITA",
      "EE PORTO VILMA",
      "EE SCILA MÉDICI"
    ],
    DOURADINA: ["EE BARÃO DO RIO BRANCO"],
    DOURADOS: [
      "CEEJA DOURADOS",
      "CENTRO ESTADUAL DE EDUCAÇÃO PROFISSIONAL",
      "EE ABIGAIL BORRALHO",
      "EE ANTÔNIA DA SILVEIRA CAPILÉ",
      "EE ANTÔNIO VICENTE AZAMBUJA",
      "EE CASTRO ALVES",
      "EE FLORIANO VIEGAS MACHADO",
      "EE JOAQUIM VAZ DE OLIVEIRA",
      "EE MARIA DA GLÓRIA MUZZI FERREIRA",
      "EE MENODORA FIALHO DE FIGUEIREDO",
      "EE MIN. JOÃO PAULO DOS REIS VELOSO",
      "EE PASTOR DANIEL BERG",
      "EE PRES. GETÚLIO VARGAS",
      "EE PRES. TANCREDO NEVES",
      "EE PRESIDENTE VARGAS",
      "EE PROF. ALÍCIO ARAÚJO",
      "EE PROF. CELSO MÜLLER DO AMARAL",
      "EE PROFª. FLORIANA LOPES",
      "EE PROFESSOR JOSÉ PEREIRA LINS",
      "EE RAMONA DA SILVA PEDROSO",
      "EE RITA ANGELINA BARBOSA SILVEIRA",
      "EE VEREADOR MOACIR DJALMA BARROS",
      "EE VILMAR VIEIRA MATOS",
      "EE INDÍGENA INTERCULTURAL GUATEKA - MARÇAL DE SOUZA"
    ],
    "FÁTIMA DO SUL": [
      "EE JONAS BELARMINO DA SILVA",
      "EE SEN. FILINTO MÜLLER",
      "EE VICENTE PALLOTTI",
      "EE VILA BRASIL"
    ],
    "GLÓRIA DE DOURADOS": [
      "EE PROFª. EUFROSINA PINTO",
      "EE PROFª. VÂNIA MEDEIROS LOPES",
      "EE WEIMAR TORRES"
    ],
    ITAPORÃ: [
      "EE ANTÔNIO JOÃO RIBEIRO",
      "EE EDSON BEZERRA",
      "EE OLIVIA PAULA",
      "EE PRINCESA IZABEL",
      "EE RODRIGUES ALVES",
      "EE SEN. SALDANHA DERZI"
    ],
    JATEÍ: [
      "EE PROF. JOAQUIM ALFREDO SOARES VIANNA",
      "EE PROFª. BERNADETE SANTOS LEITE"
    ],
    "LAGUNA CARAPÃ": ["EE ÁLVARO MARTINS DOS SANTOS"],
    MARACAJU: [
      "EE CAMBARAI",
      "EE CEL. LIMA DE FIGUEIREDO",
      "EE MANOEL FERREIRA DE LIMA",
      "EE PADRE CONSTANTINO DE MONTE"
    ],
    "RIO BRILHANTE": [
      "EE ETALÍVIO PEREIRA MARTINS",
      "EE FERNANDO CORRÊA DA COSTA",
      "EE PROFª. LIGIA TEREZINHA MARTINS"
    ],
    VICENTINA: [
      "EE EMANNUEL PINHEIRO",
      "EE PADRE JOSÉ DANIEL",
      "EE SÃO JOSÉ"
    ]
  };

  const [registros, setRegistros] = useState([]);
  const [filtroAtivo, setFiltroAtivo] = useState(null);
  const [modoRelatorio, setModoRelatorio] = useState(false);
  const [registroAberto, setRegistroAberto] = useState(null);
  const [municipioIndicadores, setMunicipioIndicadores] = useState("GERAL");

  const [form, setForm] = useState({
    municipio: "",
    escola: "",
    data: "",
    diretor: "",
    adjunto: "",
    demandas: [],
    descricaoDemandas: "",
    administrativas: [],
    descricaoAdministrativas: "",
    avaliacaoSedDiretor: "",
    avaliacaoSedAdjunto: "",
    avaliacaoGovernoDiretor: "",
    avaliacaoGovernoAdjunto: "",
    interesseAgendaDiretor: "",
    interesseAgendaAdjunto: "",
    classificacaoDiretor: "",
    classificacaoAdjunto: "",
    observacoes: ""
  });

  const demandasOpcoes = [
    "Reforma",
    "Pintura",
    "Climatização",
    "Rede elétrica",
    "Mobiliário",
    "Tecnologia",
    "Segurança",
    "Transporte",
    "Outros"
  ];

  const administrativasOpcoes = [
    "Déficit de servidores",
    "Problemas organizacionais",
    "Dificuldades pedagógicas",
    "Necessidade de apoio da CRE",
    "Outros"
  ];

  function alternarCheckbox(campo, valor) {
    setForm((atual) => {
      const lista = atual[campo];
      return {
        ...atual,
        [campo]: lista.includes(valor)
          ? lista.filter((item) => item !== valor)
          : [...lista, valor]
      };
    });
  }

  async function carregarRegistros() {
    const dados = await getDocs(collection(db, "reunioes_gestores"));
    setRegistros(dados.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  }

  async function salvarRegistro() {
    if (!form.municipio || !form.escola) {
      alert("Preencha município e escola.");
      return;
    }

    await addDoc(collection(db, "reunioes_gestores"), {
      ...form,
      criadoEm: new Date().toLocaleString()
    });

    alert("Reunião salva com sucesso!");
    carregarRegistros();
  }

  useEffect(() => {
    carregarRegistros();
  }, []);

  const registrosIndicadores = useMemo(() => {
    if (municipioIndicadores === "GERAL") return registros;
    return registros.filter((r) => r.municipio === municipioIndicadores);
  }, [registros, municipioIndicadores]);

  function contarClassificacao(tipo, base = registrosIndicadores) {
    return base.reduce((total, r) => {
      let soma = 0;
      if (r.classificacaoDiretor === tipo) soma++;
      if (r.classificacaoAdjunto === tipo) soma++;
      return total + soma;
    }, 0);
  }

  function contarEngajamento(tipo, base = registrosIndicadores) {
    return base.reduce((total, r) => {
      let soma = 0;
      if (r.interesseAgendaDiretor === tipo) soma++;
      if (r.interesseAgendaAdjunto === tipo) soma++;
      return total + soma;
    }, 0);
  }

  const totalGestores = registrosIndicadores.length * 2;

  const verde = contarClassificacao("VERDE");
  const amarelo = contarClassificacao("AMARELO");
  const vermelho = contarClassificacao("VERMELHO");

  const altoEngajamento = contarEngajamento("Alto");
  const medioEngajamento = contarEngajamento("Médio");
  const baixoEngajamento = contarEngajamento("Baixo");

  function corIndicador(label) {
    if (label === "VERDE" || label === "Alto") return "#22c55e";
    if (label === "AMARELO" || label === "Médio") return "#eab308";
    if (label === "VERMELHO" || label === "Baixo") return "#ef4444";
    return "#facc15";
  }

  function listaFiltrada() {
    if (!filtroAtivo) return [];

    const lista = [];

    registrosIndicadores.forEach((r) => {
      if (["VERDE", "AMARELO", "VERMELHO"].includes(filtroAtivo)) {
        if (r.classificacaoDiretor === filtroAtivo) {
          lista.push({
            id: r.id + "-diretor",
            registroId: r.id,
            cargo: "Diretor(a)",
            nome: r.diretor || "Não informado",
            escola: r.escola,
            municipio: r.municipio,
            classificacao: r.classificacaoDiretor,
            engajamento: r.interesseAgendaDiretor
          });
        }

        if (r.classificacaoAdjunto === filtroAtivo) {
          lista.push({
            id: r.id + "-adjunto",
            registroId: r.id,
            cargo: "Diretor(a) Adjunto(a)",
            nome: r.adjunto || "Não informado",
            escola: r.escola,
            municipio: r.municipio,
            classificacao: r.classificacaoAdjunto,
            engajamento: r.interesseAgendaAdjunto
          });
        }
      } else {
        if (r.interesseAgendaDiretor === filtroAtivo) {
          lista.push({
            id: r.id + "-diretor",
            registroId: r.id,
            cargo: "Diretor(a)",
            nome: r.diretor || "Não informado",
            escola: r.escola,
            municipio: r.municipio,
            classificacao: r.classificacaoDiretor,
            engajamento: r.interesseAgendaDiretor
          });
        }

        if (r.interesseAgendaAdjunto === filtroAtivo) {
          lista.push({
            id: r.id + "-adjunto",
            registroId: r.id,
            cargo: "Diretor(a) Adjunto(a)",
            nome: r.adjunto || "Não informado",
            escola: r.escola,
            municipio: r.municipio,
            classificacao: r.classificacaoAdjunto,
            engajamento: r.interesseAgendaAdjunto
          });
        }
      }
    });

    return lista;
  }

  function barra(label, valor, totalBase) {
    const percentual = totalBase ? Math.round((valor / totalBase) * 100) : 0;
    const cor = corIndicador(label);

    return (
      <div style={styles.barChartRow} onClick={() => setFiltroAtivo(label)}>
        <div style={styles.barLabelArea}>
          <span style={{ color: cor }}>{label}</span>
          <strong style={{ color: cor }}>
            {valor} ({percentual}%)
          </strong>
        </div>

        <div style={styles.barraFundoVertical}>
          <div
            style={{
              ...styles.barraValorVertical,
              height: `${percentual}%`,
              background: cor
            }}
          />
        </div>
      </div>
    );
  }

  function gerarPDF() {
    window.print();
  }

  function abrirRegistroPorId(id) {
    const encontrado = registros.find((r) => r.id === id);
    if (encontrado) {
      setRegistroAberto(encontrado);
      setFiltroAtivo(null);
      setModoRelatorio(false);
    }
  }

  function copiarLinkRegistro(id) {
    const link = `${window.location.origin}${window.location.pathname}#registro-${id}`;
    navigator.clipboard.writeText(link);
    alert("Link do formulário copiado!");
  }

  useEffect(() => {
    if (!registros.length) return;
    const hash = window.location.hash;
    if (hash.startsWith("#registro-")) {
      const id = hash.replace("#registro-", "");
      const encontrado = registros.find((r) => r.id === id);
      if (encontrado) setRegistroAberto(encontrado);
    }
  }, [registros]);

  if (registroAberto) {
    const r = registroAberto;

    return (
      <div style={styles.relatorioPage}>
        <div style={styles.noPrintButtons}>
          <button style={styles.buttonRelatorio} onClick={() => setRegistroAberto(null)}>
            Voltar ao painel
          </button>

          <button style={styles.buttonRelatorio} onClick={gerarPDF}>
            Gerar PDF / Imprimir formulário
          </button>

          <button style={styles.buttonRelatorio} onClick={() => copiarLinkRegistro(r.id)}>
            Copiar link do formulário
          </button>
        </div>

        <div style={styles.relatorioTopo}>
          <h1>Radar Link MS</h1>
          <h2>Formulário Salvo de Reunião com Gestores</h2>
          <p><strong>Município:</strong> {r.municipio}</p>
          <p><strong>Escola:</strong> {r.escola}</p>
          <p><strong>Data da reunião:</strong> {r.data || "Não informada"}</p>
          <p><strong>Salvo em:</strong> {r.criadoEm || "Não informado"}</p>
        </div>

        <section style={styles.relatorioBox}>
          <h2>1. Identificação dos Gestores</h2>
          <p><strong>Diretor(a):</strong> {r.diretor || "