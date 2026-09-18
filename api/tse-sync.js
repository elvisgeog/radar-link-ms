import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const MUNICIPIOS_CRE5 = [
  "CAARAPÓ", "DEODÁPOLIS", "DOURADINA", "DOURADOS", "FÁTIMA DO SUL",
  "GLÓRIA DE DOURADOS", "ITAPORÃ", "JATEÍ", "LAGUNA CARAPÃ", "MARACAJU",
  "RIO BRILHANTE", "VICENTINA",
];

const CARGOS = [
  { codigo: 3, arquivo: "0003", nome: "Governador" },
  { codigo: 5, arquivo: "0005", nome: "Senador" },
  { codigo: 6, arquivo: "0006", nome: "Deputado Federal" },
  { codigo: 7, arquivo: "0007", nome: "Deputado Estadual" },
];

function normalizar(texto) {
  return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}
function padEleicao(valor) { return String(valor).padStart(6, "0"); }

function iniciarFirebaseAdmin() {
  if (!getApps().length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT não configurada na Vercel.");
    }

    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return getFirestore();
}
function raizTSE() {
  const base = (process.env.TSE_BASE_URL || "https://resultados-sim.tse.jus.br/simulado").replace(/\/+$/, "");
  const ambiente = process.env.TSE_AMBIENTE || "simulado2026";
  const ciclo = process.env.TSE_CICLO || "ele2026";
  const eleicao = padEleicao(process.env.TSE_ELEICAO_ESTADUAL || "21272");
  return `${base}/${ambiente}/${ciclo}/${Number(eleicao)}`;
}

function urlMunicipios() {
  const eleicao = padEleicao(process.env.TSE_ELEICAO_ESTADUAL || "21272");
  return `${raizTSE()}/config/mun-e${eleicao}-cm.json`;
}

function urlResultadoMunicipio(codigoMunicipio, cargoArquivo) {
  const uf = (process.env.TSE_UF || "ms").toLowerCase();
  const eleicao = padEleicao(process.env.TSE_ELEICAO_ESTADUAL || "21272");
  const cod = String(codigoMunicipio).padStart(5, "0");
  return `${raizTSE()}/dados/${uf}/${uf}${cod}-c${cargoArquivo}-e${eleicao}-u.json`;
}

async function obterJSON(url) {
  const resposta = await fetch(url, { headers: { "User-Agent": "Radar-Link-MS/1.0 resultados-eleitorais-2026", Accept: "application/json" }, cache: "no-store" });
  if (!resposta.ok) {
    const erro = new Error(`TSE respondeu HTTP ${resposta.status} para ${url}`);
    erro.status = resposta.status;
    throw erro;
  }
  return resposta.json();
}

function extrairCandidatos(json) {
  const candidatos = [];
  for (const cargo of json.carg || []) {
    for (const agrupamento of cargo.agr || []) {
      for (const partido of agrupamento.par || []) {
        for (const candidato of partido.cand || []) {
          candidatos.push({
            numero: Number(candidato.n || 0),
            sequencial: candidato.sqcand ? String(candidato.sqcand) : "",
            nome: candidato.nm || "",
            nomeUrna: candidato.nmu || candidato.nm || "",
            partido: partido.sg || "",
            partidoNome: partido.nm || "",
            votos: Number(candidato.vap || 0),
            percentual: Number(candidato.pvap || candidato.pvapn || 0),
            situacao: candidato.st || "",
            eleito: candidato.e || "n",
            destinacaoVoto: candidato.dvt || "",
          });
        }
      }
    }
  }
  return candidatos.sort((a, b) => a.numero - b.numero || a.nomeUrna.localeCompare(b.nomeUrna, "pt-BR"));
}

function transformarResultado(json, municipio, cargo) {
  const v = json.v || {};
  const s = json.s || {};
  const e = json.e || {};
  return {
    fonte: "TSE", ano: 2026, uf: (process.env.TSE_UF || "ms").toUpperCase(),
    municipio: municipio.nm,
    municipioCodigoTSE: String(municipio.cd).padStart(5, "0"),
    municipioCodigoIBGE: municipio.cdi ? String(municipio.cdi).padStart(5, "0") : "",
    zonas: Array.isArray(municipio.z) ? municipio.z : [],
    cargoCodigo: cargo.codigo, cargoNome: cargo.nome,
    fase: json.f || "", turno: Number(json.t || 1), andamento: json.and || "",
    totalizacaoFinal: json.tf || "n", divulgacaoPermitida: json.dv || "s",
    dataGeracao: json.dg || "", horaGeracao: json.hg || "",
    dataTotalizacao: json.dt || "", horaTotalizacao: json.ht || "", idGeracao: json.idg ?? null,
    secoesTotal: Number(s.ts || 0), secoesTotalizadas: Number(s.st || 0),
    percentualSecoesTotalizadas: Number(s.pst || s.pstn || 0), secoesNaoTotalizadas: Number(s.snt || 0),
    eleitores: Number(e.te || 0), comparecimento: Number(e.c || 0), abstencao: Number(e.a || 0),
    votosTotal: Number(v.tv || 0), votosValidos: Number(v.vv || 0), votosNominais: Number(v.vnom || 0),
    votosLegenda: Number(v.vl || 0), brancos: Number(v.vb || 0), nulos: Number(v.tvn || v.vn || 0),
    candidatos: extrairCandidatos(json),
    sincronizadoEm: FieldValue.serverTimestamp(),
    sincronizadoEmTexto: new Date().toLocaleString("pt-BR", { timeZone: "America/Campo_Grande" }),
  };
}

function autorizado(req) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return true;
  return req.headers.authorization === `Bearer ${segredo}`;
}

export default async function handler(req, res) {
  if (!autorizado(req)) return res.status(401).json({ ok: false, erro: "Não autorizado." });
  const inicio = Date.now();
  const db = iniciarFirebaseAdmin();

  try {
    const config = await obterJSON(urlMunicipios());
    const uf = (process.env.TSE_UF || "ms").toLowerCase();
    const blocoUF = (config.abr || []).find((a) => String(a.cd || "").toLowerCase() === uf);
    if (!blocoUF) throw new Error(`UF ${uf.toUpperCase()} não encontrada no EA12.`);

    const mapaDesejados = new Set(MUNICIPIOS_CRE5.map(normalizar));
    const municipios = (blocoUF.mu || []).filter((m) => mapaDesejados.has(normalizar(m.nm)));
    const faltantes = MUNICIPIOS_CRE5.filter((nome) => !municipios.some((m) => normalizar(m.nm) === normalizar(nome)));
    const gravados = [];
    const erros = [];

    for (const municipio of municipios) {
      for (const cargo of CARGOS) {
        const url = urlResultadoMunicipio(municipio.cd, cargo.arquivo);
        try {
          const json = await obterJSON(url);
          const resultado = transformarResultado(json, municipio, cargo);
          const docId = `ms_${String(municipio.cd).padStart(5, "0")}_${cargo.arquivo}`;
          await db.collection("resultados_tse_2026").doc(docId).set(resultado, { merge: true });
          gravados.push({ municipio: municipio.nm, cargo: cargo.nome, idGeracao: resultado.idGeracao, secoes: `${resultado.secoesTotalizadas}/${resultado.secoesTotal}` });
        } catch (e) {
          erros.push({ municipio: municipio.nm, cargo: cargo.nome, status: e.status || null, erro: e.message });
        }
      }
    }

    await db.collection("meta_tse_2026").doc("ultima_sincronizacao").set({
      fonte: "TSE", ambiente: process.env.TSE_AMBIENTE || "simulado2026",
      municipiosEncontrados: municipios.map((m) => m.nm), municipiosFaltantes: faltantes,
      totalGravados: gravados.length, totalErros: erros.length,
      atualizadoEm: FieldValue.serverTimestamp(),
      atualizadoEmTexto: new Date().toLocaleString("pt-BR", { timeZone: "America/Campo_Grande" }),
    }, { merge: true });

    return res.status(200).json({ ok: true, ambiente: process.env.TSE_AMBIENTE || "simulado2026", totalMunicipios: municipios.length, gravados: gravados.length, erros: erros.length, municipiosFaltantes: faltantes, detalhesErros: erros.slice(0, 30), duracaoMs: Date.now() - inicio });
  } catch (e) {
    return res.status(500).json({ ok: false, erro: e.message, duracaoMs: Date.now() - inicio });
  }
}
