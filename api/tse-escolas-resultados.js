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
    .replace(/\s+/g, " ")
    .trim();
}

function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function criarResultadoBase(resultado) {
  return {
    idEleicao:
      resultado.idEleicao ?? null,

    cargoCodigo:
      resultado.cargoCodigo ?? null,

    cargoNome:
      resultado.cargoNome || "",

    comparecimento: 0,
    votosNominais: 0,
    votosLegenda: 0,
    votosValidos: 0,
    brancos: 0,
    nulos: 0,
    cargoSemCandidato: 0,

    candidatos: new Map(),
  };
}

function somarResultado(destino, origem) {
  destino.comparecimento +=
    numero(origem.comparecimento);

  destino.votosNominais +=
    numero(origem.votosNominais);

  destino.votosLegenda +=
    numero(origem.votosLegenda);

  destino.votosValidos +=
    numero(origem.votosValidos);

  destino.brancos +=
    numero(origem.brancos);

  destino.nulos +=
    numero(origem.nulos);

  destino.cargoSemCandidato +=
    numero(origem.cargoSemCandidato);

  for (const candidato of
    origem.candidatos || []) {

    const numeroCandidato =
      candidato.numero;

    if (
      numeroCandidato === null ||
      numeroCandidato === undefined
    ) {
      continue;
    }

    const chave =
      String(numeroCandidato);

    if (!destino.candidatos.has(chave)) {
      destino.candidatos.set(chave, {
        numero: numeroCandidato,
        partido:
          candidato.partido ?? null,
        votos: 0,
      });
    }

    const atual =
      destino.candidatos.get(chave);

    atual.votos +=
      numero(candidato.votos);
  }
}

function resultadoParaFirestore(resultado) {
  return {
    idEleicao: resultado.idEleicao,
    cargoCodigo: resultado.cargoCodigo,
    cargoNome: resultado.cargoNome,

    comparecimento:
      resultado.comparecimento,

    votosNominais:
      resultado.votosNominais,

    votosLegenda:
      resultado.votosLegenda,

    votosValidos:
      resultado.votosValidos,

    brancos:
      resultado.brancos,

    nulos:
      resultado.nulos,

    cargoSemCandidato:
      resultado.cargoSemCandidato,

    candidatos: Array.from(
      resultado.candidatos.values()
    ).sort(
      (a, b) =>
        numero(a.numero) -
        numero(b.numero)
    ),
  };
}

function idsDasEscolasDaSecao(
  escolasSecao,
  indicePorNome
) {
  const ids = new Set();

  for (const item of escolasSecao || []) {
    const idDireto =
      item?.id ||
      item?.escolaId ||
      item?.docId;

    if (idDireto) {
      ids.add(String(idDireto));
      continue;
    }

    const municipio =
      normalizar(item?.municipio);

    const nome =
      normalizar(
        item?.escolaRadar ||
        item?.escola ||
        item?.nome
      );

    const chave =
      `${municipio}|${nome}`;

    const idEncontrado =
      indicePorNome.get(chave);

    if (idEncontrado) {
      ids.add(idEncontrado);
    }
  }

  return Array.from(ids);
}

export default async function handler(
  req,
  res
) {
  if (!autorizado(req)) {
    return res.status(401).json({
      ok: false,
      erro: "Não autorizado",
    });
  }

  try {
    const db = iniciarFirebase();

    const [
      escolasSnap,
      secoesSnap,
    ] = await Promise.all([
      db.collection(
        "escolas_tse_2026"
      ).get(),

      db.collection(
        "votos_secao_tse_2026"
      ).get(),
    ]);

    const escolas = new Map();
    const indicePorNome = new Map();

    for (const doc of escolasSnap.docs) {
      const dados = doc.data() || {};

      const registro = {
        id: doc.id,

        escolaRadar:
          dados.escolaRadar ||
          dados.escola ||
          "",

        municipio:
          dados.municipio || "",

        nomeLocalVotacaoTSE:
          dados.nomeLocalVotacaoTSE ||
          dados.nomeLocalVotacao ||
          "",

        zona:
          dados.zona ?? null,

        secoes:
          Array.isArray(dados.secoes)
            ? dados.secoes
            : [],

        resultados: new Map(),

        secoesComBU: new Set(),
      };

      escolas.set(doc.id, registro);

      const chave =
        `${normalizar(registro.municipio)}|` +
        `${normalizar(registro.escolaRadar)}`;

      indicePorNome.set(
        chave,
        doc.id
      );
    }

    for (const secaoDoc of
      secoesSnap.docs) {

      const secao =
        secaoDoc.data() || {};

      const idsEscolas =
        idsDasEscolasDaSecao(
          secao.escolas,
          indicePorNome
        );

      for (const escolaId of
        idsEscolas) {

        const escola =
          escolas.get(escolaId);

        if (!escola) continue;

        escola.secoesComBU.add(
          secaoDoc.id
        );

        for (const resultado of
          secao.resultados || []) {

          const chaveResultado =
            `${resultado.idEleicao ?? ""}|` +
            `${resultado.cargoCodigo ?? ""}`;

          if (
            !escola.resultados.has(
              chaveResultado
            )
          ) {
            escola.resultados.set(
              chaveResultado,
              criarResultadoBase(
                resultado
              )
            );
          }

          somarResultado(
            escola.resultados.get(
              chaveResultado
            ),
            resultado
          );
        }
      }
    }

    let escolasComBU = 0;
    let resultadosGravados = 0;

    const batch = db.batch();

    for (const escola of
      escolas.values()) {

      const resultados =
        Array.from(
          escola.resultados.values()
        )
          .map(
            resultadoParaFirestore
          )
          .sort((a, b) => {
            const cargo =
              numero(a.cargoCodigo) -
              numero(b.cargoCodigo);

            if (cargo !== 0) {
              return cargo;
            }

            return (
              numero(a.idEleicao) -
              numero(b.idEleicao)
            );
          });

      if (
        escola.secoesComBU.size > 0
      ) {
        escolasComBU++;
      }

      resultadosGravados +=
        resultados.length;

      const ref = db
        .collection(
          "resultados_escolas_tse_2026"
        )
        .doc(escola.id);

      batch.set(ref, {
        escolaId: escola.id,

        escolaRadar:
          escola.escolaRadar,

        municipio:
          escola.municipio,

        nomeLocalVotacaoTSE:
          escola.nomeLocalVotacaoTSE,

        zona:
          escola.zona,

        totalSecoesEsperadas:
          escola.secoes.length,

        totalSecoesComBU:
          escola.secoesComBU.size,

        secoesComBU:
          Array.from(
            escola.secoesComBU
          ),

        resultados,

        atualizadoEm:
          admin.firestore
            .FieldValue
            .serverTimestamp(),
      });
    }

    const metaRef = db
      .collection("meta_tse_2026")
      .doc("resultados_escolas");

    batch.set(
      metaRef,
      {
        fonte:
          "Boletins de Urna TSE",

        totalEscolas:
          escolas.size,

        totalSecoesProcessadas:
          secoesSnap.size,

        escolasComBU,

        resultadosCargoGravados:
          resultadosGravados,

        atualizadoEm:
          admin.firestore
            .FieldValue
            .serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    await batch.commit();

    return res.status(200).json({
      ok: true,

      totalEscolas:
        escolas.size,

      totalSecoesProcessadas:
        secoesSnap.size,

      escolasComBU,

      resultadosCargoGravados:
        resultadosGravados,
    });

  } catch (erro) {
    console.error(
      "Erro ao agregar resultados por escola:",
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
