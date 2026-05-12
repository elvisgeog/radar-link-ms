```javascript
// SUBSTITUA TODO O src/App.jsx POR ESTE ARQUIVO

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
      "EE FREI JOÃO DAMASCENO"
    ],

    "DOURADOS": [
      "EE MENODORA FIALHO",
      "EE DANIEL BERG",
      "EE JOSÉ PEREIRA LINS"
    ]
  };

  const [registros, setRegistros] = useState([]);
  const [filtroAtivo, setFiltroAtivo] = useState(null);
  const [modoRelatorio, setModoRelatorio] = useState(false);
  const [formAberto, setFormAberto] = useState(null);
  const [municipioIndicador, setMunicipioIndicador] = useState("GERAL");

  const [form, setForm] = useState({
    municipio: "",
    escola: "",
    diretor: "",
    adjunto: "",
    interesseAgendaDiretor: "",
    interesseAgendaAdjunto: "",
    classificacaoDiretor: "",
    classificacaoAdjunto: "",
    observacoes: ""
  });

  async function carregarRegistros() {

    const dados = await getDocs(
      collection(db, "reunioes_gestores")
    );

    setRegistros(
      dados.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }))
    );
  }

  useEffect(() => {
    carregarRegistros();
  }, []);

  async function salvarRegistro() {

    if (!form.municipio || !form.escola) {
      alert("Preencha município e escola");
      return;
    }

    await addDoc(
      collection(db, "reunioes_gestores"),
      {
        ...form,
        criadoEm: new Date().toLocaleString()
      }
    );

    alert("Salvo com sucesso");

    setForm({
      municipio: "",
      escola: "",
      diretor: "",
      adjunto: "",
      interesseAgendaDiretor: "",
      interesseAgendaAdjunto: "",
      classificacaoDiretor: "",
      classificacaoAdjunto: "",
      observacoes: ""
    });

    carregarRegistros();
  }

  async function excluirRegistro(id) {

    const confirmar = window.confirm(
      "Deseja excluir?"
    );

    if (!confirmar) return;

    await deleteDoc(
      doc(db, "reunioes_gestores", id)
    );

    alert("Excluído");

    setFormAberto(null);

    carregarRegistros();
  }

  function gerarPDF() {
    window.print();
  }

  function registrosBase() {

    if (municipioIndicador === "GERAL") {
      return registros;
    }

    return registros.filter(
      (r) => r.municipio === municipioIndicador
    );
  }

  const base = registrosBase();

  function contarClassificacao(tipo) {

    return base.reduce((total, r) => {

      let soma = 0;

      if (r.classificacaoDiretor === tipo) soma++;
      if (r.classificacaoAdjunto === tipo) soma++;

      return total + soma;

    }, 0);
  }

  function contarEngajamento(tipo) {

    return base.reduce((total, r) => {

      let soma = 0;

      if (r.interesseAgendaDiretor === tipo) soma++;
      if (r.interesseAgendaAdjunto === tipo) soma++;

      return total + soma;

    }, 0);
  }

  const totalGestores = base.length * 2;

  const verde = contarClassificacao("VERDE");
  const amarelo = contarClassificacao("AMARELO");
  const vermelho = contarClassificacao("VERMELHO");

  const alto = contarEngajamento("Alto");
  const medio = contarEngajamento("Médio");
  const baixo = contarEngajamento("Baixo");

  function corIndicador(label) {

    if (label === "VERDE" || label === "Alto")
      return "#22c55e";

    if (label === "AMARELO" || label === "Médio")
      return "#eab308";

    if (label === "VERMELHO" || label === "Baixo")
      return "#ef4444";

    return "#ffffff";
  }

  function barra(label, valor, totalBase) {

    const percentual = totalBase
      ? Math.round((valor / totalBase) * 100)
      : 0;

    const cor = corIndicador(label);

    return (

      <div
        style={styles.colunaGrafico}
        onClick={() => setFiltroAtivo(label)}
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

        <strong style={{ color: cor }}>
          {valor}
        </strong>

        <span style={{ color: cor }}>
          {label}
        </span>

        <small style={{ color: "#cbd5e1" }}>
          {percentual}%
        </small>

      </div>
    );
  }

  if (formAberto) {

    return (

      <div style={styles.relatorioPage}>

        <h1>Radar Link MS</h1>

        <button
          style={styles.button}
          onClick={() => setFormAberto(null)}
        >
          Voltar
        </button>

        <button
          style={styles.button}
          onClick={gerarPDF}
        >
          Gerar PDF / Imprimir
        </button>

        <section style={styles.relatorioBox}>

          <h2>Formulário salvo</h2>

          <p>
            <strong>Município:</strong>
            {" "}
            {formAberto.municipio}
          </p>

          <p>
            <strong>Escola:</strong>
            {" "}
            {formAberto.escola}
          </p>

          <p>
            <strong>Diretor:</strong>
            {" "}
            {formAberto.diretor}
          </p>

          <p>
            <strong>Adjunto:</strong>
            {" "}
            {formAberto.adjunto}
          </p>

          <p>
            <strong>Observações:</strong>
            {" "}
            {formAberto.observacoes}
          </p>

        </section>

        <button
          style={styles.buttonExcluir}
          onClick={() => excluirRegistro(formAberto.id)}
        >
          Excluir formulário
        </button>

      </div>
    );
  }

  return (

    <div style={styles.page}>

      <header style={styles.header}>

        <div style={styles.logo}>
          ◎
        </div>

        <div>

          <h1 style={styles.title}>
            Radar Link MS
          </h1>

          <p style={styles.subtitle}>
            Inteligência • Gestão • Articulação Regional
          </p>

        </div>

      </header>

      <main style={styles.grid}>

        <section style={styles.panel}>

          <h2>Formulário</h2>

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

            <option value="">
              Município
            </option>

            {Object.keys(escolasPorMunicipio)
              .map((m) => (
                <option key={m}>
                  {m}
                </option>
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

            <option value="">
              Escola
            </option>

            {form.municipio &&
              escolasPorMunicipio[
                form.municipio
              ]?.map((e) => (
                <option key={e}>
                  {e}
                </option>
              ))}

          </select>

          <input
            style={styles.input}
            placeholder="Diretor(a)"
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
            placeholder="Adjunto(a)"
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
            <option value="">
              Classificação Diretor
            </option>

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
            <option value="">
              Classificação Adjunto
            </option>

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
            <option value="">
              Engajamento Diretor
            </option>

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
            <option value="">
              Engajamento Adjunto
            </option>

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

          <button
            style={styles.button}
            onClick={salvarRegistro}
          >
            Salvar
          </button>

        </section>

        <section style={styles.panel}>

          <h2>
            Indicadores por Gestor
          </h2>

          <select
            style={styles.input}
            value={municipioIndicador}
            onChange={(e) =>
              setMunicipioIndicador(
                e.target.value
              )
            }
          >

            <option value="GERAL">
              Indicadores gerais
            </option>

            {Object.keys(escolasPorMunicipio)
              .map((m) => (
                <option
                  key={m}
                  value={m}
                >
                  {m}
                </option>
              ))}

          </select>

          <h3>Classificação</h3>

          <div style={styles.graficoVertical}>

            {barra("VERDE", verde, totalGestores)}

            {barra("AMARELO", amarelo, totalGestores)}

            {barra("VERMELHO", vermelho, totalGestores)}

          </div>

          <h3>Engajamento</h3>

          <div style={styles.graficoVertical}>

            {barra("Alto", alto, totalGestores)}

            {barra("Médio", medio, totalGestores)}

            {barra("Baixo", baixo, totalGestores)}

          </div>

        </section>

        <section style={styles.panel}>

          <h2>
            Formulários salvos
          </h2>

          {registros.map((r) => (

            <div
              key={r.id}
              style={styles.registro}
            >

              <h3>{r.escola}</h3>

              <p>
                <strong>Município:</strong>
                {" "}
                {r.municipio}
              </p>

              <button
                style={styles.button}
                onClick={() => setFormAberto(r)}
              >
                Abrir formulário
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
    background:
      "linear-gradient(135deg,#07111f,#0f172a,#111827)",
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
    background:
      "linear-gradient(135deg,#2563eb,#facc15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 32
  },

  title: {
    margin: 0,
    fontSize: "clamp(26px,5vw,38px)"
  },

  subtitle: {
    margin: 0,
    color: "#cbd5e1"
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(320px,1fr))",
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

  graficoVertical: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "flex-end",
    gap: 20,
    height: 260,
    marginBottom: 35
  },

  colunaGrafico: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    width: 80,
    gap: 6
  },

  areaBarraVertical: {
    height: 180,
    width: 45,
    background: "#334155",
    borderRadius: 10,
    display: "flex",
    alignItems: "flex-end",
    overflow: "hidden"
  },

  barraVertical: {
    width: "100%",
    borderRadius: 10,
    transition: "0.3s"
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
    padding: 30
  },

  relatorioBox: {
    border: "1px solid #ccc",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20
  }

};
```
