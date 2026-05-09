import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
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

  const [registros, setRegistros] = useState([]);
  const [filtroAtivo, setFiltroAtivo] = useState(null);
  const [modoRelatorio, setModoRelatorio] = useState(false);

  const [form, setForm] = useState({
    municipio: "",
    escola: "",
    diretor: "",
    adjunto: "",
    classificacaoDiretor: "",
    classificacaoAdjunto: "",
    interesseAgendaDiretor: "",
    interesseAgendaAdjunto: "",
    observacoes: ""
  });

  async function carregarRegistros() {
    const dados = await getDocs(collection(db, "reunioes_gestores"));
    setRegistros(dados.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })));
  }

  useEffect(() => {
    carregarRegistros();
  }, []);

  async function salvarRegistro() {
    if (!form.municipio || !form.escola) {
      alert("Preencha município e escola.");
      return;
    }

    await addDoc(collection(db, "reunioes_gestores"), {
      ...form,
      criadoEm: new Date().toLocaleString()
    });

    alert("Registro salvo!");

    setForm({
      municipio: "",
      escola: "",
      diretor: "",
      adjunto: "",
      classificacaoDiretor: "",
      classificacaoAdjunto: "",
      interesseAgendaDiretor: "",
      interesseAgendaAdjunto: "",
      observacoes: ""
    });

    carregarRegistros();
  }

  async function excluirRegistro(id) {
    const confirmar = window.confirm("Deseja realmente excluir este registro?");
    if (!confirmar) return;

    await deleteDoc(doc(db, "reunioes_gestores", id));
    alert("Registro excluído com sucesso!");
    carregarRegistros();
  }

  function contarClassificacao(tipo) {
    return registros.reduce((total, r) => {
      let soma = 0;
      if (r.classificacaoDiretor === tipo) soma++;
      if (r.classificacaoAdjunto === tipo) soma++;
      return total + soma;
    }, 0);
  }

  function contarEngajamento(tipo) {
    return registros.reduce((total, r) => {
      let soma = 0;
      if (r.interesseAgendaDiretor === tipo) soma++;
      if (r.interesseAgendaAdjunto === tipo) soma++;
      return total + soma;
    }, 0);
  }

  const totalGestores = registros.length * 2;

  const verde = contarClassificacao("VERDE");
  const amarelo = contarClassificacao("AMARELO");
  const vermelho = contarClassificacao("VERMELHO");

  const alto = contarEngajamento("Alto");
  const medio = contarEngajamento("Médio");
  const baixo = contarEngajamento("Baixo");

  function corIndicador(label) {
    if (label === "VERDE" || label === "Alto") return "#22c55e";
    if (label === "AMARELO" || label === "Médio") return "#eab308";
    if (label === "VERMELHO" || label === "Baixo") return "#ef4444";
    return "#ffffff";
  }

  function gerarPDF() {
    window.print();
  }

  function listaFiltrada() {
    if (!filtroAtivo) return [];

    const lista = [];

    registros.forEach((r) => {
      if (r.classificacaoDiretor === filtroAtivo) {
        lista.push({
          id: r.id + "d",
          nome: r.diretor || "Não informado",
          cargo: "Diretor(a)",
          escola: r.escola,
          municipio: r.municipio
        });
      }

      if (r.classificacaoAdjunto === filtroAtivo) {
        lista.push({
          id: r.id + "a",
          nome: r.adjunto || "Não informado",
          cargo: "Diretor(a) Adjunto(a)",
          escola: r.escola,
          municipio: r.municipio
        });
      }

      if (r.interesseAgendaDiretor === filtroAtivo) {
        lista.push({
          id: r.id + "ed",
          nome: r.diretor || "Não informado",
          cargo: "Diretor(a)",
          escola: r.escola,
          municipio: r.municipio
        });
      }

      if (r.interesseAgendaAdjunto === filtroAtivo) {
        lista.push({
          id: r.id + "ea",
          nome: r.adjunto || "Não informado",
          cargo: "Diretor(a) Adjunto(a)",
          escola: r.escola,
          municipio: r.municipio
        });
      }
    });

    return lista;
  }

  function barra(label, valor, totalBase) {
    const percentual = totalBase ? Math.round((valor / totalBase) * 100) : 0;
    const cor = corIndicador(label);

    return (
      <div style={styles.verticalChartItem} onClick={() => setFiltroAtivo(label)}>
        <div style={styles.verticalBarArea}>
          <div
            style={{
              ...styles.verticalBar,
              background: cor,
              height: `${percentual}%`
            }}
          />
        </div>

        <strong style={{ color: cor, marginTop: 10 }}>{valor}</strong>

        <span style={{ color: cor, fontWeight: "bold", marginTop: 5, textAlign: "center" }}>
          {label}
        </span>

        <small style={{ color: "#cbd5e1", marginTop: 4 }}>{percentual}%</small>
      </div>
    );
  }

  if (modoRelatorio) {
    return (
      <div style={styles.relatorioPage}>
        <h1>Radar Link MS</h1>
        <h2>Relatório Estratégico</h2>
        <p>Data: {new Date().toLocaleString()}</p>

        <button style={styles.button} onClick={() => setModoRelatorio(false)}>
          Voltar
        </button>

        <button style={styles.button} onClick={gerarPDF}>
          Gerar PDF
        </button>

        <div style={styles.relatorioBox}>
          <h2>Indicadores</h2>
          <p>Verde: {verde}</p>
          <p>Amarelo: {amarelo}</p>
          <p>Vermelho: {vermelho}</p>
          <p>Alto: {alto}</p>
          <p>Médio: {medio}</p>
          <p>Baixo: {baixo}</p>
        </div>

        {registros.map((r) => (
          <div key={r.id} style={styles.relatorioItem}>
            <h3>{r.escola}</h3>
            <p>Município: {r.municipio}</p>
            <p>Diretor: {r.diretor}</p>
            <p>Adjunto: {r.adjunto}</p>
            <p>Classificação Diretor: {r.classificacaoDiretor}</p>
            <p>Classificação Adjunto: {r.classificacaoAdjunto}</p>
            <p>Engajamento Diretor: {r.interesseAgendaDiretor}</p>
            <p>Engajamento Adjunto: {r.interesseAgendaAdjunto}</p>
            <p>Observações: {r.observacoes}</p>
          </div>
        ))}
      </div>
    );
  }

  if (filtroAtivo) {
    return (
      <div style={styles.page}>
        <button style={styles.button} onClick={() => setFiltroAtivo(null)}>
          Voltar
        </button>

        <h1 style={{ color: corIndicador(filtroAtivo) }}>Lista: {filtroAtivo}</h1>

        {listaFiltrada().map((r) => (
          <div key={r.id} style={styles.registro}>
            <h2>{r.nome}</h2>
            <p>Cargo: {r.cargo}</p>
            <p>Escola: {r.escola}</p>
            <p>Município: {r.municipio}</p>
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
        Abrir Relatório / PDF
      </button>

      <section style={styles.cards}>
        <div style={{ ...styles.card, color: "#22c55e" }}>
          <span>Verde</span>
          <strong>{verde}</strong>
        </div>

        <div style={{ ...styles.card, color: "#eab308" }}>
          <span>Amarelo</span>
          <strong>{amarelo}</strong>
        </div>

        <div style={{ ...styles.card, color: "#ef4444" }}>
          <span>Vermelho</span>
          <strong>{vermelho}</strong>
        </div>

        <div style={{ ...styles.card, color: "#22c55e" }}>
          <span>Alto engajamento</span>
          <strong>{alto}</strong>
        </div>

        <div style={{ ...styles.card, color: "#eab308" }}>
          <span>Médio engajamento</span>
          <strong>{medio}</strong>
        </div>

        <div style={{ ...styles.card, color: "#ef4444" }}>
          <span>Baixo engajamento</span>
          <strong>{baixo}</strong>
        </div>
      </section>

      <main style={styles.grid}>
        <section style={styles.panel}>
          <h2>Cadastro</h2>

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
            <option value="">Município</option>

            {Object.keys(escolasPorMunicipio).map((m) => (
              <option key={m}>{m}</option>
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
            <option value="">Escola</option>

            {form.municipio &&
              escolasPorMunicipio[form.municipio].map((e) => (
                <option key={e}>{e}</option>
              ))}
          </select>

          <input
            style={styles.input}
            placeholder="Diretor"
            value={form.diretor}
            onChange={(e) =>
              setForm({
                ...form,
                diretor: e.target.value
              })
            }
          />

          <input
            style={styles.input}
            placeholder="Adjunto"
            value={form.adjunto}
            onChange={(e) =>
              setForm({
                ...form,
                adjunto: e.target.value
              })
            }
          />

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
            <option value="">Engajamento Diretor</option>
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
            <option value="">Engajamento Adjunto</option>
            <option>Alto</option>
            <option>Médio</option>
            <option>Baixo</option>
          </select>

          <textarea
            style={styles.textarea}
            placeholder="Observações"
            value={form.observacoes}
            onChange={(e) =>
              setForm({
                ...form,
                observacoes: e.target.value
              })
            }
          />

          <button style={styles.button} onClick={salvarRegistro}>
            Salvar
          </button>
        </section>

        <section style={styles.panel}>
          <h2>Indicadores</h2>

          <div style={styles.verticalChartContainer}>
            {barra("VERDE", verde, totalGestores)}
            {barra("AMARELO", amarelo, totalGestores)}
            {barra("VERMELHO", vermelho, totalGestores)}
            {barra("Alto", alto, totalGestores)}
            {barra("Médio", medio, totalGestores)}
            {barra("Baixo", baixo, totalGestores)}
          </div>
        </section>

        <section style={styles.panel}>
          <h2>Registros Salvos</h2>

          {registros.map((r) => (
            <div key={r.id} style={styles.registro}>
              <h3>{r.escola}</h3>
              <p><strong>Município:</strong> {r.municipio}</p>
              <p><strong>Diretor:</strong> {r.diretor}</p>
              <p><strong>Adjunto:</strong> {r.adjunto}</p>
              <p><strong>Observações:</strong> {r.observacoes}</p>

              <button style={styles.buttonExcluir} onClick={() => excluirRegistro(r.id)}>
                Excluir Registro
              </button>
            </div>
          ))}
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
    marginBottom: 25
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
    fontSize: 38
  },

  subtitle: {
    margin: 0,
    color: "#cbd5e1"
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
    gap: 12,
    marginBottom: 25
  },

  card: {
    background: "#1e293b",
    padding: 18,
    borderRadius: 14,
    display: "flex",
    justifyContent: "space-between"
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
    fontSize: 16,
    boxSizing: "border-box"
  },

  textarea: {
    width: "100%",
    padding: 13,
    marginBottom: 10,
    borderRadius: 8,
    border: "none",
    minHeight: 90,
    boxSizing: "border-box"
  },

  button: {
    width: "100%",
    padding: 15,
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: 15
  },

  buttonExcluir: {
    width: "100%",
    padding: 12,
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: 10
  },

  registro: {
    background: "#1e293b",
    padding: 18,
    borderRadius: 14,
    marginBottom: 15
  },

  verticalChartContainer: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-around",
    gap: 20,
    minHeight: 320,
    paddingTop: 20,
    overflowX: "auto"
  },

  verticalChartItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    width: 90
  },

  verticalBarArea: {
    height: 220,
    width: 60,
    background: "#334155",
    borderRadius: 12,
    display: "flex",
    alignItems: "flex-end",
    overflow: "hidden"
  },

  verticalBar: {
    width: "100%",
    borderRadius: 12,
    transition: "0.4s"
  },

  relatorioPage: {
    background: "white",
    color: "black",
    minHeight: "100vh",
    padding: 30
  },

  relatorioBox: {
    border: "1px solid #ccc",
    padding: 15,
    marginBottom: 20
  },

  relatorioItem: {
    borderBottom: "1px solid #ddd",
    padding: "10px 0"
  }
};