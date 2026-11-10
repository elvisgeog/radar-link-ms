import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

// Uma única função Serverless para todos os cargos, inclusive Presidente (2 turnos).
// Não executar com parâmetros de simulação: o endpoint valida a origem oficial.
const MUNICIPIOS_CRE5 = [
  "CAARAPÓ", "DEODÁPOLIS", "DOURADINA", "DOURADOS", "FÁTIMA DO SUL",
  "GLÓRIA DE DOURADOS", "ITAPORÃ", "JATEÍ", "LAGUNA CARAPÃ", "MARACAJU",
  "RIO BRILHANTE", "VICENTINA",
];

const ELEICOES = [
  { eleicao: "6257", cargo: 1, arquivo: "0001", nome: "Presidente", turno: 1 },
  { eleicao: "6258", cargo: 1, arquivo: "0001", nome: "Presidente", turno: 2 },
  { eleicao: "6259", cargo: 3, arquivo: "0003", nome: "Governador", turno: 1 },
  { eleicao: "6259", cargo: 5, arquivo: "0005", nome: "Senador", turno: 1 },
  { eleicao: "6259", cargo: 6, arquivo: "0006", nome: "Deputado Federal", turno: 1 },
  { eleicao: "6259", cargo: 7, arquivo: "0007", nome: "Deputado Estadual", turno: 1 },
];

const COLECAO = "resultados_tse_2026";
const BASE_OFICIAL = "https://resultados.tse.jus.br";
const AMBIENTE_OFICIAL = "oficial";
const CICLO_OFICIAL = "ele2026";

function normalizar(texto) {
  return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}
function pad(valor, tamanho) { return String(valor).padStart(tamanho, "0"); }

function iniciarFirebaseAdmin() {
  if (!getApps().length) {
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
    if (!b64) throw new Error("FIREBASE_SERVICE_ACCOUNT_B64 não configurada na Vercel.");
    const conta = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    initializeApp({ credential: cert(conta) });
  }
  return getFirestore();
}

function autorizado(req) {
  const esperado = process.env.CRON_SECRET;
  return Boolean(esperado) && req.headers.authorization === `Bearer ${esperado}`;
}

function configuracaoOficial() {
  const base = String(process.env.TSE_BASE_URL || BASE_OFICIAL).replace(/\/+$/, "");
  const ambiente = String(process.env.TSE_AMBIENTE || AMBIENTE_OFICIAL);
  const ciclo = String(process.env.TSE_CICLO || CICLO_OFICIAL);
  const uf = String(process.env.TSE_UF || "ms").toLowerCase();
  if (base !== BASE_OFICIAL || ambiente !== AMBIENTE_OFICIAL || ciclo !== CICLO_OFICIAL || uf !== "ms") {
    throw new Error("Configuração TSE inválida: use TSE_BASE_URL=https://resultados.tse.jus.br, TSE_AMBIENTE=oficial, TSE_CICLO=ele2026 e TSE_UF=ms. Nenhum dado foi gravado.");
  }
  return { base, ambiente, ciclo, uf };
}

function raiz(eleicao, config) {
  return `${config.base}/${config.ambiente}/${config.ciclo}/${Number(eleicao)}`;
}
function urlMunicipios(eleicao, config) {
  return `${raiz(eleicao, config)}/config/mun-e${pad(eleicao, 6)}-cm.json`;
}
function urlResultadoMunicipio(municipio, item, config) {
  const eleicao = pad(item.eleicao, 6);
  const codigo = pad(municipio.cd, 5);
  return `${raiz(item.eleicao, config)}/dados/${config.uf}/${config.uf}${codigo}-c${item.arquivo}-e${eleicao}-u.json`;
}

async function obterJSON(url) {
  const resposta = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Radar-Link-MS/1.0" },
    cache: "no-store",
    signal: AbortSignal.timeout(18000),
  });
  if (!resposta.ok) {
    const erro = new Error(`TSE HTTP ${resposta.status} (${url})`);
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

function validarResultado(json, item) {
  if (!json || !Array.isArray(json.carg) || json.carg.length === 0) {
    throw new Error("Resposta sem lista de cargos/candidatos: não será gravada.");
  }
  if (json.f !== "o") throw new Error("Resultado não identificado como oficial (fase diferente de 'o').");
  if (json.t !== undefined && json.t !== null && json.t !== "" && Number(json.t) !== item.turno) {
    throw new Error(`Turno divergente: resposta ${json.t}, esperado ${item.turno}.`);
  }
  const candidatos = extrairCandidatos(json);
  if (!candidatos.length) throw new Error("Resposta sem candidatos: não será gravada.");
  return candidatos;
}

function transformarResultado(json, municipio, item, candidatos) {
  const v = json.v || {};
  const s = json.s || {};
  const e = json.e || {};
  return {
    fonte: "TSE", ano: 2026, uf: "MS",
    municipio: municipio.nm,
    municipioCodigoTSE: pad(municipio.cd, 5),
    municipioCodigoIBGE: municipio.cdi ? String(municipio.cdi) : "",
    zonas: Array.isArray(municipio.z) ? municipio.z : [],
    cargoCodigo: item.cargo, cargoNome: item.nome,
    eleicaoCodigo: Number(item.eleicao),
    fase: "o", turno: item.turno, andamento: json.and || "",
    totalizacaoFinal: json.tf || "n", divulgacaoPermitida: json.dv || "s",
    dataGeracao: json.dg || "", horaGeracao: json.hg || "",
    dataTotalizacao: json.dt || "", horaTotalizacao: json.ht || "", idGeracao: json.idg ?? null,
    secoesTotal: Number(s.ts || 0), secoesTotalizadas: Number(s.st || 0),
    percentualSecoesTotalizadas: Number(s.pst || s.pstn || 0), secoesNaoTotalizadas: Number(s.snt || 0),
    eleitores: Number(e.te || 0), comparecimento: Number(e.c || 0), abstencao: Number(e.a || 0),
    votosTotal: Number(v.tv || 0), votosValidos: Number(v.vv || 0), votosNominais: Number(v.vnom || 0),
    votosLegenda: Number(v.vl || 0), brancos: Number(v.vb || 0), nulos: Number(v.tvn || v.vn || 0),
    candidatos,
    sincronizadoEm: FieldValue.serverTimestamp(),
    sincronizadoEmTexto: new Date().toLocaleString("pt-BR", { timeZone: "America/Campo_Grande" }),
  };
}

async function comConcorrencia(itens, limite, fn) {
  const respostas = new Array(itens.length);
  let indice = 0;
  async function trabalhador() {
    while (indice < itens.length) {
      const i = indice++;
      respostas[i] = await fn(itens[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(itens.length, limite) }, trabalhador));
  return respostas;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!autorizado(req)) return res.status(401).json({ ok: false, erro: "Não autorizado. Configure CRON_SECRET e envie Authorization: Bearer <token>." });
  if (!["GET", "POST"].includes(req.method)) return res.status(405).json({ ok: false, erro: "Método não permitido." });

  const inicio = Date.now();
  try {
    const config = configuracaoOficial();
    const diagnostico = String(req.query?.diagnostico || "") === "1";
    const modo = String(req.query?.modo || "todos").toLowerCase();
    const previsualizar = String(req.query?.previsualizar || "") === "1";
    if (!['todos', 'presidente'].includes(modo)) return res.status(400).json({ ok: false, erro: "Modo inválido: use todos ou presidente." });
    const cargos = modo === 'presidente' ? ELEICOES.filter(x => x.cargo === 1) : ELEICOES;
    if (diagnostico) {
      return res.status(200).json({
        ok: true, modo: "diagnostico", origem: "TSE oficial", ambiente: config.ambiente,
        cargos: cargos.map(x => ({ nome: x.nome, turno: x.turno, eleicao: x.eleicao })),
        gravacao: false,
      });
    }

    const eleicoesDistintas = [...new Set(cargos.map(c => c.eleicao))];
    const municipiosPorEleicao = new Map();
    const faltantesPorEleicao = [];

    // Obtém o cadastro municipal correto de cada eleição; impede usar um código de simulado ou pleito distinto.
    for (const eleicao of eleicoesDistintas) {
      const configuracao = await obterJSON(urlMunicipios(eleicao, config));
      const bloco = (configuracao.abr || []).find(a => String(a.cd || "").toLowerCase() === "ms");
      if (!bloco) throw new Error(`MS não encontrada no cadastro da eleição ${eleicao}; nada foi gravado.`);
      const desejados = new Set(MUNICIPIOS_CRE5.map(normalizar));
      const municipios = (bloco.mu || []).filter(m => desejados.has(normalizar(m.nm)));
      const faltantes = MUNICIPIOS_CRE5.filter(nome => !municipios.some(m => normalizar(m.nm) === normalizar(nome)));
      if (faltantes.length) {
        faltantesPorEleicao.push({ eleicao, faltantes });
        throw new Error(`Eleição ${eleicao}: municípios faltantes (${faltantes.join(", ")}); nada foi gravado.`);
      }
      municipiosPorEleicao.set(eleicao, municipios);
    }

    const tarefas = cargos.flatMap(item => municipiosPorEleicao.get(item.eleicao).map(municipio => ({ item, municipio })));
    const apuracoes = await comConcorrencia(tarefas, 6, async ({ item, municipio }) => {
      try {
        const json = await obterJSON(urlResultadoMunicipio(municipio, item, config));
        const candidatos = validarResultado(json, item);
        const resultado = transformarResultado(json, municipio, item, candidatos);
        const id = item.cargo === 1
          ? `ms_${pad(municipio.cd, 5)}_${item.arquivo}_t${item.turno}`
          : `ms_${pad(municipio.cd, 5)}_${item.arquivo}`; // IDs originais preservados
        return { ok: true, id, resultado, municipio: municipio.nm, cargo: item.nome, turno: item.turno };
      } catch (erro) {
        return { ok: false, municipio: municipio.nm, cargo: item.nome, turno: item.turno, status: erro.status ?? null, erro: erro.message };
      }
    });

    const gravaveis = apuracoes.filter(x => x.ok);
    const erros = apuracoes.filter(x => !x.ok);

    // Modo de leitura: consulta o TSE, valida cada resultado e NÃO grava no Firestore.
    if (previsualizar) {
      const porTurno = cargos.map(item => {
        const correspondentes = apuracoes.filter(x => x.turno === item.turno && x.cargo === item.nome);
        return {
          cargo: item.nome,
          turno: item.turno,
          eleicao: item.eleicao,
          municipiosConsultados: correspondentes.length,
          municipiosValidos: correspondentes.filter(x => x.ok).length,
          municipiosComErro: correspondentes.filter(x => !x.ok).length,
        };
      });
      return res.status(200).json({
        ok: erros.length === 0,
        modo: "previsualizacao",
        ambiente: "oficial",
        gravacao: false,
        totalConsultas: apuracoes.length,
        validos: gravaveis.length,
        erros: erros.length,
        porTurno,
        detalhesErros: erros.map(x => ({ municipio: x.municipio, cargo: x.cargo, turno: x.turno, status: x.status, erro: x.erro })),
        duracaoMs: Date.now() - inicio,
      });
    }

    const db = iniciarFirebaseAdmin();
    if (!gravaveis.length) return res.status(502).json({ ok: false, erro: "Nenhum resultado oficial válido foi encontrado; nenhuma alteração realizada.", detalhesErros: erros.slice(0, 12) });

    // Só grava resultados validados; nunca remove coleções ou documentos de outros cargos.
    let batch = db.batch();
    let noBatch = 0;
    for (const item of gravaveis) {
      batch.set(db.collection(COLECAO).doc(item.id), item.resultado, { merge: true });
      noBatch++;
      if (noBatch >= 300) { await batch.commit(); batch = db.batch(); noBatch = 0; }
    }
    if (noBatch) await batch.commit();
    await db.collection("meta_tse_2026").doc("ultima_sincronizacao").set({
      fonte: "TSE", ambiente: "oficial", modo,
      totalGravados: gravaveis.length, totalErros: erros.length,
      atualizadoEm: FieldValue.serverTimestamp(),
      atualizadoEmTexto: new Date().toLocaleString("pt-BR", { timeZone: "America/Campo_Grande" }),
    }, { merge: true });

    return res.status(erros.length ? 207 : 200).json({
      ok: true, ambiente: "oficial", modo,
      totalMunicipios: MUNICIPIOS_CRE5.length,
      gravados: gravaveis.length, erros: erros.length,
      detalhesErros: erros.slice(0, 30),
      duracaoMs: Date.now() - inicio,
    });
  } catch (erro) {
    console.error("tse-sync:", erro);
    return res.status(500).json({ ok: false, erro: erro.message, duracaoMs: Date.now() - inicio });
  }
}
