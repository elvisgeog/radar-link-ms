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
  const SENHA_ACESSO = "radar2026";

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

  const [senhaDigitada, setSenhaDigitada] = useState("");
  const [autenticado, setAutenticado] = useState(
    localStorage.getItem("radar_auth") === "ok"
  );

  const [registros, setRegistros] = useState([]);
  const [formAberto, setFormAberto] = useState(null);
  const [modoRelatorio, setModoRelatorio] = useState(false);
  const [modoFormularios, setModoFormularios] = useState(false);
  const [modoGraficos, setModoGraficos] = useState(false);
  const [filtroAtivo, setFiltroAtivo] = useState(null);
  const [municipioIndicador, setMunicipioIndicador] = useState("GERAL");
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(formLimpo);

  function entrarNaPlataforma() {
    if (senhaDigitada === SENHA_ACESSO) {
      localStorage.setItem("radar_auth", "ok");
      setAutenticado(true);
    } else {
      alert("Senha incorreta.");
    }
  }

  function sairDaPlataforma() {
    localStorage.removeItem("radar_auth");
    setAutenticado(false);
    setSenhaDigitada("");
  }

  async function carregarRegistros() {
    const dados = await getDocs(collection(db, "reunioes_gestores"));
    const lista = dados.docs.map((item) => ({
      id: item.id,
      ...item.data()
    }));

    setRegistros(lista);
  }

  useEffect(() => {
    if (autenticado) {
      carregarRegistros();
    }
  }, [autenticado]);

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
    setModoGraficos(false);
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
    if (label === "VERDE" || label === "Alto" || label === "Positivo")
      return "#00ff66";

    if (
      label === "AMARELO" ||
      label === "Médio" ||
      label === "Positivo com ressalvas"
    )
      return "#ffd400";

    if (label === "VERMELHO" || label === "Baixo" || label === "Negativo")
      return "#ff3333";

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
              : r.adjunto || "Não informado",
            cargo: cargoDiretor
              ? "Diretor(a)"
              : "Diretor(a) Adjunto(a)",
            municipio: r.municipio,
            escola: r.escola,
            percepcao: r[filtroAtivo.campo] || "Não informado",
            titulo: filtroAtivo.titulo
          });
        }
      });

      return lista.sort((a, b) =>
        String(a.escola || "").localeCompare(
          String(b.escola || ""),
          "pt-BR"
        )
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
      String(a.escola || "").localeCompare(
        String(b.escola || ""),
        "pt-BR"
      )
    );
  }

  function barraVertical(label, valor, totalBase, aoClicar) {
    const percentual = totalBase
      ? Math.round((valor / totalBase) * 100)
      : 0;

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
            fontSize:
              label === "Positivo com ressalvas" ? 12 : 15,
            lineHeight: "15px",
            minHeight: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {label}
        </span>

        <small
          style={{
            color: "#ffffff",
            fontWeight: "bold"
          }}
        >
          {percentual}%
        </small>
      </div>
    );
  }

  function barraHorizontal(label, valor, totalBase) {
    const percentual = totalBase
      ? Math.round((valor / totalBase) * 100)
      : 0;

    return (
      <div style={styles.barraHorizontalItem}>
        <div style={styles.barraHorizontalTexto}>
          <span style={{ color: "#ffffff" }}>{label}</span>

          <strong style={{ color: "#ffffff" }}>
            {valor} ({percentual}%)
          </strong>
        </div>

        <div style={styles.barraHorizontalFundo}>
          <div
            style={{
              ...styles.barraHorizontalValor,
              width: `${percentual}%`
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
            {barraHorizontal(
              opcao,
              contarArray(campo, opcao),
              totalFormularios
            )}
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

  if (!autenticado) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginBox}>
          <div style={styles.logoGrande}>◎</div>

          <h1 style={styles.loginTitle}>Radar Link MS</h1>

          <p style={styles.loginSubtitle}>
            Plataforma Estratégica de Gestão Regional
          </p>

          <input
            type="password"
            placeholder="Digite a senha"
            style={styles.input}
            value={senhaDigitada}
            onChange={(e) => setSenhaDigitada(e.target.value)}
          />

          <button
            style={styles.button}
            onClick={entrarNaPlataforma}
          >
            🔐 Entrar na Plataforma
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.logo}>◎</div>

        <div>
          <h1 style={styles.title}>Radar Link MS</h1>

          <p style={styles.subtitle}>
            Inteligência • Gestão • Articulação Regional
          </p>
        </div>
      </header>

      <button
        style={styles.button}
        onClick={() => setModoRelatorio(true)}
      >
        📄 Abrir Relatório Geral / Gerar PDF
      </button>

      <button
        style={styles.button}
        onClick={() => setModoFormularios(true)}
      >
        📂 Acessar Formulários Salvos
      </button>

      <button
        style={styles.button}
        onClick={() => setModoGraficos(true)}
      >
        📊 Acessar Gráficos / Resultados
      </button>

      <button
        style={styles.buttonSecundario}
        onClick={sairDaPlataforma}
      >
        🚪 Sair da Plataforma
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
            onChange={(e) =>
              setForm({
                ...form,
                descricaoDemandas: e.target.value
              })
            }
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
            onChange={(e) =>
              setForm({
                ...form,
                descricaoAdministrativas: e.target.value
              })
            }
          />

          <h3>3. Percepção Institucional</h3>

          <h4>Diretor(a): Como avalia a SED?</h4>
          <select
            style={styles.input}
            value={form.avaliacaoSedDiretor}
            onChange={(e) =>
              setForm({
                ...form,
                avaliacaoSedDiretor: e.target.value
              })
            }
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
            onChange={(e) =>
              setForm({
                ...form,
                avaliacaoGovernoDiretor: e.target.value
              })
            }
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
            onChange={(e) =>
              setForm({
                ...form,
                avaliacaoSedAdjunto: e.target.value
              })
            }
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
            onChange={(e) =>
              setForm({
                ...form,
                avaliacaoGovernoAdjunto: e.target.value
              })
            }
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
            onChange={(e) =>
              setForm({
                ...form,
                interesseAgendaDiretor: e.target.value
              })
            }
          >
            <option value="">Interesse Diretor</option>
            <option>Alto</option>
            <option>Médio</option>
            <option>Baixo</option>
          </select>

          <select
            style={styles.input}
            value={form.interesseAgendaAdjunto}
            onChange={(e) =>
              setForm({
                ...form,
                interesseAgendaAdjunto: e.target.value
              })
            }
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
            onChange={(e) =>
              setForm({
                ...form,
                classificacaoDiretor: e.target.value
              })
            }
          >
            <option value="">Classificação Diretor</option>
            <option>VERDE</option>
            <option>AMARELO</option>
            <option>VERMELHO</option>
          </select>

          <select
            style={styles.input}
            value={form.classificacaoAdjunto}
            onChange={(e) =>
              setForm({
                ...form,
                classificacaoAdjunto: e.target.value
              })
            }
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
            onChange={(e) =>
              setForm({
                ...form,
                observacoesDiretor: e.target.value
              })
            }
          />

          <h4>Diretor(a) Adjunto(a)</h4>
          <textarea
            style={styles.textarea}
            placeholder="Observações estratégicas do Adjunto(a)"
            value={form.observacoesAdjunto}
            onChange={(e) =>
              setForm({
                ...form,
                observacoesAdjunto: e.target.value
              })
            }
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

  loginPage: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e293b)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "Arial"
  },

  loginBox: {
    width: "100%",
    maxWidth: 420,
    background: "rgba(15,23,42,.96)",
    padding: 30,
    borderRadius: 22,
    boxShadow: "0 20px 60px rgba(0,0,0,.45)",
    color: "white",
    textAlign: "center"
  },

  logoGrande: {
    width: 75,
    height: 75,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#2563eb,#facc15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 42,
    margin: "0 auto 15px auto"
  },

  loginTitle: {
    margin: 0,
    fontSize: 34
  },

  loginSubtitle: {
    color: "#cbd5e1",
    marginBottom: 25
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

  avisoEdicao: {
    background: "#eab308",
    color: "#111827",
    padding: 12,
    borderRadius: 10,
    fontWeight: "bold",
    marginBottom: 12
  }
};