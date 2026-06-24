import { supabase } from "./supabaseClient.js";

let socios = [];
let usuarioLogado = null;
let perfilLogado = null;
const hoje = new Date();
const anoAtual = hoje.getFullYear();
const mesAtual = hoje.getMonth() + 1;
const STATUS_PAGO = "Pago";
const STATUS_PENDENTE = "Pendente";

const tabelaSocios = document.getElementById("tabelaSocios");
const totalSociosEl = document.getElementById("totalSocios");
const inputPesquisa = document.getElementById("inputPesquisa");
const nomeAdministradorHeader = document.getElementById(
  "nomeAdministradorHeader",
);

async function carregarSociosDoBanco() {
  try {
    const { data, error } = await supabase
      .from("socios")
      .select("*")
      .order("nome", { ascending: true });

    if (error) throw error;

    const { data: pagamentosMesAtual, error: erroPagamentos } = await supabase
      .from("pagamentos")
      .select("socio_id, status")
      .eq("ano", anoAtual)
      .eq("mes", mesAtual);

    if (erroPagamentos) throw erroPagamentos;

    const statusPorSocio = new Map(
      (pagamentosMesAtual || []).map((pagamento) => [
        pagamento.socio_id,
        pagamento.status,
      ]),
    );

    socios = (data || []).map((socio) => ({
      ...socio,
      status_mes_atual: statusPorSocio.get(socio.id) || STATUS_PENDENTE,
    }));

    renderTabela(socios);
  } catch (error) {
    console.error("Erro ao carregar dados do Supabase:", error.message);
    alert("Erro ao conectar com o banco de dados.");
  }
}

function renderTabela(lista) {
  tabelaSocios.innerHTML = "";

  lista.forEach((socio) => {
    const tr = document.createElement("tr");
    const badgeStatus = montarBadgeStatus(socio.status_mes_atual);

    tr.innerHTML = `
            <td class="nome-socio">${socio.nome}</td>
            <td>${socio.telefone || "(00) 00000-0000"}</td>
            <td><span class="status-badge ${badgeStatus.classe}">${badgeStatus.texto}</span></td>
            <td><a class="btn-detalhes" href="socio-detalhes.html?id=${socio.id}" data-id="${socio.id}">Ver detalhes</a></td>
        `;

    tabelaSocios.appendChild(tr);
  });

  totalSociosEl.textContent = `Total de Sócios: ${lista.length}`;
}

function montarBadgeStatus(status) {
  if (status === STATUS_PAGO) {
    return {
      classe: "status-pago",
      texto:
        '<span class="material-symbols-outlined status-icon" aria-hidden="true">check</span> Pago',
    };
  }

  return {
    classe: "status-pendente",
    texto: "✕ Pendente",
  };
}

tabelaSocios.addEventListener("click", (e) => {
  const botaoDetalhes = e.target.closest(".btn-detalhes");

  if (!botaoDetalhes) return;

  const socioSelecionado = socios.find(
    (socio) => socio.id === botaoDetalhes.dataset.id,
  );

  if (socioSelecionado) {
    localStorage.setItem("socioSelecionado", JSON.stringify(socioSelecionado));
  }
});

function filtrarSocios() {
  const termo = inputPesquisa.value.trim().toLowerCase();
  const filtrados = socios.filter((s) => s.nome.toLowerCase().includes(termo));
  renderTabela(filtrados);
}

inputPesquisa.addEventListener("input", filtrarSocios);

const modalOverlay = document.getElementById("modalOverlay");
const btnNovoSocio = document.getElementById("btnNovoSocio");
const btnFecharModal = document.getElementById("btnFecharModal");
const btnCancelar = document.getElementById("btnCancelar");
const formNovoSocio = document.getElementById("formNovoSocio");
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

function abrirModal() {
  modalOverlay.classList.add("active");
}

function fecharModal() {
  modalOverlay.classList.remove("active");
  formNovoSocio.reset();
}

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

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
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

btnNovoSocio.addEventListener("click", abrirModal);
btnFecharModal.addEventListener("click", fecharModal);
btnCancelar.addEventListener("click", fecharModal);
btnEditarPerfil.addEventListener("click", abrirModalPerfil);
btnFecharPerfil.addEventListener("click", fecharModalPerfil);
btnCancelarPerfil.addEventListener("click", fecharModalPerfil);

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) fecharModal();
});

modalPerfilOverlay.addEventListener("click", (e) => {
  if (e.target === modalPerfilOverlay) fecharModalPerfil();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOverlay.classList.contains("active")) {
    fecharModal();
  }

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

perfilEmail.addEventListener("blur", () => {
  perfilEmail.value = perfilEmail.value.trim().toLowerCase().slice(0, 100);
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
  const email = perfilEmail.value.trim().toLowerCase();
  const novaSenha = perfilNovaSenha.value;
  const confirmarSenha = perfilConfirmarSenha.value;

  perfilNome.value = nome;
  perfilEmail.value = email;

  if (!nome || !email) {
    mostrarMensagemPerfil("Preencha nome e e-mail.", "erro");
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

  if (email.length > 100 || !emailValido(email)) {
    mostrarMensagemPerfil("Informe um e-mail válido com até 100 caracteres.", "erro");
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
      email,
      data: { nome_completo: nome },
    };

    if (novaSenha) {
      authPayload.password = novaSenha;
    }

    const { error: authError } = await supabase.auth.updateUser(authPayload);
    if (authError) throw authError;

    const { error: perfilError } = await supabase
      .from("usuarios")
      .update({ nome_completo: nome, email })
      .eq("id", usuarioLogado.id);

    if (perfilError) throw perfilError;

    perfilLogado = { ...perfilLogado, nome_completo: nome, email };
    usuarioLogado = {
      ...usuarioLogado,
      email,
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

formNovoSocio.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const dataNascimento = document.getElementById("dataNascimento").value;
  const filiacaoMae = document.getElementById("filiacaoMae").value.trim();
  const filiacaoPai = document.getElementById("filiacaoPai").value.trim();
  const naturalidade = document.getElementById("naturalidade").value.trim();
  const rg = document.getElementById("rg").value.trim();
  const cpf = document.getElementById("cpf").value.trim();
  const profissao = document.getElementById("profissao").value.trim();
  const endereco = document.getElementById("endereco").value.trim();
  const telefone = document.getElementById("telefone")
    ? document.getElementById("telefone").value.trim()
    : "(00) 00000-0000";

  if (!nome || !cpf) {
    alert("Por favor, preencha os campos obrigatórios.");
    return;
  }

  try {
    const { error } = await supabase
      .from("socios")
      .insert([
        {
          nome,
          data_nascimento: dataNascimento,
          filiacao_mae: filiacaoMae,
          filiacao_pai: filiacaoPai,
          naturalidade,
          rg,
          cpf,
          profissao,
          endereco,
          telefone,
          ativo: true,
        },
      ]);

    if (error) throw error;

    await carregarSociosDoBanco();
    fecharModal();
  } catch (error) {
    console.error("Erro ao salvar novo sócio:", error.message);
    alert("Erro ao cadastrar sócio. Verifique se o CPF já existe.");
  }
});

carregarPerfilAdministrador();
carregarSociosDoBanco();

const inputCpf = document.getElementById("cpf");
const inputRg = document.getElementById("rg");

inputCpf.addEventListener("input", (e) => {
  let value = e.target.value;

  value = value.replace(/\D/g, "").slice(0, 11);

  value = value.replace(/(\d{3})(\d)/, "$1.$2");
  value = value.replace(/(\d{3})(\d)/, "$1.$2");
  value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

  e.target.value = value;
});

inputRg.addEventListener("input", (e) => {
  let value = e.target.value;

  value = value.replace(/\D/g, "");

  if (value.length > 1) {
    value = value.replace(/(\d+)(\d{1})$/, "$1-$2");
  }

  e.target.value = value;
});
