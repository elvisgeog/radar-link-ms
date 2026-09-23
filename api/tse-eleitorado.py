import base64
import csv
import io
import json
import os
import unicodedata
import zipfile
from collections import defaultdict
from http.server import BaseHTTPRequestHandler
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

import firebase_admin
from firebase_admin import credentials, firestore


TSE_URLS = [
    (
        "https://dadosabertos.tse.jus.br/dataset/eleitorado-2026/"
        "resource/bfc7d118-2d99-445c-bf75-11c64d0e3cbb/"
        "download/perfil_eleitor_secao_2026_MS.zip"
    ),
    (
        "https://cdn.tse.jus.br/estatistica/sead/odsele/"
        "perfil_eleitor_secao/perfil_eleitor_secao_2026_MS.zip"
    ),
]

MUNICIPIOS_CRE5 = {
    "CAARAPO": "CAARAPÓ",
    "DEODAPOLIS": "DEODÁPOLIS",
    "DOURADINA": "DOURADINA",
    "DOURADOS": "DOURADOS",
    "FATIMA DO SUL": "FÁTIMA DO SUL",
    "GLORIA DE DOURADOS": "GLÓRIA DE DOURADOS",
    "ITAPORA": "ITAPORÃ",
    "JATEI": "JATEÍ",
    "LAGUNA CARAPA": "LAGUNA CARAPÃ",
    "MARACAJU": "MARACAJU",
    "RIO BRILHANTE": "RIO BRILHANTE",
    "VICENTINA": "VICENTINA",
}

_DB = None


def normalizar(valor=""):
    texto = unicodedata.normalize("NFD", str(valor or ""))
    texto = "".join(
        caractere
        for caractere in texto
        if unicodedata.category(caractere) != "Mn"
    )
    return " ".join(texto.upper().strip().split())


def inteiro(valor):
    try:
        return int(str(valor or "0").strip())
    except (TypeError, ValueError):
        return 0


def slug(valor):
    texto = normalizar(valor).lower()
    return "_".join(texto.split())


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

    service_account = json.loads(
        base64.b64decode(valor).decode("utf-8")
    )

    if not firebase_admin._apps:
        firebase_admin.initialize_app(
            credentials.Certificate(service_account)
        )

    _DB = firestore.client()
    return _DB


def baixar_zip():
    erros = []

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/152.0.0.0 Safari/537.36"
        ),
        "Accept": (
            "text/html,application/xhtml+xml,application/xml;q=0.9,"
            "image/avif,image/webp,image/apng,*/*;q=0.8,"
            "application/signed-exchange;v=b3;q=0.7"
        ),
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "Accept-Encoding": "identity",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Referer": "https://dadosabertos.tse.jus.br/dataset/eleitorado-2026",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Upgrade-Insecure-Requests": "1",
    }

    for url in TSE_URLS:
        try:
            req = Request(
                url,
                headers=headers,
                method="GET",
            )

            with urlopen(
                req,
                timeout=45,
            ) as resposta:
                conteudo = resposta.read()

                status = getattr(
                    resposta,
                    "status",
                    200,
                )

                content_type = str(
                    resposta.headers.get(
                        "Content-Type",
                        "",
                    )
                )

            if status != 200:
                erros.append(
                    f"{url} -> HTTP {status}"
                )
                continue

            if not conteudo:
                erros.append(
                    f"{url} -> resposta vazia"
                )
                continue

            if not zipfile.is_zipfile(
                io.BytesIO(conteudo)
            ):
                inicio = conteudo[:120].decode(
                    "utf-8",
                    errors="replace",
                )

                erros.append(
                    f"{url} -> conteúdo não é ZIP "
                    f"(Content-Type={content_type}; início={inicio!r})"
                )
                continue

            return conteudo

        except HTTPError as erro:
            corpo = ""

            try:
                corpo = erro.read(200).decode(
                    "utf-8",
                    errors="replace",
                )
            except Exception:
                pass

            erros.append(
                f"{url} -> HTTP {erro.code} "
                f"{erro.reason}; resposta={corpo!r}"
            )

        except URLError as erro:
            erros.append(
                f"{url} -> erro de rede: {erro.reason}"
            )

        except Exception as erro:
            erros.append(
                f"{url} -> {type(erro).__name__}: {erro}"
            )

    raise RuntimeError(
        "Falha ao baixar o arquivo oficial do TSE. "
        + " | ".join(erros)
    )


def localizar_csv(conteudo_zip):
    arquivo_zip = zipfile.ZipFile(io.BytesIO(conteudo_zip))

    nomes = [
        nome
        for nome in arquivo_zip.namelist()
        if nome.lower().endswith(".csv")
    ]

    if not nomes:
        raise RuntimeError(
            "Nenhum CSV foi encontrado no ZIP oficial do TSE."
        )

    # O ZIP de MS normalmente contém um único CSV.
    # Se houver mais de um, prioriza o arquivo de perfil por seção de MS.
    nomes.sort(
        key=lambda nome: (
            "perfil_eleitor_secao" not in nome.lower(),
            "_ms" not in nome.lower(),
            nome.lower(),
        )
    )

    return arquivo_zip, nomes[0]


def ler_eleitorado_por_secao(conteudo_zip):
    arquivo_zip, nome_csv = localizar_csv(conteudo_zip)

    totais_secao = defaultdict(int)
    totais_municipio = defaultdict(int)

    data_geracao = ""
    hora_geracao = ""

    with arquivo_zip.open(nome_csv) as bruto:
        texto = io.TextIOWrapper(
            bruto,
            encoding="latin-1",
            newline="",
        )

        leitor = csv.DictReader(
            texto,
            delimiter=";",
            quotechar='"',
        )

        if not leitor.fieldnames:
            raise RuntimeError(
                "O CSV oficial do TSE não possui cabeçalho."
            )

        # Remove eventual BOM e espaços dos nomes das colunas.
        leitor.fieldnames = [
            str(campo or "")
            .replace("\ufeff", "")
            .strip()
            for campo in leitor.fieldnames
        ]

        obrigatorios = {
            "NM_MUNICIPIO",
            "NR_ZONA",
            "NR_SECAO",
            "QT_ELEITORES",
        }

        faltando = obrigatorios.difference(
            set(leitor.fieldnames)
        )

        if faltando:
            raise RuntimeError(
                "Colunas esperadas não encontradas no TSE: "
                + ", ".join(sorted(faltando))
            )

        for linha in leitor:
            municipio_norm = normalizar(
                linha.get("NM_MUNICIPIO")
            )

            if municipio_norm not in MUNICIPIOS_CRE5:
                continue

            zona = inteiro(linha.get("NR_ZONA"))
            secao = inteiro(linha.get("NR_SECAO"))
            quantidade = inteiro(
                linha.get("QT_ELEITORES")
            )

            if not zona or not secao:
                continue

            chave_secao = (
                municipio_norm,
                zona,
                secao,
            )

            totais_secao[chave_secao] += quantidade
            totais_municipio[
                municipio_norm
            ] += quantidade

            if not data_geracao:
                data_geracao = str(
                    linha.get("DT_GERACAO") or ""
                ).strip()

            if not hora_geracao:
                hora_geracao = str(
                    linha.get("HH_GERACAO") or ""
                ).strip()

    return {
        "totaisSecao": dict(totais_secao),
        "totaisMunicipio": dict(totais_municipio),
        "dataGeracao": data_geracao,
        "horaGeracao": hora_geracao,
        "arquivo": nome_csv,
    }


def chave_secao_escola(escola, secao):
    municipio_norm = normalizar(
        escola.get("municipio")
    )

    zona = inteiro(
        escola.get("zona")
    )

    nr_secao = inteiro(secao)

    return (
        municipio_norm,
        zona,
        nr_secao,
    )


def calcular_e_gravar(db, dados_tse):
    escolas_snap = list(
        db.collection(
            "escolas_tse_2026"
        ).stream()
    )

    totais_secao = dados_tse[
        "totaisSecao"
    ]

    totais_municipio = dados_tse[
        "totaisMunicipio"
    ]

    secoes_estaduais_por_municipio = defaultdict(set)
    escolas_por_municipio = defaultdict(int)

    atualizacoes_escolas = []

    for doc in escolas_snap:
        escola = doc.to_dict() or {}

        municipio_norm = normalizar(
            escola.get("municipio")
        )

        if municipio_norm not in MUNICIPIOS_CRE5:
            continue

        secoes = escola.get("secoes") or []

        eleitores_por_secao = []
        total_escola = 0

        for secao in secoes:
            chave = chave_secao_escola(
                escola,
                secao,
            )

            quantidade = inteiro(
                totais_secao.get(
                    chave,
                    0,
                )
            )

            total_escola += quantidade

            eleitores_por_secao.append({
                "secao": inteiro(secao),
                "eleitores": quantidade,
            })

            secoes_estaduais_por_municipio[
                municipio_norm
            ].add(chave)

        escolas_por_municipio[
            municipio_norm
        ] += 1

        atualizacoes_escolas.append(
            (
                doc.reference,
                {
                    "eleitoresCadastrados":
                        total_escola,
                    "eleitoresPorSecao":
                        eleitores_por_secao,
                    "eleitoradoFonte":
                        "TSE - Perfil do eleitorado por seção eleitoral 2026",
                    "eleitoradoAtualizadoEm":
                        firestore.SERVER_TIMESTAMP,
                },
            )
        )

    registros_municipio = {}

    total_cre5 = 0
    total_escolas_cre5 = 0
    total_secoes_estaduais_cre5 = 0

    for municipio_norm, nome_oficial in MUNICIPIOS_CRE5.items():
        eleitores_municipio = inteiro(
            totais_municipio.get(
                municipio_norm,
                0,
            )
        )

        secoes_estaduais = (
            secoes_estaduais_por_municipio.get(
                municipio_norm,
                set(),
            )
        )

        eleitores_escolas_estaduais = sum(
            inteiro(
                totais_secao.get(
                    chave,
                    0,
                )
            )
            for chave in secoes_estaduais
        )

        total_cre5 += eleitores_municipio
        total_escolas_cre5 += (
            eleitores_escolas_estaduais
        )
        total_secoes_estaduais_cre5 += len(
            secoes_estaduais
        )

        registros_municipio[
            municipio_norm
        ] = {
            "municipio": nome_oficial,
            "municipioNormalizado": municipio_norm,
            "eleitoresMunicipio":
                eleitores_municipio,
            "eleitoresEscolasEstaduais":
                eleitores_escolas_estaduais,
            "totalEscolasEstaduais":
                escolas_por_municipio.get(
                    municipio_norm,
                    0,
                ),
            "totalSecoesEstaduais":
                len(secoes_estaduais),
            "ano": 2026,
            "fonte":
                "TSE - Perfil do eleitorado por seção eleitoral 2026",
            "dataGeracaoTSE":
                dados_tse.get("dataGeracao") or "",
            "horaGeracaoTSE":
                dados_tse.get("horaGeracao") or "",
            "atualizadoEm":
                firestore.SERVER_TIMESTAMP,
        }

    # Menos de 500 operações, mas dividimos em lotes
    # para manter margem de segurança.
    operacoes = []

    for ref, dados in atualizacoes_escolas:
        operacoes.append(
            ("set", ref, dados)
        )

    for municipio_norm, dados in registros_municipio.items():
        ref = db.collection(
            "eleitorado_tse_2026"
        ).document(
            slug(municipio_norm)
        )

        operacoes.append(
            ("set", ref, dados)
        )

    ref_meta = db.collection(
        "meta_tse_2026"
    ).document(
        "eleitorado"
    )

    operacoes.append(
        (
            "set",
            ref_meta,
            {
                "eleitoresCRE5":
                    total_cre5,
                "eleitoresEscolasEstaduaisCRE5":
                    total_escolas_cre5,
                "totalMunicipios":
                    len(MUNICIPIOS_CRE5),
                "totalEscolasEstaduais":
                    len(atualizacoes_escolas),
                "totalSecoesEstaduais":
                    total_secoes_estaduais_cre5,
                "ano": 2026,
                "fonte":
                    "TSE - Perfil do eleitorado por seção eleitoral 2026",
                "dataGeracaoTSE":
                    dados_tse.get("dataGeracao") or "",
                "horaGeracaoTSE":
                    dados_tse.get("horaGeracao") or "",
                "arquivoTSE":
                    dados_tse.get("arquivo") or "",
                "atualizadoEm":
                    firestore.SERVER_TIMESTAMP,
            },
        )
    )

    for inicio in range(
        0,
        len(operacoes),
        400,
    ):
        lote = db.batch()

        for _, ref, dados in operacoes[
            inicio:inicio + 400
        ]:
            lote.set(
                ref,
                dados,
                merge=True,
            )

        lote.commit()

    return {
        "totalMunicipios": len(
            MUNICIPIOS_CRE5
        ),
        "totalEscolas":
            len(atualizacoes_escolas),
        "eleitoresCRE5":
            total_cre5,
        "eleitoresEscolasEstaduaisCRE5":
            total_escolas_cre5,
        "totalSecoesEstaduais":
            total_secoes_estaduais_cre5,
        "municipios": {
            dados["municipio"]: {
                "eleitoresMunicipio":
                    dados["eleitoresMunicipio"],
                "eleitoresEscolasEstaduais":
                    dados[
                        "eleitoresEscolasEstaduais"
                    ],
                "totalEscolasEstaduais":
                    dados[
                        "totalEscolasEstaduais"
                    ],
                "totalSecoesEstaduais":
                    dados[
                        "totalSecoesEstaduais"
                    ],
            }
            for dados in registros_municipio.values()
        },
    }


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
        try:
            if "health=1" in self.path:
                banco()

                return self.responder(
                    200,
                    {
                        "ok": True,
                        "servico":
                            "Eleitorado oficial TSE 2026",
                        "firebase":
                            "conectado",
                        "fonte":
                            "perfil_eleitor_secao_2026_MS",
                    },
                )

            if "diagnostico=1" in self.path:
                try:
                    conteudo_zip = baixar_zip()
                    arquivo_zip, nome_csv = localizar_csv(
                        conteudo_zip
                    )

                    with arquivo_zip.open(nome_csv) as bruto:
                        texto_csv = io.TextIOWrapper(
                            bruto,
                            encoding="latin-1",
                            newline="",
                        )

                        leitor = csv.reader(
                            texto_csv,
                            delimiter=";",
                            quotechar='"',
                        )

                        cabecalho = next(
                            leitor,
                            [],
                        )

                    return self.responder(
                        200,
                        {
                            "ok": True,
                            "zipBytes":
                                len(conteudo_zip),
                            "arquivoCSV":
                                nome_csv,
                            "cabecalho":
                                cabecalho,
                        },
                    )

                except Exception as erro:
                    return self.responder(
                        500,
                        {
                            "ok": False,
                            "tipoErro":
                                type(erro).__name__,
                            "erro":
                                str(erro),
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

            db = banco()

            conteudo_zip = baixar_zip()

            dados_tse = (
                ler_eleitorado_por_secao(
                    conteudo_zip
                )
            )

            resultado = calcular_e_gravar(
                db,
                dados_tse,
            )

            return self.responder(
                200,
                {
                    "ok": True,
                    "fonte":
                        "TSE - Perfil do eleitorado por seção eleitoral 2026",
                    "dataGeracaoTSE":
                        dados_tse.get(
                            "dataGeracao"
                        ),
                    "horaGeracaoTSE":
                        dados_tse.get(
                            "horaGeracao"
                        ),
                    **resultado,
                },
            )

        except Exception as erro:
            return self.responder(
                500,
                {
                    "ok": False,
                    "tipoErro": type(erro).__name__,
                    "erro": str(erro),
                },
            )
