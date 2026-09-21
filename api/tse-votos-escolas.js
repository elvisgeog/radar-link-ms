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

  if (!segredo) return true;

  return (req.headers.authorization || "") === `Bearer ${segredo}`;
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
  const municipio = pad(codigoMunicipio, 5);
  const z = pad(zona, 4);
  const s = pad(secao, 4);

  return (
    `${base}/${ambiente}/${ciclo}` +
    `/arquivo-urna/${pleito}` +
    `/dados/${uf}/${municipio}/${z}/${s}` +
    `/p${p}-${uf}-m${municipio}-z${z}-s${s}-aux.json`
  );
}

function urlArquivoUrna({
  codigoMunicipio,
  zona,
  secao,
  hash,
  nomeArquivo,
}) {
  const {
    base,
    ambiente,
    ciclo,
    pleito,
    uf,
  } = configuracaoTSE();

  const municipio =
    pad(codigoMunicipio, 5);

  const z = pad(zona, 4);
  const s = pad(secao, 4);

  return (
    `${base}/${ambiente}/${ciclo}` +
    `/arquivo-urna/${pleito}` +
    `/dados/${uf}/${municipio}/${z}/${s}` +
    `/${hash}/${nomeArquivo}`
  );
}

async function consultarSecao({
  codigoMunicipio,
  zona,
  secao,
}) {
  const url = urlEA18({
    codigoMunicipio,
    zona,
    secao,
  });

  const resposta = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (resposta.status === 404) {
    return {
      secao: String(secao),
      disponivel: false,
      statusHTTP: 404,
    };
  }

  if (!resposta.ok) {
    return {
      secao: String(secao),
      disponivel: false,
      statusHTTP: resposta.status,
    };
  }

  const dados = await resposta.json();
if (String(secao) === "113") {
  console.log("EA18 RAW SECAO 113:", JSON.stringify(dados));

  return {
    secao: String(secao),
    disponivel: true,
    debugRaw: dados,
  };
}
  const hashes = Array.isArray(dados.hashes)
    ? dados.hashes
    : [];

  const recebimentos = hashes.map(
    (item) => {
      const arquivos = Array.isArray(item.arq)
        ? item.arq
        : [];

      return {
        hash: item.hash || null,
        dataRecebimento:
          item.dr || null,
        horaRecebimento:
          item.hr || null,
        situacao:
          item.st || null,

        arquivos: arquivos.map(
          (arquivo) => ({
            nome:
              arquivo.nm || null,

            tipo:
              arquivo.tp || null,

            url:
              item.hash &&
              arquivo.nm
                ? urlArquivoUrna({
                    codigoMunicipio,
                    zona,
                    secao,
                    hash:
                      item.hash,
                    nomeArquivo:
                      arquivo.nm,
                  })
                : null,
          })
        ),
      };
    }
  );

  return {
    secao: String(secao),
    disponivel: true,

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

    recebimentos,
  };
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
    const id =
      typeof req.query?.id === "string"
        ? req.query.id
        : "";

    if (!id) {
      return res.status(400).json({
        ok: false,
        erro:
          "Informe o ID da escola no parâmetro ?id=",
        exemplo:
          "/api/tse-votos-escolas?id=dourados_abigail_borralho",
      });
    }

    const db =
      iniciarFirebaseAdmin();

    const ref = db
      .collection("escolas_tse_2026")
      .doc(id);

    const snap =
      await ref.get();

    if (!snap.exists) {
      return res.status(404).json({
        ok: false,
        erro:
          "Escola não encontrada em escolas_tse_2026.",
      });
    }

    const escola =
      snap.data();

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
      throw new Error(
        "A escola não possui município, zona e seções completos."
      );
    }

    const resultados = [];

    // Consulta sequencial para evitar excesso
    // de requisições ao servidor do TSE.
    for (const secao of secoes) {
      const resultado =
        await consultarSecao({
          codigoMunicipio,
          zona,
          secao,
        });

      resultados.push(resultado);
    }

    const secoesDisponiveis =
      resultados.filter(
        (item) =>
          item.disponivel
      ).length;

    await ref.set(
      {
        ea18Secoes:
          resultados,

        ea18SecoesDisponiveis:
          secoesDisponiveis,

        ea18AtualizadoEm:
          FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    return res.status(200).json({
      ok: true,

      escola:
        escola.escolaRadar,

      municipio:
        escola.municipio,

      zona:
        String(zona),

      totalSecoes:
        secoes.length,

      secoesDisponiveis,

      secoes:
        resultados,

      duracaoMs:
        Date.now() - inicio,
    });
  } catch (erro) {
    console.error(
      "Erro tse-votos-escolas:",
      erro
    );

    return res.status(500).json({
      ok: false,
      erro:
        erro.message,
      duracaoMs:
        Date.now() - inicio,
    });
  }
}
