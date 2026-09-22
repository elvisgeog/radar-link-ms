import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

function iniciarFirebaseAdmin() {
  if (!getApps().length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_B64 não configurada na Vercel."
      );
    }

    const json = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_B64,
      "base64"
    ).toString("utf8");

    initializeApp({
      credential: cert(JSON.parse(json)),
    });
  }

  return getFirestore();
}

function autorizado(req) {
  const segredo = process.env.CRON_SECRET;

  if (!segredo) return false;

  return (
    (req.headers.authorization || "") ===
    `Bearer ${segredo}`
  );
}

function pad(valor, tamanho) {
  return String(valor).padStart(tamanho, "0");
}

function configuracaoTSE() {
  return {
    base: (
      process.env.TSE_BASE_URL ||
      "https://resultados-sim.tse.jus.br/simulado"
    ).replace(/\/+$/, ""),

    ambiente:
      process.env.TSE_AMBIENTE ||
      "simulado2026",

    ciclo:
      process.env.TSE_CICLO ||
      "ele2026",

    pleito:
      String(
        process.env.TSE_PLEITO ||
        "17801"
      ),

    uf:
      String(
        process.env.TSE_UF ||
        "ms"
      ).toLowerCase(),
  };
}

function urlEA18({
  codigoMunicipio,
  zona,
  secao,
}) {
  const {
    base,
    ambiente,
    ciclo,
    pleito,
    uf,
  } = configuracaoTSE();

  const p = pad(pleito, 6);
  const m = pad(codigoMunicipio, 5);
  const z = pad(zona, 4);
  const s = pad(secao, 4);

  return (
    `${base}/${ambiente}/${ciclo}` +
    `/arquivo-urna/${pleito}` +
    `/dados/${uf}/${m}/${z}/${s}` +
    `/p${p}-${uf}-m${m}-z${z}-s${s}-aux.json`
  );
}

function urlArquivoUrna({
  codigoMunicipio,
  zona,
  secao,
  hash,
  nome,
}) {
  const {
    base,
    ambiente,
    ciclo,
    pleito,
    uf,
  } = configuracaoTSE();

  const m = pad(codigoMunicipio, 5);
  const z = pad(zona, 4);
  const s = pad(secao, 4);

  return (
    `${base}/${ambiente}/${ciclo}` +
    `/arquivo-urna/${pleito}` +
    `/dados/${uf}/${m}/${z}/${s}` +
    `/${hash}/${encodeURIComponent(nome)}`
  );
}

function ehArquivoBU(nome = "", tipo = "") {
  const n = String(nome).toLowerCase();
  const t = String(tipo).toLowerCase();

  return (
    n.endsWith(".bu") ||
    t === "bu" ||
    t.includes("boletim")
  );
}

async function consultarEA18(item) {
  const url = urlEA18(item);

  try {
    const resposta = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (resposta.status === 404) {
      return {
        ...item,
        ea18Disponivel: false,
        statusHTTP: 404,
        arquivosBU: [],
        hashes: [],
      };
    }

    if (!resposta.ok) {
      return {
        ...item,
        ea18Disponivel: false,
        statusHTTP: resposta.status,
        arquivosBU: [],
        hashes: [],
      };
    }

    const dados = await resposta.json();

    const hashesOriginais =
      Array.isArray(dados.hashes)
        ? dados.hashes
        : [];

    const hashes = [];
    const arquivosBU = [];

    for (const hashItem of hashesOriginais) {
      const hash =
        hashItem.hash || null;

      const arquivos =
        Array.isArray(hashItem.arq)
          ? hashItem.arq
          : [];

      const arquivosTratados = [];

      for (const arquivo of arquivos) {
        const nome =
          arquivo.nm || "";

        const tipo =
          arquivo.tp || "";

        const urlArquivo =
          hash && nome
            ? urlArquivoUrna({
                ...item,
                hash,
                nome,
              })
            : null;

        const registro = {
          nome,
          tipo,
          url: urlArquivo,
        };

        arquivosTratados.push(registro);

        if (
          hash &&
          nome &&
          ehArquivoBU(nome, tipo)
        ) {
          arquivosBU.push({
            hash,
            nome,
            tipo,
            url: urlArquivo,
            dataRecebimento:
              hashItem.dr || null,
            horaRecebimento:
              hashItem.hr || null,
            situacao:
              hashItem.st || null,
          });
        }
      }

      hashes.push({
        hash,
        dataRecebimento:
          hashItem.dr || null,
        horaRecebimento:
          hashItem.hr || null,
        situacao:
          hashItem.st || null,
        arquivos:
          arquivosTratados,
      });
    }

    return {
      ...item,

      ea18Disponivel: true,

      situacaoSecao:
        dados.st || null,

      fase:
        dados.f || null,

      dataGeracao:
        dados.dg || null,

      horaGeracao:
        dados.hg || null,

      idGeracao:
        dados.idg || null,

      hashes,
      arquivosBU,

      buDisponivel:
        arquivosBU.length > 0,

      statusHTTP: 200,
    };
  } catch (erro) {
    return {
      ...item,
      ea18Disponivel: false,
      statusHTTP: null,
      arquivosBU: [],
      hashes: [],
      erro: erro.message,
    };
  }
}

async function executarComLimite(
  itens,
  limite,
  executor
) {
  const resultados = new Array(
    itens.length
  );

  let indice = 0;

  async function trabalhador() {
    while (true) {
      const atual = indice++;

      if (atual >= itens.length) {
        return;
      }

      resultados[atual] =
        await executor(itens[atual]);
    }
  }

  const quantidade = Math.min(
    limite,
    itens.length
  );

  await Promise.all(
    Array.from(
      { length: quantidade },
      () => trabalhador()
    )
  );

  return resultados;
}

export default async function handler(
  req,
  res
) {
  const inicio = Date.now();

  if (!autorizado(req)) {
    return res.status(401).json({
      ok: false,
      erro: "Não autorizado",
    });
  }

  try {
    const db =
      iniciarFirebaseAdmin();

    const escolasSnap =
      await db
        .collection(
          "escolas_tse_2026"
        )
        .get();

    const secoesMap = new Map();

    for (
      const escolaDoc
      of escolasSnap.docs
    ) {
      const escola =
        escolaDoc.data();

      const codigoMunicipio =
        escola.codigoMunicipio;

      const zona =
        escola.zona;

      const secoes =
        Array.isArray(escola.secoes)
          ? escola.secoes
          : [];

      if (
        !codigoMunicipio ||
        !zona ||
        !secoes.length
      ) {
        continue;
      }

      for (const secao of secoes) {
        const chave =
          `${codigoMunicipio}_` +
          `${zona}_${secao}`;

        if (!secoesMap.has(chave)) {
          secoesMap.set(chave, {
            codigoMunicipio:
              String(codigoMunicipio),

            municipio:
              escola.municipio || "",

            zona:
              String(zona),

            secao:
              String(secao),

            escolas: [],
          });
        }

        secoesMap
          .get(chave)
          .escolas
          .push({
            id: escolaDoc.id,
            nome:
              escola.escolaRadar ||
              escola.nomeLocalVotacaoTSE ||
              escolaDoc.id,
          });
      }
    }

    const secoes =
      [...secoesMap.values()];

    const resultados =
      await executarComLimite(
        secoes,
        12,
        consultarEA18
      );

    let batch =
      db.batch();

    let operacoes = 0;

    async function salvarBatch() {
      if (!operacoes) return;

      await batch.commit();

      batch = db.batch();
      operacoes = 0;
    }

    let ea18Disponiveis = 0;
    let busDisponiveis = 0;
    let erros = 0;

    const escolasComBU =
      new Map();

    for (const resultado of resultados) {
      const id =
        `ms_` +
        `${pad(
          resultado.codigoMunicipio,
          5
        )}_` +
        `${pad(resultado.zona, 4)}_` +
        `${pad(resultado.secao, 4)}`;

      if (resultado.ea18Disponivel) {
        ea18Disponiveis++;
      }

      if (resultado.buDisponivel) {
        busDisponiveis++;
      }

      if (resultado.erro) {
        erros++;
      }

      for (
        const escola
        of resultado.escolas || []
      ) {
        if (
          !escolasComBU.has(
            escola.id
          )
        ) {
          escolasComBU.set(
            escola.id,
            {
              total: 0,
              comBU: 0,
            }
          );
        }

        const resumo =
          escolasComBU.get(
            escola.id
          );

        resumo.total++;

        if (
          resultado.buDisponivel
        ) {
          resumo.comBU++;
        }
      }

      const ref = db
        .collection(
          "bus_tse_2026"
        )
        .doc(id);

      batch.set(
        ref,
        {
          uf: "MS",

          codigoMunicipio:
            resultado.codigoMunicipio,

          municipio:
            resultado.municipio,

          zona:
            resultado.zona,

          secao:
            resultado.secao,

          escolas:
            resultado.escolas || [],

          ea18Disponivel:
            Boolean(
              resultado.ea18Disponivel
            ),

          buDisponivel:
            Boolean(
              resultado.buDisponivel
            ),

          situacaoSecao:
            resultado.situacaoSecao ||
            null,

          fase:
            resultado.fase || null,

          dataGeracao:
            resultado.dataGeracao ||
            null,

          horaGeracao:
            resultado.horaGeracao ||
            null,

          idGeracao:
            resultado.idGeracao ||
            null,

          hashes:
            resultado.hashes || [],

          arquivosBU:
            resultado.arquivosBU ||
            [],

          statusHTTP:
            resultado.statusHTTP ??
            null,

          erro:
            resultado.erro || null,

          atualizadoEm:
            FieldValue.serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      operacoes++;

      if (operacoes >= 350) {
        await salvarBatch();
      }
    }

    await salvarBatch();

    let batchEscolas =
      db.batch();

    let operacoesEscolas = 0;

    async function salvarEscolas() {
      if (!operacoesEscolas) return;

      await batchEscolas.commit();

      batchEscolas = db.batch();
      operacoesEscolas = 0;
    }

    for (
      const [
        escolaId,
        resumo,
      ]
      of escolasComBU.entries()
    ) {
      const ref = db
        .collection(
          "escolas_tse_2026"
        )
        .doc(escolaId);

      batchEscolas.set(
        ref,
        {
          buTotalSecoes:
            resumo.total,

          buSecoesDisponiveis:
            resumo.comBU,

          buSincronizadoEm:
            FieldValue.serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      operacoesEscolas++;

      if (
        operacoesEscolas >= 350
      ) {
        await salvarEscolas();
      }
    }

    await salvarEscolas();

    await db
      .collection("meta_tse_2026")
      .doc("bus")
      .set(
        {
          fonte:
            "TSE EA18",

          totalEscolas:
            escolasSnap.size,

          totalSecoes:
            secoes.length,

          ea18Disponiveis,

          busDisponiveis,

          erros,

          ambiente:
            configuracaoTSE()
              .ambiente,

          atualizadoEm:
            FieldValue.serverTimestamp(),
        },
        {
          merge: true,
        }
      );

    return res
      .status(200)
      .json({
        ok: true,

        ambiente:
          configuracaoTSE()
            .ambiente,

        totalEscolas:
          escolasSnap.size,

        totalSecoes:
          secoes.length,

        ea18Disponiveis,

        busDisponiveis,

        erros,

        duracaoMs:
          Date.now() - inicio,
      });
  } catch (erro) {
    console.error(
      "Erro tse-bus-sync:",
      erro
    );

    return res
      .status(500)
      .json({
        ok: false,
        erro:
          erro.message,
        duracaoMs:
          Date.now() - inicio,
      });
  }
}
