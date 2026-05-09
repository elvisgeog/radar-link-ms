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

    avaliacaoSedDiretor: "",
    avaliacaoSedAdjunto: "",

    avaliacaoGovernoDiretor: "",
    avaliacaoGovernoAdjunto: "",

    divulgaAcoesDiretor: "",
    divulgaAcoesAdjunto: "",

    interesseAgendaDiretor: "",
    interesseAgendaAdjunto: "",

    potencialMobilizacaoDiretor: "",
    potencialMobilizacaoAdjunto: "",

    classificacaoDiretor: "",
    classificacaoAdjunto: "",

    observacoes: ""
  });

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

    setRegistros(
      dados.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
    );
  }

  async function salvarRegistro() {
    if (!form.municipio || !form.escola) {
      alert("Preencha município e escola.");
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

      avaliacaoSedDiretor: "",
      avaliacaoSedAdjunto: "",

      avaliacaoGovernoDiretor: "",
      avaliacaoGovernoAdjunto: "",

      divulgaAcoesDiretor: "",
      divulgaAcoesAdjunto: "",

      interesseAgendaDiretor: "",
      interesseAgendaAdjunto: "",

      potencialMobilizacaoDiretor: "",
      potencialMobilizacaoAdjunto: "",

      classificacaoDiretor: "",
      classificacaoAdjunto: "",

      observacoes: ""
    });

    carregarRegistros();
  }

  useEffect(() => {
    carregarRegistros();
  }, []);

  const total = registros.length;

  const verde = registros.filter(
    (r) => r.classificacaoDiretor === "VERDE"
  ).length;

  const amarelo = registros.filter(
    (r) => r.classificacaoDiretor === "AMARELO"
  ).length;

  const vermelho = registros.filter(
    (r) => r.classificacaoDiretor === "VERMELHO"
  ).length;

  const altoEngajamento = registros.filter(
    (r) => r.interesseAgendaDiretor === "Alto"
  ).length;

  function barra(label, valor, totalBase) {
    const percentual = totalBase
      ? Math.round((valor / totalBase) * 100)
      : 0;

    return (
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10
          }}
        >
          <span>{label}</span>

          <strong>
            {valor} ({percentual}%)
          </strong>
        </div>

        <div style={styles.barraFundo}>
          <div
            style={{
              ...styles.barraValor,
              width: `${percentual}%`
            }}
          />
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

      <section style={styles.cards}>
        <div style={styles.card}>
          <span>Reuniões</span>
          <strong>{total}</strong>
        </div>

        <div style={styles.card}>
          <span>Verde</span>
          <strong>{verde}</strong>
        </div>

        <div style={styles.card}>
          <span>Amarelo</span>
          <strong>{amarelo}</strong>
        </div>

        <div style={styles.card}>
          <span>Vermelho</span>
          <strong>{vermelho}</strong>
        </div>

        <div style={styles.card}>
          <span>Alto engajamento</span>
          <strong>{altoEngajamento}</strong>
        </div>
      </section>

      <main style={styles.grid}>
        <section style={styles.panel}>
          <h2>Formulário de Reunião com Gestores</h2>

          <input
            style={styles.input}
            placeholder="Município"
            value={form.municipio}
            onChange={(e) =>
              setForm({ ...form, municipio: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Escola"
            value={form.escola}
            onChange={(e) =>
              setForm({ ...form, escola: e.target.value })
            }
          />

          <input
            style={styles.input}
            type="date"
            value={form.data}
            onChange={(e) =>
              setForm({ ...form, data: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Diretor(a)"
            value={form.diretor}
            onChange={(e) =>
              setForm({ ...form, diretor: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Diretor(a) Adjunto(a)"
            value={form.adjunto}
            onChange={(e) =>
              setForm({ ...form, adjunto: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Participantes da equipe"
            value={form.participantes}
            onChange={(e) =>
              setForm({ ...form, participantes: e.target.value })
            }
          />

          <h3>1. Demandas da Escola</h3>

          {demandasOpcoes.map((opcao) => (
            <label style={styles.check} key={opcao}>
              <input
                type="checkbox"
                checked={form.demandas.includes(opcao)}
                onChange={() =>
                  alternarCheckbox("demandas", opcao)
                }
              />

              {" "}{opcao}
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
                onChange={() =>
                  alternarCheckbox(
                    "administrativas",
                    opcao
                  )
                }
              />

              {" "}{opcao}
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

          <h4>Diretor(a)</h4>

          <textarea
            style={styles.textarea}
            placeholder="Como o diretor avalia a atuação da SED?"
            value={form.avaliacaoSedDiretor}
            onChange={(e) =>
              setForm({
                ...form,
                avaliacaoSedDiretor: e.target.value
              })
            }
          />

          <textarea
            style={styles.textarea}
            placeholder="Como o diretor avalia as ações do Governo?"
            value={form.avaliacaoGovernoDiretor}
            onChange={(e) =>
              setForm({
                ...form,
                avaliacaoGovernoDiretor: e.target.value
              })
            }
          />

          <select
            style={styles.input}
            value={form.divulgaAcoesDiretor}
            onChange={(e) =>
              setForm({
                ...form,
                divulgaAcoesDiretor: e.target.value
              })
            }
          >
            <option value="">
              Diretor divulga ações institucionais?
            </option>

            <option>Sim</option>
            <option>Parcialmente</option>
            <option>Não</option>
          </select>

          <h4>Diretor(a) Adjunto(a)</h4>

          <textarea
            style={styles.textarea}
            placeholder="Como o adjunto avalia a atuação da SED?"
            value={form.avaliacaoSedAdjunto}
            onChange={(e) =>
              setForm({
                ...form,
                avaliacaoSedAdjunto: e.target.value
              })
            }
          />

          <textarea
            style={styles.textarea}
            placeholder="Como o adjunto avalia as ações do Governo?"
            value={form.avaliacaoGovernoAdjunto}
            onChange={(e) =>
              setForm({
                ...form,
                avaliacaoGovernoAdjunto: e.target.value
              })
            }
          />

          <select
            style={styles.input}
            value={form.divulgaAcoesAdjunto}
            onChange={(e) =>
              setForm({
                ...form,
                divulgaAcoesAdjunto: e.target.value
              })
            }
          >
            <option value="">
              Adjunto divulga ações institucionais?
            </option>

            <option>Sim</option>
            <option>Parcialmente</option>
            <option>Não</option>
          </select>

          <h3>4. Engajamento</h3>

          <h4>Diretor(a)</h4>

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
              Interesse em agendas institucionais
            </option>

            <option>Alto</option>
            <option>Médio</option>
            <option>Baixo</option>
          </select>

          <select
            style={styles.input}
            value={form.potencialMobilizacaoDiretor}
            onChange={(e) =>
              setForm({
                ...form,
                potencialMobilizacaoDiretor:
                  e.target.value
              })
            }
          >
            <option value="">
              Potencial de mobilização
            </option>

            <option>Alto</option>
            <option>Médio</option>
            <option>Baixo</option>
          </select>

          <h4>Diretor(a) Adjunto(a)</h4>

          <select
            style={styles.input}
            value={form.interesseAgendaAdjunto}
            onChange={(e) =>
              setForm({
                ...form,
                interesseAgendaAdjunto:
                  e.target.value
              })
            }
          >
            <option value="">
              Interesse em agendas institucionais
            </option>

            <option>Alto</option>
            <option>Médio</option>
            <option>Baixo</option>
          </select>

          <select
            style={styles.input}
            value={form.potencialMobilizacaoAdjunto}
            onChange={(e) =>
              setForm({
                ...form,
                potencialMobilizacaoAdjunto:
                  e.target.value
              })
            }
          >
            <option value="">
              Potencial de mobilização
            </option>

            <option>Alto</option>
            <option>Médio</option>
            <option>Baixo</option>
          </select>

          <h3>5. Classificação Interna</h3>

          <h4>Diretor(a)</h4>

          <select
            style={styles.input}
            value={form.classificacaoDiretor}
            onChange={(e) =>
              setForm({
                ...form,
                classificacaoDiretor:
                  e.target.value
              })
            }
          >
            <option value="">
              Classificação diretor
            </option>

            <option>VERDE</option>
            <option>AMARELO</option>
            <option>VERMELHO</option>
          </select>

          <h4>Diretor(a) Adjunto(a)</h4>

          <select
            style={styles.input}
            value={form.classificacaoAdjunto}
            onChange={(e) =>
              setForm({
                ...form,
                classificacaoAdjunto:
                  e.target.value
              })
            }
          >
            <option value="">
              Classificação adjunto
            </option>

            <option>VERDE</option>
            <option>AMARELO</option>
            <option>VERMELHO</option>
          </select>

          <h3>6. Observações Estratégicas</h3>

          <textarea
            style={styles.textarea}
            placeholder="Observações estratégicas"
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
            Salvar Reunião
          </button>
        </section>

        <section style={styles.panel}>
          <h2>Gráficos e Indicadores</h2>

          {barra("Verde", verde, total)}
          {barra("Amarelo", amarelo, total)}
          {barra("Vermelho", vermelho, total)}
          {barra(
            "Alto engajamento",
            altoEngajamento,
            total
          )}

          <h2 style={{ marginTop: 30 }}>
            Registros Salvos
          </h2>

          {registros.map((r) => (
            <div
              key={r.id}
              style={styles.registro}
            >
              <h3>{r.escola}</h3>

              <p>
                <strong>Município:</strong>{" "}
                {r.municipio}
              </p>

              <p>
                <strong>Diretor:</strong>{" "}
                {r.diretor}
              </p>

              <p>
                <strong>Adjunto:</strong>{" "}
                {r.adjunto}
              </p>

              <p>
                <strong>Classificação Diretor:</strong>{" "}
                {r.classificacaoDiretor}
              </p>

              <p>
                <strong>Classificação Adjunto:</strong>{" "}
                {r.classificacaoAdjunto}
              </p>

              <p>
                <strong>Engajamento Diretor:</strong>{" "}
                {r.interesseAgendaDiretor}
              </p>

              <p>
                <strong>Demandas:</strong>{" "}
                {r.demandas?.join(", ")}
              </p>
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
    fontFamily: "Arial, sans-serif",
    padding: 15,
    boxSizing: "border-box"
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 25,
    flexWrap: "wrap"
  },

  logo: {
    width: 54,
    height: 54,
    borderRadius: "50%",
    background:
      "linear-gradient(135deg,#2563eb,#facc15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 34,
    flexShrink: 0
  },

  title: {
    margin: 0,
    fontSize: "clamp(26px, 6vw, 38px)"
  },

  subtitle: {
    margin: 0,
    color: "#cbd5e1",
    fontSize: "clamp(13px, 3.5vw, 16px)"
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 12,
    marginBottom: 25
  },

  card: {
    background: "#1e293b",
    padding: 18,
    borderRadius: 14,
    minWidth: 0
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 20
  },

  panel: {
    background: "rgba(15,23,42,.95)",
    padding: 18,
    borderRadius: 18,
    overflow: "hidden"
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
    marginBottom: 9,
    fontSize: 15
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
    fontSize: 16
  },

  barraFundo: {
    height: 12,
    background: "#334155",
    borderRadius: 999,
    marginTop: 5
  },

  barraValor: {
    height: 12,
    background: "#facc15",
    borderRadius: 999
  },

  registro: {
    background: "#1e293b",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    overflowWrap: "break-word"
  }
};