/* ============================================
   VESALIA — Microinterações + captura de lista
   ============================================ */

/* ---------- Scroll reveal (IntersectionObserver) ---------- */
(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal, .stagger-children").forEach((el) => {
      el.classList.add("is-visible");
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  document.querySelectorAll(".reveal, .stagger-children").forEach((el) => {
    observer.observe(el);
  });
})();

/* ---------- Sticky nav: aparece após scrollar 75% da viewport ---------- */
(() => {
  const nav = document.querySelector(".floating-nav");
  if (!nav) return;

  let ticking = false;
  const threshold = () => window.innerHeight * 0.75;

  const update = () => {
    const shouldShow = window.scrollY > threshold();
    nav.classList.toggle("is-visible", shouldShow);
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );
})();

/* ============================================
   Formspree — captura de lista de espera
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
