/* ============================================
   VESALIA — Captura de lista de espera
   --------------------------------------------
   Submete pro Formspree (https://formspree.io)

   ⚠️  CONFIGURAR ANTES DE PUBLICAR:
   1. Crie conta gratuita em formspree.io
   2. Crie um novo form (recebe endpoint tipo
      https://formspree.io/f/xxxxxxxx)
   3. Cole o endpoint na constante abaixo
   ============================================ */

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mjglnkej";

const form = document.getElementById("waitlist-form");
const formContainer = form.parentElement;

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validação nativa
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const button = form.querySelector(".submit");
  const buttonLabel = button.querySelector("span:first-child");
  const originalLabel = buttonLabel.textContent;

  // Estado loading
  button.disabled = true;
  button.classList.add("is-loading");
  buttonLabel.textContent = "Enviando…";

  try {
    const data = Object.fromEntries(new FormData(form).entries());

    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Sucesso: substitui o form pelo estado de confirmação
    renderSuccess(data.nome);

  } catch (err) {
    console.error("Erro ao enviar:", err);
    button.disabled = false;
    button.classList.remove("is-loading");
    buttonLabel.textContent = originalLabel;
    renderError();
  }
});

function renderSuccess(nome) {
  const firstName = (nome || "").trim().split(" ")[0] || "";
  const greeting = firstName ? `${firstName}, ` : "";

  const successHTML = `
    <div class="form-success">
      <div class="success-mark">✓</div>
      <h3 class="success-title">${greeting}recebido.</h3>
      <p class="success-text">Entraremos em contato assim que abrirmos as primeiras parcerias.</p>
    </div>
  `;

  form.style.display = "none";
  form.insertAdjacentHTML("afterend", successHTML);
}

function renderError() {
  // Remove banner anterior se existir
  document.querySelector(".form-error")?.remove();

  const errorHTML = `
    <div class="form-error" role="alert">
      Não foi possível enviar agora.
      Tente de novo, ou escreva para <a href="mailto:contato@vesalia.com.br">contato@vesalia.com.br</a>.
    </div>
  `;

  form.insertAdjacentHTML("afterbegin", errorHTML);
}
