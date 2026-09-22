import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { inflateRawSync } from "node:zlib";

const TSE_URL =
  "https://dadosabertos.tse.jus.br/dataset/eleitorado-2026/resource/bfc7d118-2d99-445c-bf75-11c64d0e3cbb/download/perfil_eleitor_secao_2026_ms.zip";

const MUNICIPIOS_CRE5 = [
  "CAARAPÓ",
  "DEODÁPOLIS",
  "DOURADINA",
  "DOURADOS",
  "FÁTIMA DO SUL",
  "GLÓRIA DE DOURADOS",
  "ITAPORÃ",
  "JATEÍ",
  "LAGUNA CARAPÃ",
  "MARACAJU",
  "RIO BRILHANTE",
  "VICENTINA",
];

function normalizar(valor = "") {
  return String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function numeroLimpo(valor) {
  const n = Number(String(valor).trim());
  return Number.isFinite(n) ? String(n) : String(valor).trim();
}

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

function extrairCsvDoZip(zip) {
  let eocd = -1;

  const inicioBusca = Math.max(0, zip.length - 65557);

  for (let i = zip.length - 22; i >= inicioBusca; i--) {
    if (zip.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }

  if (eocd < 0) {
    throw new Error("Estrutura ZIP do TSE não reconhecida.");
  }

  const totalEntradas = zip.readUInt16LE(eocd + 10);
  let offset = zip.readUInt32LE(eocd + 16);

  let arquivo = null;

  for (let i = 0; i < totalEntradas; i++) {
    if (zip.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("Diretório ZIP inválido.");
    }

    const metodo = zip.readUInt16LE(offset + 10);
    const tamanhoComprimido = zip.readUInt32LE(offset + 20);
    const tamanhoNome = zip.readUInt16LE(offset + 28);
    const tamanhoExtra = zip.readUInt16LE(offset + 30);
    const tamanhoComentario = zip.readUInt16LE(offset + 32);
    const offsetLocal = zip.readUInt32LE(offset + 42);

    const nome = zip
      .subarray(offset + 46, offset + 46 + tamanhoNome)
      .toString("utf8");

    if (nome.toLowerCase().endsWith(".csv")) {
      arquivo = {
        nome,
        metodo,
        tamanhoComprimido,
        offsetLocal,
      };
      break;
    }

    offset +=
      46 + tamanhoNome + tamanhoExtra + tamanhoComentario;
  }

  if (!arquivo) {
    throw new Error("CSV não encontrado dentro do ZIP do TSE.");
  }

  if (zip.readUInt32LE(arquivo.offsetLocal) !== 0x04034b50) {
    throw new Error("Cabeçalho do CSV no ZIP é inválido.");
  }

  const tamanhoNomeLocal = zip.readUInt16LE(arquivo.offsetLocal + 26);
  const tamanhoExtraLocal = zip.readUInt16LE(arquivo.offsetLocal + 28);

  const inicioDados =
    arquivo.offsetLocal +
    30 +
    tamanhoNomeLocal +
    tamanhoExtraLocal;

  const comprimido = zip.subarray(
    inicioDados,
    inicioDados + arquivo.tamanhoComprimido
  );

  if (arquivo.metodo === 0) {
    return comprimido;
  }

  if (arquivo.metodo === 8) {
    return inflateRawSync(comprimido);
  }

  throw new Error(
    `Método de compressão ZIP não suportado: ${arquivo.metodo}`
  );
}

function separarLinhaCSV(linha) {
  const campos = [];
  let atual = "";
  let aspas = false;

  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];

    if (ch === '"') {
      if (aspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        aspas = !aspas;
      }
    } else if (ch === ";" && !aspas) {
      campos.push(atual);
      atual = "";
    } else {
      atual += ch;
    }
  }

  campos.push(atual);

  return campos;
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

    const resposta = await fetch(TSE_URL, {
      cache: "no-store",
     headers: {
  Accept: "application/zip,application/octet-stream,*/*",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  Referer:
    "https://dadosabertos.tse.jus.br/dataset/eleitorado-2026/resource/bfc7d118-2d99-445c-bf75-11c64d0e3cbb",
  "Cache-Control": "no-cache",
},
    });

    if (!resposta.ok) {
      throw new Error(
        `TSE respondeu HTTP ${resposta.status}`
      );
    }

    const zip = Buffer.from(await resposta.arrayBuffer());
    const csvBuffer = extrairCsvDoZip(zip);

    const texto = new TextDecoder("latin1").decode(csvBuffer);

    const linhas = texto
      .split(/\r?\n/)
      .filter((linha) => linha.trim().length > 0);

    if (linhas.length < 2) {
      throw new Error("CSV do TSE está vazio.");
    }

    const cabecalho = separarLinhaCSV(linhas[0]).map((campo) =>
      campo.replace(/^\uFEFF/, "").trim().toUpperCase()
    );

    function indice(...nomes) {
      for (const nome of nomes) {
        const i = cabecalho.indexOf(nome);
        if (i >= 0) return i;
      }
      return -1;
    }

    const iCodigoMunicipio = indice("CD_MUNICIPIO");
    const iMunicipio = indice("NM_MUNICIPIO");
    const iZona = indice("NR_ZONA");
    const iSecao = indice("NR_SECAO");
    const iNumeroLocal = indice("NR_LOCAL_VOTACAO");
    const iNomeLocal = indice("NM_LOCAL_VOTACAO");

    const iEndereco = indice(
      "DS_LOCAL_VOTACAO_ENDERECO",
      "DS_ENDERECO"
    );

    const obrigatorios = [
      iCodigoMunicipio,
      iMunicipio,
      iZona,
      iSecao,
      iNumeroLocal,
      iNomeLocal,
    ];

    if (obrigatorios.some((i) => i < 0)) {
      return res.status(500).json({
        ok: false,
        erro: "Layout do CSV diferente do esperado.",
        cabecalho,
      });
    }

    const municipiosPermitidos = new Set(
      MUNICIPIOS_CRE5.map(normalizar)
    );

    const secoes = new Map();

    for (let i = 1; i < linhas.length; i++) {
      const campos = separarLinhaCSV(linhas[i]);

      const municipio = campos[iMunicipio] || "";

      if (!municipiosPermitidos.has(normalizar(municipio))) {
        continue;
      }

      const codigoMunicipio = numeroLimpo(
        campos[iCodigoMunicipio]
      );

      const zona = numeroLimpo(campos[iZona]);
      const secao = numeroLimpo(campos[iSecao]);
      const numeroLocal = numeroLimpo(campos[iNumeroLocal]);

      const nomeLocal = (campos[iNomeLocal] || "").trim();

      const endereco =
        iEndereco >= 0
          ? (campos[iEndereco] || "").trim()
          : "";

      const chave = `${codigoMunicipio}_${zona}_${secao}`;

      if (!secoes.has(chave)) {
        secoes.set(chave, {
          municipio: municipio.trim(),
          codigoMunicipio,
          zona,
          secao,
          numeroLocal,
          nomeLocal,
          endereco,
        });
      }
    }

    let batch = db.batch();
    let operacoes = 0;
    let gravados = 0;

    const resumo = {};

    async function salvarBatch() {
      if (operacoes === 0) return;

      await batch.commit();

      batch = db.batch();
      operacoes = 0;
    }

    for (const item of secoes.values()) {
      const id =
        `ms_${item.codigoMunicipio}_${item.zona}_${item.secao}`;

      const ref = db
        .collection("secoes_tse_2026")
        .doc(id);

      batch.set(
        ref,
        {
          municipio: item.municipio,
          municipioNormalizado: normalizar(item.municipio),
          codigoMunicipio: item.codigoMunicipio,

          zona: item.zona,
          secao: item.secao,

          numeroLocalVotacao: item.numeroLocal,
          nomeLocalVotacao: item.nomeLocal,
          enderecoLocalVotacao: item.endereco,

          fonteLocalVotacao:
            "TSE - Perfil do eleitorado por seção eleitoral 2026",

          localVotacaoAtualizadoEm:
            FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      if (!resumo[item.municipio]) {
        resumo[item.municipio] = {
          secoes: 0,
          locais: new Set(),
        };
      }

      resumo[item.municipio].secoes++;
      resumo[item.municipio].locais.add(
        `${item.zona}_${item.numeroLocal}`
      );

      operacoes++;
      gravados++;

      if (operacoes >= 400) {
        await salvarBatch();
      }
    }

    await salvarBatch();

    const municipios = {};

    for (const [nome, dados] of Object.entries(resumo)) {
      municipios[nome] = {
        secoes: dados.secoes,
        locaisVotacao: dados.locais.size,
      };
    }

    await db
      .collection("meta_tse_2026")
      .doc("locais_votacao")
      .set(
        {
          fonte:
            "TSE - Perfil do eleitorado por seção eleitoral 2026 MS",
          url: TSE_URL,
          totalSecoesVinculadas: gravados,
          municipios,
          atualizadoEm: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return res.status(200).json({
      ok: true,
      totalSecoesVinculadas: gravados,
            municipios,
      duracaoMs: Date.now() - inicio,
    });
  } catch (erro) {
    console.error("Erro tse-escolas:", erro);

    return res.status(500).json({
      ok: false,
      erro: erro.message,
      duracaoMs: Date.now() - inicio,
    });
  }
}
