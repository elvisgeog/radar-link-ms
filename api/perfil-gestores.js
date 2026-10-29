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

function autorizado(req) {
  const esperado = process.env.RADAR_PERFIL_SECRET;
  const recebido = String(req.headers["x-radar-secret"] || "");

  if (!esperado) {
    return {
      ok: false,
      status: 500,
      erro: "RADAR_PERFIL_SECRET não configurada na Vercel.",
    };
  }

  if (!recebido || recebido !== esperado) {
    return {
      ok: false,
      status: 401,
      erro: "Não autorizado.",
    };
  }

  return { ok: true };
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
