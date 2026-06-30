import { registrarSessaoCallback } from "./session.js";
import { supabase } from "./supabaseClient.js";

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

function mostrarToast(titulo, descricao, duracao = 2000) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <div class="toast-icone">
      <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
    </div>
    <div class="toast-texto">
      <p class="toast-titulo">${titulo}</p>
      <p class="toast-descricao">${descricao}</p>
    </div>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("sair");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, duracao);
}

function mensagemErroCadastro(error) {
  const mensagem = error?.message || "";

  if (mensagem.toLowerCase().includes("user already registered")) {
    return "Este e-mail já está cadastrado. Faça login ou remova o usuário em Authentication > Users no Supabase.";
  }

  return `Erro ao criar conta: ${mensagem}`;
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
        .eq("email", username)
        .maybeSingle();

      if (erroPerfil || !perfil) {
        mostrarMensagem(mensagemEl, "E-mail ou senha incorretos.", "erro");
        return;
      }

      const { error: erroLogin } = await supabase.auth.signInWithPassword({
        email: perfil.email,
        password: senha,
      });

      if (erroLogin) {
        mostrarMensagem(mensagemEl, "E-mail ou senha incorretos.", "erro");
        return;
      }

      mostrarToast("Login efetuado com sucesso!", "Redirecionando...");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
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
      const { data: usuarioExistente } = await supabase
        .from("usuarios")
        .select("username, email")
        .or(`username.eq.${username},email.eq.${email}`)
        .maybeSingle();

      if (usuarioExistente?.username === username) {
        mostrarMensagem(mensagemEl, "Esse nome de usuário já está em uso.", "erro");
        return;
      }

      if (usuarioExistente?.email === email) {
        mostrarMensagem(mensagemEl, "Este e-mail já está cadastrado. Faça login.", "erro");
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
        mostrarMensagem(mensagemEl, mensagemErroCadastro(error), "erro");
        return;
      }

      mostrarToast("Conta criada com sucesso!", "Redirecionando para o login...");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } catch (err) {
      console.error("Erro ao criar conta:", err.message);
      mostrarMensagem(mensagemEl, "Erro ao conectar com o servidor.", "erro");
    } finally {
      botaoSubmit.disabled = false;
    }
  });
}

registrarSessaoCallback((resultadoSessao) => {
  if (!resultadoSessao) return;

  const authPathnames = ["/login", "/cadastro"];
  const pathname = window.location.pathname;

  if (!authPathnames.some(authPathname => authPathname.startsWith(pathname))) return;

  // User is logged and will be redirected
  return window.location.href = `${window.location.origin}/index`;
});
