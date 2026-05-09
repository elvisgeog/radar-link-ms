import React, { useEffect, useState } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export default function App() {
  const [registros, setRegistros] = useState([]);

  const [form, setForm] = useState({
    municipio: "",
    escola: "",
    data: "",
    diretor: "",
    adjunto: "",
    participantes: "",
    demandas: [],
    descricaoDemandas: "",
    administrativas: [],
    descricaoAdministrativas: "",
    avaliacaoSed: "",
    avaliacaoGoverno: "",
    divulgaAcoes: "",
    interesseAgenda: "",
    potencialMobilizacao: "",
    classificacao: "",
    observacoes: ""
  });

  const demandasOpcoes = ["Reforma", "Pintura", "Climatização", "Rede elétrica", "Mobiliário", "Tecnologia", "Segurança", "Transporte", "Outros"];
  const administrativasOpcoes = ["Déficit de servidores", "Problemas organizacionais", "Dificuldades pedagógicas", "Necessidade de apoio da CRE", "Outros"];

  function alternarCheckbox(campo, valor) {
    setForm((atual) => {
      const lista = atual[campo];
      return {
        ...atual,
        [campo]: lista.includes(valor)
          ? lista.filter((item) => item !== valor)
          : [...lista, valor]
      };
    });
  }

  async function carregarRegistros() {
    const dados = await getDocs(collection(db, "reunioes_gestores"));
    setRegistros(dados.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  }

  async function salvarRegistro() {
    if (!form.municipio || !form.escola || !form.classificacao) {
      alert("Preencha município, escola e classificação interna.");
      return;
    }

    await addDoc(collection(db, "reunioes_gestores"), {
      ...form,
      criadoEm: new Date().toLocaleString()
    });

    alert("Reunião salva com sucesso!");

    setForm({
      municipio: "",
      escola: "",
      data: "",
      diretor: "",
      adjunto: "",
      participantes: "",
      demandas: [],
      descricaoDemandas: "",
      administrativas: [],
      descricaoAdministrativas: "",
      avaliacaoSed: "",
      avaliacaoGoverno: "",
      divulgaAcoes: "",
      interesseAgenda: "",
      potencialMobilizacao: "",
      classificacao: "",
      observacoes: ""
    });

    carregarRegistros();
  }

  useEffect(() => {
    carregarRegistros();
  }, []);

  const total = registros.length;
  const verde = registros.filter(r => r.classificacao === "VERDE").length;
  const amarelo = registros.filter(r => r.classificacao === "AMARELO").length;
  const vermelho = registros.filter(r => r.classificacao === "VERMELHO").length;
  const altoEngajamento = registros.filter(r => r.interesseAgenda === "Alto").length;

  function barra(label, valor, totalBase) {
    const percentual = totalBase ? Math.round((valor / totalBase) * 100) : 0;
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{label}</span>
          <strong>{valor} ({percentual}%)</strong>
        </div>
        <div style={styles.barraFundo}>
          <div style={{ ...styles.barraValor, width: `${percentual}%` }} />
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
          <p style={styles.subtitle}>Inteligência • Gestão • Articulação Regional</p>
        </div>
      </header>

      <section style={styles.cards}>
        <div style={styles.card}><span>Reuniões registradas</span><strong>{total}</strong></div>
        <div style={styles.card}><span>Classificação verde</span><strong>{verde}</strong></div>
        <div style={styles.card}><span>Classificação amarela</span><strong>{amarelo}</strong></div>
        <div style={styles.card}><span>Classificação vermelha</span><strong>{vermelho}</strong></div>
        <div style={styles.card}><span>Alto engajamento</span><strong>{altoEngajamento}</strong></div>
      </section>

      <main style={styles.grid}>
        <section style={styles.panel}>
          <h2>Formulário de Reunião com Gestores</h2>

          <input style={styles.input} placeholder="Município" value={form.municipio} onChange={e => setForm({...form, municipio: e.target.value})} />
          <input style={styles.input} placeholder="Escola" value={form.escola} onChange={e => setForm({...form, escola: e.target.value})} />
          <input style={styles.input} type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})} />
          <input style={styles.input} placeholder="Diretor(a)" value={form.diretor} onChange={e => setForm({...form, diretor: e.target.value})} />
          <input style={styles.input} placeholder="Diretor(a) Adjunto(a)" value={form.adjunto} onChange={e => setForm({...form, adjunto: e.target.value})} />
          <input style={styles.input} placeholder="Participantes da equipe" value={form.participantes} onChange={e => setForm({...form, participantes: e.target.value})} />

          <h3>Demandas da Escola</h3>
          {demandasOpcoes.map(opcao => (
            <label style={styles.check} key={opcao}>
              <input type="checkbox" checked={form.demandas.includes(opcao)} onChange={() => alternarCheckbox("demandas", opcao)} />
              {opcao}
            </label>
          ))}
          <textarea style={styles.textarea} placeholder="Descrição das demandas" value={form.descricaoDemandas} onChange={e => setForm({...form, descricaoDemandas: e.target.value})} />

          <h3>Questões Administrativas</h3>
          {administrativasOpcoes.map(opcao => (
            <label style={styles.check} key={opcao}>
              <input type="checkbox" checked={form.administrativas.includes(opcao)} onChange={() => alternarCheckbox("administrativas", opcao)} />
              {opcao}
            </label>
          ))}
          <textarea style={styles.textarea} placeholder="Descrição das questões administrativas" value={form.descricaoAdministrativas} onChange={e => setForm({...form, descricaoAdministrativas: e.target.value})} />

          <h3>Percepção Institucional</h3>
          <textarea style={styles.textarea} placeholder="Como o gestor avalia a atuação da SED?" value={form.avaliacaoSed} onChange={e => setForm({...form, avaliacaoSed: e.target.value})} />
          <textarea style={styles.textarea} placeholder="Como avalia as ações do Governo do Estado na educação?" value={form.avaliacaoGoverno} onChange={e => setForm({...form, avaliacaoGoverno: e.target.value})} />

          <select style={styles.input} value={form.divulgaAcoes} onChange={e => setForm({...form, divulgaAcoes: e.target.value})}>
            <option value="">Participa/divulga ações institucionais?</option>
            <option>Sim</option>
            <option>Parcialmente</option>
            <option>Não</option>
          </select>

          <select style={styles.input} value={form.interesseAgenda} onChange={e => setForm({...form, interesseAgenda: e.target.value})}>
            <option value="">Interesse em agendas institucionais</option>
            <option>Alto</option>
            <option>Médio</option>
            <option>Baixo</option>
          </select>

          <select style={styles.input} value={form.potencialMobilizacao} onChange={e => setForm({...form, potencialMobilizacao: e.target.value})}>
            <option value="">Potencial de mobilização</option>
            <option>Alto</option>
            <option>Médio</option>
            <option>Baixo</option>
          </select>

          <select style={styles.input} value={form.classificacao} onChange={e => setForm({...form, classificacao: e.target.value})}>
            <option value="">Classificação interna</option>
            <option>VERDE</option>
            <option>AMARELO</option>
            <option>VERMELHO</option>
          </select>

          <textarea style={styles.textarea} placeholder="Observações estratégicas" value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} />

          <button style={styles.button} onClick={salvarRegistro}>Salvar Reunião</button>
        </section>

        <section style={styles.panel}>
          <h2>Gráficos e Indicadores</h2>

          {barra("Verde", verde, total)}
          {barra("Amarelo", amarelo, total)}
          {barra("Vermelho", vermelho, total)}
          {barra("Alto engajamento", altoEngajamento, total)}

          <h2 style={{ marginTop: 30 }}>Registros Salvos</h2>

          {registros.map(r => (
            <div key={r.id} style={styles.registro}>
              <h3>{r.escola}</h3>
              <p><strong>Município:</strong> {r.municipio}</p>
              <p><strong>Diretor:</strong> {r.diretor}</p>
              <p><strong>Classificação:</strong> {r.classificacao}</p>
              <p><strong>Engajamento:</strong> {r.interesseAgenda}</p>
              <p><strong>Demandas:</strong> {r.demandas?.join(", ")}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#07111f,#0f172a,#111827)", color: "white", fontFamily: "Arial", padding: 30 },
  header: { display: "flex", alignItems: "center", gap: 16, marginBottom: 25 },
  logo: { width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#facc15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38 },
  title: { margin: 0, fontSize: 36 },
  subtitle: { margin: 0, color: "#cbd5e1" },
  cards: { display: "flex", gap: 15, flexWrap: "wrap", marginBottom: 25 },
  card: { background: "#1e293b", padding: 20, borderRadius: 14, minWidth: 180 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 25 },
  panel: { background: "rgba(15,23,42,.95)", padding: 25, borderRadius: 18 },
  input: { width: "100%", padding: 13, marginBottom: 10, borderRadius: 8, border: "none", boxSizing: "border-box" },
  textarea: { width: "100%", padding: 13, marginBottom: 10, borderRadius: 8, border: "none", minHeight: 90, boxSizing: "border-box" },
  check: { display: "block", marginBottom: 8 },
  button: { width: "100%", padding: 15, background: "#2563eb", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", cursor: "pointer" },
  barraFundo: { height: 12, background: "#334155", borderRadius: 999, marginTop: 5 },
  barraValor: { height: 12, background: "#facc15", borderRadius: 999 },
  registro: { background: "#1e293b", padding: 15, borderRadius: 12, marginBottom: 12 }
};