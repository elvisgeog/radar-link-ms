/**
 * Radar Link MS — descoberta dos arquivos de urna TSE 2026 por turno.
 * GET: pré-visualização, somente leitura. POST ?turno=2&confirmar=SIM: grava
 * APENAS entradas do segundo turno, em IDs terminados em _t2.
 * Preserva todos os registros anteriores do primeiro turno.
 * Esta rotina localiza BUs; não decodifica nem soma votos.
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { timingSafeEqual } from "node:crypto";

const PLEITOS = { 1: "3220", 2: "3221" };
const ELEICOES_FEDERAIS = { 1: 6257, 2: 6258 };
const COLECAO = "bus_tse_2026";

function autorizado(req) {
  const esperado = process.env.CRON_SECRET || "";
  const recebido = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!esperado || !recebido) return false;
  const a = Buffer.from(esperado), b = Buffer.from(recebido);
  return a.length === b.length && timingSafeEqual(a, b);
}
function pad(v, len) { return String(v).padStart(len, "0"); }
function configuracao() {
  const base = (process.env.TSE_BASE_URL || "https://resultados.tse.jus.br").replace(/\/+$/, "");
  const ambiente = process.env.TSE_AMBIENTE || "oficial";
  const ciclo = process.env.TSE_CICLO || "ele2026";
  const uf = (process.env.TSE_UF || "ms").toLowerCase();
  if (base !== "https://resultados.tse.jus.br" || ambiente !== "oficial" || ciclo !== "ele2026" || uf !== "ms") {
    throw new Error("Configuração TSE não corresponde ao ambiente oficial MS 2026. Revise TSE_BASE_URL, TSE_AMBIENTE, TSE_CICLO e TSE_UF.");
  }
  return { base, ambiente, ciclo, uf };
}
function banco() {
  if (!getApps().length) {
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
    if (!b64) throw new Error("FIREBASE_SERVICE_ACCOUNT_B64 ausente.");
    initializeApp({ credential: cert(JSON.parse(Buffer.from(b64, "base64").toString("utf8"))) });
  }
  return getFirestore();
}
function urls({ codigoMunicipio, zona, secao }, turno) {
  const { base, ambiente, ciclo, uf } = configuracao();
  const pleito = PLEITOS[turno];
  const m = pad(codigoMunicipio, 5), z = pad(zona, 4), s = pad(secao, 4);
  const raiz = `${base}/${ambiente}/${ciclo}/arquivo-urna/${pleito}/dados/${uf}/${m}/${z}/${s}`;
  return { raiz, aux: `${raiz}/p${pad(pleito, 6)}-${uf}-m${m}-z${z}-s${s}-aux.json` };
}
function ehBU(nome, tipo) {
  const n = String(nome || "").toLowerCase(), t = String(tipo || "").toLowerCase();
  return n.endsWith("-bu.dat") || n.endsWith("-busa.dat") || n.endsWith(".bu") || t === "bu" || t.includes("boletim");
}
function nomeSeguro(nome) {
  return typeof nome === "string" && /^[a-zA-Z0-9_.-]+$/.test(nome) && !nome.includes("..");
}
async function consultar(secao, turno) {
  const { raiz, aux } = urls(secao, turno);
  try {
    const resposta = await fetch(aux, { cache: "no-store", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) });
    if (!resposta.ok) return { ...secao, turno, pleito: PLEITOS[turno], disponivel: false, statusHTTP: resposta.status, arquivosBU: [], hashes: [] };
    const dados = await resposta.json();
    const hashes = [], arquivosBU = [];
    for (const item of Array.isArray(dados.hashes) ? dados.hashes : []) {
      const hash = String(item.hash || "");
      if (!/^[a-zA-Z0-9_-]+$/.test(hash)) continue;
      const arquivos = [];
      for (const arq of Array.isArray(item.arq) ? item.arq : []) {
        const nome = arq.nm || "";
        if (!nomeSeguro(nome)) continue;
        const arquivo = { nome, tipo: arq.tp || "", url: `${raiz}/${hash}/${encodeURIComponent(nome)}` };
        arquivos.push(arquivo);
        if (ehBU(nome, arq.tp)) arquivosBU.push({ ...arquivo, hash, dataRecebimento: item.dr || null, horaRecebimento: item.hr || null, situacao: item.st || null });
      }
      hashes.push({ hash, dataRecebimento: item.dr || null, horaRecebimento: item.hr || null, situacao: item.st || null, arquivos });
    }
    return { ...secao, turno, pleito: PLEITOS[turno], eleicaoFederal: ELEICOES_FEDERAIS[turno], disponivel: true,
      statusHTTP: 200, situacaoSecao: dados.st || null, fase: dados.f || null, dataGeracao: dados.dg || null,
      horaGeracao: dados.hg || null, idGeracao: dados.idg ?? null, hashes, arquivosBU, buDisponivel: arquivosBU.length > 0 };
  } catch (e) {
    return { ...secao, turno, pleito: PLEITOS[turno], disponivel: false, statusHTTP: null,
      arquivosBU: [], hashes: [], erro: String(e.message || e).slice(0, 200) };
  }
}
async function paralelo(itens, limite, fn) {
  let indice = 0; const saida = new Array(itens.length);
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, async () => {
    while (indice < itens.length) { const i = indice++; saida[i] = await fn(itens[i]); }
  }));
  return saida;
}
function intParametro(v, padrao, min, max) {
  const n = Number(v); return Number.isInteger(n) ? Math.max(min, Math.min(max, n)) : padrao;
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!autorizado(req)) return res.status(401).json({ ok: false, erro: "Não autorizado" });
  if (!["GET", "POST"].includes(req.method)) return res.status(405).json({ ok: false, erro: "Use GET ou POST." });
  const turno = Number(req.query?.turno ?? 2);
  if (![1, 2].includes(turno)) return res.status(400).json({ ok: false, erro: "turno deve ser 1 ou 2" });
  const gravar = req.method === "POST";
  if (gravar && (turno !== 2 || req.query?.confirmar !== "SIM")) {
    return res.status(400).json({ ok: false, erro: "Gravação disponível apenas para 2º turno mediante POST ?turno=2&confirmar=SIM" });
  }
  try {
    configuracao();
    const db = banco();
    const escolasSnap = await db.collection("escolas_tse_2026").get();
    const map = new Map();
    for (const d of escolasSnap.docs) {
      const e = d.data() || {};
      if (e.codigoMunicipio == null || e.zona == null || !Array.isArray(e.secoes)) continue;
      for (const secao of e.secoes) {
        const key = `${pad(e.codigoMunicipio, 5)}_${pad(e.zona, 4)}_${pad(secao, 4)}`;
        if (!map.has(key)) map.set(key, { codigoMunicipio: String(e.codigoMunicipio), municipio: e.municipio || "", zona: String(e.zona), secao: String(secao), escolas: [] });
        map.get(key).escolas.push({ id: d.id, municipio: e.municipio || "", nome: e.escolaRadar || e.nomeLocalVotacaoTSE || d.id });
      }
    }
    const secoes = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
    const offset = intParametro(req.query?.offset, 0, 0, 100000);
    const limit = intParametro(req.query?.limit, 10, 1, 25);
    const selecao = secoes.slice(offset, offset + limit);
    const resultados = await paralelo(selecao, 5, async ([, s]) => consultar(s, turno));
    const encontrados = resultados.filter(r => r.buDisponivel);
    const erros = resultados.filter(r => r.erro || (r.statusHTTP && r.statusHTTP !== 200 && r.statusHTTP !== 404));
    const resposta = {
      ok: true, modo: gravar ? "gravacao" : "previsualizacao", turno, pleito: PLEITOS[turno], eleicaoFederal: ELEICOES_FEDERAIS[turno],
      totalEscolas: escolasSnap.size, totalSecoes: secoes.length, offset, consultadas: selecao.length,
      auxDisponiveis: resultados.filter(r => r.disponivel).length, comBU: encontrados.length,
      semBU: resultados.length - encontrados.length, erros: erros.map(r => ({ municipio: r.municipio, zona: r.zona, secao: r.secao, statusHTTP: r.statusHTTP, erro: r.erro || "HTTP inesperado" })).slice(0, 20),
      exemplos: resultados.slice(0, 5).map(r => ({ municipio: r.municipio, zona: r.zona, secao: r.secao, statusHTTP: r.statusHTTP, bu: r.arquivosBU.length })),
      proximoOffset: offset + selecao.length < secoes.length ? offset + selecao.length : null,
      gravacao: false,
    };
    if (gravar) {
      if (erros.length || !encontrados.length) return res.status(409).json({ ...resposta, ok: false, erro: "Gravação bloqueada: erros de consulta ou nenhum BU do 2º turno." });
      const batch = db.batch();
      for (const r of encontrados) {
        const id = `ms_${pad(r.codigoMunicipio, 5)}_${pad(r.zona, 4)}_${pad(r.secao, 4)}_t2`;
        const ref = db.collection(COLECAO).doc(id);
        batch.set(ref, { uf: "MS", codigoMunicipio: r.codigoMunicipio, municipio: r.municipio,
          zona: r.zona, secao: r.secao, escolas: r.escolas, turno: 2, pleito: PLEITOS[2],
          idEleicaoFederal: ELEICOES_FEDERAIS[2], ea18Disponivel: r.disponivel,
          buDisponivel: r.buDisponivel, hashes: r.hashes, arquivosBU: r.arquivosBU,
          situacaoSecao: r.situacaoSecao, fase: r.fase, dataGeracao: r.dataGeracao,
          horaGeracao: r.horaGeracao, idGeracao: r.idGeracao, statusHTTP: r.statusHTTP,
          atualizadoEm: FieldValue.serverTimestamp() }, { merge: true });
      }
      await batch.commit();
      resposta.gravacao = true;
      resposta.documentosGravados = encontrados.length;
    }
    return res.status(200).json(resposta);
  } catch (e) {
    console.error("tse-bus-sync:", e);
    return res.status(500).json({ ok: false, erro: String(e.message || e).slice(0, 300) });
  }
}
