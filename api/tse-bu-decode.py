import json
import os
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen

import asn1tools

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ASN1_PATH = os.path.join(BASE_DIR, "bu.asn1")

_CONVERSOR = None

CARGOS = {
    1: "Presidente",
    2: "Vice-Presidente",
    3: "Governador",
    4: "Vice-Governador",
    5: "Senador",
    6: "Deputado Federal",
    7: "Deputado Estadual",
    8: "Deputado Distrital",
    9: "1º Suplente de Senador",
    10: "2º Suplente de Senador",
    11: "Prefeito",
    12: "Vice-Prefeito",
    13: "Vereador",
}

TIPOS_VOTO = {
    1: "nominal",
    2: "branco",
    3: "nulo",
    4: "legenda",
    5: "cargoSemCandidato",
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


def valor_choice(valor):
    if isinstance(valor, (tuple, list)) and len(valor) == 2:
        return valor[1]
    return valor


def inteiro(valor):
    try:
        return int(valor)
    except (TypeError, ValueError):
        return None


def decodificar_bu(conteudo):
    conv = conversor()

    envelope = conv.decode(
        "EntidadeEnvelopeGenerico",
        bytearray(conteudo),
    )

    if inteiro(envelope.get("tipoEnvelope")) != 1:
        raise ValueError(
            "O arquivo informado não é um Boletim de Urna."
        )

    bu = conv.decode(
        "EntidadeBoletimUrna",
        envelope["conteudo"],
    )

    identificacao = bu.get("identificacaoSecao") or {}
    municipio_zona = identificacao.get("municipioZona") or {}

    votos = []
    resumos = {}

    for eleicao in bu.get(
        "resultadosVotacaoPorEleicao", []
    ) or []:
        id_eleicao = inteiro(eleicao.get("idEleicao"))

        for resultado in eleicao.get(
            "resultadosVotacao", []
        ) or []:
            comparecimento = inteiro(
                resultado.get("qtdComparecimento")
            ) or 0

            for total_cargo in resultado.get(
                "totaisVotosCargo", []
            ) or []:
                cargo_codigo = inteiro(
                    valor_choice(
                        total_cargo.get("codigoCargo")
                    )
                )

                chave = f"{id_eleicao}:{cargo_codigo}"

                if chave not in resumos:
                    resumos[chave] = {
                        "idEleicao": id_eleicao,
                        "cargoCodigo": cargo_codigo,
                        "cargoNome": CARGOS.get(
                            cargo_codigo,
                            f"Cargo {cargo_codigo}",
                        ),
                        "comparecimento": comparecimento,
                        "nominais": 0,
                        "legenda": 0,
                        "brancos": 0,
                        "nulos": 0,
                        "cargoSemCandidato": 0,
                        "totalVotos": 0,
                    }

                resumo = resumos[chave]

                for item in total_cargo.get(
                    "votosVotaveis", []
                ) or []:
                    tipo_voto = inteiro(
                        item.get("tipoVoto")
                    )

                    quantidade = inteiro(
                        item.get("quantidadeVotos")
                    ) or 0

                    votavel = (
                        item.get(
                            "identificacaoVotavel"
                        )
                        or {}
                    )

                    numero_votavel = inteiro(
                        votavel.get("codigo")
                    )

                    partido = inteiro(
                        votavel.get("partido")
                    )

                    votos.append({
                        "idEleicao": id_eleicao,
                        "cargoCodigo": cargo_codigo,
                        "cargoNome": CARGOS.get(
                            cargo_codigo,
                            f"Cargo {cargo_codigo}",
                        ),
                        "tipoVoto": tipo_voto,
                        "tipoVotoNome": TIPOS_VOTO.get(
                            tipo_voto,
                            f"tipo{tipo_voto}",
                        ),
                        "quantidadeVotos": quantidade,
                        "numeroVotavel": numero_votavel,
                        "partido": partido,
                    })

                    resumo["totalVotos"] += quantidade

                    if tipo_voto == 1:
                        resumo["nominais"] += quantidade
                    elif tipo_voto == 2:
                        resumo["brancos"] += quantidade
                    elif tipo_voto == 3:
                        resumo["nulos"] += quantidade
                    elif tipo_voto == 4:
                        resumo["legenda"] += quantidade
                    elif tipo_voto == 5:
                        resumo[
                            "cargoSemCandidato"
                        ] += quantidade

    return {
        "fase": inteiro(bu.get("fase")),
        "dataHoraEmissao": bu.get("dataHoraEmissao"),
        "municipioCodigo": inteiro(
            municipio_zona.get("municipio")
        ),
        "zona": inteiro(
            municipio_zona.get("zona")
        ),
        "local": inteiro(
            identificacao.get("local")
        ),
        "secao": inteiro(
            identificacao.get("secao")
        ),
        "qtdEleitoresCompareceram": inteiro(
            bu.get("qtdEleitoresCompareceram")
        ),
        "resultados": list(resumos.values()),
        "votos": votos,
    }


def host_tse_valido(url):
    parsed = urlparse(url)

    if parsed.scheme != "https":
        return False

    host = (parsed.hostname or "").lower()

    return (
        host == "tse.jus.br"
        or host.endswith(".tse.jus.br")
    )


class handler(BaseHTTPRequestHandler):
    def responder(self, status, payload):
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
            query = parse_qs(
                urlparse(self.path).query
            )

            if (
                query.get(
                    "health",
                    [""],
                )[0]
                == "1"
            ):
                conversor()

                return self.responder(
                    200,
                    {
                        "ok": True,
                        "decoder": "BU ASN.1 2026",
                        "asn1": "compilado",
                    },
                )

            if not self.autorizado():
                return self.responder(
                    401,
                    {
                        "ok": False,
                        "erro": "Não autorizado",
                    },
                )

            url = query.get(
                "url",
                [""],
            )[0].strip()

            if not url:
                return self.responder(
                    400,
                    {
                        "ok": False,
                        "erro": (
                            "Informe a URL do BU "
                            "no parâmetro ?url="
                        ),
                    },
                )

            if not host_tse_valido(url):
                return self.responder(
                    400,
                    {
                        "ok": False,
                        "erro": (
                            "A URL precisa pertencer "
                            "ao domínio oficial tse.jus.br."
                        ),
                    },
                )

            requisicao = Request(
                url,
                headers={
                    "Accept":
                        "application/octet-stream,*/*",
                    "User-Agent":
                        "RadarLinkMS/1.0",
                },
            )

            with urlopen(
                requisicao,
                timeout=30,
            ) as resposta:
                conteudo = resposta.read()

            if not conteudo:
                raise ValueError(
                    "O arquivo BU retornado pelo "
                    "TSE está vazio."
                )

            resultado = decodificar_bu(
                conteudo
            )

            return self.responder(
                200,
                {
                    "ok": True,
                    "bytes": len(conteudo),
                    **resultado,
                },
            )

        except Exception as erro:
            return self.responder(
                500,
                {
                    "ok": False,
                    "erro": str(erro),
                },
            )
