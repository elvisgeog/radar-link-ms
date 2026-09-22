import base64
import json
import os
import time
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen

import asn1tools
import firebase_admin
from firebase_admin import credentials, firestore

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ASN1_PATH = os.path.join(BASE_DIR, "bu.asn1")

_CONVERSOR = None
_DB = None

CARGOS_INTERESSE = {3, 5, 6, 7}

CARGOS = {
    3: "Governador",
    5: "Senador",
    6: "Deputado Federal",
    7: "Deputado Estadual",
}


def conversor():
    global _CONVERSOR

    if _CONVERSOR is None:
        _CONVERSOR = asn1tools.compile_files(
            [ASN1_PATH],
            codec="ber",
            numeric_enums=True,
        )

    return _CONVERSOR


def banco():
    global _DB

    if _DB is not None:
        return _DB

    valor = os.environ.get(
        "FIREBASE_SERVICE_ACCOUNT_B64",
        "",
    ).strip()

    if not valor:
        raise RuntimeError(
            "FIREBASE_SERVICE_ACCOUNT_B64 não configurada na Vercel."
        )

    dados = json.loads(
        base64.b64decode(valor).decode("utf-8")
    )

    if not firebase_admin._apps:
        firebase_admin.initialize_app(
            credentials.Certificate(dados)
        )

    _DB = firestore.client()

    return _DB


def valor_choice(valor):
    if (
        isinstance(valor, (tuple, list))
        and len(valor) == 2
    ):
        return valor[1]

    return valor


def inteiro(valor):
    try:
        return int(valor)
    except (TypeError, ValueError):
        return None


def host_tse_valido(url):
    parsed = urlparse(url)

    if parsed.scheme != "https":
        return False

    host = (parsed.hostname or "").lower()

    return (
        host == "tse.jus.br"
        or host.endswith(".tse.jus.br")
    )


def baixar(url):
    if not host_tse_valido(url):
        raise ValueError(
            "URL do BU fora do domínio oficial tse.jus.br."
        )

    req = Request(
        url,
        headers={
            "Accept": "application/octet-stream,*/*",
            "User-Agent": "RadarLinkMS/1.0",
        },
    )

    with urlopen(
        req,
        timeout=25,
    ) as resposta:
        conteudo = resposta.read()

    if not conteudo:
        raise ValueError(
            "Arquivo BU vazio."
        )

    return conteudo


def decodificar_bu(conteudo):
    conv = conversor()

    envelope = conv.decode(
        "EntidadeEnvelopeGenerico",
        bytearray(conteudo),
    )

    if inteiro(
        envelope.get("tipoEnvelope")
    ) != 1:
        raise ValueError(
            "Arquivo recebido não é um Boletim de Urna."
        )

    bu = conv.decode(
        "EntidadeBoletimUrna",
        envelope["conteudo"],
    )

    identificacao = (
        bu.get("identificacaoSecao")
        or {}
    )

    municipio_zona = (
        identificacao.get(
            "municipioZona"
        )
        or {}
    )

    resultados = []

    for eleicao in (
        bu.get(
            "resultadosVotacaoPorEleicao",
            [],
        )
        or []
    ):
        id_eleicao = inteiro(
            eleicao.get("idEleicao")
        )

        for resultado in (
            eleicao.get(
                "resultadosVotacao",
                [],
            )
            or []
        ):
            comparecimento = (
                inteiro(
                    resultado.get(
                        "qtdComparecimento"
                    )
                )
                or 0
            )

            for total_cargo in (
                resultado.get(
                    "totaisVotosCargo",
                    [],
                )
                or []
            ):
                cargo = inteiro(
                    valor_choice(
                        total_cargo.get(
                            "codigoCargo"
                        )
                    )
                )

                if (
                    cargo
                    not in CARGOS_INTERESSE
                ):
                    continue

                candidatos = {}

                nominais = 0
                legenda = 0
                brancos = 0
                nulos = 0
                cargo_sem_candidato = 0

                for voto in (
                    total_cargo.get(
                        "votosVotaveis",
                        [],
                    )
                    or []
                ):
                    tipo = inteiro(
                        voto.get(
                            "tipoVoto"
                        )
                    )

                    quantidade = (
                        inteiro(
                            voto.get(
                                "quantidadeVotos"
                            )
                        )
                        or 0
                    )

                    votavel = (
                        voto.get(
                            "identificacaoVotavel"
                        )
                        or {}
                    )

                    if tipo == 1:
                        nominais += quantidade

                        numero = inteiro(
                            votavel.get(
                                "codigo"
                            )
                        )

                        partido = inteiro(
                            votavel.get(
                                "partido"
                            )
                        )

                        if numero is not None:
                            chave = str(numero)

                            atual = (
                                candidatos.setdefault(
                                    chave,
                                    {
                                        "numero":
                                            numero,
                                        "partido":
                                            partido,
                                        "votos":
                                            0,
                                    },
                                )
                            )

                            atual[
                                "votos"
                            ] += quantidade

                    elif tipo == 2:
                        brancos += quantidade

                    elif tipo == 3:
                        nulos += quantidade

                    elif tipo == 4:
                        legenda += quantidade

                    elif tipo == 5:
                        cargo_sem_candidato += (
                            quantidade
                        )

                lista_candidatos = sorted(
                    candidatos.values(),
                    key=lambda item:
                        item["numero"],
                )

                resultados.append(
                    {
                        "idEleicao":
                            id_eleicao,

                        "cargoCodigo":
                            cargo,

                        "cargoNome":
                            CARGOS[cargo],

                        "comparecimento":
                            comparecimento,

                        "votosNominais":
                            nominais,

                        "votosLegenda":
                            legenda,

                        "votosValidos":
                            nominais
                            + legenda,

                        "brancos":
                            brancos,

                        "nulos":
                            nulos,

                        "cargoSemCandidato":
                            cargo_sem_candidato,

                        "candidatos":
                            lista_candidatos,
                    }
                )

    return {
        "fase":
            inteiro(
                bu.get("fase")
            ),

        "dataHoraEmissao":
            bu.get(
                "dataHoraEmissao"
            ),

        "municipioCodigo":
            inteiro(
                municipio_zona.get(
                    "municipio"
                )
            ),

        "zona":
            inteiro(
                municipio_zona.get(
                    "zona"
                )
            ),

        "local":
            inteiro(
                identificacao.get(
                    "local"
                )
            ),

        "secao":
            inteiro(
                identificacao.get(
                    "secao"
                )
            ),

        "qtdEleitoresCompareceram":
            inteiro(
                bu.get(
                    "qtdEleitoresCompareceram"
                )
            ),

        "resultados":
            resultados,
    }


def escolher_bu(arquivos):
    validos = [
        item
        for item in (
            arquivos or []
        )
        if (
            item.get("url")
            and item.get("hash")
        )
    ]

    if not validos:
        return None

    return validos[-1]


def mesmo_numero(a, b):
    try:
        return int(a) == int(b)
    except (TypeError, ValueError):
        return (
            str(a).lstrip("0")
            == str(b).lstrip("0")
        )


class handler(BaseHTTPRequestHandler):

    def responder(
        self,
        status,
        payload,
    ):
        corpo = json.dumps(
            payload,
            ensure_ascii=False,
            separators=(",", ":"),
        ).encode("utf-8")

        self.send_response(status)

        self.send_header(
            "Content-Type",
            "application/json; charset=utf-8",
        )

        self.send_header(
            "Cache-Control",
            "no-store",
        )

        self.end_headers()

        self.wfile.write(corpo)

    def autorizado(self):
        segredo = os.environ.get(
            "CRON_SECRET",
            "",
        )

        if not segredo:
            return False

        return (
            self.headers.get(
                "Authorization",
                "",
            )
            == f"Bearer {segredo}"
        )

    def do_GET(self):
        inicio = time.time()

        try:
            query = parse_qs(
                urlparse(
                    self.path
                ).query
            )

            if (
                query.get(
                    "health",
                    [""],
                )[0]
                == "1"
            ):
                conversor()
                banco()

                return self.responder(
                    200,
                    {
                        "ok": True,
                        "processador":
                            "BU 2026",
                        "asn1":
                            "compilado",
                        "firebase":
                            "conectado",
                    },
                )

            if not self.autorizado():
                return self.responder(
                    401,
                    {
                        "ok": False,
                        "erro":
                            "Não autorizado",
                    },
                )

            limite = (
                inteiro(
                    query.get(
                        "limit",
                        ["40"],
                    )[0]
                )
                or 40
            )

            limite = max(
                1,
                min(
                    limite,
                    100,
                ),
            )

            db = banco()

            documentos = list(
                db.collection(
                    "bus_tse_2026"
                )
                .where(
                    "buDisponivel",
                    "==",
                    True,
                )
                .stream()
            )

            candidatos_processamento = []

            for doc in documentos:
                dados = (
                    doc.to_dict()
                    or {}
                )

                arquivo = escolher_bu(
                    dados.get(
                        "arquivosBU"
                    )
                )

                if not arquivo:
                    continue

                hash_atual = str(
                    arquivo.get(
                        "hash"
                    )
                    or ""
                )

                if (
                    dados.get(
                        "buProcessadoOk"
                    )
                    is True
                    and str(
                        dados.get(
                            "buProcessadoHash"
                        )
                        or ""
                    )
                    == hash_atual
                ):
                    continue

                candidatos_processamento.append(
                    (
                        doc.reference,
                        doc.id,
                        dados,
                        arquivo,
                    )
                )

            candidatos_processamento = (
                candidatos_processamento[
                    :limite
                ]
            )

            processados = 0
            falhas = 0
            resultados_gravados = 0

            detalhes_erros = []

            for (
                ref,
                doc_id,
                dados,
                arquivo,
            ) in candidatos_processamento:

                if (
                    time.time()
                    - inicio
                    > 48
                ):
                    break

                try:
                    conteudo = baixar(
                        arquivo["url"]
                    )

                    resultado = (
                        decodificar_bu(
                            conteudo
                        )
                    )

                    if not mesmo_numero(
                        resultado.get(
                            "municipioCodigo"
                        ),
                        dados.get(
                            "codigoMunicipio"
                        ),
                    ):
                        raise ValueError(
                            "Município do BU não corresponde ao registro da seção."
                        )

                    if not mesmo_numero(
                        resultado.get(
                            "zona"
                        ),
                        dados.get(
                            "zona"
                        ),
                    ):
                        raise ValueError(
                            "Zona do BU não corresponde ao registro da seção."
                        )

                    if not mesmo_numero(
                        resultado.get(
                            "secao"
                        ),
                        dados.get(
                            "secao"
                        ),
                    ):
                        raise ValueError(
                            "Seção do BU não corresponde ao registro da seção."
                        )

                    doc_secao = {
                        "uf":
                            "MS",

                        "codigoMunicipio":
                            str(
                                dados.get(
                                    "codigoMunicipio"
                                )
                                or ""
                            ),

                        "municipio":
                            dados.get(
                                "municipio"
                            )
                            or "",

                        "zona":
                            str(
                                dados.get(
                                    "zona"
                                )
                                or ""
                            ),

                        "secao":
                            str(
                                dados.get(
                                    "secao"
                                )
                                or ""
                            ),

                        "escolas":
                            dados.get(
                                "escolas"
                            )
                            or [],

                        "hashBU":
                            arquivo.get(
                                "hash"
                            ),

                        "nomeArquivoBU":
                            arquivo.get(
                                "nome"
                            ),

                        "urlBU":
                            arquivo.get(
                                "url"
                            ),

                        "bytesBU":
                            len(conteudo),

                        "fase":
                            resultado.get(
                                "fase"
                            ),

                        "dataHoraEmissao":
                            resultado.get(
                                "dataHoraEmissao"
                            ),

                        "local":
                            resultado.get(
                                "local"
                            ),

                        "qtdEleitoresCompareceram":
                            resultado.get(
                                "qtdEleitoresCompareceram"
                            ),

                        "resultados":
                            resultado.get(
                                "resultados"
                            )
                            or [],

                        "atualizadoEm":
                            firestore.SERVER_TIMESTAMP,
                    }

                    db.collection(
                        "votos_secao_tse_2026"
                    ).document(
                        doc_id
                    ).set(
                        doc_secao,
                        merge=True,
                    )

                    ref.set(
                        {
                            "buProcessadoOk":
                                True,

                            "buProcessadoHash":
                                arquivo.get(
                                    "hash"
                                ),

                            "buProcessadoEm":
                                firestore.SERVER_TIMESTAMP,

                            "buProcessamentoErro":
                                None,
                        },
                        merge=True,
                    )

                    processados += 1

                    resultados_gravados += len(
                        resultado.get(
                            "resultados"
                        )
                        or []
                    )

                except Exception as erro:
                    falhas += 1

                    mensagem = str(
                        erro
                    )[:500]

                    ref.set(
                        {
                            "buProcessadoOk":
                                False,

                            "buProcessamentoErro":
                                mensagem,

                            "buProcessadoEm":
                                firestore.SERVER_TIMESTAMP,
                        },
                        merge=True,
                    )

                    detalhes_erros.append(
                        {
                            "id":
                                doc_id,
                            "erro":
                                mensagem,
                        }
                    )

            db.collection(
                "meta_tse_2026"
            ).document(
                "processamento_bus"
            ).set(
                {
                    "fonte":
                        "TSE BU ASN.1",

                    "totalComBU":
                        len(documentos),

                    "selecionadosNestaExecucao":
                        len(
                            candidatos_processamento
                        ),

                    "processadosNestaExecucao":
                        processados,

                    "falhasNestaExecucao":
                        falhas,

                    "resultadosCargoGravados":
                        resultados_gravados,

                    "atualizadoEm":
                        firestore.SERVER_TIMESTAMP,
                },
                merge=True,
            )

            return self.responder(
                200,
                {
                    "ok":
                        True,

                    "totalComBU":
                        len(documentos),

                    "selecionados":
                        len(
                            candidatos_processamento
                        ),

                    "processados":
                        processados,

                    "falhas":
                        falhas,

                    "resultadosCargoGravados":
                        resultados_gravados,

                    "detalhesErros":
                        detalhes_erros[:10],

                    "duracaoMs":
                        int(
                            (
                                time.time()
                                - inicio
                            )
                            * 1000
                        ),
                },
            )

        except Exception as erro:
            return self.responder(
                500,
                {
                    "ok":
                        False,

                    "erro":
                        str(erro),

                    "duracaoMs":
                        int(
                            (
                                time.time()
                                - inicio
                            )
                            * 1000
                        ),
                },
            )
