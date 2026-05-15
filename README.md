# Vesalia · Landing Page

Landing page de captura de lista de espera para `vesalia.com.br`.
Tagline: **Infraestrutura, não software.**

---

## Stack

- **HTML + CSS + JS puros** — sem framework, sem build step
- **Fontes:** Fraunces (serifa editorial) + Manrope (grotesque), via Google Fonts
- **Server:** `serve` (npm) — Railway autodetecta via Nixpacks
- **Captura de lead:** Formspree (free tier, 50 envios/mês)

---

## Antes de publicar — configurar Formspree

1. Crie conta em [formspree.io](https://formspree.io) (gratuito).
2. Crie um novo form e configure o e-mail destino: o seu (ou `contato@vesalia.com.br` quando você ativar o domínio).
3. Copie o endpoint do form. Vai ser algo como:
   ```
   https://formspree.io/f/xyzpqrst
   ```
4. Abra `script.js` e substitua:
   ```js
   const FORMSPREE_ENDPOINT = "https://formspree.io/f/SEU_ID_AQUI";
   ```
   pelo endpoint real.

**Importante:** no Formspree, o primeiro envio precisa ser confirmado por e-mail (anti-spam). Faça um teste depois de subir o site.

---

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

> Editor recomendado: **Cursor**. Edita HTML/CSS/JS direto, hot reload manual (Ctrl+R no browser).

---

## Deploy no Railway

### Primeira vez

1. Push do projeto pro GitHub (repo privado serve).
2. Em Railway: **New Project → Deploy from GitHub repo** → selecione `vesalia-landing`.
3. Railway autodetecta `package.json`, roda `npm install` e `npm start`.
4. Em 1-2 minutos o site está no ar em uma URL temporária tipo `vesalia-landing.up.railway.app`.

### Custom domain (vesalia.com.br)

1. No Railway, vá em **Settings → Networking → Custom Domain → +Add Domain**.
2. Adicione `vesalia.com.br` e `www.vesalia.com.br`.
3. Railway mostra os registros DNS que você precisa apontar (CNAME).
4. No painel do seu registrador de domínio (registro.br):
   - Apague registros A/CNAME conflitantes
   - Adicione os CNAMEs que Railway pediu
5. Propagação leva de minutos a horas. Railway emite SSL automaticamente via Let's Encrypt.

### Atualizações

Cada `git push` na branch principal dispara redeploy automático no Railway.

---

## Estrutura do projeto

```
vesalia-landing/
├── index.html           ← Estrutura da página
├── styles.css           ← Visual completo
├── script.js            ← Submit do form (Formspree)
├── package.json         ← Define "npm start"
├── railway.json         ← Config de deploy
├── .gitignore
├── README.md
└── assets/
    ├── vesalia-logo.svg
    ├── vesalia-simbolo.svg
    └── vesalia-simbolo-512.png
```

---

## Onde editar o quê

| Quero mudar… | Arquivo | Onde |
|---|---|---|
| Tagline, copy, parágrafos | `index.html` | Direto no HTML |
| Cores da marca | `styles.css` | Variáveis `:root` no topo |
| Fontes | `index.html` (link Google Fonts) + `styles.css` (`--font-serif` / `--font-sans`) |
| E-mail destino do form | Formspree (não no código) | Dashboard formspree.io |
| Texto da confirmação após envio | `script.js` | Função `renderSuccess()` |
| Tamanho do título | `styles.css` | Classe `.tagline` |
| Espaçamentos gerais | `styles.css` | Variáveis `--space-*` |

---

## Tokens da marca (já no CSS)

```css
--ink:      #0A0A0A   /* preto absoluto    */
--paper:    #FAFAF7   /* off-white         */
--gold:     #A8884A   /* acento dourado    */
--burgundy: #5C1F26   /* acento bordô      */
--muted:    #6B6B6B   /* texto secundário  */
```

---

## Checklist antes de publicar

- [ ] Substituir `SEU_ID_AQUI` no `script.js` pelo endpoint do Formspree
- [ ] Configurar e-mail destino no Formspree
- [ ] Fazer 1 envio de teste e confirmar pelo e-mail do Formspree (necessário no primeiro envio)
- [ ] Apontar `vesalia.com.br` no Railway (custom domain)
- [ ] Conferir o link do Instagram no footer (`@vesalia.co`)
- [ ] Testar no mobile (especialmente o form)
- [ ] Subir favicon definitivo se quiser (hoje usa `assets/vesalia-simbolo.svg`)

---

## Próximos passos sugeridos

- **Analytics:** Plausible ou Umami (privacy-friendly, alinhado com tom da marca). Cloudflare Web Analytics também serve, é grátis.
- **OG image:** gerar uma imagem 1200×630 com o wordmark VESALIA pra ficar bonito quando compartilhado em WhatsApp/LinkedIn. Tem PNGs do logo no projeto Vesalia.
- **/manifest.json + iOS touch icons:** quando o produto ganhar tração.
