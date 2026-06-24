import { supabase } from "./supabaseClient.js";

let usuarioLogado = null;
let perfilLogado = null;

const nomeAdministradorHeader = document.getElementById(
  "nomeAdministradorHeader",
);
const modalPerfilOverlay = document.getElementById("modalPerfilOverlay");
const btnEditarPerfil = document.getElementById("btnEditarPerfil");
const btnFecharPerfil = document.getElementById("btnFecharPerfil");
const btnCancelarPerfil = document.getElementById("btnCancelarPerfil");
const formPerfil = document.getElementById("formPerfil");
const perfilNome = document.getElementById("perfilNome");
const perfilEmail = document.getElementById("perfilEmail");
const perfilNovaSenha = document.getElementById("perfilNovaSenha");
const perfilConfirmarSenha = document.getElementById("perfilConfirmarSenha");
const perfilMessage = document.getElementById("perfilMessage");

function mostrarMensagemPerfil(texto, tipo) {
  perfilMessage.textContent = texto;
  perfilMessage.className = `form-message ${tipo}`;
}

function limparMensagemPerfil() {
  perfilMessage.textContent = "";
  perfilMessage.className = "form-message";
}

function normalizarNomePerfil(valor) {
  return valor
    .replace(/[0-9]/g, "")
    .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 50);
}

function senhaPerfilValida(senha) {
  return senha.length >= 8 && senha.length <= 72 && !/\s/.test(senha);
}

function preencherFormularioPerfil() {
  const nome =
    perfilLogado?.nome_completo ||
    usuarioLogado?.user_metadata?.nome_completo ||
    "Administrador";
  const email = usuarioLogado?.email || perfilLogado?.email || "";

  perfilNome.value = nome;
  perfilEmail.value = email;
  perfilNovaSenha.value = "";
  perfilConfirmarSenha.value = "";
  limparMensagemPerfil();
}

function abrirModalPerfil() {
  preencherFormularioPerfil();
  modalPerfilOverlay.classList.add("active");
}

function fecharModalPerfil() {
  modalPerfilOverlay.classList.remove("active");
  formPerfil.reset();
  limparMensagemPerfil();
}

async function carregarPerfilAdministrador() {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return;
  }

  usuarioLogado = userData.user;

  const { data: perfil, error: perfilError } = await supabase
    .from("usuarios")
    .select("id, nome_completo, email")
    .eq("id", usuarioLogado.id)
    .maybeSingle();

  if (!perfilError && perfil) {
    perfilLogado = perfil;
    nomeAdministradorHeader.textContent =
      perfil.nome_completo || "Administrador";
  }
}

btnEditarPerfil.addEventListener("click", abrirModalPerfil);
btnFecharPerfil.addEventListener("click", fecharModalPerfil);
btnCancelarPerfil.addEventListener("click", fecharModalPerfil);

modalPerfilOverlay.addEventListener("click", (e) => {
  if (e.target === modalPerfilOverlay) fecharModalPerfil();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalPerfilOverlay.classList.contains("active")) {
    fecharModalPerfil();
  }
});

document.querySelectorAll(".toggle-password").forEach((botao) => {
  botao.addEventListener("click", () => {
    const input = document.getElementById(botao.dataset.target);
    input.type = input.type === "password" ? "text" : "password";
  });
});

perfilNome.addEventListener("input", () => {
  perfilNome.value = normalizarNomePerfil(perfilNome.value);
});

formPerfil.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!usuarioLogado) {
    mostrarMensagemPerfil(
      "Entre na sua conta antes de editar o perfil.",
      "erro",
    );
    return;
  }

  const nome = normalizarNomePerfil(perfilNome.value).trim();
  const emailAtual = usuarioLogado.email || perfilLogado?.email || "";
  const novaSenha = perfilNovaSenha.value;
  const confirmarSenha = perfilConfirmarSenha.value;

  perfilNome.value = nome;
  perfilEmail.value = emailAtual;

  if (!nome) {
    mostrarMensagemPerfil("Preencha o nome.", "erro");
    return;
  }

  if (nome.length < 3 || nome.length > 50) {
    mostrarMensagemPerfil("O nome deve ter entre 3 e 50 caracteres.", "erro");
    return;
  }

  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(nome)) {
    mostrarMensagemPerfil("O nome deve conter apenas letras e espaços.", "erro");
    return;
  }

  if ((novaSenha || confirmarSenha) && novaSenha !== confirmarSenha) {
    mostrarMensagemPerfil("As senhas não coincidem.", "erro");
    return;
  }

  if (novaSenha && !senhaPerfilValida(novaSenha)) {
    mostrarMensagemPerfil(
      "A nova senha deve ter entre 8 e 72 caracteres e não pode ter espaços.",
      "erro",
    );
    return;
  }

  const submitButton = formPerfil.querySelector(".btn-salvar");
  submitButton.disabled = true;
  limparMensagemPerfil();

  try {
    const authPayload = {
      data: { nome_completo: nome },
    };

    if (novaSenha) {
      authPayload.password = novaSenha;
    }

    const { error: authError } = await supabase.auth.updateUser(authPayload);
    if (authError) throw authError;

    const { error: perfilError } = await supabase
      .from("usuarios")
      .update({ nome_completo: nome })
      .eq("id", usuarioLogado.id);

    if (perfilError) throw perfilError;

    perfilLogado = { ...perfilLogado, nome_completo: nome };
    usuarioLogado = {
      ...usuarioLogado,
      user_metadata: { ...usuarioLogado.user_metadata, nome_completo: nome },
    };
    nomeAdministradorHeader.textContent = nome || "Administrador";

    mostrarMensagemPerfil("Perfil atualizado com sucesso.", "sucesso");
    perfilNovaSenha.value = "";
    perfilConfirmarSenha.value = "";
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error.message);
    mostrarMensagemPerfil(
      "Não foi possível atualizar o perfil. Verifique as permissões no Supabase.",
      "erro",
    );
  } finally {
    submitButton.disabled = false;
  }
});

carregarPerfilAdministrador();
