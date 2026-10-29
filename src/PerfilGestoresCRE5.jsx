import React, { useEffect, useMemo, useState } from "react";

const API = "/api/perfil-gestores";
const CHAVE_SESSAO = "radar_perfil_secret";

function normalizar(v = "") {
  return String(v)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function campo(v) {
  return v === null || v === undefined ? "" : String(v);
}

function perfilEdicao(p = {}) {
  return {
    nome: campo(p.nome),
    tecnico: campo(p.tecnico),
    politico: campo(p.politico),
    social: campo(p.social),
    posicionamento: campo(p.posicionamento),
    observacao: campo(p.observacao),
  };
}

function headers(segredo) {
  return {
    "Content-Type": "application/json",
    "x-radar-secret": segredo,
  };
}

export default function PerfilGestoresCRE5({ onVoltar }) {
  const [segredo, setSegredo] = useState(() => {
    try {
      return sessionStorage.getItem(CHAVE_SESSAO) || "";
    } catch {
      return "";
    }
  });
  const [senhaDigitada, setSenhaDigitada] = useState("");
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [municipio, setMunicipio] = useState("TODOS");
  const [busca, setBusca] = useState("");
  const [edicaoId, setEdicaoId] = useState(null);
  const [rascunho, setRascunho] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [importando, setImportando] = useState(false);

  async function carregar(chave = segredo) {
    if (!chave) return;

    setCarregando(true);
    setErro("");

    try {
      const resposta = await fetch(API, {
        method: "GET",
        headers: headers(chave),
        cache: "no-store",
      });

      const json = await resposta.json();

      if (!resposta.ok || !json.ok) {
        throw new Error(json.erro || "Falha ao carregar a base.");
      }

      setRegistros(json.registros || []);
    } catch (e) {
      setErro(e?.message || "Falha ao carregar a base.");
      if (e?.message === "Não autorizado.") {
        bloquear();
      }
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (segredo) carregar(segredo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segredo]);

  async function desbloquear() {
    const chave = senhaDigitada.trim();
    if (!chave) return;

    setErro("");
    setCarregando(true);

    try {
      const resposta = await fetch(API, {
        method: "GET",
        headers: headers(chave),
        cache: "no-store",
      });

      const json = await resposta.json();

      if (!resposta.ok || !json.ok) {
        throw new Error(json.erro || "Acesso negado.");
      }

      try {
        sessionStorage.setItem(CHAVE_SESSAO, chave);
      } catch {
        // sessão sem storage
      }

      setSegredo(chave);
      setSenhaDigitada("");
      setRegistros(json.registros || []);
    } catch (e) {
      setErro(e?.message || "Acesso negado.");
    } finally {
      setCarregando(false);
    }
  }

  function bloquear() {
    try {
      sessionStorage.removeItem(CHAVE_SESSAO);
    } catch {
      // sessão sem storage
    }

    setSegredo("");
    setSenhaDigitada("");
    setRegistros([]);
    setEdicaoId(null);
    setRascunho(null);
  }

  const municipios = useMemo(
    () =>
      [...new Set(registros.map((r) => r.cidade).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b, "pt-BR")
      ),
    [registros]
  );

  const filtrados = useMemo(() => {
    const termo = normalizar(busca);

    return registros.filter((r) => {
      if (municipio !== "TODOS" && r.cidade !== municipio) {
        return false;
      }

      if (!termo) return true;

      const alvo = normalizar(
        [
          r.cidade,
          r.escola,
          r.diretor?.nome,
          r.adjunto?.nome,
          r.diretor?.posicionamento,
          r.adjunto?.posicionamento,
          r.diretor?.observacao,
          r.adjunto?.observacao,
        ].join(" ")
      );

      return alvo.includes(termo);
    });
  }, [registros, municipio, busca]);

  function abrirEdicao(item) {
    setEdicaoId(item.id);
    setRascunho({
      diretor: perfilEdicao(item.diretor),
      adjunto: perfilEdicao(item.adjunto),
    });
    setMensagem("");
  }

  function fecharEdicao() {
    setEdicaoId(null);
    setRascunho(null);
  }

  function mudar(cargo, nomeCampo, valor) {
    setRascunho((atual) => ({
      ...atual,
      [cargo]: {
        ...(atual?.[cargo] || {}),
        [nomeCampo]: valor,
      },
    }));
  }

  async function salvar(item) {
    if (!rascunho) return;

    setSalvando(true);
    setErro("");
    setMensagem("");

    try {
      const resposta = await fetch(API, {
        method: "PUT",
        headers: headers(segredo),
        body: JSON.stringify({
          id: item.id,
          diretor: rascunho.diretor,
          adjunto: rascunho.adjunto,
        }),
      });

      const json = await resposta.json();

      if (!resposta.ok || !json.ok) {
        throw new Error(json.erro || "Falha ao salvar.");
      }

      setRegistros((atuais) =>
        atuais.map((r) =>
          r.id === item.id ? json.registro : r
        )
      );

      setMensagem("Alterações salvas.");
      fecharEdicao();
    } catch (e) {
      setErro(e?.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function importarArquivo(arquivo) {
    if (!arquivo) return;

    setImportando(true);
    setErro("");
    setMensagem("");

    try {
      const texto = await arquivo.text();
      const registrosImportacao = JSON.parse(texto);

      if (!Array.isArray(registrosImportacao)) {
        throw new Error("O arquivo JSON não contém uma lista válida.");
      }

      const resposta = await fetch(API, {
        method: "POST",
        headers: headers(segredo),
        body: JSON.stringify({
          acao: "importar",
          registros: registrosImportacao,
        }),
      });

      const json = await resposta.json();

      if (!resposta.ok || !json.ok) {
        throw new Error(json.erro || "Falha ao importar.");
      }

      setMensagem(
        `${json.importados} registros importados com sucesso.`
      );

      await carregar(segredo);
    } catch (e) {
      setErro(e?.message || "Falha ao importar.");
    } finally {
      setImportando(false);
    }
  }

  if (!segredo) {
    return (
      <Pagina>
        <div className="pg-lock-card">
          <div className="pg-eyebrow">Área protegida</div>
          <h1>Avaliação de Perfil CRE-5</h1>
          <p>
            Esta área contém dados pessoais e avaliações de gestores.
            Informe a senha específica do módulo.
          </p>

          <input
            className="pg-input"
            type="password"
            value={senhaDigitada}
            onChange={(e) => setSenhaDigitada(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") desbloquear();
            }}
            placeholder="Senha do módulo"
            autoFocus
          />

          {erro && <div className="pg-erro">{erro}</div>}

          <div className="pg-actions">
            {onVoltar && (
              <button className="pg-btn sec" onClick={onVoltar}>
                ← Voltar
              </button>
            )}
            <button
              className="pg-btn"
              onClick={desbloquear}
              disabled={carregando}
            >
              {carregando ? "Verificando..." : "Entrar"}
            </button>
          </div>
        </div>
      </Pagina>
    );
  }

  return (
    <Pagina>
      <div className="pg-top">
        <div>
          <div className="pg-eyebrow">CRE-5 · Dourados</div>
          <h1>Avaliação de Perfil</h1>
          <p>
            Cidade e escola são campos fixos. Todos os demais campos
            podem ser atualizados.
          </p>
        </div>

        <div className="pg-actions">
          {onVoltar && (
            <button className="pg-btn sec" onClick={onVoltar}>
              ← Voltar
            </button>
          )}
          <button className="pg-btn sec" onClick={bloquear}>
            Bloquear módulo
          </button>
        </div>
      </div>

      <div className="pg-kpis">
        <Kpi titulo="Municípios" valor={municipios.length} />
        <Kpi titulo="Escolas" valor={registros.length} />
        <Kpi titulo="Diretores" valor={registros.length} />
        <Kpi titulo="Adjuntos" valor={registros.length} />
      </div>

      {registros.length === 0 && !carregando && (
        <section className="pg-panel">
          <h2>Importação inicial</h2>
          <p>
            A coleção está vazia. Selecione o arquivo
            <strong> perfil_gestores_cre5_base.json</strong> gerado a
            partir da planilha de 27/10/2026.
          </p>

          <input
            className="pg-input"
            type="file"
            accept=".json,application/json"
            disabled={importando}
            onChange={(e) =>
              importarArquivo(e.target.files?.[0] || null)
            }
          />
        </section>
      )}

      <section className="pg-panel">
        <div className="pg-filtros">
          <select
            className="pg-input"
            value={municipio}
            onChange={(e) => {
              setMunicipio(e.target.value);
              fecharEdicao();
            }}
          >
            <option value="TODOS">Todos os municípios</option>
            {municipios.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <input
            className="pg-input"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar escola ou gestor..."
          />
        </div>
      </section>

      {erro && <div className="pg-erro">{erro}</div>}
      {mensagem && <div className="pg-ok">{mensagem}</div>}

      {carregando ? (
        <section className="pg-panel">Carregando...</section>
      ) : (
        <div className="pg-list">
          {filtrados.map((item) => {
            const aberto = edicaoId === item.id;

            return (
              <section className="pg-card" key={item.id}>
                <div className="pg-card-head">
                  <div>
                    <div className="pg-city">{item.cidade}</div>
                    <div className="pg-school">{item.escola}</div>
                    <div className="pg-summary">
                      <strong>Diretor:</strong>{" "}
                      {item.diretor?.nome || "—"}
                      <br />
                      <strong>Adjunto:</strong>{" "}
                      {item.adjunto?.nome || "—"}
                    </div>
                  </div>

                  <button
                    className="pg-btn"
                    onClick={() =>
                      aberto ? fecharEdicao() : abrirEdicao(item)
                    }
                  >
                    {aberto ? "Fechar" : "Editar"}
                  </button>
                </div>

                {aberto && rascunho && (
                  <div className="pg-editor">
                    <div className="pg-grid2">
                      <Pessoa
                        titulo="Diretor"
                        perfil={rascunho.diretor}
                        onChange={(c, v) => mudar("diretor", c, v)}
                      />
                      <Pessoa
                        titulo="Diretor Adjunto"
                        perfil={rascunho.adjunto}
                        onChange={(c, v) => mudar("adjunto", c, v)}
                      />
                    </div>

                    <div className="pg-fixed">
                      🔒 Município e escola não são editáveis.
                    </div>

                    <div className="pg-actions">
                      <button
                        className="pg-btn sec"
                        onClick={fecharEdicao}
                        disabled={salvando}
                      >
                        Cancelar
                      </button>
                      <button
                        className="pg-btn ok"
                        onClick={() => salvar(item)}
                        disabled={salvando}
                      >
                        {salvando ? "Salvando..." : "Salvar alterações"}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </Pagina>
  );
}

function Pessoa({ titulo, perfil, onChange }) {
  return (
    <div className="pg-person">
      <h3>{titulo}</h3>

      <Campo label="Nome">
        <input
          className="pg-input"
          value={perfil.nome}
          onChange={(e) => onChange("nome", e.target.value)}
        />
      </Campo>

      <div className="pg-notas">
        <Nota
          label="Técnico"
          value={perfil.tecnico}
          onChange={(v) => onChange("tecnico", v)}
        />
        <Nota
          label="Político"
          value={perfil.politico}
          onChange={(v) => onChange("politico", v)}
        />
        <Nota
          label="Social"
          value={perfil.social}
          onChange={(v) => onChange("social", v)}
        />
      </div>

      <Campo label="Posicionamento político Dep. Estadual/Federal 2026">
        <textarea
          className="pg-textarea"
          value={perfil.posicionamento}
          onChange={(e) =>
            onChange("posicionamento", e.target.value)
          }
        />
      </Campo>

      <Campo label="Observação">
        <textarea
          className="pg-textarea"
          value={perfil.observacao}
          onChange={(e) => onChange("observacao", e.target.value)}
        />
      </Campo>
    </div>
  );
}

function Nota({ label, value, onChange }) {
  return (
    <Campo label={label}>
      <input
        className="pg-input"
        type="number"
        min="0"
        max="10"
        step="1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Campo>
  );
}

function Campo({ label, children }) {
  return (
    <div className="pg-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function Kpi({ titulo, valor }) {
  return (
    <div className="pg-kpi">
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function Pagina({ children }) {
  return (
    <div className="pg-page">
      <style>{`
        .pg-page{
          min-height:100vh;padding:16px;
          background:linear-gradient(135deg,#07111f,#0f172a,#111827);
          color:#fff;font-family:Arial,sans-serif;box-sizing:border-box
        }
        .pg-page>*{width:min(1180px,100%);margin-left:auto;margin-right:auto}
        .pg-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:14px}
        .pg-top h1,.pg-lock-card h1{margin:4px 0 6px;font-size:clamp(26px,4vw,38px)}
        .pg-top p,.pg-lock-card p{margin:0;color:#cbd5e1;line-height:1.5}
        .pg-eyebrow{font-size:12px;font-weight:900;letter-spacing:.08em;color:#60a5fa;text-transform:uppercase}
        .pg-lock-card{max-width:520px!important;margin-top:8vh!important;background:#0f172a;border:1px solid #334155;border-radius:18px;padding:22px}
        .pg-panel,.pg-card{background:rgba(15,23,42,.97);border:1px solid #334155;border-radius:14px;margin-bottom:12px}
        .pg-panel{padding:14px}
        .pg-list{display:grid;gap:10px}
        .pg-card{overflow:hidden}
        .pg-card-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:14px}
        .pg-city{font-size:12px;color:#60a5fa;font-weight:900;letter-spacing:.06em}
        .pg-school{font-size:18px;font-weight:900;margin-top:3px}
        .pg-summary{font-size:13px;color:#cbd5e1;line-height:1.55;margin-top:6px}
        .pg-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px auto}
        .pg-kpi{background:#1e293b;border:1px solid #334155;border-radius:13px;padding:13px}
        .pg-kpi span{display:block;color:#94a3b8;font-size:12px}
        .pg-kpi strong{display:block;font-size:24px;margin-top:4px}
        .pg-filtros{display:grid;grid-template-columns:260px 1fr;gap:10px}
        .pg-input,.pg-textarea{width:100%;box-sizing:border-box;border:1px solid #475569;border-radius:9px;padding:11px 12px;background:#f8fafc;color:#0f172a;font-size:15px}
        .pg-textarea{min-height:88px;resize:vertical}
        .pg-btn{border:0;border-radius:9px;padding:11px 14px;background:#2563eb;color:#fff;font-weight:800;cursor:pointer}
        .pg-btn.sec{background:#334155}.pg-btn.ok{background:#15803d}
        .pg-btn:disabled{opacity:.55;cursor:not-allowed}
        .pg-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
        .pg-editor{border-top:1px solid #334155;background:#111c30;padding:14px}
        .pg-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .pg-person{background:#172238;border:1px solid #334155;border-radius:12px;padding:13px}
        .pg-person h3{margin:0 0 10px}
        .pg-field{margin-bottom:10px}.pg-field label{display:block;margin-bottom:5px;color:#cbd5e1;font-size:12px;font-weight:800}
        .pg-notas{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
        .pg-fixed{font-size:12px;color:#94a3b8;margin:10px 0}
        .pg-erro,.pg-ok{padding:12px;border-radius:10px;margin:10px auto}
        .pg-erro{background:#7f1d1d;border:1px solid #ef4444}
        .pg-ok{background:#14532d;border:1px solid #22c55e}
        @media(max-width:760px){
          .pg-page{padding:10px}
          .pg-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
          .pg-filtros,.pg-grid2,.pg-card-head{grid-template-columns:1fr}
          .pg-card-head .pg-btn{width:100%}
          .pg-school{font-size:16px}
        }
        @media(max-width:420px){
          .pg-notas{grid-template-columns:1fr}
        }
      `}</style>
      {children}
    </div>
  );
}
