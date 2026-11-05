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

function escaparHTML(valor) {
  return campo(valor).replace(/[&<>"']/g, (caractere) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[caractere]));
}

function celulaTexto(valor) {
  const texto = campo(valor).trim();
  return texto ? escaparHTML(texto).replace(/\r?\n/g, "<br>") : "—";
}

function htmlRelatorio(registros, abrangencia) {
  const data = new Date().toLocaleString("pt-BR");
  const municipios = new Set(registros.map((r) => r.cidade).filter(Boolean)).size;
  const linhas = registros.map((item, indice) => {
    const pessoas = [
      ["Diretor", item.diretor || {}],
      ["Adjunto", item.adjunto || {}],
    ];
    return `<tbody class="bloco">
      <tr class="escola"><td colspan="7"><strong>${indice + 1}. ${celulaTexto(item.escola)}</strong> — ${celulaTexto(item.cidade)}</td></tr>
      <tr class="cabecalho"><th>Cargo</th><th>Nome</th><th>Técnico</th><th>Político</th><th>Social</th><th>Posicionamento político Dep. Estadual/Federal 2026</th><th>Observação</th></tr>
      ${pessoas.map(([cargo, pessoa]) => `<tr><td>${cargo}</td><td>${celulaTexto(pessoa.nome)}</td><td class="nota">${celulaTexto(pessoa.tecnico)}</td><td class="nota">${celulaTexto(pessoa.politico)}</td><td class="nota">${celulaTexto(pessoa.social)}</td><td>${celulaTexto(pessoa.posicionamento)}</td><td>${celulaTexto(pessoa.observacao)}</td></tr>`).join("")}
    </tbody>`;
  }).join("");

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
    <title>Relatório de Avaliação de Perfil - CRE-5 Dourados</title>
    <style>
      @page { size: A4 landscape; margin: 12mm; }
      * { box-sizing: border-box; }
      body { font-family: Arial, sans-serif; color: #111; background: #fff; font-size: 10px; margin: 0; }
      h1 { font-size: 18px; margin: 0 0 6px; }
      .meta { margin: 0 0 12px; line-height: 1.6; }
      .aviso { font-weight: bold; margin-bottom: 10px; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { border: 1px solid #888; padding: 5px; vertical-align: top; overflow-wrap: anywhere; white-space: normal; }
      th { background: #e9e9e9; text-align: left; }
      .escola td { background: #dcdcdc; padding: 7px; font-size: 11px; }
      .nota { text-align: center; }
      th:nth-child(1) { width: 8%; } th:nth-child(2) { width: 16%; }
      th:nth-child(3), th:nth-child(4), th:nth-child(5) { width: 6%; }
      th:nth-child(6) { width: 26%; } th:nth-child(7) { width: 32%; }
      tbody.bloco { break-inside: avoid; page-break-inside: avoid; }
      tbody.bloco + tbody.bloco { border-top: 7px solid white; }
      @media screen { body { padding: 18px; } }
    </style></head><body>
    <h1>CRE-5 Dourados — Avaliação de Perfil</h1>
    <div class="meta"><strong>Abrangência:</strong> ${escaparHTML(abrangencia)} &nbsp; | &nbsp; <strong>Municípios:</strong> ${municipios} &nbsp; | &nbsp; <strong>Escolas:</strong> ${registros.length} &nbsp; | &nbsp; <strong>Emitido em:</strong> ${escaparHTML(data)}</div>
    <div class="aviso">DOCUMENTO DE ACESSO RESTRITO — Contém dados pessoais e avaliações de gestores.</div>
    <table>${linhas}</table>
    </body></html>`;
}

export default function PerfilGestoresCRE5({ onVoltar }) {
  const [segredo, setSegredo] = useState(() => {
    try {
