import React, { useEffect, useState } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export default function App() {
  const [escola, setEscola] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [observacao, setObservacao] = useState("");
  const [visitas, setVisitas] = useState([]);

  async function carregarVisitas() {
    const dados = await getDocs(collection(db, "visitas_tecnicas"));
    const lista = dados.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setVisitas(lista);
  }

  async function salvarVisita() {
    if (!escola || !municipio || !prioridade) {
      alert("Preencha escola, município e prioridade.");
      return;
    }

    await addDoc(collection(db, "visitas_tecnicas"), {
      escola,
      municipio,
      prioridade,
      responsavel,
      observacao,
      status: "Pendente",
      data: new Date().toLocaleDateString()
    });

    setEscola("");
    setMunicipio("");
    setPrioridade("");
    setResponsavel("");
    setObservacao("");
    carregarVisitas();
    alert("Visita salva com sucesso!");
  }

  useEffect(() => {
    carregarVisitas();
  }, []);

  const total = visitas.length;
  const alta = visitas.filter(v => v.prioridade?.toLowerCase() === "alta").length;
  const pendentes = visitas.filter(v => v.status === "Pendente").length;

  return (
    <div style={page}>
      <header style={header}>
        <div>
          <div style={logoArea}>
            <div style={radarIcon}>◎</div>
            <div>
              <h1 style={title}>Radar Link MS</h1>
              <p style={subtitle}>Inteligência • Gestão • Articulação Regional</p>
            </div>
          </div>
        </div>

        <div style={badge}>
          Plataforma Estratégica CRE-5
        </div>
      </header>

      <section style={hero}>
        <h2 style={heroTitle}>Painel de Monitoramento Educacional</h2>
        <p style={heroText}>
          Sistema para registrar visitas técnicas, reuniões, demandas escolares e informações estratégicas da rede regional.
        </p>
      </section>

      <section style={cards}>
        <div style={card}>
          <span style={cardLabel}>Visitas cadastradas</span>
          <strong style={cardNumber}>{total}</strong>
        </div>

        <div style={card}>
          <span style={cardLabel}>Prioridade alta</span>
          <strong style={cardNumber}>{alta}</strong>
        </div>

        <div style={card}>
          <span style={cardLabel}>Pendentes</span>
          <strong style={cardNumber}>{pendentes}</strong>
        </div>
      </section>

      <main style={grid}>
        <section style={panel}>
          <h2 style={sectionTitle}>Nova Visita Técnica</h2>

          <input style={input} placeholder="Nome da escola" value={escola} onChange={(e) => setEscola(e.target.value)} />
          <input style={input} placeholder="Município" value={municipio} onChange={(e) => setMunicipio(e.target.value)} />
          <input style={input} placeholder="Prioridade: Alta, Média ou Baixa" value={prioridade} onChange={(e) => setPrioridade(e.target.value)} />
          <input style={input} placeholder="Responsável pela visita" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />

          <textarea
            style={textarea}
            placeholder="Observações estratégicas, demandas, encaminhamentos e próximos passos"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />

          <button style={button} onClick={salvarVisita}>
            Salvar Visita
          </button>
        </section>

        <section style={panel}>
          <h2 style={sectionTitle}>Banco de Visitas</h2>

          {visitas.length === 0 && <p>Nenhuma visita cadastrada ainda.</p>}

          {visitas.map((v) => (
            <div key={v.id} style={visitCard}>
              <div style={visitTop}>
                <h3 style={visitTitle}>{v.escola}</h3>
                <span style={priority(v.prioridade)}>{v.prioridade}</span>
              </div>

              <p><strong>Município:</strong> {v.municipio}</p>
              <p><strong>Status:</strong> {v.status}</p>
              <p><strong>Responsável:</strong> {v.responsavel || "Não informado"}</p>
              <p><strong>Data:</strong> {v.data}</p>
              {v.observacao && <p><strong>Observação:</strong> {v.observacao}</p>}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

const page = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #07111f, #0f172a 55%, #111827)",
  color: "white",
  fontFamily: "Arial, sans-serif",
  padding: 30
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  flexWrap: "wrap"
};

const logoArea = {
  display: "flex",
  alignItems: "center",
  gap: 15
};

const radarIcon = {
  width: 58,
  height: 58,
  borderRadius: "50%",
  background: "linear-gradient(135deg, #2563eb, #facc15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 36,
  fontWeight: "bold"
};

const title = {
  margin: 0,
  fontSize: 34,
  letterSpacing: 1
};

const subtitle = {
  margin: 0,
  color: "#cbd5e1"
};

const badge = {
  background: "#facc15",
  color: "#111827",
  padding: "10px 16px",
  borderRadius: 999,
  fontWeight: "bold"
};

const hero = {
  marginTop: 35,
  padding: 30,
  borderRadius: 18,
  background: "rgba(30, 41, 59, 0.9)",
  border: "1px solid rgba(255,255,255,0.08)"
};

const heroTitle = {
  fontSize: 30,
  margin: 0
};

const heroText = {
  color: "#cbd5e1",
  fontSize: 17,
  maxWidth: 800
};

const cards = {
  display: "flex",
  gap: 20,
  marginTop: 25,
  flexWrap: "wrap"
};

const card = {
  background: "#1e293b",
  borderRadius: 16,
  padding: 22,
  minWidth: 220,
  border: "1px solid rgba(255,255,255,0.08)"
};

const cardLabel = {
  color: "#cbd5e1",
  display: "block"
};

const cardNumber = {
  fontSize: 38,
  marginTop: 8,
  display: "block",
  color: "#facc15"
};

const grid = {
  display: "grid",
  gridTemplateColumns: "minmax(300px, 500px) 1fr",
  gap: 25,
  marginTop: 30
};

const panel = {
  background: "rgba(15, 23, 42, 0.95)",
  padding: 25,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.08)"
};

const sectionTitle = {
  marginTop: 0,
  color: "#facc15"
};

const input = {
  width: "100%",
  padding: 14,
  marginBottom: 12,
  borderRadius: 8,
  border: "1px solid #334155",
  boxSizing: "border-box",
  fontSize: 15
};

const textarea = {
  ...input,
  height: 100,
  resize: "vertical"
};

const button = {
  width: "100%",
  padding: 15,
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  border: "none",
  borderRadius: 10,
  fontSize: 16,
  fontWeight: "bold",
  cursor: "pointer"
};

const visitCard = {
  background: "#1e293b",
  padding: 18,
  borderRadius: 14,
  marginBottom: 15,
  borderLeft: "5px solid #2563eb"
};

const visitTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10
};

const visitTitle = {
  margin: 0,
  color: "white"
};

const priority = (valor) => ({
  padding: "6px 10px",
  borderRadius: 999,
  fontWeight: "bold",
  background:
    valor?.toLowerCase() === "alta"
      ? "#dc2626"
      : valor?.toLowerCase() === "média"
      ? "#facc15"
      : "#22c55e",
  color: valor?.toLowerCase() === "média" ? "#111827" : "white"
});