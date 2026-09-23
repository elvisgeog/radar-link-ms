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

function pareceEscolaEstadual(nome = "") {
  const n = String(nome)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();

  return (
    n.startsWith("EE ") ||
    n.startsWith("E E ") ||
    n.startsWith("EEPG ") ||
    n.startsWith("EEPSG ") ||
    n.startsWith("ESCOLA ESTADUAL ") ||
    n.startsWith("ESC ESTADUAL ") ||
    n.startsWith("CEEP ") ||
    n.startsWith("CEEJA ") ||
    n.startsWith("CENTRO ESTADUAL ")
  );
}

function idSeguro(texto = "") {
  return normalizar(texto)
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 120);
}

function ehCeepCeejaDourados(nome = "", municipio = "") {
  const n = normalizar(nome);
  const m = normalizar(municipio);

  if (m !== "DOURADOS") return false;

  return (
    n.includes("CEEJA") ||
    n.includes("CENTRO ESTADUAL DE EDUCACAO PROFISSIONAL")
  );
}

function canonizarNomeEscola(nome = "", municipio = "") {
  const original = String(nome || "").trim();

  if (!original) return "";

  if (ehCeepCeejaDourados(original, municipio)) {
    return "CENTRO ESTADUAL DE EDUCAÇÃO PROFISSIONAL E CEEJA/MS";
  }

  if (normalizar(municipio) !== "DOURADOS") {
    return original;
  }

  const n = normalizar(original);

  if (
    n.includes("ALICIO ARAUJO") ||
    n.includes("ALICIO DE ARAUJO")
  ) {
    return "EE PROF. ALÍCIO ARAÚJO";
  }

  if (n.includes("CELSO MULLER DO AMARAL")) {
    return "EE PROF. CELSO MÜLLER DO AMARAL";
  }

  if (
    n === "DJALMA BARROS" ||
    n.includes("MOACIR DJALMA BARROS")
  ) {
    return "EE VEREADOR MOACIR DJALMA BARROS";
  }

  if (n.includes("GETULIO VARGAS")) {
    return "EE PRES. GETÚLIO VARGAS";
  }

  if (n.includes("JOAO PAULO DOS REIS VELOSO")) {
    return "EE MIN. JOÃO PAULO DOS REIS VELOSO";
  }

  return original;
}

function chaveLocal(municipio, zona, numeroLocalVotacao) {
  return [
    normalizar(municipio),
    String(zona ?? ""),
    String(numeroLocalVotacao ?? ""),
  ].join("|");
}

function escolherCandidato(atual, novo) {
  if (!atual) return novo;

  const atualRadar = atual.origem !== "TSE";
  const novoRadar = novo.origem !== "TSE";

  if (novoRadar && !atualRadar) return novo;
  if (atualRadar && !novoRadar) return atual;

  if (novo.melhorScore > atual.melhorScore) return novo;
  if (atual.melhorScore > novo.melhorScore) return atual;

  return String(novo.escolaRadar.escola).localeCompare(
    String(atual.escolaRadar.escola),
    "pt-BR"
  ) < 0
    ? novo
    : atual;
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

      const escolaOriginal = String(d.escola || "").trim();

      const municipio = String(
        d.municipio || d["município"] || ""
      ).trim();

      const escola = canonizarNomeEscola(
        escolaOriginal,
        municipio
      );

      if (!escola || !municipio) continue;

      const chave =
        `${normalizar(municipio)}|${normalizar(escola)}`;

      if (!escolasRadar.has(chave)) {
        escolasRadar.set(chave, {
          escola,
          municipio,
          origem: "RADAR",
        });
      }
    }

    const locaisPorMunicipio = new Map();

    for (const doc of snapSecoes.docs) {
      const d = doc.data();

      if (!d.nomeLocalVotacao || !d.municipio) continue;

      const municipioNorm = normalizar(d.municipio);

      if (!locaisPorMunicipio.has(municipioNorm)) {
        locaisPorMunicipio.set(
          municipioNorm,
          new Map()
        );
      }

      const chave =
        `${d.zona}|${d.numeroLocalVotacao}`;

      const locais =
        locaisPorMunicipio.get(municipioNorm);

      if (!locais.has(chave)) {
        locais.set(chave, {
          municipio: d.municipio,
          codigoMunicipio:
            d.codigoMunicipio || null,
          zona: d.zona,
          numeroLocalVotacao:
            d.numeroLocalVotacao,
          nomeLocalVotacao:
            d.nomeLocalVotacao,
          enderecoLocalVotacao:
            d.enderecoLocalVotacao || "",
          secoes: [],
        });
      }

      locais.get(chave).secoes.push(
        String(d.secao)
      );
    }

    for (
      const locais of locaisPorMunicipio.values()
    ) {
      for (const local of locais.values()) {
        if (
          !pareceEscolaEstadual(
            local.nomeLocalVotacao
          )
        ) {
          continue;
        }

        const nomeLocalUnificado =
          canonizarNomeEscola(
            local.nomeLocalVotacao,
            local.municipio
          );

        const chave =
          `${normalizar(local.municipio)}|` +
          `${normalizar(nomeLocalUnificado)}`;

        if (!escolasRadar.has(chave)) {
          escolasRadar.set(chave, {
            escola: nomeLocalUnificado,
            municipio: local.municipio,
            origem: "TSE",
          });
        }
      }
    }

    const candidatosEncontrados = [];
    const pendentes = [];

    for (
      const escolaRadar of escolasRadar.values()
    ) {
      const municipioNorm =
        normalizar(escolaRadar.municipio);

      const locais =
        locaisPorMunicipio.get(municipioNorm);

      let melhor = null;
      let melhorScore = 0;

      if (locais) {
        for (const local of locais.values()) {
          const scoreBase = similaridade(
            escolaRadar.escola,
            local.nomeLocalVotacao
          );

          const escolaNorm =
            normalizar(escolaRadar.escola);

          const localNorm =
            normalizar(local.nomeLocalVotacao);

          const score =
            escolaNorm.includes("CEEJA") &&
            localNorm.includes("CEEJA")
              ? 1
              : scoreBase;

          if (score > melhorScore) {
            melhorScore = score;
            melhor = local;
          }
        }
      }

      if (melhor && melhorScore >= 0.68) {
        candidatosEncontrados.push({
          escolaRadar,
          melhor,
          melhorScore,
          origem:
            escolaRadar.origem || "RADAR",
        });
      } else {
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

    const porLocalTSE = new Map();
    const duplicidadesEliminadas = [];

    for (const candidato of candidatosEncontrados) {
      const chave = chaveLocal(
        candidato.melhor.municipio,
        candidato.melhor.zona,
        candidato.melhor.numeroLocalVotacao
      );

      const atual = porLocalTSE.get(chave);

      if (!atual) {
        porLocalTSE.set(chave, candidato);
        continue;
      }

      const escolhido = escolherCandidato(
        atual,
        candidato
      );

      const descartado =
        escolhido === atual
          ? candidato
          : atual;

      porLocalTSE.set(chave, escolhido);

      duplicidadesEliminadas.push({
        chaveLocalTSE: chave,
        mantida:
          escolhido.escolaRadar.escola,
        descartada:
          descartado.escolaRadar.escola,
        nomeLocalVotacaoTSE:
          escolhido.melhor.nomeLocalVotacao,
        secoes:
          escolhido.melhor.secoes
            .map(Number)
            .sort((a, b) => a - b),
      });
    }

    const finais =
      Array.from(porLocalTSE.values());

    let batch = db.batch();
    let operacoes = 0;

    async function salvarBatch() {
      if (operacoes === 0) return;

      await batch.commit();

      batch = db.batch();
      operacoes = 0;
    }

    for (const candidato of finais) {
      const {
        escolaRadar,
        melhor,
        melhorScore,
      } = candidato;

      const nomeCanonico =
        canonizarNomeEscola(
          escolaRadar.escola,
          escolaRadar.municipio
        );

      const id =
        `${idSeguro(escolaRadar.municipio)}_` +
        `${idSeguro(nomeCanonico)}`;

      const ref = db
        .collection("escolas_tse_2026")
        .doc(id);

      const secoesOrdenadas =
        [...new Set(melhor.secoes)]
          .map(String)
          .sort(
            (a, b) => Number(a) - Number(b)
          );

      batch.set(
        ref,
        {
          escolaRadar: nomeCanonico,
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

          secoes: secoesOrdenadas,

          totalSecoes:
            secoesOrdenadas.length,

          similaridade:
            Number(melhorScore.toFixed(3)),

          confirmadoAutomaticamente:
            melhorScore >= 0.8,

          origemCadastro:
            escolaRadar.origem || "RADAR",

          atualizadoEm:
            FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      operacoes++;

      if (operacoes >= 400) {
        await salvarBatch();
      }
    }

    await salvarBatch();

    const encontrados = finais.length;
    const naoEncontrados = pendentes.length;

    await db
      .collection("meta_tse_2026")
      .doc("escolas_estaduais")
      .set(
        {
          totalEscolasRadar:
            escolasRadar.size,

          candidatosEncontradosAntesDeduplicacao:
            candidatosEncontrados.length,

          encontradas:
            encontrados,

          naoEncontradas:
            naoEncontrados,

          duplicidadesPorLocalRemovidas:
            duplicidadesEliminadas.length,

          atualizadoEm:
            FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return res.status(200).json({
      ok: true,

      totalEscolasRadar:
        escolasRadar.size,

      candidatosEncontradosAntesDeduplicacao:
        candidatosEncontrados.length,

      encontradas:
        encontrados,

      naoEncontradas:
        naoEncontrados,

      duplicidadesPorLocalRemovidas:
        duplicidadesEliminadas.length,

      duplicidadesEliminadas:
        duplicidadesEliminadas.slice(0, 30),

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
