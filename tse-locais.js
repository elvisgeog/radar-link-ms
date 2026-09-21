import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const MUNICIPIOS_CRE5 = [
  "CAARAPÓ",
  "DEODÁPOLIS",
  "DOURADINA",
  "DOURADOS",
  "FÁTIMA DO SUL",
  "GLÓRIA DE DOURADOS",
  "ITAPORÃ",
  "JATEÍ",
  "LAGUNA CARAPÃ",
  "MARACAJU",
  "RIO BRILHANTE",
  "VICENTINA",
];

function normalizar(valor = "") {
  return String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

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

    const serviceAccount = JSON.parse(json);

    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return getFirestore();
}

function autorizado(req) {
  const segredo = process.env.CRON_SECRET;

  if (!segredo) return true;

  const auth = req.headers.authorization || "";
  return auth === `Bearer ${segredo}`;
}

function urlEA16() {
  const base = (
    process.env.TSE_BASE_URL ||
    "https://resultados-sim.tse.jus.br/simulado"
  ).replace(/\/+$/, "");

  const ambiente = process.env.TSE_AMBIENTE || "simulado2026";
  const ciclo = process.env.TSE_CICLO || "ele2026";
  const pleito = String(process.env.TSE_PLEITO || "17801");
  const pleitoArquivo = pleito.padStart(6, "0");
  const uf = (process.env.TSE_UF || "ms").toLowerCase();

  return `${base}/${ambiente}/${ciclo}/arquivo-urna/${pleito}/config/${uf}/${uf}-p${pleitoArquivo}-cs.json`;
}

async function baixarJSON(url) {
  const resposta = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!resposta.ok) {
    throw new Error(`TSE respondeu HTTP ${resposta.status}: ${url}`);
  }

  return resposta.json();
}

export default async function handler(req, res) {
  const inicio = Date.now();

  if (!autorizado(req)) {
    return res.status(401).json({
      ok: false,
      erro: "Não autorizado",
    });
  }

  try {
    const db = iniciarFirebaseAdmin();
    const url = urlEA16();
    const dados = await baixarJSON(url);

    const ms = (dados.abr || []).find(
      (item) => normalizar(item.cd) === "MS"
    );

    if (!ms) {
      throw new Error("Mato Grosso do Sul não encontrado no EA16.");
    }

    const permitidos = new Set(MUNICIPIOS_CRE5.map(normalizar));

    let batch = db.batch();
    let operacoes = 0;
    let totalGravado = 0;

    const resumoMunicipios = {};

    async function gravarBatch() {
      if (operacoes === 0) return;

      await batch.commit();

      batch = db.batch();
      operacoes = 0;
    }

    for (const municipio of ms.mu || []) {
      if (!permitidos.has(normalizar(municipio.nm))) continue;

      let quantidadeSecoes = 0;

      for (const zona of municipio.zon || []) {
        for (const secao of zona.sec || []) {
          const id = `ms_${municipio.cd}_${zona.cd}_${secao.ns}`;

          const ref = db.collection("secoes_tse_2026").doc(id);

          batch.set(
            ref,
            {
              uf: "MS",

              municipio: municipio.nm,
              municipioNormalizado: normalizar(municipio.nm),
              codigoMunicipio: municipio.cd,

              zona: zona.cd,
              secao: secao.ns,

              secaoPrincipal: secao.nsp || null,
              secoesAgregadas: Array.isArray(secao.nsa)
                ? secao.nsa
                : [],

              dataArquivoAuxiliar: secao.da || null,
              horaArquivoAuxiliar: secao.ha || null,

              pleito: String(dados.cdp || "17801"),
              fase: dados.f || null,
              idGeracaoTSE: dados.idg || null,
              dataGeracaoTSE: dados.dg || null,
              horaGeracaoTSE: dados.hg || null,

              atualizadoEm: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          operacoes++;
          totalGravado++;
          quantidadeSecoes++;

          if (operacoes >= 400) {
            await gravarBatch();
          }
        }
      }

      resumoMunicipios[municipio.nm] = quantidadeSecoes;
    }

    await gravarBatch();

    await db.collection("meta_tse_2026").doc("secoes").set(
      {
        fonte: "TSE EA16",
        url,
        totalSecoes: totalGravado,
        municipios: resumoMunicipios,
        atualizadoEm: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.status(200).json({
      ok: true,
      fonte: "EA16",
      totalSecoes: totalGravado,
      municipios: resumoMunicipios,
      duracaoMs: Date.now() - inicio,
    });
  } catch (erro) {
    console.error("Erro tse-locais:", erro);

    return res.status(500).json({
      ok: false,
      erro: erro.message,
      duracaoMs: Date.now() - inicio,
    });
  }
}
