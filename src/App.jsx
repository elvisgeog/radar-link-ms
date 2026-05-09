import React, { useEffect, useState } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export default function App() {

  const [registros, setRegistros] = useState([]);
  const [filtro, setFiltro] = useState(null);

  const [form, setForm] = useState({
    municipio: "",
    escola: "",
    diretor: "",
    adjunto: "",
    interesseAgendaDiretor: "",
    classificacaoDiretor: ""
  });

  const escolasPorMunicipio = {
    "CAARAPÓ": [
      "EE ARCÊNIO ROJAS",
      "EE FREI JOÃO DAMASCENO"
    ],

    "DOURADOS": [
      "EE PASTOR DANIEL BERG",
      "EE PROFESSOR JOSÉ PEREIRA LINS"
    ]
  };

  async function carregarRegistros() {

    const dados = await getDocs(
      collection(db, "reunioes_gestores")
    );

    setRegistros(
      dados.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
    );

  }

  useEffect(() => {
    carregarRegistros();
  }, []);

  async function salvarRegistro() {

    await addDoc(
      collection(db, "reunioes_gestores"),
      form
    );

    alert("Salvo com sucesso!");

    carregarRegistros();

  }

  const verde = registros.filter(
    (r) => r.classificacaoDiretor === "VERDE"
  );

  const amarelo = registros.filter(
    (r) => r.classificacaoDiretor === "AMARELO"
  );

  const vermelho = registros.filter(
    (r) => r.classificacaoDiretor === "VERMELHO"
  );

  const alto = registros.filter(
    (r) => r.interesseAgendaDiretor === "Alto"
  );

  const medio = registros.filter(
    (r) => r.interesseAgendaDiretor === "Médio"
  );

  const baixo = registros.filter(
    (r) => r.interesseAgendaDiretor === "Baixo"
  );

  function abrirLista(tipo) {
    setFiltro(tipo);
  }

  function obterLista() {

    switch (filtro) {

      case "verde":
        return verde;

      case "amarelo":
        return amarelo;

      case "vermelho":
        return vermelho;

      case "alto":
        return alto;

      case "medio":
        return medio;

      case "baixo":
        return baixo;

      default:
        return [];

    }

  }

  return (

    <div style={styles.page}>

      <h1 style={styles.title}>
        Radar Link MS
      </h1>

      <div style={styles.cards}>

        <div
          style={styles.card}
          onClick={() => abrirLista("verde")}
        >
          <span>VERDE</span>
          <strong>{verde.length}</strong>
        </div>

        <div
          style={styles.card}
          onClick={() => abrirLista("amarelo")}
        >
          <span>AMARELO</span>
          <strong>{amarelo.length}</strong>
        </div>

        <div
          style={styles.card}
          onClick={() => abrirLista("vermelho")}
        >
          <span>VERMELHO</span>
          <strong>{vermelho.length}</strong>
        </div>

        <div
          style={styles.card}
          onClick={() => abrirLista("alto")}
        >
          <span>ALTO</span>
          <strong>{alto.length}</strong>
        </div>

        <div
          style={styles.card}
          onClick={() => abrirLista("medio")}
        >
          <span>MÉDIO</span>
          <strong>{medio.length}</strong>
        </div>

        <div
          style={styles.card}
          onClick={() => abrirLista("baixo")}
        >
          <span>BAIXO</span>
          <strong>{baixo.length}</strong>
        </div>

      </div>

      <div style={styles.grid}>

        <section style={styles.panel}>

          <h2>
            Cadastro
          </h2>

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

            {Object.keys(escolasPorMunicipio).map(
              (municipio) => (

                <option key={municipio}>
                  {municipio}
                </option>

              )
            )}

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
              ].map((escola) => (

                <option key={escola}>
                  {escola}
                </option>

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
            placeholder="Diretor Adjunto"
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
            value={
              form.interesseAgendaDiretor
            }
            onChange={(e) =>
              setForm({
                ...form,
                interesseAgendaDiretor:
                  e.target.value
              })
            }
          >

            <option value="">
              Engajamento
            </option>

            <option>Alto</option>
            <option>Médio</option>
            <option>Baixo</option>

          </select>

          <select
            style={styles.input}
            value={
              form.classificacaoDiretor
            }
            onChange={(e) =>
              setForm({
                ...form,
                classificacaoDiretor:
                  e.target.value
              })
            }
          >

            <option value="">
              Classificação
            </option>

            <option>VERDE</option>
            <option>AMARELO</option>
            <option>VERMELHO</option>

          </select>

          <button
            style={styles.button}
            onClick={salvarRegistro}
          >
            Salvar
          </button>

        </section>

        <section style={styles.panel}>

          <h2>
            {filtro
              ? `Lista ${filtro.toUpperCase()}`
              : "Clique nos indicadores"}
          </h2>

          {obterLista().map((item) => (

            <div
              key={item.id}
              style={styles.item}
            >

              <h3>{item.escola}</h3>

              <p>
                <strong>Município:</strong>{" "}
                {item.municipio}
              </p>

              <p>
                <strong>Diretor:</strong>{" "}
                {item.diretor}
              </p>

              <p>
                <strong>Adjunto:</strong>{" "}
                {item.adjunto}
              </p>

            </div>

          ))}

        </section>

      </div>

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

  title: {
    fontSize: 42,
    marginBottom: 25
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(140px,1fr))",
    gap: 12,
    marginBottom: 25
  },

  card: {
    background: "#1e293b",
    padding: 20,
    borderRadius: 14,
    cursor: "pointer",
    textAlign: "center"
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(320px,1fr))",
    gap: 20
  },

  panel: {
    background:
      "rgba(15,23,42,.95)",
    padding: 20,
    borderRadius: 18
  },

  input: {
    width: "100%",
    padding: 13,
    marginBottom: 10,
    borderRadius: 8,
    border: "none",
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
    cursor: "pointer"
  },

  item: {
    background: "#1e293b",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12
  }

};