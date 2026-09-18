import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

const CARGOS = {
  3: "Governador",
  5: "Senador",
  6: "Deputado Federal",
  7: "Deputado Estadual",
};

function numero(v) {
  return Number(v || 0).toLocaleString("pt-BR");
}

function percentual(v) {
  const n = Number(v || 0);
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function situacao(andamento) {
  if (andamento === "f") return "Finalizada";
  if (andamento === "p") return "Em andamento";
  return "Não iniciada";
}

export default function ResultadosTSE2026({ onVoltar }) {
  const [dados, setDados] = useState([]);
  const [erro, setErro] = useState("");
  const [municipio, setMunicipio] = useState("GERAL");
  const [cargo, setCargo] = useState("3");

  useEffect(() => {
    const cancelar = onSnapshot(
      collection(db, "resultados_tse_2026"),
      (snapshot) => {
        setDados(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setErro("");
      },
      (e) => setErro(e.message || "Falha ao ler resultados no Firestore.")
    );
    return () => cancelar();
  }, []);

  const municipios = useMemo(
    () => [...new Set(dados.map((d) => d.municipio).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [dados]
  );

  const filtrados = useMemo(() => {
    return dados
      .filter((d) => String(d.cargoCodigo) === String(cargo))
      .filter((d) => municipio === "GERAL" || d.municipio === municipio)
      .sort((a, b) => String(a.municipio).localeCompare(String(b.municipio), "pt-BR"));
  }, [dados, cargo, municipio]);

  const resumo = useMemo(() => filtrados.reduce((acc, d) => {
    acc.secoesTotal += Number(d.secoesTotal || 0);
    acc.secoesTotalizadas += Number(d.secoesTotalizadas || 0);
    acc.eleitores += Number(d.eleitores || 0);
    acc.comparecimento += Number(d.comparecimento || 0);
    acc.abstencao += Number(d.abstencao || 0);
    acc.votosValidos += Number(d.votosValidos || 0);
    acc.brancos += Number(d.brancos || 0);
    acc.nulos += Number(d.nulos || 0);
    return acc;
  }, {
    secoesTotal: 0,
    secoesTotalizadas: 0,
    eleitores: 0,
    comparecimento: 0,
    abstencao: 0,
    votosValidos: 0,
    brancos: 0,
    nulos: 0,
  }), [filtrados]);

  const pctSecoes = resumo.secoesTotal
    ? (resumo.secoesTotalizadas / resumo.secoesTotal) * 100
    : 0;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={{ margin: 0 }}>🗳️ Resultados Eleitorais 2026</h1>
          <p style={s.sub}>Dados oficiais do TSE sincronizados pelo servidor do Radar Link MS.</p>
        </div>
      </div>

      <button style={s.button} onClick={onVoltar}>Voltar ao painel principal</button>

      <section style={s.panel}>
        <div style={s.filtros}>
          <select style={s.input} value={cargo} onChange={(e) => setCargo(e.target.value)}>
            {Object.entries(CARGOS).map(([codigo, nome]) => (
              <option key={codigo} value={codigo}>{nome}</option>
            ))}
          </select>

          <select style={s.input} value={municipio} onChange={(e) => setMunicipio(e.target.value)}>
            <option value="GERAL">Todos os municípios CRE-5</option>
            {municipios.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>

        {erro && <div style={s.erro}>{erro}</div>}

        <div style={s.cards}>
          <Card titulo="Seções totalizadas" valor={`${numero(resumo.secoesTotalizadas)} / ${numero(resumo.secoesTotal)}`} />
          <Card titulo="% de seções" valor={percentual(pctSecoes)} />
          <Card titulo="Eleitores" valor={numero(resumo.eleitores)} />
          <Card titulo="Comparecimento" valor={numero(resumo.comparecimento)} />
          <Card titulo="Abstenção" valor={numero(resumo.abstencao)} />
          <Card titulo="Votos válidos" valor={numero(resumo.votosValidos)} />
          <Card titulo="Brancos" valor={numero(resumo.brancos)} />
          <Card titulo="Nulos" valor={numero(resumo.nulos)} />
        </div>
      </section>

      {filtrados.length === 0 && (
        <section style={s.panel}><p>Nenhum resultado sincronizado ainda para este filtro.</p></section>
      )}

      {filtrados.map((d) => (
        <section key={d.id} style={s.panel}>
          <div style={s.municipioTopo}>
            <div>
              <h2 style={{ margin: 0 }}>{d.municipio}</h2>
              <div style={s.meta}>
                {CARGOS[d.cargoCodigo] || d.cargoNome || `Cargo ${d.cargoCodigo}`} · TSE: {situacao(d.andamento)}
              </div>
            </div>
            <div style={s.selo}>{d.fase === "o" ? "OFICIAL" : "SIMULADO"}</div>
          </div>

          <div style={s.resumoLinha}>
            <span><strong>Seções:</strong> {numero(d.secoesTotalizadas)} / {numero(d.secoesTotal)}</span>
            <span><strong>Válidos:</strong> {numero(d.votosValidos)}</span>
            <span><strong>Brancos:</strong> {numero(d.brancos)}</span>
            <span><strong>Nulos:</strong> {numero(d.nulos)}</span>
          </div>

          <div style={s.tabelaWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Número</th>
                  <th style={s.th}>Candidatura</th>
                  <th style={s.th}>Partido</th>
                  <th style={s.thDireita}>Votos</th>
                  <th style={s.thDireita}>% TSE</th>
                  <th style={s.th}>Situação</th>
                </tr>
              </thead>
              <tbody>
                {(d.candidatos || []).slice()
                  .sort((a, b) => Number(a.numero || 0) - Number(b.numero || 0))
                  .map((c) => (
                    <tr key={`${d.id}-${c.sequencial || c.numero}-${c.partido}`}>
                      <td style={s.td}>{c.numero}</td>
                      <td style={s.td}>{c.nomeUrna || c.nome}</td>
                      <td style={s.td}>{c.partido}</td>
                      <td style={s.tdDireita}>{numero(c.votos)}</td>
                      <td style={s.tdDireita}>{percentual(c.percentual)}</td>
                      <td style={s.td}>{c.situacao || "-"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div style={s.rodape}>
            Gerado pelo TSE: {d.dataGeracao || "-"} {d.horaGeracao || ""} · Sincronizado no Radar: {d.sincronizadoEmTexto || "-"} · ID geração TSE: {d.idGeracao ?? "-"}
          </div>
        </section>
      ))}
    </div>
  );
}

function Card({ titulo, valor }) {
  return <div style={s.card}><div style={s.cardTitulo}>{titulo}</div><div style={s.cardValor}>{valor}</div></div>;
}

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#07111f,#0f172a,#111827)", color: "white", fontFamily: "Arial", padding: 15 },
  header: { marginBottom: 15 },
  sub: { color: "#cbd5e1", marginTop: 6 },
  panel: { background: "rgba(15,23,42,.96)", padding: 18, borderRadius: 18, marginBottom: 16 },
  filtros: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10 },
  input: { width: "100%", padding: 12, borderRadius: 8, border: "none", boxSizing: "border-box", fontSize: 16 },
  button: { width: "100%", padding: 14, background: "#2563eb", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", marginBottom: 10 },
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginTop: 12 },
  card: { background: "#1e293b", padding: 14, borderRadius: 12 },
  cardTitulo: { color: "#cbd5e1", fontSize: 13 },
  cardValor: { fontSize: 24, fontWeight: 900, marginTop: 5 },
  municipioTopo: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" },
  meta: { color: "#cbd5e1", marginTop: 4 },
  selo: { background: "#1d4ed8", padding: "7px 11px", borderRadius: 999, fontWeight: 900, fontSize: 12 },
  resumoLinha: { display: "flex", flexWrap: "wrap", gap: 18, padding: "14px 0", color: "#e2e8f0" },
  tabelaWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", background: "#0f172a" },
  th: { textAlign: "left", padding: 10, borderBottom: "1px solid #334155", color: "#cbd5e1", whiteSpace: "nowrap" },
  thDireita: { textAlign: "right", padding: 10, borderBottom: "1px solid #334155", color: "#cbd5e1", whiteSpace: "nowrap" },
  td: { padding: 10, borderBottom: "1px solid #1e293b", whiteSpace: "nowrap" },
  tdDireita: { padding: 10, borderBottom: "1px solid #1e293b", textAlign: "right", whiteSpace: "nowrap" },
  rodape: { marginTop: 12, color: "#94a3b8", fontSize: 12 },
  erro: { background: "#7f1d1d", border: "1px solid #ef4444", padding: 12, borderRadius: 10, marginTop: 12 },
};
