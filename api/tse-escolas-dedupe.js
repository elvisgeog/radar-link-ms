import admin from "firebase-admin";

function autorizado(req) {
  const segredo = process.env.CRON_SECRET;

  if (!segredo) return false;

  return (
    (req.headers.authorization || "") ===
    `Bearer ${segredo}`
  );
}

function iniciarFirebase() {
  if (!admin.apps.length) {
    const base64 =
      process.env.FIREBASE_SERVICE_ACCOUNT_B64;

    if (!base64) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_B64 não configurada."
      );
    }

    const serviceAccount = JSON.parse(
      Buffer.from(base64, "base64").toString("utf8")
    );

    admin.initializeApp({
      credential: admin.credential.cert(
        serviceAccount
      ),
    });
  }

  return admin.firestore();
}

function normalizar(valor = "") {
  return String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function secoesNormalizadas(secoes = []) {
  return [...new Set(
    (Array.isArray(secoes) ? secoes : [])
      .map((s) => Number(s))
      .filter((s) => Number.isFinite(s) && s > 0)
  )].sort((a, b) => a - b);
}

function assinatura(dados = {}) {
  const municipio = normalizar(
    dados.municipio
  );

  const zona = String(
    dados.zona ?? ""
  ).trim();

  const secoes = secoesNormalizadas(
    dados.secoes
  );

  if (!municipio || !zona || !secoes.length) {
    return "";
  }

  return `${municipio}|${zona}|${secoes.join(",")}`;
}

const CANONICOS_DOURADOS = [
  {
    nome: "EE PRES. GETÚLIO VARGAS",
    aliases: [
      "EE GETULIO VARGAS",
      "EE PRES GETULIO VARGAS",
      "EE PRESIDENTE GETULIO VARGAS",
    ],
  },
  {
    nome: "EE MIN. JOÃO PAULO DOS REIS VELOSO",
    aliases: [
      "EE JOAO PAULO DOS REIS VELOSO",
      "EE MIN JOAO PAULO DOS REIS VELOSO",
      "EE MINISTRO JOAO PAULO DOS REIS VELOSO",
    ],
  },
  {
    nome: "EE PROF. ALÍCIO ARAÚJO",
    aliases: [
      "EE PROF ALICIO ARAUJO",
      "EE PROF ALICIO DE ARAUJO",
      "EE PROFESSOR ALICIO ARAUJO",
      "EE PROFESSOR ALICIO DE ARAUJO",
    ],
  },
  {
    nome: "EE PROF. CELSO MÜLLER DO AMARAL",
    aliases: [
      "EE PROF CELSO MULLER DO AMARAL",
      "EE PROFESSOR CELSO MULLER DO AMARAL",
    ],
  },
  {
    nome: "EE VEREADOR MOACIR DJALMA BARROS",
    aliases: [
      "EE DJALMA BARROS",
      "EE VEREADOR MOACIR DJALMA BARROS",
      "EE MOACIR DJALMA BARROS",
    ],
  },
];

function definicaoCanonica(nomes = []) {
  const normalizados = nomes.map(
    (nome) => normalizar(nome)
  );

  for (const item of CANONICOS_DOURADOS) {
    const aliases = item.aliases.map(
      (alias) => normalizar(alias)
    );

    const encontrou = normalizados.some(
      (nome) => aliases.includes(nome)
    );

    if (encontrou) {
      return item;
    }
  }

  return null;
}

function escolherPrincipal(documentos, canonico) {
  const nomeCanonico = normalizar(
    canonico.nome
  );

  const exato = documentos.find(
    (item) =>
      normalizar(item.dados.escolaRadar) ===
      nomeCanonico
  );

  if (exato) return exato;

  const aliases = canonico.aliases.map(
    (alias) => normalizar(alias)
  );

  const porAlias = documentos.find(
    (item) =>
      aliases.includes(
        normalizar(item.dados.escolaRadar)
      )
  );

  return porAlias || documentos[0];
}

function resumoDocumento(item) {
  return {
    id: item.id,
    escolaRadar:
      item.dados.escolaRadar || "",
    nomeLocalVotacaoTSE:
      item.dados.nomeLocalVotacaoTSE || "",
    municipio:
      item.dados.municipio || "",
    zona:
      item.dados.zona ?? null,
    secoes:
      secoesNormalizadas(
        item.dados.secoes
      ),
    eleitoresCadastrados:
      Number(
        item.dados.eleitoresCadastrados || 0
      ),
  };
}

export default async function handler(req, res) {
  if (!autorizado(req)) {
    return res.status(401).json({
      ok: false,
      erro: "Não autorizado",
    });
  }

  try {
    const db = iniciarFirebase();

    const aplicar =
      String(req.query?.aplicar || "") === "1";

    const snap = await db
      .collection("escolas_tse_2026")
      .get();

    const documentos = snap.docs.map(
      (doc) => ({
        id: doc.id,
        ref: doc.ref,
        dados: doc.data() || {},
      })
    );

    const dourados = documentos.filter(
      (item) =>
        normalizar(
          item.dados.municipio
        ) === "DOURADOS"
    );

    const grupos = new Map();

    for (const item of dourados) {
      const chave = assinatura(item.dados);

      if (!chave) continue;

      if (!grupos.has(chave)) {
        grupos.set(chave, []);
      }

      grupos.get(chave).push(item);
    }

    const duplicidades = [];

    for (const [chave, itens] of grupos) {
      if (itens.length < 2) continue;

      const nomes = itens.map(
        (item) =>
          item.dados.escolaRadar || ""
      );

      const canonico =
        definicaoCanonica(nomes);

      duplicidades.push({
        assinatura: chave,
        reconhecida: Boolean(canonico),
        nomeCanonico:
          canonico?.nome || null,
        registros:
          itens.map(resumoDocumento),
      });
    }

    if (!aplicar) {
      return res.status(200).json({
        ok: true,
        modo: "diagnostico",
        totalDourados: dourados.length,
        gruposDuplicados:
          duplicidades.length,
        duplicidades,
        instrucao:
          "Revise a lista. Para aplicar somente as duplicidades reconhecidas, execute com ?aplicar=1.",
      });
    }

    const corrigidos = [];
    const ignorados = [];

    for (const grupo of duplicidades) {
      if (!grupo.reconhecida) {
        ignorados.push(grupo);
        continue;
      }

      const itens = grupos.get(
        grupo.assinatura
      );

      const canonico =
        definicaoCanonica(
          itens.map(
            (item) =>
              item.dados.escolaRadar || ""
          )
        );

      const principal =
        escolherPrincipal(
          itens,
          canonico
        );

      const excluir = itens.filter(
        (item) =>
          item.id !== principal.id
      );

      const todosEleitores = itens.map(
        (item) =>
          Number(
            item.dados.eleitoresCadastrados || 0
          )
      );

      const maiorEleitorado = Math.max(
        0,
        ...todosEleitores
      );

      const locais = [
        ...new Set(
          itens
            .map(
              (item) =>
                item.dados
                  .nomeLocalVotacaoTSE
            )
            .filter(Boolean)
        ),
      ];

      const atualizacao = {
        escolaRadar:
          canonico.nome,
        secoes:
          secoesNormalizadas(
            principal.dados.secoes
          ),
        eleitoresCadastrados:
          maiorEleitorado,
        duplicidadeCorrigida:
          true,
        duplicidadeCorrigidaEm:
          admin.firestore
            .FieldValue
            .serverTimestamp(),
        aliasesUnificados:
          [
            ...new Set(
              itens.map(
                (item) =>
                  item.dados
                    .escolaRadar || ""
              )
            ),
          ],
      };

      if (
        !principal.dados
          .nomeLocalVotacaoTSE &&
        locais.length
      ) {
        atualizacao.nomeLocalVotacaoTSE =
          locais[0];
      }

      await principal.ref.set(
        atualizacao,
        { merge: true }
      );

      for (const item of excluir) {
        await item.ref.delete();

        // Remove resultado agregado antigo
        // vinculado ao documento duplicado.
        await db
          .collection(
            "resultados_escolas_tse_2026"
          )
          .doc(item.id)
          .delete()
          .catch(() => {});
      }

      corrigidos.push({
        nomeCanonico:
          canonico.nome,
        mantido:
          principal.id,
        excluidos:
          excluir.map(
            (item) => item.id
          ),
        secoes:
          secoesNormalizadas(
            principal.dados.secoes
          ),
      });
    }

    await db
      .collection("meta_tse_2026")
      .doc("deduplicacao_escolas")
      .set(
        {
          municipio: "DOURADOS",
          corrigidos,
          ignorados: ignorados.map(
            (g) => ({
              assinatura: g.assinatura,
              registros:
                g.registros.map(
                  (r) => r.escolaRadar
                ),
            })
          ),
          atualizadoEm:
            admin.firestore
              .FieldValue
              .serverTimestamp(),
        },
        { merge: true }
      );

    return res.status(200).json({
      ok: true,
      modo: "aplicado",
      gruposCorrigidos:
        corrigidos.length,
      corrigidos,
      gruposIgnorados:
        ignorados.length,
      observacao:
        "Execute novamente /api/tse-eleitorado e /api/tse-bus-sync após a correção para recalcular totais e vínculos.",
    });
  } catch (erro) {
    console.error(
      "Erro na deduplicação de escolas:",
      erro
    );

    return res.status(500).json({
      ok: false,
      erro:
        erro?.message ||
        String(erro),
    });
  }
}
