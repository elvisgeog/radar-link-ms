import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc
} from "firebase/firestore";
import { db } from "./firebase";

export default function App() {
  const escolasPorMunicipio = {
    "CAARAPÓ": [
      "EE ARCÊNIO ROJAS",
      "EE FREI JOÃO DAMASCENO",
      "EE PADRE JOSÉ DE ANCHIETA",
      "EE PROF. JOAQUIM ALFREDO SOARES VIANNA",
      "EE PROFª. CLEUZA APARECIDA V. GALHARDO",
      "EE TEN. AVIADOR ANTÔNIO JOÃO",
      "EE INDÍGENA DE EM YVY POTY"
    ],
    "DEODÁPOLIS": [
      "EE 13 DE MAIO",
      "EE JOÃO BAPTISTA PEREIRA",
      "EE LAGOA BONITA",
      "EE PORTO VILMA",
      "EE SCILA MÉDICI"
    ],
    "DOURADINA": ["EE BARÃO DO RIO BRANCO"],
    "DOURADOS": [
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
    "ITAPORÃ": [
      "EE ANTÔNIO JOÃO RIBEIRO",
      "EE EDSON BEZERRA",
      "EE OLIVIA PAULA",
      "EE PRINCESA IZABEL",
      "EE RODRIGUES ALVES",
      "EE SEN. SALDANHA DERZI"
    ],
    "JATEÍ": [
      "EE PROF. JOAQUIM ALFREDO SOARES VIANNA",
      "EE PROFª. BERNADETE SANTOS LEITE"
    ],
    "LAGUNA CARAPÃ": ["EE ÁLVARO MARTINS DOS SANTOS"],
    "MARACAJU": [
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
    "VICENTINA": [
      "EE EMANNUEL PINHEIRO",
      "EE PADRE JOSÉ DANIEL",
      "EE SÃO JOSÉ"
    ]
  };

  const formLimpo = {
    municipio: "",
    escola: "",
    classificacaoEscola: "",
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
    observacoesDiretor: "",
    observacoesAdjunto: ""
  };

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

  const percepcaoOpcoes = [
    "Positivo",
    "Positivo com ressalvas",
    "Negativo"
  ];

  const [registros, setRegistros] = useState([]);
  const [formAberto, setFormAberto] = useState(null);
  const [modoRelatorio, setModoRelatorio] = useState(false);
  const [modoFormularios, setModoFormularios] = useState(false);
  const [filtroAtivo, setFiltroAtivo] = useState(null);
  const [municipioIndicador, setMunicipioIndicador] = useState("GERAL");
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(formLimpo);

  async function carregarRegistros() {
    const dados = await getDocs(collection(db, "reunioes_gestores"));
    const lista = dados.docs.map((item) => ({
      id: item.id,
      ...item.data()
    }));

    setRegistros(lista);
  }

  useEffect(() => {
    carregarRegistros();
  }, []);

  function ordenarPorEscola(lista) {
    return [...lista].sort((a, b) =>
      String(a.escola || "").localeCompare(String(b.escola || ""), "pt-BR")
    );
  }

  function alternarCheckbox(campo, valor) {
    setForm((atual) => {
      const listaAtual = atual[campo] || [];

      return {
        ...atual,
        [campo]: listaAtual.includes(valor)
          ? listaAtual.filter((item) => item !== valor)
          : [...listaAtual, valor]
      };
    });
  }

  async function salvarRegistro() {
    if (!form.municipio || !form.escola) {
      alert("Preencha município e escola.");
      return;
    }

    if (editandoId) {
      await updateDoc(doc(db, "reunioes_gestores", editandoId), {
        ...form,
        atualizadoEm: new Date().toLocaleString()
      });

      alert("Formulário atualizado com sucesso!");
    } else {
      await addDoc(collection(db, "reunioes_gestores"), {
        ...form,
        criadoEm: new Date().toLocaleString()
      });

      alert("Reunião salva com sucesso!");
    }

    setForm(formLimpo);
    setEditandoId(null);
    carregarRegistros();
  }

  function editarFormulario(registro) {
    setForm({
      municipio: registro.municipio || "",
      escola: registro.escola || "",
      classificacaoEscola: registro.classificacaoEscola || "",
      data: registro.data || "",
      diretor: registro.diretor || "",
      adjunto: registro.adjunto || "",
      demandas: registro.demandas || [],
      descricaoDemandas: registro.descricaoDemandas || "",
      administrativas: registro.administrativas || [],
      descricaoAdministrativas: registro.descricaoAdministrativas || "",
      avaliacaoSedDiretor: registro.avaliacaoSedDiretor || "",
      avaliacaoSedAdjunto: registro.avaliacaoSedAdjunto || "",
      avaliacaoGovernoDiretor: registro.avaliacaoGovernoDiretor || "",
      avaliacaoGovernoAdjunto: registro.avaliacaoGovernoAdjunto || "",
      interesseAgendaDiretor: registro.interesseAgendaDiretor || "",
      interesseAgendaAdjunto: registro.interesseAgendaAdjunto || "",
      classificacaoDiretor: registro.classificacaoDiretor || "",
      classificacaoAdjunto: registro.classificacaoAdjunto || "",
      observacoesDiretor: registro.observacoesDiretor || "",
      observacoesAdjunto: registro.observacoesAdjunto || ""
    });

    setEditandoId(registro.id);
    setFormAberto(null);
    setModoFormularios(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirRegistro(id) {
    const confirmar = window.confirm("Deseja realmente excluir este formulário?");
    if (!confirmar) return;

    await deleteDoc(doc(db, "reunioes_gestores", id));

    alert("Formulário excluído com sucesso!");

    setFormAberto(null);
    carregarRegistros();
  }

  function gerarPDF() {
    window.print();
  }

  function imprimirFormulario(registro) {
    setFormAberto(registro);
    setTimeout(() => {
      window.print();
    }, 500);
  }

  function registrosBase() {
    if (municipioIndicador === "GERAL") {
      return registros;
    }

    return registros.filter((r) => r.municipio === municipioIndicador);
  }

  const baseIndicadores = registrosBase();
  const registrosOrdenados = ordenarPorEscola(registros);
  const baseOrdenada = ordenarPorEscola(baseIndicadores);

  function contarClassificacao(tipo) {
    return baseIndicadores.reduce((total, r) => {
      let soma = 0;

      if (r.classificacaoDiretor === tipo) soma++;
      if (r.classificacaoAdjunto === tipo) soma++;

      return total + soma;
    }, 0);
  }

  function contarEngajamento(tipo) {
    return baseIndicadores.reduce((total, r) => {
      let soma = 0;

      if (r.interesseAgendaDiretor === tipo) soma++;
      if (r.interesseAgendaAdjunto === tipo) soma++;

      return total + soma;
    }, 0);
  }

  function contarArray(campo, opcao) {
    return baseIndicadores.reduce((total, r) => {
      const lista = Array.isArray(r[campo]) ? r[campo] : [];
      return lista.includes(opcao) ? total + 1 : total;
    }, 0);
  }

  function normalizarPercepcao(valor) {
    const texto = String(valor || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (texto.includes("ressalva")) return "Positivo com ressalvas";
    if (texto.includes("negativ")) return "Negativo";
    if (texto.includes("positiv")) return "Positivo";

    return "";
  }

  function contarPercepcao(campo, opcao) {
    return baseIndicadores.reduce((total, r) => {
      return normalizarPercepcao(r[campo]) === opcao ? total + 1 : total;
    }, 0);
  }

  const totalGestores = baseIndicadores.length * 2;
  const totalFormularios = baseIndicadores.length;

  const verde = contarClassificacao("VERDE");
  const amarelo = contarClassificacao("AMARELO");
  const vermelho = contarClassificacao("VERMELHO");

  const alto = contarEngajamento("Alto");
  const medio = contarEngajamento("Médio");
  const baixo = contarEngajamento("Baixo");

 function corIndicador(label) {
  if (label === "VERDE" || label === "Alto" || label === "Positivo") return "#00ff66";
  if (label === "AMARELO" || label === "Médio" || label === "Positivo com ressalvas") return "#ffd400";
  if (label === "VERMELHO" || label === "Baixo" || label === "Negativo") return "#ff3333";

  return "#facc15";
}

  function listaFiltrada() {
    if (!filtroAtivo) return [];

    const lista = [];

    if (typeof filtroAtivo === "object" && filtroAtivo.tipo === "percepcao") {
      baseIndicadores.forEach((r) => {
        const cargoDiretor =
          filtroAtivo.campo === "avaliacaoSedDiretor" ||
          filtroAtivo.campo === "avaliacaoGovernoDiretor";

        const cargoAdjunto =
          filtroAtivo.campo === "avaliacaoSedAdjunto" ||
          filtroAtivo.campo === "avaliacaoGovernoAdjunto";

        if (normalizarPercepcao(r[filtroAtivo.campo]) === filtroAtivo.label) {
          lista.push({
            id: `${r.id}-${filtroAtivo.campo}`,
            nome: cargoDiretor
              ? r.diretor || "Não informado"
              : cargoAdjunto
              ? r.adjunto || "Não informado"
              : "Não informado",
            cargo: cargoDiretor ? "Diretor(a)" : "Diretor(a) Adjunto(a)",
            municipio: r.municipio,
            escola: r.escola,
            percepcao: r[filtroAtivo.campo] || "Não informado",
            titulo: filtroAtivo.titulo
          });
        }
      });

      return lista.sort((a, b) =>
        String(a.escola || "").localeCompare(String(b.escola || ""), "pt-BR")
      );
    }

    baseIndicadores.forEach((r) => {
      if (["VERDE", "AMARELO", "VERMELHO"].includes(filtroAtivo)) {
        if (r.classificacaoDiretor === filtroAtivo) {
          lista.push({
            id: `${r.id}-diretor-classificacao`,
            nome: r.diretor || "Não informado",
            cargo: "Diretor(a)",
            municipio: r.municipio,
            escola: r.escola,
            classificacao: r.classificacaoDiretor,
            engajamento: r.interesseAgendaDiretor
          });
        }

        if (r.classificacaoAdjunto === filtroAtivo) {
          lista.push({
            id: `${r.id}-adjunto-classificacao`,
            nome: r.adjunto || "Não informado",
            cargo: "Diretor(a) Adjunto(a)",
            municipio: r.municipio,
            escola: r.escola,
            classificacao: r.classificacaoAdjunto,
            engajamento: r.interesseAgendaAdjunto
          });
        }
      } else {
        if (r.interesseAgendaDiretor === filtroAtivo) {
          lista.push({
            id: `${r.id}-diretor-engajamento`,
            nome: r.diretor || "Não informado",
            cargo: "Diretor(a)",
            municipio: r.municipio,
            escola: r.escola,
            classificacao: r.classificacaoDiretor,
            engajamento: r.interesseAgendaDiretor
          });
        }

        if (r.interesseAgendaAdjunto === filtroAtivo) {
          lista.push({
            id: `${r.id}-adjunto-engajamento`,
            nome: r.adjunto || "Não informado",
            cargo: "Diretor(a) Adjunto(a)",
            municipio: r.municipio,
            escola: r.escola,
            classificacao: r.classificacaoAdjunto,
            engajamento: r.interesseAgendaAdjunto
          });
        }
      }
    });

    return lista.sort((a, b) =>
      String(a.escola || "").localeCompare(String(b.escola || ""), "pt-BR")
    );
  }

  function barraVertical(label, valor, totalBase, aoClicar) {
    const percentual = totalBase ? Math.round((valor / totalBase) * 100) : 0;
    const cor = corIndicador(label);

    return (
      <div
        style={styles.colunaGrafico}
        onClick={aoClicar || (() => setFiltroAtivo(label))}
      >
        <div style={styles.areaBarraVertical}>
          <div
            style={{
              ...styles.barraVertical,
              height: `${percentual}%`,
              background: cor
            }}
          />
        </div>

        <strong style={{ color: cor, fontSize: 18 }}>{valor}</strong>

        <span
          style={{
            color: cor,
            fontWeight: "900",
            textAlign: "center",
            fontSize: label === "Positivo com ressalvas" ? 12 : 15,
            lineHeight: "15px",
            minHeight: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {label}
        </span>

        <small style={{ color: "#ffffff", fontWeight: "bold" }}>{percentual}%</small>
      </div>
    );
  }

  function barraHorizontal(label, valor, totalBase) {
    const percentual = totalBase ? Math.round((valor / totalBase) * 100) : 0;
    const cor = corIndicador(label);

    return (
      <div style={styles.barraHorizontalItem}>
        <div style={styles.barraHorizontalTexto}>
          <span style={{ color: "#ffffff" }}>{label}</span>
          <strong style={{ color: "#ffffff" }}>valor} ({percentual}%)</strong>
        </div>

        <div style={styles.barraHorizontalFundo}>
          <div
            style={{
              ...styles.barraHorizontalValor,
              width: `${percentual}%`,
              background: cor
            }}
          />
        </div>
      </div>
    );
  }

  function graficoCheckbox(titulo, campo, opcoes) {
    return (
      <section style={styles.subPainel}>
        <h3 style={styles.tituloGrafico}>{titulo}</h3>

        {opcoes.map((opcao) => (
          <div key={opcao}>
            {barraHorizontal(opcao, contarArray(campo, opcao), totalFormularios)}
          </div>
        ))}
      </section>
    );
  }

  function graficoPercepcao(titulo, campo) {
    return (
      <section style={styles.subPainel}>
        <h3 style={styles.tituloGrafico}>{titulo}</h3>

        <div style={styles.graficoVertical}>
          {percepcaoOpcoes.map((opcao) =>
            barraVertical(
              opcao,
              contarPercepcao(campo, opcao),
              totalFormularios,
              () =>
                setFiltroAtivo({
                  tipo: "percepcao",
                  label: opcao,
                  campo,
                  titulo
                })
            )
          )}
        </div>
      </section>
    );
  }

  if (formAberto) {
    return (
      <div style={styles.relatorioPage}>
        <h1>Radar Link MS</h1>
        <h2>Formulário salvo</h2>

        <button style={styles.buttonRelatorio} onClick={() => setFormAberto(null)}>
          Voltar
        </button>

        <button style={styles.buttonRelatorio} onClick={gerarPDF}>
          Imprimir / Salvar PDF
        </button>

        <button style={styles.buttonRelatorio} onClick={() => editarFormulario(formAberto)}>
          Editar este formulário
        </button>

        <section style={styles.relatorioBox}>
          <h2>Dados da reunião</h2>
          <p><strong>Município:</strong> {formAberto.municipio}</p>
          <p><strong>Escola:</strong> {formAberto.escola}</p>
          <p><strong>Classificação da Escola:</strong> {formAberto.classificacaoEscola || "Não informada"}</p>
          <p><strong>Data:</strong> {formAberto.data || "Não informada"}</p>
          <p><strong>Diretor(a):</strong> {formAberto.diretor || "Não informado"}</p>
          <p><strong>Diretor(a) Adjunto(a):</strong> {formAberto.adjunto || "Não informado"}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>Demandas da escola</h2>
          <p><strong>Marcadas:</strong> {formAberto.demandas?.join(", ") || "Nenhuma"}</p>
          <p><strong>Descrição:</strong> {formAberto.descricaoDemandas || "Sem descrição"}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>Questões administrativas</h2>
          <p><strong>Marcadas:</strong> {formAberto.administrativas?.join(", ") || "Nenhuma"}</p>
          <p><strong>Descrição:</strong> {formAberto.descricaoAdministrativas || "Sem descrição"}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>Percepção institucional</h2>
          <p><strong>SED - Diretor:</strong> {formAberto.avaliacaoSedDiretor || "Não informado"}</p>
          <p><strong>Governo - Diretor:</strong> {formAberto.avaliacaoGovernoDiretor || "Não informado"}</p>
          <p><strong>SED - Adjunto:</strong> {formAberto.avaliacaoSedAdjunto || "Não informado"}</p>
          <p><strong>Governo - Adjunto:</strong> {formAberto.avaliacaoGovernoAdjunto || "Não informado"}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>Engajamento e classificação</h2>
          <p><strong>Engajamento Diretor:</strong> {formAberto.interesseAgendaDiretor || "Não informado"}</p>
          <p><strong>Engajamento Adjunto:</strong> {formAberto.interesseAgendaAdjunto || "Não informado"}</p>
          <p><strong>Classificação Diretor:</strong> {formAberto.classificacaoDiretor || "Não informado"}</p>
          <p><strong>Classificação Adjunto:</strong> {formAberto.classificacaoAdjunto || "Não informado"}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>Observações estratégicas</h2>
          <p><strong>Diretor(a):</strong> {formAberto.observacoesDiretor || "Sem observações"}</p>
          <p><strong>Adjunto(a):</strong> {formAberto.observacoesAdjunto || "Sem observações"}</p>
        </section>

        <button style={styles.buttonExcluir} onClick={() => excluirRegistro(formAberto.id)}>
          Excluir este formulário
        </button>
      </div>
    );
  }

  if (modoFormularios) {
    return (
      <div style={styles.page}>
        <header style={styles.header}>
          <div style={styles.logo}>◎</div>

          <div>
            <h1 style={styles.title}>Formulários Salvos</h1>
            <p style={styles.subtitle}>Abrir • Editar • Imprimir • Excluir</p>
          </div>
        </header>

        <button style={styles.button} onClick={() => setModoFormularios(false)}>
          Voltar ao painel principal
        </button>

        <button style={styles.button} onClick={gerarPDF}>
          Imprimir lista / Salvar PDF
        </button>

        <section style={styles.panel}>
          {registrosOrdenados.length === 0 && <p>Nenhum formulário salvo ainda.</p>}

          {registrosOrdenados.map((r) => (
            <div key={r.id} style={styles.registro}>
              <h3>{r.escola}</h3>
              <p><strong>Município:</strong> {r.municipio}</p>
              <p><strong>Classificação Escola:</strong> {r.classificacaoEscola || "Não informada"}</p>
              <p><strong>Diretor:</strong> {r.diretor || "Não informado"}</p>
              <p><strong>Adjunto:</strong> {r.adjunto || "Não informado"}</p>

              <button style={styles.button} onClick={() => setFormAberto(r)}>
                Abrir formulário
              </button>

              <button style={styles.button} onClick={() => editarFormulario(r)}>
                Editar formulário
              </button>

              <button style={styles.buttonSecundario} onClick={() => imprimirFormulario(r)}>
                Imprimir formulário
              </button>

              <button style={styles.buttonExcluir} onClick={() => excluirRegistro(r.id)}>
                Excluir
              </button>
            </div>
          ))}
        </section>
      </div>
    );
  }

  if (modoRelatorio) {
    return (
      <div style={styles.relatorioPage}>
        <h1>Radar Link MS</h1>
        <h2>Relatório Estratégico de Gestores</h2>
        <p><strong>Filtro:</strong> {municipioIndicador === "GERAL" ? "Geral" : municipioIndicador}</p>
        <p><strong>Data de geração:</strong> {new Date().toLocaleString()}</p>

        <button style={styles.buttonRelatorio} onClick={() => setModoRelatorio(false)}>
          Voltar ao painel
        </button>

        <button style={styles.buttonRelatorio} onClick={gerarPDF}>
          Gerar PDF / Imprimir
        </button>

        <section style={styles.relatorioBox}>
          <h2>1. Totais por Classificação</h2>
          <p><strong>Verde:</strong> {verde}</p>
          <p><strong>Amarelo:</strong> {amarelo}</p>
          <p><strong>Vermelho:</strong> {vermelho}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>2. Totais por Engajamento</h2>
          <p><strong>Alto:</strong> {alto}</p>
          <p><strong>Médio:</strong> {medio}</p>
          <p><strong>Baixo:</strong> {baixo}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>3. Lista de Diretores</h2>

          {baseOrdenada.map((r) => (
            <div key={`${r.id}-diretor`} style={styles.relatorioItem}>
              <p><strong>Escola:</strong> {r.escola}</p>
              <p><strong>Nome:</strong> {r.diretor || "Não informado"}</p>
              <p><strong>Município:</strong> {r.municipio}</p>
              <p><strong>Classificação Escola:</strong> {r.classificacaoEscola || "Não informada"}</p>
              <p><strong>Classificação:</strong> {r.classificacaoDiretor || "Não informado"}</p>
              <p><strong>Engajamento:</strong> {r.interesseAgendaDiretor || "Não informado"}</p>
              <p><strong>Observações:</strong> {r.observacoesDiretor || "Sem observações"}</p>
            </div>
          ))}
        </section>

        <section style={styles.relatorioBox}>
          <h2>4. Lista de Diretores Adjuntos</h2>

          {baseOrdenada.map((r) => (
            <div key={`${r.id}-adjunto`} style={styles.relatorioItem}>
              <p><strong>Escola:</strong> {r.escola}</p>
              <p><strong>Nome:</strong> {r.adjunto || "Não informado"}</p>
              <p><strong>Município:</strong> {r.municipio}</p>
              <p><strong>Classificação Escola:</strong> {r.classificacaoEscola || "Não informada"}</p>
              <p><strong>Classificação:</strong> {r.classificacaoAdjunto || "Não informado"}</p>
              <p><strong>Engajamento:</strong> {r.interesseAgendaAdjunto || "Não informado"}</p>
              <p><strong>Observações:</strong> {r.observacoesAdjunto || "Sem observações"}</p>
            </div>
          ))}
        </section>

        <section style={styles.relatorioBox}>
          <h2>5. Indicadores Demandas</h2>
          {graficoCheckbox("Demandas da Escola", "demandas", demandasOpcoes)}
          {graficoCheckbox("Questões Administrativas", "administrativas", administrativasOpcoes)}
        </section>

        <section style={styles.relatorioBox}>
          <h2>6. Percepção Institucional</h2>
          {graficoPercepcao("Diretor(a): Como avalia a SED?", "avaliacaoSedDiretor")}
          {graficoPercepcao("Diretor(a): Como avalia o Governo?", "avaliacaoGovernoDiretor")}
          {graficoPercepcao("Diretor(a) Adjunto(a): Como avalia a SED?", "avaliacaoSedAdjunto")}
          {graficoPercepcao("Diretor(a) Adjunto(a): Como avalia o Governo?", "avaliacaoGovernoAdjunto")}
        </section>
      </div>
    );
  }

  if (filtroAtivo) {
    const lista = listaFiltrada();
    const filtroLabel = typeof filtroAtivo === "object" ? filtroAtivo.label : filtroAtivo;
    const filtroTitulo = typeof filtroAtivo === "object" ? filtroAtivo.titulo : `Lista: ${filtroLabel}`;
    const cor = corIndicador(filtroLabel);

    return (
      <div style={styles.page}>
        <button style={styles.button} onClick={() => setFiltroAtivo(null)}>
          Voltar ao painel
        </button>

        <h1 style={{ color: cor }}>{filtroTitulo}</h1>
        <h2 style={{ color: cor }}>{filtroLabel}</h2>

        {lista.length === 0 && <p>Nenhum registro encontrado.</p>}

        {lista.map((r) => (
          <div key={r.id} style={{ ...styles.registro, borderLeft: `6px solid ${cor}` }}>
            <h2>{r.nome}</h2>
            <p><strong>Cargo:</strong> {r.cargo}</p>
            <p><strong>Município:</strong> {r.municipio}</p>
            <p><strong>Escola:</strong> {r.escola}</p>
            {r.percepcao && <p><strong>Percepção:</strong> {r.percepcao}</p>}
            {r.classificacao && <p><strong>Classificação:</strong> {r.classificacao}</p>}
            {r.engajamento && <p><strong>Engajamento:</strong> {r.engajamento}</p>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.logo}>◎</div>

        <div>
          <h1 style={styles.title}>Radar Link MS</h1>
          <p style={styles.subtitle}>Inteligência • Gestão • Articulação Regional</p>
        </div>
      </header>

      <button style={styles.button} onClick={() => setModoRelatorio(true)}>
        Abrir Relatório Geral / Gerar PDF
      </button>

      <button style={styles.button} onClick={() => setModoFormularios(true)}>
        Acessar Formulários Salvos
      </button>

      <main style={styles.grid}>
        <section style={styles.panel}>
          <h2>Formulário de Reunião com Gestores</h2>

          {editandoId && (
            <div style={styles.avisoEdicao}>
              Editando formulário salvo
            </div>
          )}

          <select
            style={styles.input}
            value={form.municipio}
            onChange={(e) =>
              setForm({
                ...form,
                municipio: e.target.value,
                escola: ""
              })
            }
          >
            <option value="">Selecione o município</option>

            {Object.keys(escolasPorMunicipio).map((municipio) => (
              <option key={municipio}>{municipio}</option>
            ))}
          </select>

          <select
            style={styles.input}
            value={form.escola}
            onChange={(e) =>
              setForm({
                ...form,
                escola: e.target.value
              })
            }
          >
            <option value="">Selecione a escola</option>

            {form.municipio &&
              escolasPorMunicipio[form.municipio]?.map((escola) => (
                <option key={escola}>{escola}</option>
              ))}
          </select>

          <select
            style={styles.input}
            value={form.classificacaoEscola}
            onChange={(e) =>
              setForm({
                ...form,
                classificacaoEscola: e.target.value
              })
            }
          >
            <option value="">Classificação da Escola</option>
            <option>1</option>
            <option>2</option>
            <option>3</option>
            <option>4</option>
          </select>

          <input
            style={styles.input}
            type="date"
            value={form.data}
            onChange={(e) => setForm({ ...form, data: e.target.value })}
          />

          <input
            style={styles.input}
            placeholder="Diretor(a)"
            value={form.diretor}
            onChange={(e) => setForm({ ...form, diretor: e.target.value })}
          />

          <input
            style={styles.input}
            placeholder="Diretor(a) Adjunto(a)"
            value={form.adjunto}
            onChange={(e) => setForm({ ...form, adjunto: e.target.value })}
          />

          <h3>1. Demandas da Escola</h3>

          {demandasOpcoes.map((opcao) => (
            <label style={styles.check} key={opcao}>
              <input
                type="checkbox"
                checked={form.demandas.includes(opcao)}
                onChange={() => alternarCheckbox("demandas", opcao)}
              />{" "}
              {opcao}
            </label>
          ))}

          <textarea
            style={styles.textarea}
            placeholder="Descrição das demandas"
            value={form.descricaoDemandas}
            onChange={(e) => setForm({ ...form, descricaoDemandas: e.target.value })}
          />

          <h3>2. Questões Administrativas</h3>

          {administrativasOpcoes.map((opcao) => (
            <label style={styles.check} key={opcao}>
              <input
                type="checkbox"
                checked={form.administrativas.includes(opcao)}
                onChange={() => alternarCheckbox("administrativas", opcao)}
              />{" "}
              {opcao}
            </label>
          ))}

          <textarea
            style={styles.textarea}
            placeholder="Descrição das questões administrativas"
            value={form.descricaoAdministrativas}
            onChange={(e) => setForm({ ...form, descricaoAdministrativas: e.target.value })}
          />

          <h3>3. Percepção Institucional</h3>

          <h4>Diretor(a): Como avalia a SED?</h4>

          <select
            style={styles.input}
            value={form.avaliacaoSedDiretor}
            onChange={(e) => setForm({ ...form, avaliacaoSedDiretor: e.target.value })}
          >
            <option value="">Selecione</option>
            {percepcaoOpcoes.map((opcao) => (
              <option key={opcao}>{opcao}</option>
            ))}
          </select>

          <h4>Diretor(a): Como avalia o Governo?</h4>

          <select
            style={styles.input}
            value={form.avaliacaoGovernoDiretor}
            onChange={(e) => setForm({ ...form, avaliacaoGovernoDiretor: e.target.value })}
          >
            <option value="">Selecione</option>
            {percepcaoOpcoes.map((opcao) => (
              <option key={opcao}>{opcao}</option>
            ))}
          </select>

          <h4>Diretor(a) Adjunto(a): Como avalia a SED?</h4>

          <select
            style={styles.input}
            value={form.avaliacaoSedAdjunto}
            onChange={(e) => setForm({ ...form, avaliacaoSedAdjunto: e.target.value })}
          >
            <option value="">Selecione</option>
            {percepcaoOpcoes.map((opcao) => (
              <option key={opcao}>{opcao}</option>
            ))}
          </select>

          <h4>Diretor(a) Adjunto(a): Como avalia o Governo?</h4>

          <select
            style={styles.input}
            value={form.avaliacaoGovernoAdjunto}
            onChange={(e) => setForm({ ...form, avaliacaoGovernoAdjunto: e.target.value })}
          >
            <option value="">Selecione</option>
            {percepcaoOpcoes.map((opcao) => (
              <option key={opcao}>{opcao}</option>
            ))}
          </select>

          <h3>4. Engajamento</h3>

          <select
            style={styles.input}
            value={form.interesseAgendaDiretor}
            onChange={(e) => setForm({ ...form, interesseAgendaDiretor: e.target.value })}
          >
            <option value="">Interesse Diretor</option>
            <option>Alto</option>
            <option>Médio</option>
            <option>Baixo</option>
          </select>

          <select
            style={styles.input}
            value={form.interesseAgendaAdjunto}
            onChange={(e) => setForm({ ...form, interesseAgendaAdjunto: e.target.value })}
          >
            <option value="">Interesse Adjunto</option>
            <option>Alto</option>
            <option>Médio</option>
            <option>Baixo</option>
          </select>

          <h3>5. Classificação Interna</h3>

          <select
            style={styles.input}
            value={form.classificacaoDiretor}
            onChange={(e) => setForm({ ...form, classificacaoDiretor: e.target.value })}
          >
            <option value="">Classificação Diretor</option>
            <option>VERDE</option>
            <option>AMARELO</option>
            <option>VERMELHO</option>
          </select>

          <select
            style={styles.input}
            value={form.classificacaoAdjunto}
            onChange={(e) => setForm({ ...form, classificacaoAdjunto: e.target.value })}
          >
            <option value="">Classificação Adjunto</option>
            <option>VERDE</option>
            <option>AMARELO</option>
            <option>VERMELHO</option>
          </select>

          <h3>6. Observações Estratégicas</h3>

          <h4>Diretor(a)</h4>

          <textarea
            style={styles.textarea}
            placeholder="Observações estratégicas do Diretor(a)"
            value={form.observacoesDiretor}
            onChange={(e) => setForm({ ...form, observacoesDiretor: e.target.value })}
          />

          <h4>Diretor(a) Adjunto(a)</h4>

          <textarea
            style={styles.textarea}
            placeholder="Observações estratégicas do Adjunto(a)"
            value={form.observacoesAdjunto}
            onChange={(e) => setForm({ ...form, observacoesAdjunto: e.target.value })}
          />

          <button style={styles.button} onClick={salvarRegistro}>
            {editandoId ? "Salvar Alterações" : "Salvar Reunião"}
          </button>

          {editandoId && (
            <button
              style={styles.buttonSecundario}
              onClick={() => {
                setForm(formLimpo);
                setEditandoId(null);
              }}
            >
              Cancelar edição
            </button>
          )}
        </section>

        <section style={styles.panel}>
          <h2>Indicadores por Gestor</h2>

          <select
            style={styles.input}
            value={municipioIndicador}
            onChange={(e) => setMunicipioIndicador(e.target.value)}
          >
            <option value="GERAL">Indicadores gerais</option>

            {Object.keys(escolasPorMunicipio).map((municipio) => (
              <option key={municipio} value={municipio}>
                {municipio}
              </option>
            ))}
          </select>

          <h3 style={styles.tituloGrafico}>Classificação</h3>

          <div style={styles.graficoVertical}>
            {barraVertical("VERDE", verde, totalGestores)}
            {barraVertical("AMARELO", amarelo, totalGestores)}
            {barraVertical("VERMELHO", vermelho, totalGestores)}
          </div>

          <h3 style={styles.tituloGrafico}>Engajamento</h3>

          <div style={styles.graficoVertical}>
            {barraVertical("Alto", alto, totalGestores)}
            {barraVertical("Médio", medio, totalGestores)}
            {barraVertical("Baixo", baixo, totalGestores)}
          </div>

          <h2>Indicadores Demandas</h2>

          {graficoCheckbox("1. Demandas da Escola", "demandas", demandasOpcoes)}
          {graficoCheckbox("2. Questões Administrativas", "administrativas", administrativasOpcoes)}

          <h2>Percepção Institucional</h2>

          {graficoPercepcao("Diretor(a): Como avalia a SED?", "avaliacaoSedDiretor")}
          {graficoPercepcao("Diretor(a): Como avalia o Governo?", "avaliacaoGovernoDiretor")}
          {graficoPercepcao("Diretor(a) Adjunto(a): Como avalia a SED?", "avaliacaoSedAdjunto")}
          {graficoPercepcao("Diretor(a) Adjunto(a): Como avalia o Governo?", "avaliacaoGovernoAdjunto")}
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#07111f,#0f172a,#111827)",
    color: "white",
    fontFamily: "Arial",
    padding: 15
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 15,
    marginBottom: 25,
    flexWrap: "wrap"
  },

  logo: {
    width: 55,
    height: 55,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#2563eb,#facc15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 32
  },

  title: {
    margin: 0,
    fontSize: "clamp(26px, 5vw, 38px)"
  },

  subtitle: {
    margin: 0,
    color: "#cbd5e1"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
    gap: 20
  },

  panel: {
    background: "rgba(15,23,42,.95)",
    padding: 20,
    borderRadius: 18
  },

  subPainel: {
    background: "#0f172a",
    padding: 14,
    borderRadius: 12,
    marginBottom: 18
  },

  tituloGrafico: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 10,
    color: "#ffffff"
  },

  input: {
    width: "100%",
    padding: 13,
    marginBottom: 10,
    borderRadius: 8,
    border: "none",
    boxSizing: "border-box",
    fontSize: 16
  },

  textarea: {
    width: "100%",
    padding: 13,
    marginBottom: 10,
    borderRadius: 8,
    border: "none",
    minHeight: 90,
    boxSizing: "border-box",
    fontSize: 16
  },

  check: {
    display: "block",
    marginBottom: 8
  },

  button: {
    width: "100%",
    padding: 14,
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: "bold",
    marginBottom: 10
  },

  buttonSecundario: {
    width: "100%",
    padding: 14,
    background: "#475569",
    color: "white",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: "bold",
    marginBottom: 10
  },

  buttonExcluir: {
    width: "100%",
    padding: 14,
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: "bold"
  },

  avisoEdicao: {
    background: "#eab308",
    color: "#111827",
    padding: 12,
    borderRadius: 10,
    fontWeight: "bold",
    marginBottom: 12
  },

  graficoVertical: {
    display: "flex",
    justifyContent: "space-evenly",
    alignItems: "flex-end",
    gap: 30,
    height: 320,
    marginBottom: 40,
    paddingTop: 20,
    overflowX: "auto"
  },

  colunaGrafico: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    cursor: "pointer",
    width: 90,
    gap: 10,
    flexShrink: 0
  },

  areaBarraVertical: {
    height: 220,
    width: 55,
    background: "#334155",
    borderRadius: 12,
    display: "flex",
    alignItems: "flex-end",
    overflow: "hidden",
    border: "1px solid #475569"
  },

  barraVertical: {
    width: "100%",
    borderRadius: 12,
    transition: "0.4s"
  },

  barraHorizontalItem: {
    marginBottom: 12
  },

  barraHorizontalTexto: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    fontWeight: "bold",
    marginBottom: 5
color: "#ffffff"
  },

  barraHorizontalFundo: {
  height: 14,
  background: "#334155",
  borderRadius: 999,
  overflow: "hidden"
},

  barraHorizontalValor: {
  height: 14,
  borderRadius: 999,
  transition: "0.3s",
  boxShadow: "0 0 12px rgba(245,158,11,0.55)"
},

  registro: {
    background: "#1e293b",
    padding: 18,
    borderRadius: 14,
    marginBottom: 15
  },

  relatorioPage: {
    background: "white",
    color: "black",
    minHeight: "100vh",
    padding: 30,
    fontFamily: "Arial"
  },

  relatorioBox: {
    border: "1px solid #ccc",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20
  },

  relatorioItem: {
    borderBottom: "1px solid #ddd",
    padding: "10px 0"
  },

  buttonRelatorio: {
    padding: 12,
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontWeight: "bold",
    cursor: "pointer",
    marginRight: 10,
    marginBottom: 10
  }
};

