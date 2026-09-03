/* ============================================
   /criar-conta — o fluxo real de cadastro
   ============================================
   Fala com as rotas públicas do app (signupPublico.ts):
     POST /api/public/signup/enviar-codigo
     POST /api/public/signup/conferir-slug
     POST /api/public/signup/conferir-cupom
     POST /api/public/signup
   Sucesso: redirect pro entrarUrl (token de uso único que vira sessão
   no subdomínio novo). O preço NUNCA sai daqui — o servidor revalida
   tudo; esta página só mostra. */

const API = "https://app.vesalia.com.br";
const PRECO = { mensal: 890, anual: 801 };

const $ = (id) => document.getElementById(id);
const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function api(path, body) {
  const r = await fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(body),
  });
  let data = null;
  try { data = await r.json(); } catch { /* resposta não-JSON = erro genérico */ }
  return { ok: r.ok, status: r.status, data: data ?? {} };
}

/* ---------- erro global ---------- */
function mostrarErro(msg) {
  const el = $("erro");
  el.textContent = msg;
  el.classList.add("is-visible");
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}
function limparErro() { $("erro").classList.remove("is-visible"); }

/* ---------- navegação entre passos ---------- */
function irPara(n) {
  limparErro();
  ["1", "2", "3"].forEach((k) => {
    $("step" + k).classList.toggle("is-visible", k === String(n));
    const tab = $("tab" + k);
    tab.classList.toggle("is-active", k === String(n));
    tab.classList.toggle("is-done", Number(k) < n);
  });
  $("stepDone").classList.remove("is-visible");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
document.querySelectorAll(".back-btn").forEach((b) =>
  b.addEventListener("click", () => irPara(Number(b.dataset.back))));

/* ---------- passo 1: slug a partir do nome + código de e-mail ---------- */
function slugify(s) {
  return String(s || "").toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 48);
}

let slugTocado = false;
let slugTimer = null;

$("nomeClinica").addEventListener("input", () => {
  if (!slugTocado) {
    $("slug").value = slugify($("nomeClinica").value);
    conferirSlugDebounced();
  }
});
$("slug").addEventListener("input", () => {
  slugTocado = true;
  $("slug").value = slugify($("slug").value);
  conferirSlugDebounced();
});

function conferirSlugDebounced() {
  clearTimeout(slugTimer);
  slugTimer = setTimeout(conferirSlug, 450);
}

async function conferirSlug() {
  const slug = $("slug").value.trim();
  const hint = $("slugHint");
  if (slug.length < 2) {
    hint.className = "field-hint";
    hint.textContent = "Gerado a partir do nome — pode ajustar.";
    return false;
  }
  const { ok, data } = await api("/api/public/signup/conferir-slug", { slug });
  if (ok && data.disponivel) {
    hint.className = "field-hint ok";
    hint.textContent = `${data.slug}.vesalia.com.br está livre — é seu.`;
    if (data.slug !== slug) $("slug").value = data.slug;
    return true;
  }
  hint.className = "field-hint err";
  hint.textContent = "Este endereço já está em uso — escolha outro.";
  return false;
}

$("btnCodigo").addEventListener("click", async () => {
  limparErro();
  const email = $("email").value.trim().toLowerCase();
  const hint = $("emailHint");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    hint.className = "field-hint err";
    hint.textContent = "Confira o e-mail antes de pedir o código.";
    return;
  }
  const btn = $("btnCodigo");
  btn.disabled = true; btn.textContent = "Enviando…";
  const { ok, status, data } = await api("/api/public/signup/enviar-codigo", { email });
  if (ok) {
    hint.className = "field-hint ok";
    hint.textContent = "Código enviado — confira sua caixa de entrada (e o spam).";
    btn.textContent = "Reenviar código";
    btn.disabled = false;
  } else {
    hint.className = "field-hint err";
    hint.textContent = data.error || (status === 429
      ? "Muitas tentativas — aguarde alguns minutos."
      : "Não conseguimos enviar. Tente de novo.");
    btn.textContent = "Enviar código";
    btn.disabled = false;
  }
});

$("form1").addEventListener("submit", async (e) => {
  e.preventDefault();
  limparErro();
  if (!$("form1").checkValidity()) { $("form1").reportValidity(); return; }
  if ($("senha").value.length < 8) { mostrarErro("A senha precisa de pelo menos 8 caracteres."); return; }
  if (!/^\d{6}$/.test($("codigo").value.trim())) {
    mostrarErro("Digite o código de 6 dígitos que chegou no seu e-mail. Não chegou? Use o botão Enviar código.");
    return;
  }
  if (!(await conferirSlug())) { mostrarErro("O endereço da clínica precisa estar livre pra continuar."); return; }
  // O nome do cartão nasce pré-preenchido com o nome do responsável.
  if (!$("titularNome").value) $("titularNome").value = $("adminNome").value;
  irPara(2);
});

/* ---------- passo 2: plano + cupom ---------- */
let cupomAplicado = null; // { codigo, valorMensal }

function periodicidade() {
  return $("pAnual").checked ? "anual" : "mensal";
}

function atualizarPreco() {
  const p = periodicidade();
  const cheio = PRECO[p];
  const final = cupomAplicado ? cupomAplicado.valorMensal : cheio;
  const sufixo = p === "anual" ? " × 12 meses" : "/mês";
  const riscado = cupomAplicado ? `<span class="price-old">${fmt(cheio)}</span>` : "";
  $("resumoPreco").innerHTML =
    `Hoje, no cartão: ${riscado}<strong>${fmt(final)}</strong>${sufixo === "/mês" ? "" : ""} — a 1ª mensalidade. Depois, ${fmt(final)}${sufixo}.`;
  $("resumoFinal").innerHTML =
    `Cobrança de hoje: <strong>${fmt(final)}</strong> (1ª mensalidade do plano ${p}${cupomAplicado ? `, cupom ${cupomAplicado.codigo}` : ""}). Recorrência: ${fmt(final)}/mês.`;
}

document.querySelectorAll('#planPick input').forEach((r) =>
  r.addEventListener("change", async () => {
    document.querySelectorAll("#planPick label").forEach((l) => l.classList.remove("is-picked"));
    r.closest("label").classList.add("is-picked");
    // Cupom pode valer só pra uma periodicidade — revalida na troca.
    if (cupomAplicado) await aplicarCupom(true);
    atualizarPreco();
  }));

async function aplicarCupom(silencioso) {
  const codigo = $("cupom").value.trim().toUpperCase();
  const hint = $("cupomHint");
  if (!codigo) { cupomAplicado = null; hint.textContent = ""; atualizarPreco(); return; }
  const { ok, data } = await api("/api/public/signup/conferir-cupom", {
    codigo, periodicidade: periodicidade(),
  });
  if (ok && data.valido) {
    cupomAplicado = { codigo: data.codigo, valorMensal: data.valorMensal };
    hint.className = "field-hint ok";
    hint.textContent = `Cupom ${data.codigo} aplicado: ${fmt(data.valorMensal)}/mês${data.descricao ? ` — ${data.descricao}` : ""}.`;
  } else {
    cupomAplicado = null;
    hint.className = "field-hint err";
    hint.textContent = silencioso
      ? "O cupom não vale pra este plano — preço cheio aplicado."
      : "Cupom inválido, vencido ou esgotado.";
  }
  atualizarPreco();
}
$("btnCupom").addEventListener("click", () => aplicarCupom(false));

$("form2").addEventListener("submit", (e) => {
  e.preventDefault();
  atualizarPreco();
  irPara(3);
});

/* ---------- passo 3: cartão + envio ---------- */
$("validade").addEventListener("input", () => {
  let v = $("validade").value.replace(/\D/g, "").slice(0, 4);
  if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
  $("validade").value = v;
});
$("numeroCartao").addEventListener("input", () => {
  $("numeroCartao").value = $("numeroCartao").value.replace(/[^\d ]/g, "").slice(0, 23);
});

$("form3").addEventListener("submit", async (e) => {
  e.preventDefault();
  limparErro();
  if (!$("form3").checkValidity()) { $("form3").reportValidity(); return; }

  const [mes, ano] = $("validade").value.split("/");
  if (!mes || !ano || Number(mes) < 1 || Number(mes) > 12) {
    mostrarErro("Confira a validade do cartão (MM/AA).");
    return;
  }

  const btn = $("btnPagar");
  btn.disabled = true;
  btn.querySelector("span:first-child").textContent = "Processando…";

  const payload = {
    clinica: {
      nome: $("nomeClinica").value.trim(),
      slug: $("slug").value.trim(),
    },
    admin: {
      nome: $("adminNome").value.trim(),
      email: $("email").value.trim().toLowerCase(),
      codigo: $("codigo").value.trim(),
      senha: $("senha").value,
      whatsapp: $("whatsapp").value,
    },
    plano: {
      periodicidade: periodicidade(),
      cupom: cupomAplicado ? cupomAplicado.codigo : "",
    },
    pagamento: {
      cpfCnpj: $("cpfCnpj").value,
      cartao: {
        numero: $("numeroCartao").value,
        nome: $("titularNome").value.trim(),
        mesValidade: mes,
        anoValidade: (ano.length === 2 ? "20" + ano : ano),
        cvv: $("cvv").value,
      },
      titular: {
        nome: $("titularNome").value.trim(),
        cep: $("cep").value,
        numeroEndereco: $("numeroEndereco").value.trim(),
      },
    },
  };

  const { ok, status, data } = await api("/api/public/signup", payload);

  if (ok && data.entrarUrl) {
    // Aprovado: mostra o estado final e entra pela porta do token.
    ["1", "2", "3"].forEach((k) => $("step" + k).classList.remove("is-visible"));
    $("stepDone").classList.add("is-visible");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => { window.location.href = data.entrarUrl; }, 1200);
    return;
  }

  btn.disabled = false;
  btn.querySelector("span:first-child").textContent = "Pagar e criar minha clínica";

  const msg = data.error || "Não conseguimos concluir. Tente de novo.";
  if (status === 402) {
    mostrarErro(msg + " Nenhuma clínica foi criada.");
  } else if (status === 400 && /código/i.test(msg)) {
    mostrarErro(msg);
    irPara(1);
    mostrarErro(msg);
  } else if (status === 409 && /endereço/i.test(msg)) {
    mostrarErro(msg);
    irPara(1);
    mostrarErro(msg);
  } else {
    mostrarErro(msg);
  }
});

atualizarPreco();
