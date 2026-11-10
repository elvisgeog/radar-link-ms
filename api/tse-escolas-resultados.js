import admin from "firebase-admin";

// Radar Link MS — agregação de votos por escola, cargo e turno.
// Por padrão executa somente uma prévia. Gravação exige POST + confirmacao.
const COLECAO_ESCOLAS = "escolas_tse_2026";
const COLECAO_SECOES = "votos_secao_tse_2026";
const COLECAO_SAIDA = "resultados_escolas_tse_2026";
const ELEICOES_PRESIDENTE = new Map([["6257", 1], ["6258", 2]]);

function autorizado(req) {
  const esperado = process.env.CRON_SECRET;
  return Boolean(esperado) && req.headers.authorization === `Bearer ${esperado}`;
}

function dbAdmin() {
  if (!admin.apps.length) {
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
    if (!b64) throw new Error("FIREBASE_SERVICE_ACCOUNT_B64 não configurada.");
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(Buffer.from(b64, "base64").toString("utf8"))),
    });
  }
  return admin.firestore();
}

function normalizar(v = "") {
  return String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase().replace(/\s+/g, " ").trim();
}
function numero(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function campoId(v) { return String(v ?? "").trim(); }

function turnoResultado(r) {
  const codigo = Number(r?.cargoCodigo);
  const eleicao = String(Number(r?.idEleicao ?? NaN));
  if (codigo === 1) {
    // Não assumir turno para um BU presidencial sem ID oficial reconhecido.
    return ELEICOES_PRESIDENTE.get(eleicao) ?? null;
  }
  const informado = Number(r?.turno);
  return informado === 1 || informado === 2 ? informado : 1;
}
function chaveResultado(r) {
  return `${campoId(r.idEleicao)}|${campoId(r.cargoCodigo)}|${campoId(r.turno)}`;
}
function idSecao(d, id) {
  // Identificador do documento original; empregado somente no conjunto das seções.
  return String(id);
}

function novaSoma(r, turno) {
  return {
    idEleicao: r.idEleicao ?? null,
    cargoCodigo: Number(r.cargoCodigo),
    cargoNome: r.cargoNome || (Number(r.cargoCodigo) === 1 ? "Presidente" : ""),
    turno,
    comparecimento: 0, votosNominais: 0, votosLegenda: 0,
    votosValidos: 0, brancos: 0, nulos: 0, cargoSemCandidato: 0,
    candidatos: new Map(), secoes: new Set(),
  };
}
function somar(destino, r, secaoId) {
  for (const k of ["comparecimento", "votosNominais", "votosLegenda", "votosValidos", "brancos", "nulos", "cargoSemCandidato"]) {
    destino[k] += numero(r[k]);
  }
  destino.secoes.add(secaoId);
  for (const c of r.candidatos || []) {
    if (c?.numero === undefined || c?.numero === null) continue;
    const key = campoId(c.numero);
    if (!destino.candidatos.has(key)) {
      destino.candidatos.set(key, { numero: c.numero, partido: c.partido ?? null, votos: 0 });
    }
    destino.candidatos.get(key).votos += numero(c.votos);
  }
}
function serializar(r) {
  return {
    idEleicao: r.idEleicao, cargoCodigo: r.cargoCodigo, cargoNome: r.cargoNome,
    turno: r.turno, comparecimento: r.comparecimento,
    votosNominais: r.votosNominais, votosLegenda: r.votosLegenda,
    votosValidos: r.votosValidos, brancos: r.brancos, nulos: r.nulos,
    cargoSemCandidato: r.cargoSemCandidato,
    totalSecoesComBU: r.secoes.size,
    secoesComBU: [...r.secoes].sort(),
    candidatos: [...r.candidatos.values()].sort((a, b) => numero(a.numero) - numero(b.numero)),
  };
}
function idsEscolasDaSecao(itens, porNome, idsExistentes) {
  const ids = new Set();
  for (const item of itens || []) {
    const direto = campoId(item?.id || item?.escolaId || item?.docId);
    if (direto && idsExistentes.has(direto)) {
      ids.add(direto);
      continue;
    }
    const key = `${normalizar(item?.municipio)}|${normalizar(item?.escolaRadar || item?.escola || item?.nome)}`;
    const encontrado = porNome.get(key);
    if (encontrado) ids.add(encontrado);
  }
  return [...ids];
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!autorizado(req)) return res.status(401).json({ ok: false, erro: "Não autorizado." });
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, erro: "Método não permitido." });
  }
  const gravar = req.method === "POST" && req.query?.confirmar === "GRAVAR";
  if (req.method === "POST" && !gravar) {
    return res.status(400).json({ ok: false, erro: "Para gravar, use POST com ?confirmar=GRAVAR. GET faz somente prévia." });
  }
  try {
    const db = dbAdmin();
    const [escolasSnap, secoesSnap, saidaSnap] = await Promise.all([
      db.collection(COLECAO_ESCOLAS).get(),
      db.collection(COLECAO_SECOES).get(),
      db.collection(COLECAO_SAIDA).get(),
    ]);
    const escolas = new Map();
    const indiceNome = new Map();
    const existentes = new Map(saidaSnap.docs.map(d => [d.id, d.data() || {}]));
    for (const d of escolasSnap.docs) {
      const e = d.data() || {};
      escolas.set(d.id, {
        id: d.id,
        escolaRadar: e.escolaRadar || e.escola || "",
        municipio: e.municipio || "",
        nomeLocalVotacaoTSE: e.nomeLocalVotacaoTSE || e.nomeLocalVotacao || "",
        zona: e.zona ?? null,
        secoesEsperadas: Array.isArray(e.secoes) ? e.secoes.length : 0,
        resultados: new Map(),
        secoes: new Set(),
        presidente: { 1: new Set(), 2: new Set() },
      });
      indiceNome.set(`${normalizar(e.municipio)}|${normalizar(e.escolaRadar || e.escola)}`, d.id);
    }

    let presidenteIgnorado = 0;
    let duplicatasSecao = 0;
    let semEscola = 0;
    let registrosValidos = 0;
    for (const d of secoesSnap.docs) {
      const secao = d.data() || {};
      const ids = idsEscolasDaSecao(secao.escolas, indiceNome, escolas);
      if (!ids.length) { semEscola++; continue; }
      const vistosNaSecao = new Set();
      for (const r of secao.resultados || []) {
        const cargo = Number(r?.cargoCodigo);
        if (!Number.isInteger(cargo) || cargo <= 0) continue;
        const turno = turnoResultado(r);
        if (cargo === 1 && turno === null) { presidenteIgnorado++; continue; }
        const registro = { ...r, turno };
        const chave = chaveResultado(registro);
        if (vistosNaSecao.has(chave)) { duplicatasSecao++; continue; }
        vistosNaSecao.add(chave);
        const secaoId = idSecao(secao, d.id);
        registrosValidos++;
        for (const id of ids) {
          const escola = escolas.get(id);
          escola.secoes.add(secaoId);
          if (cargo === 1) escola.presidente[turno].add(secaoId);
          if (!escola.resultados.has(chave)) escola.resultados.set(chave, novaSoma(registro, turno));
          somar(escola.resultados.get(chave), registro, secaoId);
        }
      }
    }

    const resumo = {
      ok: true, modo: gravar ? "gravacao" : "previsualizacao",
      totalEscolas: escolas.size, totalDocumentosSecao: secoesSnap.size,
      registrosDeCargoValidados: registrosValidos,
      registrosPresidenteSemEleicaoIdentificada: presidenteIgnorado,
      documentosSecaoSemEscola: semEscola, duplicatasSecaoIgnoradas: duplicatasSecao,
      escolasComPresidente1: 0, escolasComPresidente2: 0,
      resultadosAAtualizar: 0, totalDocumentosASalvar: 0,
      gravacao: gravar,
    };
    const atualizacoes = [];
    for (const e of escolas.values()) {
      const novos = [...e.resultados.values()].map(serializar);
      if (!novos.length) continue; // Nunca esvaziar resultados anteriores se faltarem BUs.
      if (e.presidente[1].size) resumo.escolasComPresidente1++;
      if (e.presidente[2].size) resumo.escolasComPresidente2++;
      const anterior = existentes.get(e.id) || {};
      const porChave = new Map();
      for (const antigo of anterior.resultados || []) {
        porChave.set(chaveResultado(antigo), antigo);
      }
      for (const novo of novos) porChave.set(chaveResultado(novo), novo);
      const resultados = [...porChave.values()].sort((a, b) =>
        numero(a.cargoCodigo) - numero(b.cargoCodigo) || numero(a.turno) - numero(b.turno) ||
        numero(a.idEleicao) - numero(b.idEleicao)
      );
      resumo.resultadosAAtualizar += novos.length;
      atualizacoes.push({ id: e.id, dados: {
        escolaId: e.id, escolaRadar: e.escolaRadar, municipio: e.municipio,
        nomeLocalVotacaoTSE: e.nomeLocalVotacaoTSE, zona: e.zona,
        totalSecoesEsperadas: e.secoesEsperadas,
        // Compatibilidade com os cargos antigos (união de seções).
        totalSecoesComBU: new Set([...(anterior.secoesComBU || []), ...e.secoes]).size,
        secoesComBU: [...new Set([...(anterior.secoesComBU || []), ...e.secoes])].sort(),
        // Cobertura presidencial rigorosamente separada por turno.
        coberturaPresidente: {
          primeiroTurno: e.presidente[1].size
            ? { turno: 1, totalSecoesComBU: e.presidente[1].size, secoesComBU: [...e.presidente[1]].sort() }
            : (anterior.coberturaPresidente?.primeiroTurno || { turno: 1, totalSecoesComBU: 0, secoesComBU: [] }),
          segundoTurno: e.presidente[2].size
            ? { turno: 2, totalSecoesComBU: e.presidente[2].size, secoesComBU: [...e.presidente[2]].sort() }
            : (anterior.coberturaPresidente?.segundoTurno || { turno: 2, totalSecoesComBU: 0, secoesComBU: [] }),
        },
        resultados,
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
      }});
    }
    resumo.totalDocumentosASalvar = atualizacoes.length;
    if (!gravar) {
      return res.status(200).json({ ...resumo,
        aviso: "Prévia somente leitura: nenhuma gravação foi realizada.",
        // Quantidades não são votos: indicam apenas BUs decodificados por turno.
      });
    }
    if (!atualizacoes.length || (!resumo.escolasComPresidente1 && !resumo.escolasComPresidente2)) {
      return res.status(409).json({
        ...resumo, ok: false, gravacao: false,
        erro: "Nenhum voto presidencial decodificado por turno encontrado. Gravação cancelada para proteger resultados existentes.",
      });
    }
    let batch = db.batch();
    let pendentes = 0;
    let gravados = 0;
    for (const item of atualizacoes) {
      batch.set(db.collection(COLECAO_SAIDA).doc(item.id), item.dados, { merge: true });
      pendentes++;
      if (pendentes >= 350) {
        await batch.commit();
        gravados += pendentes;
        pendentes = 0;
        batch = db.batch();
      }
    }
    if (pendentes) { await batch.commit(); gravados += pendentes; }
    await db.collection("meta_tse_2026").doc("resultados_escolas").set({
      fonte: "Boletins de Urna TSE — agregação por eleição/cargo/turno",
      totalEscolas: escolas.size,
      totalSecoesProcessadas: secoesSnap.size,
      escolasComPresidente1: resumo.escolasComPresidente1,
      escolasComPresidente2: resumo.escolasComPresidente2,
      resultadosCargoGravados: resumo.resultadosAAtualizar,
      atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return res.status(200).json({ ...resumo, documentosGravados: gravados });
  } catch (e) {
    console.error("Falha em tse-escolas-resultados:", e);
    return res.status(500).json({ ok: false, erro: e?.message || "Erro interno." });
  }
}
