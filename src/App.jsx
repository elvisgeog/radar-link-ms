import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

export default function App() {
  const [escola, setEscola] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [prioridade, setPrioridade] = useState("");

  async function salvarVisita() {
    try {
      await addDoc(collection(db, "visitas_tecnicas"), {
        escola,
        municipio,
        prioridade,
        data: new Date().toLocaleDateString()
      });

      alert("Visita salva com sucesso!");

      setEscola("");
      setMunicipio("");
      setPrioridade("");
    } catch (erro) {
      console.error(erro);
      alert("Erro ao salvar.");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "white",
        padding: "40px",
        fontFamily: "Arial"
      }}
    >
      <h1>Radar Link MS</h1>

      <h2>Cadastro de Visita Técnica</h2>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "400px"
        }}
      >
        <input
          type="text"
          placeholder="Escola"
          value={escola}
          onChange={(e) => setEscola(e.target.value)}
          style={{ padding: "12px" }}
        />

        <input
          type="text"
          placeholder="Município"
          value={municipio}
          onChange={(e) => setMunicipio(e.target.value)}
          style={{ padding: "12px" }}
        />

        <input
          type="text"
          placeholder="Prioridade"
          value={prioridade}
          onChange={(e) => setPrioridade(e.target.value)}
          style={{ padding: "12px" }}
        />

        <button
          onClick={salvarVisita}
          style={{
            padding: "14px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            cursor: "pointer"
          }}
        >
          Salvar Visita
        </button>
      </div>
    </div>
  );
}