# Apoio Agrimensura e Topografia

Site da Apoio Agrimensura e Topografia Ltda (desde 2001): levantamento planialtimétrico e cadastral, aerolevantamento com drone, batimetria, delimitação de terrenos e usucapião.

Página única em HTML (`index.html`), sem etapa de build e sem servidor próprio.

- `css/site.css`: estilos
- `js/boot.js`: decide se mostra a abertura com a logo
- `js/site.js`: mapa, animações, formulário (o bloco `CONTATO` fica no começo)
- `js/vendor/gsap-3.12.5/`: GSAP + ScrollTrigger, cópia local conferida com o SRI oficial do cdnjs
- `fonts/`: Archivo (SIL Open Font License), servida pelo próprio site

- **Contatos:** preencha o bloco `CONTATO` no começo do script do `index.html` (WhatsApp, telefone, e-mail, endereço, Instagram). A lista de contatos, o rodapé e o formulário se ajustam sozinhos.
- **Google:** o `vercel.json` manda o cabeçalho `X-Robots-Tag: noindex`. Para liberar nas buscas, apague o bloco `headers`.

## Segurança

- Tudo é servido pelo próprio domínio (sem scripts ou fontes de terceiros), então a política de segurança (CSP) do `vercel.json` só permite arquivos do próprio site, e nenhum script embutido.
- Cabeçalhos no `vercel.json`: CSP, `X-Frame-Options: DENY` (o site não pode ser embutido em outra página), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` (câmera, microfone, localização etc. desligados) e `Cross-Origin-Opener-Policy`. A Vercel já envia HSTS (HTTPS obrigatório).
- O formulário não envia nada para servidor: ele só monta a mensagem e abre o WhatsApp.
- Se um dia adicionar script de fora (Google Analytics, mapa embutido, chat), é preciso liberar o domínio na CSP, senão ele será bloqueado.
