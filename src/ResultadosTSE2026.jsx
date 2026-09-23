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

export default function ResultadosTSE2026({ onVoltar }) {
  const [dados, setDados] = useState([]);
  const [erro, setErro] = useState("");
  const [municipio, setMunicipio] = useState("GERAL");
  const [cargo, setCargo] = useState("3");
  const [escolasTSE, setEscolasTSE] = useState([]);
  const [escolaId, setEscolaId] = useState("GERAL");
  const [resultadosEscolas, setResultadosEscolas] = useState([]);
  const [eleitoradoMunicipios, setEleitoradoMunicipios] = useState([]);

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
    </div>
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
};
