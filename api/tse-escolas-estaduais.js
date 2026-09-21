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

function normalizar(texto = "") {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\bEE\b/g, " ")
    .replace(/\bE E\b/g, " ")
    .replace(/\bESCOLA ESTADUAL\b/g, " ")
    .replace(/\bESC ESTADUAL\b/g, " ")
    .replace(/\bCOLEGIO ESTADUAL\b/g, " ")
    .replace(/\bPROFESSOR\b/g, " ")
    .replace(/\bPROFESSORA\b/g, " ")
    .replace(/\bPROF\b/g, " ")
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(texto) {
  const ignorar = new Set([
    "DE",
    "DA",
    "DO",
    "DAS",
    "DOS",
    "E",
    "DR",
    "DRA",
  ]);

  return new Set(
    normalizar(texto)
      .split(" ")
      .filter((p) => p.length > 1 && !ignorar.has(p))
  );
}

function similaridade(a, b) {
  const na = normalizar(a);
  const nb = normalizar(b);

  if (!na || !nb) return 0;

  if (na === nb) return 1;

  if (na.includes(nb) || nb.includes(na)) {
    return 0.95;
  }

  const ta = tokens(a);
  const tb = tokens(b);

  const uniao = new Set([...ta, ...tb]);

  let intersecao = 0;

  for (const item of ta) {
    if (tb.has(item)) intersecao++;
  }

  if (!uniao.size) return 0;

  return intersecao / uniao.size;
}

function idSeguro(texto = "") {
  return normalizar(texto)
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 120);
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

    const [snapGestores, snapSecoes] = await Promise.all([
      db.collection("reunioes_gestores").get(),
      db.collection("secoes_tse_2026").get(),
    ]);

    const escolasRadar = new Map();

    for (const doc of snapGestores.docs) {
      const d = doc.data();

      const escola = String(d.escola || "").trim();
      const municipio = String(
        d.municipio || d["município"] || ""
      ).trim();

      if (!escola || !municipio) continue;

      const chave =
        `${normalizar(municipio)}|${normalizar(escola)}`;

      if (!escolasRadar.has(chave)) {
        escolasRadar.set(chave, {
          escola,
          municipio,
        });
      }
    }

    const locaisPorMunicipio = new Map();

    for (const doc of snapSecoes.docs) {
      const d = doc.data();

      if (!d.nomeLocalVotacao || !d.municipio) continue;

      const municipioNorm = normalizar(d.municipio);

      if (!locaisPorMunicipio.has(municipioNorm)) {
        locaisPorMunicipio.set(municipioNorm, new Map());
      }

      const chaveLocal =
        `${d.zona}|${d.numeroLocalVotacao}`;

      const locais = locaisPorMunicipio.get(municipioNorm);

      if (!locais.has(chaveLocal)) {
        locais.set(chaveLocal, {
          municipio: d.municipio,
          codigoMunicipio: d.codigoMunicipio || null,
          zona: d.zona,
          numeroLocalVotacao: d.numeroLocalVotacao,
          nomeLocalVotacao: d.nomeLocalVotacao,
          enderecoLocalVotacao:
            d.enderecoLocalVotacao || "",
          secoes: [],
        });
      }

      locais.get(chaveLocal).secoes.push(
        String(d.secao)
      );
    }

    let batch = db.batch();
    let operacoes = 0;

    let encontrados = 0;
    let naoEncontrados = 0;

    const pendentes = [];

    async function salvarBatch() {
      if (operacoes === 0) return;

      await batch.commit();

      batch = db.batch();
      operacoes = 0;
    }

    for (const escolaRadar of escolasRadar.values()) {
      const municipioNorm =
        normalizar(escolaRadar.municipio);

      const locais =
        locaisPorMunicipio.get(municipioNorm);

      let melhor = null;
      let melhorScore = 0;

      if (locais) {
        for (const local of locais.values()) {
          const score = similaridade(
            escolaRadar.escola,
            local.nomeLocalVotacao
          );

          if (score > melhorScore) {
            melhorScore = score;
            melhor = local;
          }
        }
      }

      if (melhor && melhorScore >= 0.68) {
        encontrados++;

        const id =
          `${idSeguro(escolaRadar.municipio)}_` +
          `${idSeguro(escolaRadar.escola)}`;

        const ref = db
          .collection("escolas_tse_2026")
          .doc(id);

        batch.set(
          ref,
          {
            escolaRadar: escolaRadar.escola,
            municipio: escolaRadar.municipio,

            codigoMunicipio:
              melhor.codigoMunicipio,

            zona: melhor.zona,

            numeroLocalVotacao:
              melhor.numeroLocalVotacao,

            nomeLocalVotacaoTSE:
              melhor.nomeLocalVotacao,

            enderecoLocalVotacao:
              melhor.enderecoLocalVotacao,

            secoes: melhor.secoes.sort(
              (a, b) => Number(a) - Number(b)
            ),

            totalSecoes: melhor.secoes.length,

            similaridade:
              Number(melhorScore.toFixed(3)),

            confirmadoAutomaticamente:
              melhorScore >= 0.8,

            atualizadoEm:
              FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        operacoes++;

        if (operacoes >= 400) {
          await salvarBatch();
        }
      } else {
        naoEncontrados++;

        pendentes.push({
          municipio: escolaRadar.municipio,
          escola: escolaRadar.escola,
          melhorLocal:
            melhor?.nomeLocalVotacao || null,
          similaridade:
            Number(melhorScore.toFixed(3)),
        });
      }
    }

    await salvarBatch();

    await db
      .collection("meta_tse_2026")
      .doc("escolas_estaduais")
      .set(
        {
          totalEscolasRadar:
            escolasRadar.size,

          encontradas: encontrados,
naoEncontradas: naoEncontrados,

          atualizadoEm:
            FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return res.status(200).json({
      ok: true,

      totalEscolasRadar:
        escolasRadar.size,

      encontradas: encontrados,
naoEncontradas: naoEncontrados,

      pendentes:
        pendentes.slice(0, 30),

      duracaoMs:
        Date.now() - inicio,
    });
  } catch (erro) {
    console.error(
      "Erro tse-escolas-estaduais:",
      erro
    );

    return res.status(500).json({
      ok: false,
      erro: erro.message,
      duracaoMs:
        Date.now() - inicio,
    });
  }
}
