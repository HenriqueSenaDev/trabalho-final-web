import { CONFIG } from './config.js';

const supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

document.querySelectorAll(".toggle-senha").forEach((botao) => {
  botao.addEventListener("click", () => {
    const input = document.getElementById(botao.dataset.target);
    input.type = input.type === "password" ? "text" : "password";
  });
});

function mostrarMensagem(elemento, texto, tipo) {
  if (!elemento) return;
  elemento.textContent = texto;
  elemento.classList.remove("erro", "sucesso");
  elemento.classList.add(tipo);
}

const btnCriarConta = document.getElementById("btnCriarConta");
if (btnCriarConta) {
  btnCriarConta.addEventListener("click", () => {
    window.location.href = "cadastro.html";
  });
}

const btnFazerLogin = document.getElementById("btnFazerLogin");
if (btnFazerLogin) {
  btnFazerLogin.addEventListener("click", () => {
    window.location.href = "login.html";
  });
}

const formLogin = document.getElementById("formLogin");
if (formLogin) {
  const mensagemEl = document.getElementById("loginMessage");
  const botaoSubmit = formLogin.querySelector(".btn-principal");

  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value;

    botaoSubmit.disabled = true;

    try {
      const { data: perfil, error: erroPerfil } = await supabase
        .from("usuarios")
        .select("email")
        .eq("username", username)
        .maybeSingle();

      if (erroPerfil || !perfil) {
        mostrarMensagem(mensagemEl, "Usuário ou senha incorretos.", "erro");
        return;
      }

      const { error: erroLogin } = await supabase.auth.signInWithPassword({
        email: perfil.email,
        password: senha,
      });

      if (erroLogin) {
        mostrarMensagem(mensagemEl, "Usuário ou senha incorretos.", "erro");
        return;
      }

      window.location.href = "index.html";
    } catch (err) {
      console.error("Erro ao fazer login:", err.message);
      mostrarMensagem(mensagemEl, "Erro ao conectar com o servidor.", "erro");
    } finally {
      botaoSubmit.disabled = false;
    }
  });
}

const formCadastro = document.getElementById("formCadastro");
if (formCadastro) {
  const mensagemEl = document.getElementById("cadastroMessage");
  const botaoSubmit = formCadastro.querySelector(".btn-principal");

  formCadastro.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nomeCompleto = document.getElementById("nomeCompleto").value.trim();
    const username = document.getElementById("nomeUsuario").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    if (senha.length < 8) {
      mostrarMensagem(mensagemEl, "A senha deve ter no mínimo 8 caracteres.", "erro");
      return;
    }

    if (senha !== confirmarSenha) {
      mostrarMensagem(mensagemEl, "As senhas não coincidem.", "erro");
      return;
    }

    botaoSubmit.disabled = true;

    try {
      const { data: usernameExistente } = await supabase
        .from("usuarios")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (usernameExistente) {
        mostrarMensagem(mensagemEl, "Esse nome de usuário já está em uso.", "erro");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { nome_completo: nomeCompleto, username },
        },
      });

      if (error) {
        mostrarMensagem(mensagemEl, "Erro ao criar conta: " + error.message, "erro");
        return;
      }

      if (!data.session) {
        mostrarMensagem(mensagemEl, "Conta criada! Verifique seu e-mail para confirmar antes de entrar.", "sucesso");
        return;
      }

      window.location.href = "index.html";
    } catch (err) {
      console.error("Erro ao criar conta:", err.message);
      mostrarMensagem(mensagemEl, "Erro ao conectar com o servidor.", "erro");
    } finally {
      botaoSubmit.disabled = false;
    }
  });
}
