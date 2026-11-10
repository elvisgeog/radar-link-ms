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

CARGOS_INTERESSE = {1}

CARGOS = {1: "Presidente"}


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


def mesmo_numero(a, b):
    try:
        return int(a) == int(b)
    except (TypeError, ValueError):
        return (
            str(a).lstrip("0")
            == str(b).lstrip("0")
        )



# Identificadores de eleição presidencial de 2026 utilizados nas consultas.
# Validar se o campo idEleicao do BU corresponde a estes códigos
# antes de autorizar a gravação.
ELEICOES_PRESIDENTE = {6257: 1, 6258: 2}


def arquivos_unicos(arquivos):
    vistos = set()
    saida = []
    for item in arquivos or []:
        if not isinstance(item, dict):
            continue
        url, hash_bu = str(item.get("url") or ""), str(item.get("hash") or "")
        if not url or not hash_bu or (url, hash_bu) in vistos:
            continue
        vistos.add((url, hash_bu))
        saida.append(item)
    return saida


def secao_id(dados, fallback):
    municipio = inteiro(dados.get("codigoMunicipio"))
    zona = inteiro(dados.get("zona"))
    secao = inteiro(dados.get("secao"))
    if None in (municipio, zona, secao):
        raise ValueError("Municipio, zona ou secao ausente")
    return f"pres_ms_{municipio:05d}_{zona:04d}_{secao:04d}", municipio, zona, secao


class handler(BaseHTTPRequestHandler):
    def responder(self, status, payload):
        corpo = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(corpo)

    def autorizado(self):
        segredo = os.environ.get("CRON_SECRET", "")
        return bool(segredo) and self.headers.get("Authorization", "") == f"Bearer {segredo}"

    def do_GET(self):
        self.executar(gravar=False)

    def do_POST(self):
        self.executar(gravar=True)

    def executar(self, gravar):
        inicio = time.time()
        if not self.autorizado():
            return self.responder(401, {"ok": False, "erro": "Nao autorizado"})
        query = parse_qs(urlparse(self.path).query)
        if gravar and query.get("confirmar", [""])[0] != "SIM":
            return self.responder(400, {"ok": False, "erro": "Para gravar, use POST ?confirmar=SIM. Faça GET de previsualizacao primeiro."})
        try:
            limite = max(1, min(25, inteiro(query.get("limit", ["5"])[0]) or 5))
            db = banco()
            documentos = list(db.collection("bus_tse_2026").where("buDisponivel", "==", True).stream())
            candidatos = []
            for doc in documentos:
                dados = doc.to_dict() or {}
                for arquivo in arquivos_unicos(dados.get("arquivosBU")):
                    candidatos.append((doc.id, dados, arquivo))
            # Priorização determinística. A prévia pode percorrer o conjunto
            # em blocos com cursor/offset quando necessário.
            candidatos.sort(key=lambda x: (x[0], str(x[2].get("hash"))))
            offset = max(0, inteiro(query.get("offset", ["0"])[0]) or 0)
            selecionados = candidatos[offset:offset + limite]
            prontos = {}
            erros = []
            sem_presidente = 0
            ignorados_eleicao = {}
            for doc_id, dados, arquivo in selecionados:
                if time.time() - inicio > 40:
                    erros.append({"secao": doc_id, "erro": "Tempo limite de consulta atingido"})
                    break
                try:
                    identificador, municipio, zona, secao = secao_id(dados, doc_id)
                    if not host_tse_valido(arquivo["url"]):
                        raise ValueError("URL de BU não pertence ao TSE")
                    conteudo = baixar(arquivo["url"])
                    decodificado = decodificar_bu(conteudo)
                    if not all((
                        mesmo_numero(decodificado.get("municipioCodigo"), municipio),
                        mesmo_numero(decodificado.get("zona"), zona),
                        mesmo_numero(decodificado.get("secao"), secao),
                    )):
                        raise ValueError("Identificacao de municipio/zona/secao diverge do BU")
                    resultados_presidente = [r for r in decodificado.get("resultados", []) if numero_cargo(r) == 1]
                    if not resultados_presidente:
                        sem_presidente += 1
                    for resultado in resultados_presidente:
                        eleicao = inteiro(resultado.get("idEleicao"))
                        if eleicao not in ELEICOES_PRESIDENTE:
                            chave = str(eleicao)
                            ignorados_eleicao[chave] = ignorados_eleicao.get(chave, 0) + 1
                            continue
                        chave = f"{identificador}_e{eleicao}"
                        reg = {
                            "uf": "MS",
                            "codigoMunicipio": str(municipio),
                            "municipio": dados.get("municipio") or "",
                            "zona": str(zona), "secao": str(secao),
                            "escolas": dados.get("escolas") or [],
                            "hashBU": arquivo.get("hash"),
                            "nomeArquivoBU": arquivo.get("nome"),
                            "urlBU": arquivo.get("url"),
                            "idEleicao": eleicao,
                            "turno": ELEICOES_PRESIDENTE[eleicao],
                            "resultados": [resultado],
                        }
                        # Se houver reemissão de BU, a última entrada consistente
                        # substitui a anterior da mesma seção/eleição nesta execução.
                        prontos[chave] = reg
                except Exception as erro:
                    erros.append({"secao": doc_id, "erro": str(erro)[:250]})
            por_turno = {"1": 0, "2": 0}
            for registro in prontos.values():
                por_turno[str(registro["turno"])] += 1
            resposta = {
                "ok": not erros, "modo": "gravacao" if gravar else "previsualizacao",
                "documentosFonte": len(documentos), "arquivosFonte": len(candidatos),
                "offset": offset, "consultados": len(selecionados),
                "preparados": len(prontos), "porTurno": por_turno,
                "semPresidente": sem_presidente,
                "eleicoesNaoMapeadas": ignorados_eleicao,
                "erros": erros[:10], "gravacao": False,
                "proximoOffset": offset + len(selecionados) if offset + len(selecionados) < len(candidatos) else None,
                "observacao": "Esta rotina não descobre BUs do segundo turno: apenas processa arquivos existentes em bus_tse_2026.",
            }
            if gravar:
                if erros or ignorados_eleicao or not prontos:
                    resposta["ok"] = False
                    resposta["erro"] = "Gravacao bloqueada: inconsistencias, eleicoes nao mapeadas ou nenhum voto presidencial."
                    return self.responder(409, resposta)
                for chave, reg in prontos.items():
                    reg["atualizadoEm"] = firestore.SERVER_TIMESTAMP
                    db.collection("votos_secao_tse_2026").document(chave).set(reg, merge=False)
                resposta["gravacao"] = True
            return self.responder(200, resposta)
        except Exception as erro:
            return self.responder(500, {"ok": False, "erro": str(erro)[:400]})


def numero_cargo(resultado):
    return inteiro(resultado.get("cargoCodigo"))
