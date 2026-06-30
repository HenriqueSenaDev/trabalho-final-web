# AMAB - Controle de Socios

Sistema web para controle de socios da AMAB, feito com HTML, CSS e JavaScript puro, usando Supabase como backend.

## Tecnologias

- HTML
- CSS
- JavaScript
- Supabase

## Como rodar localmente

1. Clone o projeto.
2. Crie o arquivo `js/config.js`.
3. Copie o conteudo de `js/config.example.js` para `js/config.js`.
4. Substitua os valores de exemplo pelas credenciais reais do Supabase:

```js
export const CONFIG = {
  SUPABASE_URL: "https://SEU_PROJETO.supabase.co",
  SUPABASE_KEY: "SUA_PUBLISHABLE_KEY_AQUI",
};
```

5. Rode o projeto com um servidor local:

```bash
npx serve
```

6. Abra no navegador o endereco `localhost` mostrado no terminal.

## Estrutura

- `index.html`: dashboard com listagem de socios.
- `cadastro.html`: tela de criacao de conta.
- `login.html`: tela de login.
- `socio-detalhes.html`: tela de detalhes do socio e pagamentos.
- `css/`: arquivos de estilo.
- `js/`: scripts da aplicacao.
- `sql/`: scripts para criacao das tabelas e policies no Supabase.
- `assets/images/`: imagens usadas no projeto.

## Observacao sobre configuracao

O arquivo `js/config.js` nao deve ser enviado para o GitHub, pois contem as credenciais reais do Supabase. Use sempre `js/config.example.js` como modelo.
