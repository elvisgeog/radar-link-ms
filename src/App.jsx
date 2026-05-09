import React, { useEffect, useState } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export default function App() {
  const [escola, setEscola] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [visitas, setVisitas] = useState([]);

  async function carregarVisitas() {
    const dados = await getDocs(collection(db, "visitas_tecnicas"));
    const lista = dados.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    setVisitas(lista);
  }

  async function salvarVisita() {
    await addDoc(collection(db, "visitas_tecnicas"), {
      escola,
      municipio,
      prioridade,
      status: "Pendente",
      data: new Date().toLocaleDateString()
    });

    setEscola("");
    setMunicipio("");
    setPrioridade("");
    carregarVisitas();
    alert("Visita salva com sucesso!");
  }

  useEffect(() => {
    carregarVisitas();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "white", fontFamily: "Arial", padding: 30 }}>
      <h1>Radar Link MS</h1>
      <p>Inteligência • Gestão • Articulação</p>

      <div style={{ display: "flex", gap: 20, marginTop: 30, flexWrap: "wrap" }}>
        <div style={{ background: "#1e293b", padding: 20, borderRadius: 12, width: 220 }}>
          <h2>{visitas.length}</h2>
          <p>Visitas cadastradas</p>
        </div>

        <div style={{ background: "#1e293b", padding: 20, borderRadius: 12, width: 220 }}>
          <h2>{visitas.filter(v => v.prioridade === "Alta").length}</h2>
          <p>Prioridade alta</p>
        </div>

        <div style={{ background: "#1e293b", padding: 20, borderRadius: 12, width: 220 }}>
          <h2>{visitas.filter(v => v.status === "Pendente").length}</h2>
          <p>Pendentes</p>
        </div>
      </div>

      <div style={{ marginTop: 40, background: "#1e293b", padding: 25, borderRadius: 12, maxWidth: 500 }}>
        <h2>Nova Visita Técnica</h2>

        <input placeholder="Escola" value={escola} onChange={(e) => setEscola(e.target.value)} style={campo} />
        <input placeholder="Município" value={municipio} onChange={(e) => setMunicipio(e.target.value)} style={campo} />
        <input placeholder="Prioridade: Alta, Média ou Baixa" value={prioridade} onChange={(e) => setPrioridade(e.target.value)} style={campo} />

        <button onClick={salvarVisita} style={botao}>Salvar Visita</button>
      </div>

      <div style={{ marginTop: 40 }}>
        <h2>Banco de Visitas Técnicas</h2>

        {visitas.map((v) => (
          <div key={v.id} style={{ background: "#1e293b", padding: 20, borderRadius: 12, marginBottom: 15 }}>
            <h3>{v.escola}</h3>
            <p><strong>Município:</strong> {v.municipio}</p>
            <p><strong>Prioridade:</strong> {v.prioridade}</p>
            <p><strong>Status:</strong> {v.status}</p>
            <p><strong>Data:</strong> {v.data}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const campo = {
  width: "100%",
  padding: 12,
  marginBottom: 10,
  borderRadius: 6,
  border: "none"
};

const botao = {
  width: "100%",
  padding: 14,
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer"
};