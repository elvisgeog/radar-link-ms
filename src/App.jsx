export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial"
      }}
    >
      <h1 style={{ fontSize: "48px", marginBottom: "10px" }}>
        Radar Link MS
      </h1>

      <p style={{ fontSize: "20px", opacity: 0.8 }}>
        Inteligência • Gestão • Articulação
      </p>

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          background: "#1e293b",
          borderRadius: "12px",
          width: "320px",
          textAlign: "center"
        }}
      >
        <h2>Painel Inicial</h2>

        <p>✅ Visitas Técnicas</p>
        <p>✅ Reuniões</p>
        <p>✅ Demandas Escolares</p>
        <p>✅ Gestão Estratégica</p>
      </div>
    </div>
  );
}
