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
  const [formAberto, setFormAberto] = useState(null);
  const [municipioIndicador, setMunicipioIndicador] = useState("GERAL");

  const [form, setForm] = useState({
    municipio: "",
    escola: "",
    data: "",
    diretor: "",
    adjunto: "",
    demandas: [],
    descricaoDemandas: "",
    administrativas: [],
    descricaoAdministrativas: "",
    avaliacaoSedDiretor: "",
    avaliacaoSedAdjunto: "",
    avaliacaoGovernoDiretor: "",
    avaliacaoGovernoAdjunto: "",
    interesseAgendaDiretor: "",
    interesseAgendaAdjunto: "",
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
      dados.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data()
      }))
    );
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

    alert("Reunião salva com sucesso!");

    setForm({
      municipio: "",
      escola: "",
      data: "",
      diretor: "",
      adjunto: "",
      demandas: [],
      descricaoDemandas: "",
      administrativas: [],
      descricaoAdministrativas: "",
      avaliacaoSedDiretor: "",
      avaliacaoSedAdjunto: "",
      avaliacaoGovernoDiretor: "",
      avaliacaoGovernoAdjunto: "",
      interesseAgendaDiretor: "",
      interesseAgendaAdjunto: "",
      classificacaoDiretor: "",
      classificacaoAdjunto: "",
      observacoes: ""
    });

    carregarRegistros();
  }

  async function excluirRegistro(id) {
    const confirmar = window.confirm("Deseja realmente excluir este formulário?");
    if (!confirmar) return;

    await deleteDoc(doc(db, "reunioes_gestores", id));
    alert("Registro excluído com sucesso!");

    setFormAberto(null);
    carregarRegistros();
  }

  function registrosBase() {
    if (municipioIndicador === "GERAL") return registros;
    return registros.filter((r) => r.municipio === municipioIndicador);
  }

  const baseIndicadores = registrosBase();

  function contarClassificacao(tipo) {
    return baseIndicadores.reduce((total, r) => {
      let soma = 0;
      if (r.classificacaoDiretor === tipo) soma++;
      if (r.classificacaoAdjunto === tipo) soma++;
      return total + soma;
    }, 0);
  }

  function contarEngajamento(tipo) {
    return baseIndicadores.reduce((total, r) => {
      let soma = 0;
      if (r.interesseAgendaDiretor === tipo) soma++;
      if (r.interesseAgendaAdjunto === tipo) soma++;
      return total + soma;
    }, 0);
  }

  const totalGestores = baseIndicadores.length * 2;

  const verde = contarClassificacao("VERDE");
  const amarelo = contarClassificacao("AMARELO");
  const vermelho = contarClassificacao("VERMELHO");

  const altoEngajamento = contarEngajamento("Alto");
  const medioEngajamento = contarEngajamento("Médio");
  const baixoEngajamento = contarEngajamento("Baixo");

  function corIndicador(label) {
    if (label === "VERDE" || label === "Alto") return "#22c55e";
    if (label === "AMARELO" || label === "Médio") return "#eab308";
    if (label === "VERMELHO" || label === "Baixo") return "#ef4444";
    return "#facc15";
  }

  function gerarPDF() {
    window.print();
  }

  function listaFiltrada() {
    if (!filtroAtivo) return [];

    const lista = [];

    baseIndicadores.forEach((r) => {
      if (["VERDE", "AMARELO", "VERMELHO"].includes(filtroAtivo)) {
        if (r.classificacaoDiretor === filtroAtivo) {
          lista.push({
            id: r.id + "-diretor",
            cargo: "Diretor(a)",
            nome: r.diretor || "Não informado",
            escola: r.escola,
            municipio: r.municipio,
            classificacao: r.classificacaoDiretor,
            engajamento: r.interesseAgendaDiretor
          });
        }

        if (r.classificacaoAdjunto === filtroAtivo) {
          lista.push({
            id: r.id + "-adjunto",
            cargo: "Diretor(a) Adjunto(a)",
            nome: r.adjunto || "Não informado",
            escola: r.escola,
            municipio: r.municipio,
            classificacao: r.classificacaoAdjunto,
            engajamento: r.interesseAgendaAdjunto
          });
        }
      } else {
        if (r.interesseAgendaDiretor === filtroAtivo) {
          lista.push({
            id: r.id + "-diretor",
            cargo: "Diretor(a)",
            nome: r.diretor || "Não informado",
            escola: r.escola,
            municipio: r.municipio,
            classificacao: r.classificacaoDiretor,
            engajamento: r.interesseAgendaDiretor
          });
        }

        if (r.interesseAgendaAdjunto === filtroAtivo) {
          lista.push({
            id: r.id + "-adjunto",
            cargo: "Diretor(a) Adjunto(a)",
            nome: r.adjunto || "Não informado",
            escola: r.escola,
            municipio: r.municipio,
            classificacao: r.classificacaoAdjunto,
            engajamento: r.interesseAgendaAdjunto
          });
        }
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

  function abrirFormulario(r) {
    setFormAberto(r);
  }

  if (formAberto) {
    return (
      <div style={styles.relatorioPage}>
        <h1>Radar Link MS</h1>
        <h2>Formulário salvo</h2>

        <button style={styles.buttonRelatorio} onClick={() => setFormAberto(null)}>
          Voltar
        </button>

        <button style={styles.buttonRelatorio} onClick={gerarPDF}>
          Gerar PDF / Imprimir
        </button>

        <section style={styles.relatorioBox}>
          <h2>Dados da reunião</h2>
          <p><strong>Município:</strong> {formAberto.municipio}</p>
          <p><strong>Escola:</strong> {formAberto.escola}</p>
          <p><strong>Data:</strong> {formAberto.data || "Não informada"}</p>
          <p><strong>Diretor(a):</strong> {formAberto.diretor || "Não informado"}</p>
          <p><strong>Diretor(a) Adjunto(a):</strong> {formAberto.adjunto || "Não informado"}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>Demandas da escola</h2>
          <p><strong>Marcadas:</strong> {formAberto.demandas?.join(", ") || "Nenhuma"}</p>
          <p><strong>Descrição:</strong> {formAberto.descricaoDemandas || "Sem descrição"}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>Questões administrativas</h2>
          <p><strong>Marcadas:</strong> {formAberto.administrativas?.join(", ") || "Nenhuma"}</p>
          <p><strong>Descrição:</strong> {formAberto.descricaoAdministrativas || "Sem descrição"}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>Percepção institucional</h2>
          <p><strong>SED - Diretor:</strong> {formAberto.avaliacaoSedDiretor || "Não informado"}</p>
          <p><strong>SED - Adjunto:</strong> {formAberto.avaliacaoSedAdjunto || "Não informado"}</p>
          <p><strong>Governo - Diretor:</strong> {formAberto.avaliacaoGovernoDiretor || "Não informado"}</p>
          <p><strong>Governo - Adjunto:</strong> {formAberto.avaliacaoGovernoAdjunto || "Não informado"}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>Engajamento e classificação</h2>
          <p><strong>Engajamento Diretor:</strong> {formAberto.interesseAgendaDiretor || "Não informado"}</p>
          <p><strong>Engajamento Adjunto:</strong> {formAberto.interesseAgendaAdjunto || "Não informado"}</p>
          <p><strong>Classificação Diretor:</strong> {formAberto.classificacaoDiretor || "Não informado"}</p>
          <p><strong>Classificação Adjunto:</strong> {formAberto.classificacaoAdjunto || "Não informado"}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>Observações estratégicas</h2>
          <p>{formAberto.observacoes || "Sem observações"}</p>
        </section>

        <button style={styles.buttonExcluir} onClick={() => excluirRegistro(formAberto.id)}>
          Excluir este formulário
        </button>
      </div>
    );
  }

  if (modoRelatorio) {
    const dataGeracao = new Date().toLocaleString();

    return (
      <div style={styles.relatorioPage}>
        <div style={styles.relatorioTopo}>
          <h1>Radar Link MS</h1>
          <h2>Relatório Estratégico de Gestores</h2>
          <p>Filtro: {municipioIndicador === "GERAL" ? "Geral" : municipioIndicador}</p>
          <p>Data de geração: {dataGeracao}</p>

          <button style={styles.buttonRelatorio} onClick={() => setModoRelatorio(false)}>
            Voltar ao painel
          </button>

          <button style={styles.buttonRelatorio} onClick={gerarPDF}>
            Gerar PDF / Imprimir
          </button>
        </div>

        <section style={styles.relatorioBox}>
          <h2>1. Totais por Classificação</h2>
          <p><strong>Verde:</strong> {verde}</p>
          <p><strong>Amarelo:</strong> {amarelo}</p>
          <p><strong>Vermelho:</strong> {vermelho}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>2. Totais por Engajamento</h2>
          <p><strong>Alto:</strong> {altoEngajamento}</p>
          <p><strong>Médio:</strong> {medioEngajamento}</p>
          <p><strong>Baixo:</strong> {baixoEngajamento}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>3. Lista de Diretores</h2>

          {baseIndicadores.map((r) => (
            <div key={r.id + "-diretor"} style={styles.relatorioItem}>
              <p><strong>Nome:</strong> {r.diretor || "Não informado"}</p>
              <p><strong>Município:</strong> {r.municipio}</p>
              <p><strong>Escola:</strong> {r.escola}</p>
              <p><strong>Classificação:</strong> {r.classificacaoDiretor || "Não informado"}</p>
              <p><strong>Engajamento:</strong> {r.interesseAgendaDiretor || "Não informado"}</p>
              <p><strong>Observações:</strong> {r.observacoes || "Sem observações"}</p>
            </div>
          ))}
        </section>

        <section style={styles.relatorioBox}>
          <h2>4. Lista de Diretores Adjuntos</h2>

          {baseIndicadores.map((r) => (
            <div key={r.id + "-adjunto"} style={styles.relatorioItem}>
              <p><strong>Nome:</strong> {r.adjunto || "Não informado"}</p>
              <p><strong>Município:</strong> {r.municipio}</p>
              <p><strong>Escola:</strong> {r.escola}</p>
              <p><strong>Classificação:</strong> {r.classificacaoAdjunto || "Não informado"}</p>
              <p><strong>Engajamento:</strong> {r.interesseAgendaAdjunto || "Não informado"}</p>
              <p><strong>Observações:</strong> {r.observacoes || "Sem observações"}</p>
            </div>
          ))}
        </section>
      </div>
    );
  }

  if (filtroAtivo) {
    const lista = listaFiltrada();
    const cor = corIndicador(filtroAtivo);

    return (
      <div style={styles.page}>
        <button style={styles.button} onClick={() => setFiltroAtivo(null)}>
          Voltar ao painel
        </button>

        <h1 style={{ ...styles.title, color: cor }}>Lista: {filtroAtivo}</h1>

        {lista.length === 0 && <p>Nenhum registro encontrado.</p>}

        {lista.map((r) => (
          <div key={r.id} style={{ ...styles.registro, borderLeft: `6px solid ${cor}` }}>
            <h2>{r.nome}</h2>
            <p><strong>Cargo:</strong> {r.cargo}</p>
            <p><strong>Município:</strong> {r.municipio}</p>
            <p><strong>Escola:</strong> {r.escola}</p>
            <p><strong>Classificação:</strong> {r.classificacao || "Não informado"}</p>
            <p><strong>Engajamento:</strong> {r.engajamento || "Não informado"}</p>
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
        Abrir Relatório / Gerar PDF
      </button>

      <section style={styles.cards}>
        <div style={{ ...styles.card, color: "#22c55e" }} onClick={() => setFiltroAtivo("VERDE")}>
          <span>Verde</span>
          <strong>{verde}</strong>
        </div>

        <div style={{ ...styles.card, color: "#eab308" }} onClick={() => setFiltroAtivo("AMARELO")}>
          <span>Amarelo</span>
          <strong>{amarelo}</strong>
        </div>

        <div style={{ ...styles.card, color: "#ef4444" }} onClick={() => setFiltroAtivo("VERMELHO")}>
          <span>Vermelho</span>
          <strong>{vermelho}</strong>
        </div>

        <div style={{ ...styles.card, color: "#22c55e" }} onClick={() => setFiltroAtivo("Alto")}>
          <span>Alto engajamento</span>
          <strong>{altoEngajamento}</strong>
        </div>

        <div style={{ ...styles.card, color: "#eab308" }} onClick={() => setFiltroAtivo("Médio")}>
          <span>Médio engajamento</span>
          <strong>{medioEngajamento}</strong>
        </div>

        <div style={{ ...styles.card, color: "#ef4444" }} onClick={() => setFiltroAtivo("Baixo")}>
          <span>Baixo engajamento</span>
          <strong>{baixoEngajamento}</strong>
        </div>
      </section>

      <main style={styles.grid}>
        <section style={styles.panel}>
          <h2>Formulário de Reunião com Gestores</h2>

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
            <option value="">Selecione o município</option>

            {Object.keys(escolasPorMunicipio).map((municipio) => (
              <option key={municipio}>{municipio}</option>
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
            <option value="">Selecione a escola</option>

            {form.municipio &&
              escolasPorMunicipio[form.municipio]?.map((escola) => (
                <option key={escola}>{escola}</option>
              ))}
          </select>

          <input
            style={styles.input}
            type="date"
            value={form.data}
            onChange={(e) => setForm({ ...form, data: e.target.value })}
          />

          <input
            style={styles.input}
            placeholder="Diretor(a)"
            value={form.diretor}
            onChange={(e) => setForm({ ...form, diretor: e.target.value })}
          />

          <input
            style={styles.input}
            placeholder="Diretor(a) Adjunto(a)"
            value={form.adjunto}
            onChange={(e) => setForm({ ...form, adjunto: e.target.value })}
          />

          <h3>1. Demandas da Escola</h3>

          {demandasOpcoes.map((opcao) => (
            <label style={styles.check} key={opcao}>
              <input
                type="checkbox"
                checked={form.demandas.includes(opcao)}
                onChange={() => alternarCheckbox("demandas", opcao)}
              />{" "}
              {opcao}
            </label>
          ))}

          <textarea
            style={styles.textarea}
            placeholder="Descrição das demandas"
            value={form.descricaoDemandas}
            onChange={(e) => setForm({ ...form, descricaoDemandas: e.target.value })}
          />

          <h3>2. Questões Administrativas</h3>

          {administrativasOpcoes.map((opcao) => (
            <label style={styles.check} key={opcao}>
              <input
                type="checkbox"
                checked={form.administrativas.includes(opcao)}
                onChange={() => alternarCheckbox("administrativas", opcao)}
              />{" "}
              {opcao}
            </label>
          ))}

          <textarea
            style={styles.textarea}
            placeholder="Descrição das questões administrativas"
            value={form.descricaoAdministrativas}
            onChange={(e) => setForm({ ...form, descricaoAdministrativas: e.target.value })}
          />

          <h3>3. Percepção Institucional</h3>

          <h4>Diretor(a)</h4>

          <textarea
            style={styles.textarea}
            placeholder="Como o diretor avalia a atuação da SED?"
            value={form.avaliacaoSedDiretor}
            onChange={(e) => setForm({ ...form, avaliacaoSedDiretor: e.target.value })}
          />

          <textarea
            style={styles.textarea}
            placeholder="Como o diretor avalia o Governo?"
            value={form.avaliacaoGovernoDiretor}
            onChange={(e) => setForm({ ...form, avaliacaoGovernoDiretor: e.target.value })}
          />

          <h4>Diretor(a) Adjunto(a)</h4>

          <textarea
            style={styles.textarea}
            placeholder="Como o adjunto avalia a atuação da SED?"
            value={form.avaliacaoSedAdjunto}
            onChange={(e) => setForm({ ...form, avaliacaoSedAdjunto: e.target.value })}
          />

          <textarea
            style={styles.textarea}
            placeholder="Como o adjunto avalia o Governo?"
            value={form.avaliacaoGovernoAdjunto}
            onChange={(e) => setForm({ ...form, avaliacaoGovernoAdjunto: e.target.value })}
          />

          <h3>4. Engajamento</h3>

          <select
            style={styles.input}
            value={form.interesseAgendaDiretor}
            onChange={(e) => setForm({ ...form, interesseAgendaDiretor: e.target.value })}
          >
            <option value="">Interesse Diretor</option>
            <option>Alto</option>
            <option>Médio</option>
            <option>Baixo</option>
          </select>

          <select
            style={styles.input}
            value={form.interesseAgendaAdjunto}
            onChange={(e) => setForm({ ...form, interesseAgendaAdjunto: e.target.value })}
          >
            <option value="">Interesse Adjunto</option>
            <option>Alto</option>
            <option>Médio</option>
            <option>Baixo</option>
          </select>

          <h3>5. Classificação Interna</h3>

          <select
            style={styles.input}
            value={form.classificacaoDiretor}
            onChange={(e) => setForm({ ...form, classificacaoDiretor: e.target.value })}
          >
            <option value="">Classificação Diretor</option>
            <option>VERDE</option>
            <option>AMARELO</option>
            <option>VERMELHO</option>
          </select>

          <select
            style={styles.input}
            value={form.classificacaoAdjunto}
            onChange={(e) => setForm({ ...form, classificacaoAdjunto: e.target.value })}
          >
            <option value="">Classificação Adjunto</option>
            <option>VERDE</option>
            <option>AMARELO</option>
            <option>VERMELHO</option>
          </select>

          <h3>6. Observações Estratégicas</h3>

          <textarea
            style={styles.textarea}
            placeholder="Observações estratégicas"
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
          />

          <button style={styles.button} onClick={salvarRegistro}>
            Salvar Reunião
          </button>
        </section>

        <section style={styles.panel}>
          <h2>Indicadores por Gestor</h2>

          <select
            style={styles.input}
            value={municipioIndicador}
            onChange={(e) => setMunicipioIndicador(e.target.value)}
          >
            <option value="GERAL">Indicadores gerais</option>

            {Object.keys(escolasPorMunicipio).map((municipio) => (
              <option key={municipio} value={municipio}>
                {municipio}
              </option>
            ))}
          </select>

          {barra("VERDE", verde, totalGestores)}
          {barra("AMARELO", amarelo, totalGestores)}
          {barra("VERMELHO", vermelho, totalGestores)}
          {barra("Alto", altoEngajamento, totalGestores)}
          {barra("Médio", medioEngajamento, totalGestores)}
          {barra("Baixo", baixoEngajamento, totalGestores)}
        </section>

        <section style={styles.panel}>
          <h2>Formulários salvos</h2>

          {registros.length === 0 && <p>Nenhum formulário salvo ainda.</p>}

          {registros.map((r) => (
            <div key={r.id} style={styles.registro}>
              <h3>{r.escola}</h3>
              <p><strong>Município:</strong> {r.municipio}</p>
              <p><strong>Diretor:</strong> {r.diretor || "Não informado"}</p>
              <p><strong>Adjunto:</strong> {r.adjunto || "Não informado"}</p>

              <button style={styles.button} onClick={() => abrirFormulario(r)}>
                Abrir formulário salvo
              </button>

              <button style={styles.buttonExcluir} onClick={() => excluirRegistro(r.id)}>
                Excluir
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
    marginBottom: 25,
    flexWrap: "wrap"
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
    fontSize: "clamp(26px, 5vw, 38px)"
  },

  subtitle: {
    margin: 0,
    color: "#cbd5e1"
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
    gap: 12,
    marginBottom: 25
  },

  card: {
    background: "#1e293b",
    padding: 18,
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: "bold",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
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
    marginBottom: 8
  },

  button: {
    width: "100%",
    padding: 15,
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontWeight: "bold",
    fontSize: 16,
    cursor: "pointer",
    marginBottom: 10
  },

  buttonExcluir: {
    width: "100%",
    padding: 15,
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontWeight: "bold",
    fontSize: 16,
    cursor: "pointer"
  },

  barChartRow: {
    marginBottom: 18,
    cursor: "pointer"
  },

  barLabelArea: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 6,
    fontWeight: "bold"
  },

  barraFundo: {
    height: 16,
    background: "#334155",
    borderRadius: 999,
    marginTop: 5
  },

  barraValor: {
    height: 16,
    borderRadius: 999
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
    padding: 30,
    fontFamily: "Arial"
  },

  relatorioTopo: {
    borderBottom: "2px solid #111827",
    marginBottom: 20,
    paddingBottom: 15
  },

  relatorioBox: {
    border: "1px solid #ccc",
    padding: 15,
    marginBottom: 20,
    borderRadius: 8
  },

  relatorioItem: {
    borderBottom: "1px solid #ddd",
    padding: "10px 0"
  },

  buttonRelatorio: {
    padding: 12,
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontWeight: "bold",
    cursor: "pointer",
    marginRight: 10,
    marginBottom: 10
  }
};