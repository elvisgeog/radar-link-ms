import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const COLECAO = "perfil_gestores_cre5";
const FONTE_BASE = "CRE - 5 DOURADOS - 27/10/2026";

function dbAdmin() {
  if (!getApps().length) {
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
    if (!b64) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_B64 não configurada.");
    }

    const serviceAccount = JSON.parse(
      Buffer.from(b64, "base64").toString("utf8")
    );

    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return getFirestore();
}

const NOME_COOKIE = "radar_session";
const DURACAO_SESSAO = 12 * 60 * 60;

function igualSeguro(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && timingSafeEqual(x, y);
}

function assinar(valor) {
  return createHmac("sha256", process.env.RADAR_SESSION_SECRET || "")
    .update(valor).digest("hex");
}

function criarSessao() {
  const expira = Math.floor(Date.now() / 1000) + DURACAO_SESSAO;
  const corpo = Buffer.from(JSON.stringify({ expira, nonce: randomBytes(12).toString("hex") }))
    .toString("base64url");
  return `${corpo}.${assinar(corpo)}`;
}

function sessaoValida(req) {
  if (!process.env.RADAR_SESSION_SECRET) return false;
  const cookies = String(req.headers.cookie || "").split(";");
  const valor = cookies.map((c) => c.trim()).find((c) => c.startsWith(`${NOME_COOKIE}=`))
    ?.slice(NOME_COOKIE.length + 1);
  if (!valor) return false;
  const partes = valor.split(".");
  if (partes.length !== 2 || !igualSeguro(partes[1], assinar(partes[0]))) return false;
  try {
    const dados = JSON.parse(Buffer.from(partes[0], "base64url").toString("utf8"));
    return Number.isInteger(dados.expira) && dados.expira > Date.now() / 1000;
  } catch { return false; }
}

function cookieSessao(token, idade) {
  return `${NOME_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${idade}`;
}

function origemValida(req) {
  const origem = String(req.headers.origin || "");
  if (!origem) return false;
  try {
    const host = String(req.headers.host || "").toLowerCase();
    return new URL(origem).host.toLowerCase() === host && new URL(origem).protocol === "https:";
  } catch { return false; }
}

function autorizado(req) {
  if (!process.env.RADAR_APP_PASSWORD || !process.env.RADAR_SESSION_SECRET) {
    return { ok: false, status: 500, erro: "Autenticação do Radar não configurada no servidor." };
  }
  return sessaoValida(req)
    ? { ok: true }
    : { ok: false, status: 401, erro: "Sessão expirada. Entre novamente no Radar Link MS." };
}

function texto(v, max = 6000) {
  return String(v ?? "").trim().slice(0, max);
}

function nota(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(10, Math.round(n)));
}

function idSeguro(v = "") {
  return String(v)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 180);
}

function sanitizarPerfil(p = {}) {
  return {
    nome: texto(p.nome, 300),
    tecnico: nota(p.tecnico),
    politico: nota(p.politico),
    social: nota(p.social),
    posicionamento: texto(p.posicionamento, 3000),
    observacao: texto(p.observacao, 6000),
  };
}

function sanitizarRegistroImportacao(r = {}) {
  const cidade = texto(r.cidade, 160);
  const escola = texto(r.escola, 500);

  if (!cidade || !escola) {
    throw new Error("Registro sem cidade ou escola.");
  }

  const id =
    texto(r.id, 220) ||
    idSeguro(`${cidade}_${escola}`);

  return {
    id,
    cidade,
    escola,
    diretor: sanitizarPerfil(r.diretor),
    adjunto: sanitizarPerfil(r.adjunto),
  };
}

function serializarTimestamp(v) {
  if (!v) return null;
  if (typeof v.toDate === "function") {
    return v.toDate().toISOString();
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  // Apenas requisições do próprio domínio podem alterar sessões ou perfis.
  const acao = String(req.query?.acao || "");
  if (acao === "login" && req.method === "POST") {
    if (!origemValida(req)) return res.status(403).json({ ok: false, erro: "Origem inválida." });
    const esperado = process.env.RADAR_APP_PASSWORD || "";
    const chaveSessao = process.env.RADAR_SESSION_SECRET || "";
    if (!esperado || chaveSessao.length < 32) {
      return res.status(500).json({ ok: false, erro: "Configure RADAR_APP_PASSWORD e RADAR_SESSION_SECRET na Vercel." });
    }
    const corpo = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    if (!igualSeguro(corpo.senha, esperado)) return res.status(401).json({ ok: false, erro: "Senha incorreta." });
    res.setHeader("Set-Cookie", cookieSessao(criarSessao(), DURACAO_SESSAO));
    return res.status(200).json({ ok: true });
  }
  if (acao === "logout" && req.method === "POST") {
    if (!origemValida(req)) return res.status(403).json({ ok: false, erro: "Origem inválida." });
    res.setHeader("Set-Cookie", cookieSessao("", 0));
    return res.status(200).json({ ok: true });
  }
  if (acao === "sessao" && req.method === "GET") {
    return res.status(200).json({ ok: sessaoValida(req) });
  }
  if (!["GET", "POST", "PUT"].includes(req.method)) {
    return res.status(405).json({ ok: false, erro: "Método não permitido." });
  }
  if (req.method !== "GET" && !origemValida(req)) {
    return res.status(403).json({ ok: false, erro: "Origem inválida." });
  }

  const auth = autorizado(req);
  if (!auth.ok) {
    return res.status(auth.status).json({
      ok: false,
      erro: auth.erro,
    });
  }

  try {
    const db = dbAdmin();

    if (req.method === "GET") {
      const snap = await db
        .collection(COLECAO)
        .orderBy("cidade")
        .get();

      const registros = snap.docs
        .map((d) => {
          const dados = d.data() || {};
          return {
            id: d.id,
            cidade: dados.cidade || "",
            escola: dados.escola || "",
            diretor: dados.diretor || {},
            adjunto: dados.adjunto || {},
            fonteBase: dados.fonteBase || "",
            criadoEm: serializarTimestamp(dados.criadoEm),
            atualizadoEm: serializarTimestamp(dados.atualizadoEm),
          };
        })
        .sort((a, b) => {
          const c = String(a.cidade).localeCompare(
            String(b.cidade),
            "pt-BR"
          );
          if (c !== 0) return c;
          return String(a.escola).localeCompare(
            String(b.escola),
            "pt-BR"
          );
        });

      return res.status(200).json({
        ok: true,
        total: registros.length,
        registros,
      });
    }

    if (req.method === "POST") {
      const body =
        typeof req.body === "string"
          ? JSON.parse(req.body || "{}")
          : req.body || {};

      if (body.acao !== "importar") {
        return res.status(400).json({
          ok: false,
          erro: "Ação inválida.",
        });
      }

      const existentes = await db.collection(COLECAO).limit(1).get();

      if (!existentes.empty) {
        return res.status(409).json({
          ok: false,
          erro:
            "A base já foi importada. A importação inicial só é permitida com a coleção vazia.",
        });
      }

      const entrada = Array.isArray(body.registros)
        ? body.registros
        : [];

      if (!entrada.length || entrada.length > 200) {
        return res.status(400).json({
          ok: false,
          erro: "Quantidade de registros inválida.",
        });
      }

      const registros = entrada.map(sanitizarRegistroImportacao);

      const ids = new Set();
      for (const item of registros) {
        if (ids.has(item.id)) {
          throw new Error(`ID duplicado na importação: ${item.id}`);
        }
        ids.add(item.id);
      }

      const batch = db.batch();

      for (const item of registros) {
        const ref = db.collection(COLECAO).doc(item.id);

        batch.set(ref, {
          cidade: item.cidade,
          escola: item.escola,
          diretor: item.diretor,
          adjunto: item.adjunto,
          fonteBase: FONTE_BASE,
          criadoEm: FieldValue.serverTimestamp(),
          atualizadoEm: FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();

      return res.status(200).json({
        ok: true,
        importados: registros.length,
      });
    }

    if (req.method === "PUT") {
      const body =
        typeof req.body === "string"
          ? JSON.parse(req.body || "{}")
          : req.body || {};

      const id = texto(body.id, 220);

      if (!id) {
        return res.status(400).json({
          ok: false,
          erro: "ID não informado.",
        });
      }

      const ref = db.collection(COLECAO).doc(id);
      const atual = await ref.get();

      if (!atual.exists) {
        return res.status(404).json({
          ok: false,
          erro: "Registro não encontrado.",
        });
      }

      // Cidade e escola nunca são aceitas do cliente em uma edição.
      await ref.update({
        diretor: sanitizarPerfil(body.diretor),
        adjunto: sanitizarPerfil(body.adjunto),
        atualizadoEm: FieldValue.serverTimestamp(),
      });

      const depois = await ref.get();
      const dados = depois.data() || {};

      return res.status(200).json({
        ok: true,
        registro: {
          id: depois.id,
          cidade: dados.cidade || "",
          escola: dados.escola || "",
          diretor: dados.diretor || {},
          adjunto: dados.adjunto || {},
          fonteBase: dados.fonteBase || "",
          criadoEm: serializarTimestamp(dados.criadoEm),
          atualizadoEm: serializarTimestamp(dados.atualizadoEm),
        },
      });
    }

    return res.status(405).json({
      ok: false,
      erro: "Método não permitido.",
    });
  } catch (erro) {
    console.error("perfil-gestores:", erro);

    return res.status(500).json({
      ok: false,
      erro: erro?.message || "Erro interno.",
    });
  }
}
