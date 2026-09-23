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
  return `${n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function situacao(andamento) {
  if (andamento === "f") return "Finalizada";
  if (andamento === "p") return "Em andamento";
  return "Não iniciada";
}

function normalizar(valor = "") {
  return String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function somaVotosCandidatos(registro) {
  return (registro?.candidatos || []).reduce(
    (total, candidato) => total + Number(candidato?.votos || 0),
    0
  );
}

function votosValidosDocumento(registro) {
  const cargo = Number(registro?.cargoCodigo || 0);
  const comparecimento = Number(registro?.comparecimento || 0);
  const brancos = Number(registro?.brancos || 0);
  const nulos = Number(registro?.nulos || 0);

  // Em 2026, para Senador (cargo 5), cada eleitor dispõe de dois votos.
  // Nos demais cargos desta tela, cada eleitor dispõe de um voto.
  const multiplicadorVotos = cargo === 5 ? 2 : 1;

  // Esta é a base mais segura para o total de votos válidos:
  // total de votos possíveis no cargo menos brancos e nulos.
  if (comparecimento > 0) {
    return Math.max(
      0,
      comparecimento * multiplicadorVotos - brancos - nulos
    );
  }

  // Fallback para documentos sem comparecimento informado.
  const informado = Number(registro?.votosValidos || 0);
  const somaCandidatos = somaVotosCandidatos(registro);
  const votosLegenda = Number(
    registro?.votosLegenda ??
      registro?.votosLegendaPartido ??
      registro?.legenda ??
      0
  );

  const calculado = somaCandidatos + Math.max(0, votosLegenda);

  return informado > 0 ? informado : calculado;
}

function percentualCandidato(votos, totalValidos, percentualInformado) {
  const total = Number(totalValidos || 0);
  const qtd = Number(votos || 0);

  if (total > 0) {
    return (qtd / total) * 100;
  }

  const informado = Number(percentualInformado);

  return Number.isFinite(informado) && informado >= 0
    ? informado
    : 0;
}

function formatarDataFirestore(valor) {
  if (!valor) return "-";

  try {
    if (typeof valor.toDate === "function") {
      return valor.toDate().toLocaleString("pt-BR");
    }

    if (valor.seconds) {
      return new Date(valor.seconds * 1000).toLocaleString("pt-BR");
    }

    return new Date(valor).toLocaleString("pt-BR");
  } catch {
    return "-";
  }
}

function consolidarResultados(registros = []) {
  const resumo = {
    secoesTotal: 0,
    secoesTotalizadas: 0,
    eleitores: 0,
    comparecimento: 0,
    abstencao: 0,
    votosValidos: 0,
    brancos: 0,
    nulos: 0,
  };

  const candidatos = new Map();

  registros.forEach((registro) => {
    resumo.secoesTotal += Number(registro?.secoesTotal || 0);
    resumo.secoesTotalizadas += Number(
      registro?.secoesTotalizadas || 0
    );
    resumo.eleitores += Number(registro?.eleitores || 0);
    resumo.comparecimento += Number(
      registro?.comparecimento || 0
    );
    resumo.abstencao += Number(registro?.abstencao || 0);
    resumo.votosValidos += votosValidosDocumento(registro);
    resumo.brancos += Number(registro?.brancos || 0);
    resumo.nulos += Number(registro?.nulos || 0);

    (registro?.candidatos || []).forEach((candidato) => {
      const chave = String(candidato?.numero ?? "");
      if (!chave) return;

      const atual = candidatos.get(chave) || {
        numero: candidato?.numero ?? "-",
        nomeUrna:
          candidato?.nomeUrna ||
          candidato?.nome ||
          `Candidato nº ${candidato?.numero ?? "-"}`,
        partido: candidato?.partido || "-",
        situacao: candidato?.situacao || "-",
        votos: 0,
      };

      atual.votos += Number(candidato?.votos || 0);

      if (!atual.nomeUrna || atual.nomeUrna.startsWith("Candidato nº")) {
        atual.nomeUrna =
          candidato?.nomeUrna ||
          candidato?.nome ||
          atual.nomeUrna;
      }

      if ((!atual.partido || atual.partido === "-") && candidato?.partido) {
        atual.partido = candidato.partido;
      }

      if ((!atual.situacao || atual.situacao === "-") && candidato?.situacao) {
        atual.situacao = candidato.situacao;
      }

      candidatos.set(chave, atual);
    });
  });

  const listaCandidatos = [...candidatos.values()]
    .map((candidato) => ({
      ...candidato,
      percentual: percentualCandidato(
        candidato.votos,
        resumo.votosValidos,
        null
      ),
    }))
    .sort(
      (a, b) =>
        Number(a.numero || 0) - Number(b.numero || 0)
    );

  return { resumo, candidatos: listaCandidatos };
}

function nomeArquivoSeguro(valor = "") {
  return normalizar(valor)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ResultadosTSE2026({ onVoltar }) {
  const [dados, setDados] = useState([]);
  const [erro, setErro] = useState("");
  const [municipio, setMunicipio] = useState("GERAL");
  const [cargo, setCargo] = useState("3");
  const [escolasTSE, setEscolasTSE] = useState([]);
  const [escolaId, setEscolaId] = useState("GERAL");
  const [resultadosEscolas, setResultadosEscolas] = useState([]);
  const [eleitoradoMunicipios, setEleitoradoMunicipios] = useState([]);
  const [relatorioTipo, setRelatorioTipo] = useState(null);

  const dadosOficiais = useMemo(
    () => dados.filter((d) => d.fase === "o"),
    [dados]
  );

  useEffect(() => {
    const cancelar = onSnapshot(
      collection(db, "resultados_tse_2026"),
      (snapshot) => {
        setDados(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
        setErro("");
      },
      (e) =>
        setErro(
          e.message ||
            "Falha ao ler resultados municipais no Firestore."
        )
    );

    return () => cancelar();
  }, []);

  useEffect(() => {
    const cancelar = onSnapshot(
      collection(db, "escolas_tse_2026"),
      (snapshot) => {
        setEscolasTSE(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
        setErro("");
      },
      (e) =>
        setErro(
          e.message ||
            "Falha ao ler escolas no Firestore."
        )
    );

    return () => cancelar();
  }, []);

  useEffect(() => {
    const cancelar = onSnapshot(
      collection(db, "resultados_escolas_tse_2026"),
      (snapshot) => {
        setResultadosEscolas(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
        setErro("");
      },
      (e) =>
        setErro(
          e.message ||
            "Falha ao ler resultados das escolas no Firestore."
        )
    );

    return () => cancelar();
  }, []);

  useEffect(() => {
    const cancelar = onSnapshot(
      collection(db, "eleitorado_tse_2026"),
      (snapshot) => {
        setEleitoradoMunicipios(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
        setErro("");
      },
      (e) =>
        setErro(
          e.message ||
            "Falha ao ler o eleitorado oficial do TSE no Firestore."
        )
    );

    return () => cancelar();
  }, []);

  const municipios = useMemo(() => {
    const nomes = new Set();

    dados.forEach((d) => {
      if (d.municipio) nomes.add(d.municipio);
    });

    escolasTSE.forEach((e) => {
      if (e.municipio) nomes.add(e.municipio);
    });

    return [...nomes].sort((a, b) =>
      String(a).localeCompare(String(b), "pt-BR")
    );
  }, [dados, escolasTSE]);

  const escolasDoMunicipio = useMemo(() => {
    if (municipio === "GERAL") return [];

    return escolasTSE
      .filter(
        (e) =>
          normalizar(e.municipio) === normalizar(municipio)
      )
      .sort((a, b) =>
        String(a.escolaRadar || "").localeCompare(
          String(b.escolaRadar || ""),
          "pt-BR"
        )
      );
  }, [escolasTSE, municipio]);

  const escolaSelecionada = useMemo(() => {
    if (escolaId === "GERAL") return null;

    return escolasTSE.find((e) => e.id === escolaId) || null;
  }, [escolasTSE, escolaId]);

  const resultadoEscolaSelecionada = useMemo(() => {
    if (escolaId === "GERAL") return null;

    return (
      resultadosEscolas.find(
        (resultado) =>
          resultado.id === escolaId ||
          resultado.escolaId === escolaId
      ) || null
    );
  }, [resultadosEscolas, escolaId]);

  const resultadoCargoEscola = useMemo(() => {
    if (!resultadoEscolaSelecionada) return null;

    return (
      (resultadoEscolaSelecionada.resultados || []).find(
        (r) => String(r.cargoCodigo) === String(cargo)
      ) || null
    );
  }, [resultadoEscolaSelecionada, cargo]);

  const filtrados = useMemo(() => {
    if (escolaId !== "GERAL") return [];

    return dadosOficiais
      .filter((d) => String(d.cargoCodigo) === String(cargo))
      .filter(
        (d) =>
          municipio === "GERAL" ||
          normalizar(d.municipio) === normalizar(municipio)
      )
      .sort((a, b) =>
        String(a.municipio).localeCompare(
          String(b.municipio),
          "pt-BR"
        )
      );
  }, [dadosOficiais, cargo, municipio, escolaId]);

  const eleitoradoSelecionado = useMemo(() => {
    if (municipio === "GERAL") {
      return eleitoradoMunicipios.reduce(
        (acc, item) => {
          acc.eleitoresMunicipio += Number(
            item.eleitoresMunicipio || 0
          );
          acc.eleitoresEscolasEstaduais += Number(
            item.eleitoresEscolasEstaduais || 0
          );
          acc.totalEscolasEstaduais += Number(
            item.totalEscolasEstaduais || 0
          );
          acc.totalSecoesEstaduais += Number(
            item.totalSecoesEstaduais || 0
          );
          return acc;
        },
        {
          eleitoresMunicipio: 0,
          eleitoresEscolasEstaduais: 0,
          totalEscolasEstaduais: 0,
          totalSecoesEstaduais: 0,
        }
      );
    }

    const encontrado = eleitoradoMunicipios.find(
      (item) =>
        normalizar(item.municipio) === normalizar(municipio)
    );

    return {
      eleitoresMunicipio: Number(
        encontrado?.eleitoresMunicipio || 0
      ),
      eleitoresEscolasEstaduais: Number(
        encontrado?.eleitoresEscolasEstaduais || 0
      ),
      totalEscolasEstaduais: Number(
        encontrado?.totalEscolasEstaduais || 0
      ),
      totalSecoesEstaduais: Number(
        encontrado?.totalSecoesEstaduais || 0
      ),
    };
  }, [eleitoradoMunicipios, municipio]);

  const eleitoresEscolaSelecionada = Number(
    escolaSelecionada?.eleitoresCadastrados || 0
  );

  const consolidadosCadastro = useMemo(() => {
    const base = escolasTSE.filter(
      (e) =>
        municipio === "GERAL" ||
        normalizar(e.municipio) === normalizar(municipio)
    );

    const municipiosCadastro = new Set();
    const secoesCadastro = new Set();

    base.forEach((e) => {
      if (e.municipio) {
        municipiosCadastro.add(String(e.municipio));
      }

      (e.secoes || []).forEach((secao) => {
        secoesCadastro.add(
          `${normalizar(e.municipio)}|${String(e.zona ?? "")}|${String(secao)}`
        );
      });
    });

    return {
      escolas: base.length,
      secoes: secoesCadastro.size,
      municipios: municipiosCadastro.size,
    };
  }, [escolasTSE, municipio]);

  const temResultadosOficiais = filtrados.length > 0;

  const resumoMunicipal = useMemo(
    () =>
      filtrados.reduce(
        (acc, d) => {
          acc.secoesTotal += Number(d.secoesTotal || 0);
          acc.secoesTotalizadas += Number(d.secoesTotalizadas || 0);
          acc.eleitores += Number(d.eleitores || 0);
          acc.comparecimento += Number(d.comparecimento || 0);
          acc.abstencao += Number(d.abstencao || 0);
          acc.votosValidos += votosValidosDocumento(d);
          acc.brancos += Number(d.brancos || 0);
          acc.nulos += Number(d.nulos || 0);
          return acc;
        },
        {
          secoesTotal: 0,
          secoesTotalizadas: 0,
          eleitores: 0,
          comparecimento: 0,
          abstencao: 0,
          votosValidos: 0,
          brancos: 0,
          nulos: 0,
        }
      ),
    [filtrados]
  );

  const resumoEscola = useMemo(() => {
    const esperado = Number(
      resultadoEscolaSelecionada?.totalSecoesEsperadas ??
        escolaSelecionada?.secoes?.length ??
        0
    );

    const comBU = Number(
      resultadoEscolaSelecionada?.totalSecoesComBU || 0
    );

    return {
      secoesTotal: esperado,
      secoesTotalizadas: comBU,
      comparecimento: Number(
        resultadoCargoEscola?.comparecimento || 0
      ),
      votosValidos: Number(
        resultadoCargoEscola?.votosValidos || 0
      ),
      votosNominais: Number(
        resultadoCargoEscola?.votosNominais || 0
      ),
      votosLegenda: Number(
        resultadoCargoEscola?.votosLegenda || 0
      ),
      brancos: Number(
        resultadoCargoEscola?.brancos || 0
      ),
      nulos: Number(
        resultadoCargoEscola?.nulos || 0
      ),
    };
  }, [
    resultadoEscolaSelecionada,
    resultadoCargoEscola,
    escolaSelecionada,
  ]);

  const pctSecoesMunicipal =
    resumoMunicipal.secoesTotal > 0
      ? (resumoMunicipal.secoesTotalizadas /
          resumoMunicipal.secoesTotal) *
        100
      : 0;

  const pctSecoesEscola =
    resumoEscola.secoesTotal > 0
      ? (resumoEscola.secoesTotalizadas /
          resumoEscola.secoesTotal) *
        100
      : 0;

  const metadadosCandidatos = useMemo(() => {
    const mapa = new Map();

    dadosOficiais
      .filter((d) => String(d.cargoCodigo) === String(cargo))
      .filter(
        (d) =>
          municipio === "GERAL" ||
          normalizar(d.municipio) === normalizar(municipio)
      )
      .forEach((d) => {
        (d.candidatos || []).forEach((c) => {
          const chave = String(c.numero ?? "");

          if (!chave || mapa.has(chave)) return;

          mapa.set(chave, {
            nomeUrna: c.nomeUrna || c.nome || "",
            nome: c.nome || "",
            partido: c.partido || "",
            situacao: c.situacao || "-",
          });
        });
      });

    return mapa;
  }, [dadosOficiais, cargo, municipio]);

  const candidatosEscola = useMemo(() => {
    const totalValidos = Number(
      resultadoCargoEscola?.votosValidos || 0
    );

    return (resultadoCargoEscola?.candidatos || [])
      .map((c) => {
        const meta =
          metadadosCandidatos.get(String(c.numero ?? "")) || {};

        return {
          ...c,
          nomeUrna:
            meta.nomeUrna ||
            meta.nome ||
            `Candidato nº ${c.numero ?? "-"}`,
          partido: meta.partido || c.partido || "-",
          situacao: meta.situacao || "-",
          percentual: percentualCandidato(
            c.votos,
            totalValidos,
            null
          ),
        };
      })
      .sort(
        (a, b) =>
          Number(a.numero || 0) - Number(b.numero || 0)
      );
  }, [resultadoCargoEscola, metadadosCandidatos]);

  const temResultadoCargoEscola =
    escolaId !== "GERAL" &&
    resultadoCargoEscola &&
    resumoEscola.secoesTotalizadas > 0;

  const eleitoradoCRE5 = useMemo(
    () =>
      eleitoradoMunicipios.reduce(
        (acc, item) => {
          acc.eleitoresMunicipio += Number(
            item.eleitoresMunicipio || 0
          );
          acc.eleitoresEscolasEstaduais += Number(
            item.eleitoresEscolasEstaduais || 0
          );
          acc.totalEscolasEstaduais += Number(
            item.totalEscolasEstaduais || 0
          );
          acc.totalSecoesEstaduais += Number(
            item.totalSecoesEstaduais || 0
          );
          return acc;
        },
        {
          eleitoresMunicipio: 0,
          eleitoresEscolasEstaduais: 0,
          totalEscolasEstaduais: 0,
          totalSecoesEstaduais: 0,
        }
      ),
    [eleitoradoMunicipios]
  );

  const resultadosCargoCRE5 = useMemo(
    () =>
      dadosOficiais.filter(
        (d) => String(d.cargoCodigo) === String(cargo)
      ),
    [dadosOficiais, cargo]
  );

  const consolidadoCRE5 = useMemo(
    () => consolidarResultados(resultadosCargoCRE5),
    [resultadosCargoCRE5]
  );

  const resultadosCargoMunicipio = useMemo(() => {
    if (municipio === "GERAL") return [];

    return dadosOficiais.filter(
      (d) =>
        String(d.cargoCodigo) === String(cargo) &&
        normalizar(d.municipio) === normalizar(municipio)
    );
  }, [dadosOficiais, cargo, municipio]);

  const consolidadoMunicipio = useMemo(
    () => consolidarResultados(resultadosCargoMunicipio),
    [resultadosCargoMunicipio]
  );

  const municipiosRelatorio = useMemo(
    () =>
      [...eleitoradoMunicipios].sort((a, b) =>
        String(a.municipio || "").localeCompare(
          String(b.municipio || ""),
          "pt-BR"
        )
      ),
    [eleitoradoMunicipios]
  );

  const escolasMunicipioRelatorio = useMemo(() => {
    if (municipio === "GERAL") return [];

    return escolasTSE
      .filter(
        (e) =>
          normalizar(e.municipio) === normalizar(municipio)
      )
      .sort((a, b) =>
        String(a.escolaRadar || "").localeCompare(
          String(b.escolaRadar || ""),
          "pt-BR"
        )
      );
  }, [escolasTSE, municipio]);

  function imprimirRelatorio(tipo) {
    if (tipo === "MUNICIPIO" && municipio === "GERAL") return;
    if (tipo === "ESCOLA" && !escolaSelecionada) return;

    const tituloAnterior = document.title;
    let titulo = "Radar Link MS - Relatório CRE-5";

    if (tipo === "MUNICIPIO") {
      titulo = `Radar Link MS - ${municipio}`;
    }

    if (tipo === "ESCOLA") {
      titulo = `Radar Link MS - ${
        escolaSelecionada?.escolaRadar || "Escola"
      }`;
    }

    setRelatorioTipo(tipo);
    document.title = nomeArquivoSeguro(titulo) || "radar-link-ms";

    window.setTimeout(() => {
      window.print();
      document.title = tituloAnterior;
      window.setTimeout(() => setRelatorioTipo(null), 0);
    }, 180);
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={{ margin: 0 }}>
            🗳️ Resultados Eleitorais 2026
          </h1>
          <p style={s.sub}>
            Eleitorado oficial do TSE por município e escola estadual. Resultados de votação serão exibidos somente quando a divulgação oficial estiver disponível.
          </p>
        </div>
      </div>

      <button style={s.button} onClick={onVoltar}>
        Voltar ao painel principal
      </button>

      <div style={s.acoesRelatorio}>
        <button
          style={s.buttonRelatorio}
          onClick={() => imprimirRelatorio("CRE5")}
        >
          Imprimir / PDF CRE-5
        </button>

        <button
          style={{
            ...s.buttonRelatorio,
            ...(municipio === "GERAL" ? s.buttonDesabilitado : {}),
          }}
          onClick={() => imprimirRelatorio("MUNICIPIO")}
          disabled={municipio === "GERAL"}
        >
          Imprimir / PDF Município
        </button>

        <button
          style={{
            ...s.buttonRelatorio,
            ...(!escolaSelecionada ? s.buttonDesabilitado : {}),
          }}
          onClick={() => imprimirRelatorio("ESCOLA")}
          disabled={!escolaSelecionada}
        >
          Imprimir / PDF Escola
        </button>
      </div>

      <section style={s.panel}>
        <div style={s.filtros}>
          <select
            style={s.input}
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
          >
            {Object.entries(CARGOS).map(([codigo, nome]) => (
              <option key={codigo} value={codigo}>
                {nome}
              </option>
            ))}
          </select>

          <select
            style={s.input}
            value={municipio}
            onChange={(e) => {
              setMunicipio(e.target.value);
              setEscolaId("GERAL");
            }}
          >
            <option value="GERAL">
              Todos os municípios CRE-5
            </option>

            {municipios.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            style={s.input}
            value={escolaId}
            onChange={(e) => setEscolaId(e.target.value)}
            disabled={municipio === "GERAL"}
          >
            <option value="GERAL">
              {municipio === "GERAL"
                ? "Selecione um município primeiro"
                : "Todas as escolas estaduais"}
            </option>

            {escolasDoMunicipio.map((e) => (
              <option key={e.id} value={e.id}>
                {e.escolaRadar}
              </option>
            ))}
          </select>
        </div>

        {erro && <div style={s.erro}>{erro}</div>}

        {escolaSelecionada && (
          <div style={s.escolaBox}>
            <div style={s.escolaTitulo}>
              🏫 {escolaSelecionada.escolaRadar}
            </div>

            <div style={{ marginTop: 6 }}>
              <strong>Local TSE:</strong>{" "}
              {escolaSelecionada.nomeLocalVotacaoTSE || "-"}
            </div>

            <div>
              <strong>Zona:</strong>{" "}
              {escolaSelecionada.zona ?? "-"}
            </div>

            <div>
              <strong>Seções:</strong>{" "}
              {(escolaSelecionada.secoes || []).length
                ? (escolaSelecionada.secoes || []).join(", ")
                : "-"}
            </div>

            <div style={{ marginTop: 6 }}>
              <strong>Eleitores cadastrados:</strong>{" "}
              {numero(eleitoresEscolaSelecionada)}
            </div>
          </div>
        )}

        {escolaId === "GERAL" ? (
          <div style={s.cards}>
            <Card
              titulo={
                municipio === "GERAL"
                  ? "Eleitores nos 12 municípios CRE-5"
                  : "Eleitores do município"
              }
              valor={numero(
                eleitoradoSelecionado.eleitoresMunicipio
              )}
            />

            <Card
              titulo={
                municipio === "GERAL"
                  ? "Eleitores nas escolas estaduais CRE-5"
                  : "Eleitores nas escolas estaduais"
              }
              valor={numero(
                eleitoradoSelecionado.eleitoresEscolasEstaduais
              )}
            />

            <Card
              titulo="Escolas estaduais vinculadas"
              valor={numero(
                eleitoradoSelecionado.totalEscolasEstaduais
              )}
            />

            <Card
              titulo="Seções eleitorais vinculadas"
              valor={numero(
                eleitoradoSelecionado.totalSecoesEstaduais
              )}
            />

            <Card
              titulo="Apuração oficial"
              valor={
                temResultadosOficiais
                  ? "Em andamento"
                  : "Aguardando TSE"
              }
            />
          </div>
        ) : (
          <div style={s.cards}>
            <Card
              titulo="Eleitores cadastrados na escola"
              valor={numero(eleitoresEscolaSelecionada)}
            />

            <Card
              titulo="Seções vinculadas"
              valor={numero(resumoEscola.secoesTotal)}
            />

            <Card
              titulo="BUs oficiais processados"
              valor={numero(resumoEscola.secoesTotalizadas)}
            />

            <Card
              titulo="Situação"
              valor={
                temResultadoCargoEscola && temResultadosOficiais
                  ? "Com resultados"
                  : "Aguardando TSE"
              }
            />
          </div>
        )}
      </section>

      {escolaId !== "GERAL" && !temResultadoCargoEscola && (
        <section style={s.panel}>
          <p style={{ margin: 0 }}>
            Aguardando os boletins de urna oficiais das seções desta escola.
            Dados de simulação não são exibidos. Quando o TSE iniciar a
            divulgação oficial, o Radar Link MS processará e somará os
            resultados automaticamente.
          </p>

          {resultadoEscolaSelecionada && (
            <p style={s.infoSecundaria}>
              BUs encontrados até agora:{" "}
              {numero(
                resultadoEscolaSelecionada.totalSecoesComBU
              )}{" "}
              de{" "}
              {numero(
                resultadoEscolaSelecionada.totalSecoesEsperadas
              )}
              .
            </p>
          )}
        </section>
      )}

      {temResultadoCargoEscola && temResultadosOficiais && (
        <section style={s.panel}>
          <div style={s.municipioTopo}>
            <div>
              <h2 style={{ margin: 0 }}>
                {escolaSelecionada?.escolaRadar ||
                  resultadoEscolaSelecionada?.escolaRadar ||
                  "Escola"}
              </h2>

              <div style={s.meta}>
                {CARGOS[cargo] ||
                  resultadoCargoEscola?.cargoNome ||
                  `Cargo ${cargo}`}{" "}
                · resultado agregado dos BUs das seções
              </div>
            </div>

            <div style={s.selo}>BU TSE</div>
          </div>

          <div style={s.resumoLinha}>
            <span>
              <strong>Seções com BU:</strong>{" "}
              {numero(resumoEscola.secoesTotalizadas)} /{" "}
              {numero(resumoEscola.secoesTotal)}
            </span>

            <span>
              <strong>Válidos:</strong>{" "}
              {numero(resumoEscola.votosValidos)}
            </span>

            <span>
              <strong>Brancos:</strong>{" "}
              {numero(resumoEscola.brancos)}
            </span>

            <span>
              <strong>Nulos:</strong>{" "}
              {numero(resumoEscola.nulos)}
            </span>
          </div>

          <div style={s.tabelaWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Número</th>
                  <th style={s.th}>Candidatura</th>
                  <th style={s.th}>Partido</th>
                  <th style={s.thDireita}>Votos</th>
                  <th style={s.thDireita}>% válidos</th>
                  <th style={s.th}>Situação</th>
                </tr>
              </thead>

              <tbody>
                {candidatosEscola.map((c) => (
                  <tr
                    key={`escola-${escolaId}-${cargo}-${c.numero}-${c.partido}`}
                  >
                    <td style={s.td}>{c.numero}</td>
                    <td style={s.td}>{c.nomeUrna}</td>
                    <td style={s.td}>{c.partido}</td>
                    <td style={s.tdDireita}>
                      {numero(c.votos)}
                    </td>
                    <td style={s.tdDireita}>
                      {percentual(c.percentual)}
                    </td>
                    <td style={s.td}>
                      {c.situacao || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={s.rodape}>
            Resultado calculado a partir dos BUs publicados pelo TSE para
            as seções vinculadas a esta escola. Última agregação:{" "}
            {formatarDataFirestore(
              resultadoEscolaSelecionada?.atualizadoEm
            )}
          </div>
        </section>
      )}

      {escolaId === "GERAL" && !temResultadosOficiais && (
        <section style={s.panel}>
          <p style={{ margin: 0 }}>
            Aguardando o início da divulgação oficial dos resultados pelo TSE.
            Dados simulados, candidaturas simuladas e votos de teste não são
            exibidos nesta tela.
          </p>
        </section>
      )}

      {filtrados.map((d) => (
        <section key={d.id} style={s.panel}>
          <div style={s.municipioTopo}>
            <div>
              <h2 style={{ margin: 0 }}>{d.municipio}</h2>
              <div style={s.meta}>
                {CARGOS[d.cargoCodigo] ||
                  d.cargoNome ||
                  `Cargo ${d.cargoCodigo}`}{" "}
                · TSE: {situacao(d.andamento)}
              </div>
            </div>

            <div style={s.selo}>
              OFICIAL
            </div>
          </div>

          <div style={s.resumoLinha}>
            <span>
              <strong>Seções:</strong>{" "}
              {numero(d.secoesTotalizadas)} / {numero(d.secoesTotal)}
            </span>
            <span>
              <strong>Válidos:</strong>{" "}
              {numero(votosValidosDocumento(d))}
            </span>
            <span>
              <strong>Brancos:</strong>{" "}
              {numero(d.brancos)}
            </span>
            <span>
              <strong>Nulos:</strong>{" "}
              {numero(d.nulos)}
            </span>
          </div>

          <div style={s.tabelaWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Número</th>
                  <th style={s.th}>Candidatura</th>
                  <th style={s.th}>Partido</th>
                  <th style={s.thDireita}>Votos</th>
                  <th style={s.thDireita}>% válidos</th>
                  <th style={s.th}>Situação</th>
                </tr>
              </thead>

              <tbody>
                {(d.candidatos || [])
                  .slice()
                  .sort(
                    (a, b) =>
                      Number(a.numero || 0) -
                      Number(b.numero || 0)
                  )
                  .map((c) => (
                    <tr
                      key={`${d.id}-${
                        c.sequencial || c.numero
                      }-${c.partido}`}
                    >
                      <td style={s.td}>{c.numero}</td>
                      <td style={s.td}>
                        {c.nomeUrna || c.nome || "-"}
                      </td>
                      <td style={s.td}>
                        {c.partido || "-"}
                      </td>
                      <td style={s.tdDireita}>
                        {numero(c.votos)}
                      </td>
                      <td style={s.tdDireita}>
                        {percentual(
                          percentualCandidato(
                            c.votos,
                            votosValidosDocumento(d),
                            c.percentual
                          )
                        )}
                      </td>
                      <td style={s.td}>
                        {c.situacao || "-"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div style={s.rodape}>
            Gerado pelo TSE: {d.dataGeracao || "-"}{" "}
            {d.horaGeracao || ""} · Sincronizado no Radar:{" "}
            {d.sincronizadoEmTexto || "-"} · ID geração TSE:{" "}
            {d.idGeracao ?? "-"}
          </div>
        </section>
      ))}

      {relatorioTipo && (
        <RelatorioImpressao
          tipo={relatorioTipo}
          cargo={cargo}
          municipio={municipio}
          escolaSelecionada={escolaSelecionada}
          eleitoradoCRE5={eleitoradoCRE5}
          eleitoradoMunicipio={eleitoradoSelecionado}
          municipios={municipiosRelatorio}
          escolasMunicipio={escolasMunicipioRelatorio}
          consolidadoCRE5={consolidadoCRE5}
          consolidadoMunicipio={consolidadoMunicipio}
          resultadoCargoEscola={resultadoCargoEscola}
          candidatosEscola={candidatosEscola}
          resumoEscola={resumoEscola}
          eleitoresEscola={eleitoresEscolaSelecionada}
        />
      )}

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          html, body {
            background: #fff !important;
          }

          body * {
            visibility: hidden !important;
          }

          .relatorio-impressao,
          .relatorio-impressao * {
            visibility: visible !important;
          }

          .relatorio-impressao {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            color: #000 !important;
            background: #fff !important;
            font-family: Arial, sans-serif !important;
            font-size: 10pt !important;
          }

          .relatorio-impressao table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          .relatorio-impressao th,
          .relatorio-impressao td {
            border: 1px solid #777 !important;
            padding: 5px 6px !important;
            color: #000 !important;
          }

          .relatorio-impressao th {
            background: #eee !important;
          }

          .relatorio-impressao tr,
          .relatorio-impressao .bloco-relatorio {
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}

function RelatorioImpressao({
  tipo,
  cargo,
  municipio,
  escolaSelecionada,
  eleitoradoCRE5,
  eleitoradoMunicipio,
  municipios,
  escolasMunicipio,
  consolidadoCRE5,
  consolidadoMunicipio,
  resultadoCargoEscola,
  candidatosEscola,
  resumoEscola,
  eleitoresEscola,
}) {
  const cargoNome = CARGOS[cargo] || `Cargo ${cargo}`;
  const agora = new Date().toLocaleString("pt-BR");

  const titulo =
    tipo === "CRE5"
      ? "Relatório CRE-5"
      : tipo === "MUNICIPIO"
      ? `Relatório municipal - ${municipio}`
      : `Relatório da escola - ${
          escolaSelecionada?.escolaRadar || "-"
        }`;

  const consolidado =
    tipo === "CRE5"
      ? consolidadoCRE5
      : tipo === "MUNICIPIO"
      ? consolidadoMunicipio
      : null;

  const candidatos =
    tipo === "ESCOLA"
      ? candidatosEscola
      : consolidado?.candidatos || [];

  const resumoResultado =
    tipo === "ESCOLA"
      ? resumoEscola
      : consolidado?.resumo || {};

  const temResultado =
    tipo === "ESCOLA"
      ? Boolean(
          resultadoCargoEscola &&
            Number(resumoEscola?.secoesTotalizadas || 0) > 0
        )
      : candidatos.length > 0 ||
        Number(resumoResultado?.secoesTotalizadas || 0) > 0;

  return (
    <div className="relatorio-impressao" style={s.relatorioImpressao}>
      <div style={s.relatorioCabecalho}>
        <div>
          <h1 style={s.relatorioH1}>Radar Link MS</h1>
          <h2 style={s.relatorioH2}>{titulo}</h2>
        </div>
        <div style={s.relatorioData}>
          Gerado em {agora}
        </div>
      </div>

      <div style={s.relatorioLinha}>
        <strong>Cargo:</strong> {cargoNome}
      </div>

      {tipo === "CRE5" && (
        <>
          <ResumoRelatorio
            itens={[
              [
                "Eleitores nos 12 municípios",
                numero(eleitoradoCRE5.eleitoresMunicipio),
              ],
              [
                "Eleitores nas escolas estaduais",
                numero(eleitoradoCRE5.eleitoresEscolasEstaduais),
              ],
              [
                "Escolas estaduais vinculadas",
                numero(eleitoradoCRE5.totalEscolasEstaduais),
              ],
              [
                "Seções estaduais vinculadas",
                numero(eleitoradoCRE5.totalSecoesEstaduais),
              ],
            ]}
          />

          <BlocoRelatorio titulo="Eleitorado por município">
            <TabelaRelatorio
              colunas={[
                "Município",
                "Eleitores",
                "Nas escolas estaduais",
                "Escolas",
                "Seções",
              ]}
              linhas={municipios.map((item) => [
                item.municipio || "-",
                numero(item.eleitoresMunicipio),
                numero(item.eleitoresEscolasEstaduais),
                numero(item.totalEscolasEstaduais),
                numero(item.totalSecoesEstaduais),
              ])}
            />
          </BlocoRelatorio>
        </>
      )}

      {tipo === "MUNICIPIO" && (
        <>
          <ResumoRelatorio
            itens={[
              [
                "Eleitores do município",
                numero(eleitoradoMunicipio.eleitoresMunicipio),
              ],
              [
                "Eleitores nas escolas estaduais",
                numero(eleitoradoMunicipio.eleitoresEscolasEstaduais),
              ],
              [
                "Escolas estaduais vinculadas",
                numero(eleitoradoMunicipio.totalEscolasEstaduais),
              ],
              [
                "Seções estaduais vinculadas",
                numero(eleitoradoMunicipio.totalSecoesEstaduais),
              ],
            ]}
          />

          <BlocoRelatorio titulo="Escolas estaduais do município">
            <TabelaRelatorio
              colunas={[
                "Escola",
                "Zona",
                "Seções",
                "Eleitores",
              ]}
              linhas={escolasMunicipio.map((escola) => [
                escola.escolaRadar || "-",
                escola.zona ?? "-",
                numero((escola.secoes || []).length),
                numero(escola.eleitoresCadastrados),
              ])}
            />
          </BlocoRelatorio>
        </>
      )}

      {tipo === "ESCOLA" && escolaSelecionada && (
        <>
          <ResumoRelatorio
            itens={[
              ["Município", escolaSelecionada.municipio || "-"],
              ["Zona eleitoral", escolaSelecionada.zona ?? "-"],
              ["Eleitores cadastrados", numero(eleitoresEscola)],
              [
                "Seções vinculadas",
                numero((escolaSelecionada.secoes || []).length),
              ],
            ]}
          />

          <BlocoRelatorio titulo="Identificação do local de votação">
            <div style={s.relatorioTexto}>
              <strong>Escola:</strong>{" "}
              {escolaSelecionada.escolaRadar || "-"}
            </div>
            <div style={s.relatorioTexto}>
              <strong>Local TSE:</strong>{" "}
              {escolaSelecionada.nomeLocalVotacaoTSE || "-"}
            </div>
            <div style={s.relatorioTexto}>
              <strong>Seções:</strong>{" "}
              {(escolaSelecionada.secoes || []).join(", ") || "-"}
            </div>
          </BlocoRelatorio>

          {(escolaSelecionada.eleitoresPorSecao || []).length > 0 && (
            <BlocoRelatorio titulo="Eleitorado por seção">
              <TabelaRelatorio
                colunas={["Seção", "Eleitores"]}
                linhas={[...(escolaSelecionada.eleitoresPorSecao || [])]
                  .sort(
                    (a, b) =>
                      Number(a.secao || 0) - Number(b.secao || 0)
                  )
                  .map((item) => [
                    item.secao ?? "-",
                    numero(item.eleitores),
                  ])}
              />
            </BlocoRelatorio>
          )}
        </>
      )}

      <BlocoRelatorio titulo={`Resultado oficial - ${cargoNome}`}>
        {temResultado ? (
          <>
            <div style={s.relatorioResumoResultado}>
              <span>
                <strong>Seções:</strong>{" "}
                {numero(resumoResultado.secoesTotalizadas)} /{" "}
                {numero(resumoResultado.secoesTotal)}
              </span>
              <span>
                <strong>Válidos:</strong>{" "}
                {numero(resumoResultado.votosValidos)}
              </span>
              <span>
                <strong>Brancos:</strong>{" "}
                {numero(resumoResultado.brancos)}
              </span>
              <span>
                <strong>Nulos:</strong>{" "}
                {numero(resumoResultado.nulos)}
              </span>
            </div>

            <TabelaRelatorio
              colunas={[
                "Número",
                "Candidatura",
                "Partido",
                "Votos",
                "% válidos",
                "Situação",
              ]}
              linhas={candidatos.map((c) => [
                c.numero ?? "-",
                c.nomeUrna || c.nome || "-",
                c.partido || "-",
                numero(c.votos),
                percentual(c.percentual),
                c.situacao || "-",
              ])}
            />
          </>
        ) : (
          <div style={s.relatorioAviso}>
            Aguardando a divulgação oficial do TSE. Dados simulados não são
            incluídos neste relatório.
          </div>
        )}
      </BlocoRelatorio>

      <div style={s.relatorioFonte}>
        Fonte: Tribunal Superior Eleitoral (TSE), dados sincronizados pelo
        Radar Link MS. As candidaturas são apresentadas em ordem numérica.
      </div>
    </div>
  );
}

function ResumoRelatorio({ itens }) {
  return (
    <div style={s.relatorioCards} className="bloco-relatorio">
      {itens.map(([titulo, valor]) => (
        <div key={titulo} style={s.relatorioCard}>
          <div style={s.relatorioCardTitulo}>{titulo}</div>
          <div style={s.relatorioCardValor}>{valor}</div>
        </div>
      ))}
    </div>
  );
}

function BlocoRelatorio({ titulo, children }) {
  return (
    <section style={s.relatorioBloco} className="bloco-relatorio">
      <h3 style={s.relatorioH3}>{titulo}</h3>
      {children}
    </section>
  );
}

function TabelaRelatorio({ colunas, linhas }) {
  return (
    <table style={s.relatorioTabela}>
      <thead>
        <tr>
          {colunas.map((coluna) => (
            <th key={coluna} style={s.relatorioTh}>
              {coluna}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.length ? (
          linhas.map((linha, indice) => (
            <tr key={indice}>
              {linha.map((valor, indiceColuna) => (
                <td
                  key={`${indice}-${indiceColuna}`}
                  style={s.relatorioTd}
                >
                  {valor}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td
              style={s.relatorioTd}
              colSpan={Math.max(1, colunas.length)}
            >
              Nenhum registro disponível.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function Card({ titulo, valor }) {
  return (
    <div style={s.card}>
      <div style={s.cardTitulo}>{titulo}</div>
      <div style={s.cardValor}>{valor}</div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#07111f,#0f172a,#111827)",
    color: "white",
    fontFamily: "Arial",
    padding: 15,
  },
  header: { marginBottom: 15 },
  sub: { color: "#cbd5e1", marginTop: 6 },
  panel: {
    background: "rgba(15,23,42,.96)",
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
  },
  filtros: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
    gap: 10,
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: "none",
    boxSizing: "border-box",
    fontSize: 16,
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
    marginBottom: 10,
  },
  acoesRelatorio: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
    gap: 10,
    marginBottom: 16,
  },
  buttonRelatorio: {
    padding: 12,
    background: "#0f766e",
    color: "white",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 800,
  },
  buttonDesabilitado: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  escolaBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    background: "#172238",
    border: "1px solid #2C3A56",
  },
  escolaTitulo: {
    fontWeight: 800,
    fontSize: 17,
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
    gap: 10,
    marginTop: 12,
  },
  card: {
    background: "#1e293b",
    padding: 14,
    borderRadius: 12,
  },
  cardTitulo: {
    color: "#cbd5e1",
    fontSize: 13,
  },
  cardValor: {
    fontSize: 24,
    fontWeight: 900,
    marginTop: 5,
  },
  municipioTopo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    flexWrap: "wrap",
  },
  meta: {
    color: "#cbd5e1",
    marginTop: 4,
  },
  selo: {
    background: "#1d4ed8",
    padding: "7px 11px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 12,
  },
  resumoLinha: {
    display: "flex",
    flexWrap: "wrap",
    gap: 18,
    padding: "14px 0",
    color: "#e2e8f0",
  },
  tabelaWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#0f172a",
  },
  th: {
    textAlign: "left",
    padding: 10,
    borderBottom: "1px solid #334155",
    color: "#cbd5e1",
    whiteSpace: "nowrap",
  },
  thDireita: {
    textAlign: "right",
    padding: 10,
    borderBottom: "1px solid #334155",
    color: "#cbd5e1",
    whiteSpace: "nowrap",
  },
  td: {
    padding: 10,
    borderBottom: "1px solid #1e293b",
    whiteSpace: "nowrap",
  },
  tdDireita: {
    padding: 10,
    borderBottom: "1px solid #1e293b",
    textAlign: "right",
    whiteSpace: "nowrap",
  },
  rodape: {
    marginTop: 12,
    color: "#94a3b8",
    fontSize: 12,
  },
  infoSecundaria: {
    marginBottom: 0,
    color: "#94a3b8",
    fontSize: 13,
  },
  erro: {
    background: "#7f1d1d",
    border: "1px solid #ef4444",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  relatorioImpressao: {
    display: "none",
    background: "white",
    color: "#111",
  },
  relatorioCabecalho: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
    borderBottom: "2px solid #111",
    paddingBottom: 10,
    marginBottom: 12,
  },
  relatorioH1: {
    margin: 0,
    fontSize: 22,
  },
  relatorioH2: {
    margin: "4px 0 0",
    fontSize: 16,
  },
  relatorioH3: {
    margin: "0 0 8px",
    fontSize: 13,
  },
  relatorioData: {
    fontSize: 10,
    textAlign: "right",
  },
  relatorioLinha: {
    marginBottom: 10,
    fontSize: 11,
  },
  relatorioCards: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 7,
    marginBottom: 12,
  },
  relatorioCard: {
    border: "1px solid #777",
    padding: 7,
  },
  relatorioCardTitulo: {
    fontSize: 9,
    color: "#333",
  },
  relatorioCardValor: {
    marginTop: 3,
    fontWeight: 800,
    fontSize: 14,
  },
  relatorioBloco: {
    marginTop: 12,
    marginBottom: 12,
  },
  relatorioTabela: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 9.5,
  },
  relatorioTh: {
    border: "1px solid #777",
    background: "#eee",
    color: "#000",
    padding: "5px 6px",
    textAlign: "left",
  },
  relatorioTd: {
    border: "1px solid #777",
    color: "#000",
    padding: "5px 6px",
    verticalAlign: "top",
  },
  relatorioTexto: {
    marginBottom: 4,
    fontSize: 10,
  },
  relatorioResumoResultado: {
    display: "flex",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 8,
    fontSize: 10,
  },
  relatorioAviso: {
    border: "1px solid #999",
    padding: 9,
    fontSize: 10,
  },
  relatorioFonte: {
    borderTop: "1px solid #777",
    paddingTop: 8,
    marginTop: 14,
    fontSize: 9,
  },
};
