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
