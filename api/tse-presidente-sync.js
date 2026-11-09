import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

// Resultados Eleitorais 2026 — sincronização municipal PRESIDENCIAL CRE-5.
// Arquivos TSE EA12 (configuração de municípios) e EA20 (resultado unificado).
// Não modifica os documentos de resultados por escola/BU.

const MUNICIPIOS_CRE5 = [
  "CAARAPÓ", "DEODÁPOLIS", "DOURADINA", "DOURADOS", "FÁTIMA DO SUL",
  "GLÓRIA DE DOURADOS", "ITAPORÃ", "JATEÍ", "LAGUNA CARAPÃ", "MARACAJU",
  "RIO BRILHANTE", "VICENTINA",
];

// Códigos oficiais de eleição 2026. Podem ser sobrescritos nas variáveis Vercel,
// após conferência com https://resultados.tse.jus.br/oficial/comum/config/ele-c.json.
const ELEICOES = [
  { codigo: 1, arquivo: "0001", nome: "Presidente", turno: 1, env: "TSE_ELEICAO_PRESIDENTE_T1", padrao: "6257" },
  { codigo: 1, arquivo: "0001", nome: "Presidente", turno: 2, env: "TSE_ELEICAO_PRESIDENTE_T2", padrao: "6258" },
  { codigo: 3, arquivo: "0003", nome: "Governador", turno: 1, env: "TSE_ELEICAO_ESTADUAL", padrao: "6259" },
  { codigo: 5, arquivo: "0005", nome: "Senador", turno: 1, env: "TSE_ELEICAO_ESTADUAL", padrao: "6259" },
  { codigo: 6, arquivo: "0006", nome: "Deputado Federal", turno: 1, env: "TSE_ELEICAO_ESTADUAL", padrao: "6259" },
  { codigo: 7, arquivo: "0007", nome: "Deputado Estadual", turno: 1, env: "TSE_ELEICAO_ESTADUAL", padrao: "6259" },
];

function normalizar(texto) {
  return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}
function pad(valor, digitos) { return String(valor).padStart(digitos, "0"); }
function inteiro(v) { const n = Number(v || 0); return Number.isFinite(n) ? n : 0; }
function percentualNumerico(v) {
  const n = Number(String(v ?? "0").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function dbAdmin() {
  if (!getApps().length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_B64) throw new Error("FIREBASE_SERVICE_ACCOUNT_B64 não configurada.");
    const conta = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, "base64").toString("utf8"));
    initializeApp({ credential: cert(conta) });
  }
  return getFirestore();
}
function autorizado(req) {
  const segredo = process.env.CRON_SECRET;
  return Boolean(segredo && req.headers.authorization === `Bearer ${segredo}`);
}
function ambienteTSE() {
  // Não aceitar fallback silencioso para simulado: os dados são exibidos como oficiais.
  const base = (process.env.TSE_BASE_URL || "https://resultados.tse.jus.br").replace(/\/+$/, "");
  const ambiente = process.env.TSE_AMBIENTE || "oficial";
  const ciclo = process.env.TSE_CICLO || "ele2026";
  const uf = (process.env.TSE_UF || "ms").toLowerCase();
  if (base !== "https://resultados.tse.jus.br" || ambiente !== "oficial" || ciclo !== "ele2026" || uf !== "ms") {
    throw new Error("Sincronização bloqueada: configure TSE_BASE_URL=https://resultados.tse.jus.br, TSE_AMBIENTE=oficial, TSE_CICLO=ele2026 e TSE_UF=ms.");
  }
  return { base, ambiente, ciclo, uf };
}
function codigoEleicao(item) {
  const codigo = String(process.env[item.env] || item.padrao).trim();
  if (!/^\d{1,6}$/.test(codigo)) throw new Error(`Código de eleição inválido: ${item.env}`);
  // Rejeita identificadores de simulação que costumam persistir em variáveis antigas.
  if (["21270", "21272", "21274"].includes(codigo)) {
    throw new Error(`${item.env}=${codigo} é código de simulação; use a configuração oficial da eleição.`);
  }
  return codigo;
}
function urlMunicipios(item) {
  const cfg = ambienteTSE();
  const eleicao = codigoEleicao(item);
  return `${cfg.base}/${cfg.ambiente}/${cfg.ciclo}/${eleicao}/config/mun-e${pad(eleicao, 6)}-cm.json`;
}
function urlResultadoMunicipio(item, municipioCodigo) {
  const cfg = ambienteTSE();
  const eleicao = codigoEleicao(item);
  const municipio = pad(municipioCodigo, 5);
  return `${cfg.base}/${cfg.ambiente}/${cfg.ciclo}/${eleicao}/dados/${cfg.uf}/${cfg.uf}${municipio}-c${item.arquivo}-e${pad(eleicao, 6)}-u.json`;
}
async function obterJSON(url) {
  const resposta = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "Radar-Link-MS/2.0" }, cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!resposta.ok) {
    const erro = new Error(`TSE HTTP ${resposta.status}`);
    erro.status = resposta.status;
    throw erro;
  }
  return resposta.json();
}
function extrairCandidatos(json, cargoCodigo) {
  const lista = [];
  for (const blocoCargo of json.carg || []) {
    if (blocoCargo.cd !== undefined && Number(blocoCargo.cd) !== cargoCodigo) continue;
    for (const agrupamento of blocoCargo.agr || []) {
      for (const partido of agrupamento.par || []) {
        for (const candidato of partido.cand || []) {
          lista.push({
            numero: inteiro(candidato.n), sequencial: String(candidato.sqcand || ""),
            nome: candidato.nm || "", nomeUrna: candidato.nmu || candidato.nm || "",
            partido: partido.sg || "", partidoNome: partido.nm || "",
            votos: inteiro(candidato.vap), percentual: percentualNumerico(candidato.pvap ?? candidato.pvapn),
            situacao: candidato.st || "", eleito: candidato.e || "n", destinacaoVoto: candidato.dvt || "",
          });
        }
      }
    }
  }
  return lista.sort((a, b) => a.numero - b.numero || a.nomeUrna.localeCompare(b.nomeUrna, "pt-BR"));
}
function transformar(json, municipio, item) {
  const turnoDoArquivo = Number(json.t ?? item.turno);
  if (turnoDoArquivo !== item.turno) throw new Error(`Turno inesperado do TSE: ${turnoDoArquivo} (esperado ${item.turno})`);
  if (json.f !== "o") throw new Error("Resultado sem fase oficial (f=o); não gravado.");
  const candidatos = extrairCandidatos(json, item.codigo);
  if (!candidatos.length) throw new Error("Resultado sem candidatos para o cargo; não gravado.");
  const v = json.v || {}, s = json.s || {}, e = json.e || {};
  return {
    fonte: "TSE", ano: 2026, uf: "MS", municipio: municipio.nm,
    municipioCodigoTSE: pad(municipio.cd, 5), municipioCodigoIBGE: municipio.cdi ? String(municipio.cdi) : "",
    zonas: Array.isArray(municipio.z) ? municipio.z : [],
    cargoCodigo: item.codigo, cargoNome: item.nome, turno: item.turno,
    eleicaoCodigo: codigoEleicao(item), fase: json.f, andamento: json.and || "",
    totalizacaoFinal: json.tf || "n", divulgacaoPermitida: json.dv || "s",
    dataGeracao: json.dg || "", horaGeracao: json.hg || "", dataTotalizacao: json.dt || "", horaTotalizacao: json.ht || "", idGeracao: json.idg ?? null,
    secoesTotal: inteiro(s.ts), secoesTotalizadas: inteiro(s.st), percentualSecoesTotalizadas: percentualNumerico(s.pst ?? s.pstn), secoesNaoTotalizadas: inteiro(s.snt),
    eleitores: inteiro(e.te), comparecimento: inteiro(e.c), abstencao: inteiro(e.a),
    votosTotal: inteiro(v.tv), votosValidos: inteiro(v.vv), votosNominais: inteiro(v.vnom), votosLegenda: inteiro(v.vl), brancos: inteiro(v.vb), nulos: inteiro(v.tvn ?? v.vn),
    candidatos, sincronizadoEm: FieldValue.serverTimestamp(),
    sincronizadoEmTexto: new Date().toLocaleString("pt-BR", { timeZone: "America/Campo_Grande" }),
  };
}
function somenteConfig(req) {
  return String(req.query?.diagnostico || "") === "1";
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!autorizado(req)) return res.status(401).json({ ok: false, erro: "Não autorizado." });
  if (!["GET", "POST"].includes(req.method)) return res.status(405).json({ ok: false, erro: "Método não permitido." });
  const inicio = Date.now();
  try {
    const cfg = ambienteTSE();
    const configuracoes = ELEICOES.filter((x) => x.codigo === 1).map((x) => ({ cargo: x.nome, turno: x.turno, codigoEleicao: codigoEleicao(x) }));
    if (somenteConfig(req)) return res.status(200).json({ ok: true, modo: "diagnostico", ambiente: cfg.ambiente, configuracoes });

    // Apenas PRESIDENTE: não toca nos resultados já consolidados dos outros cargos.
    const tarefas = ELEICOES.filter((x) => x.codigo === 1);
    const mapaDesejados = new Set(MUNICIPIOS_CRE5.map(normalizar));
    const gravados = [], erros = [], faltantes = [];
    const db = dbAdmin();

    for (const item of tarefas) {
      const cfgMunicipios = await obterJSON(urlMunicipios(item));
      const blocoUF = (cfgMunicipios.abr || []).find((a) => String(a.cd || "").toLowerCase() === cfg.uf);
      if (!blocoUF) throw new Error(`UF ${cfg.uf.toUpperCase()} não encontrada na configuração EA12 para ${item.turno}º turno.`);
      const municipios = (blocoUF.mu || []).filter((m) => mapaDesejados.has(normalizar(m.nm)));
      for (const esperado of MUNICIPIOS_CRE5) {
        if (!municipios.some((m) => normalizar(m.nm) === normalizar(esperado))) faltantes.push({ turno: item.turno, municipio: esperado });
      }
      for (const municipio of municipios) {
        try {
          const json = await obterJSON(urlResultadoMunicipio(item, municipio.cd));
          const resultado = transformar(json, municipio, item);
          // Um ID por município + cargo + turno, para evitar substituição acidental.
          const id = `ms_${pad(municipio.cd, 5)}_${item.arquivo}_t${item.turno}`;
          // Nunca reduzir apuração previamente armazenada para uma amostra menor.
          const ref = db.collection("resultados_tse_2026").doc(id);
          const anterior = await ref.get();
          if (anterior.exists && inteiro(anterior.data()?.secoesTotalizadas) > resultado.secoesTotalizadas) {
            erros.push({ municipio: municipio.nm, cargo: item.nome, turno: item.turno, erro: "Registro mais completo já existente; mantido." });
            continue;
          }
          await ref.set(resultado, { merge: true });
          gravados.push({ municipio: municipio.nm, cargo: item.nome, turno: item.turno, documento: id, secoes: `${resultado.secoesTotalizadas}/${resultado.secoesTotal}` });
        } catch (e) {
          erros.push({ municipio: municipio.nm, cargo: item.nome, turno: item.turno, status: e.status || null, erro: e.message });
        }
      }
    }
    await db.collection("meta_tse_2026").doc("sincronizacao_presidente").set({
      fonte: "TSE", ambiente: cfg.ambiente, totalGravados: gravados.length, totalErros: erros.length,
      municipiosFaltantes: faltantes, atualizadoEm: FieldValue.serverTimestamp(),
    }, { merge: true });
    return res.status(200).json({ ok: erros.length === 0 && faltantes.length === 0, ambiente: cfg.ambiente,
      gravados: gravados.length, erros: erros.length, municipiosFaltantes: faltantes,
      detalhesGravados: gravados, detalhesErros: erros, duracaoMs: Date.now() - inicio });
  } catch (e) {
    return res.status(500).json({ ok: false, erro: e.message, duracaoMs: Date.now() - inicio });
  }
}
