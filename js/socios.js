import { supabase } from "./supabaseClient.js";
import { registrarSessaoCallback } from "./session.js";

let paginaAtual = 1;
const itensPorPagina = 8;

const btnPrevPage = document.getElementById("btnPrevPage");
const btnNextPage = document.getElementById("btnNextPage");
const pageInfo = document.getElementById("pageInfo");

let socios = [];
const hoje = new Date();
const anoAtual = hoje.getFullYear();
const mesAtual = hoje.getMonth() + 1;
const STATUS_PAGO = "Pago";
const STATUS_PENDENTE = "Pendente";

const tabelaSocios = document.getElementById("tabelaSocios");
const totalSociosEl = document.getElementById("totalSocios");
const inputPesquisa = document.getElementById("inputPesquisa");
const menuIcon = document.querySelector(".menu-icon");
const sidebar = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const btnMeuPerfilMenu = document.getElementById("btnMeuPerfilMenu");
const btnSairMenu = document.getElementById("btnSairMenu");
const btnEditarPerfil = document.getElementById("btnEditarPerfil");
const nomeAdministradorHeader = document.getElementById("nomeAdministradorHeader");
const nomeAdministradorMenu = document.getElementById("nomeAdministradorMenu");
const loadingOverlay = document.getElementById("loadingOverlay");

function ocultarLoadingOverlay() {
  loadingOverlay?.classList.add("hidden");
  loadingOverlay?.setAttribute("aria-hidden", "true");
}

document.getElementById("dataNascimento").addEventListener('focus', function () {
  this.max = hoje.toISOString().split('T')[0];
});

function abrirMenuLateral() {
  document.body.classList.add("menu-lateral-aberto");
  menuIcon?.setAttribute("aria-expanded", "true");
}

function fecharMenuLateral() {
  document.body.classList.remove("menu-lateral-aberto");
  menuIcon?.setAttribute("aria-expanded", "false");
}

function alternarMenuLateral() {
  const menuAberto = document.body.classList.contains("menu-lateral-aberto");
  if (menuAberto) {
    fecharMenuLateral();
    return;
  }

  abrirMenuLateral();
}

function sincronizarNomeAdministradorNoMenu() {
  if (!nomeAdministradorHeader || !nomeAdministradorMenu) return;
  nomeAdministradorMenu.textContent =
    nomeAdministradorHeader.textContent?.trim() || "Administrador";
}

menuIcon?.setAttribute("aria-controls", "sidebar");
menuIcon?.setAttribute("aria-expanded", "false");
menuIcon?.addEventListener("click", alternarMenuLateral);
sidebarBackdrop?.addEventListener("click", fecharMenuLateral);

sidebar?.addEventListener("click", (event) => {
  const acao = event.target.closest("a,button");
  if (!acao) return;

  if (acao.id !== "btnSairMenu") {
    fecharMenuLateral();
  }
});

btnMeuPerfilMenu?.addEventListener("click", () => {
  btnEditarPerfil?.click();
});

btnSairMenu?.addEventListener("click", async () => {
  try {
    btnSairMenu.disabled = true;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error("Erro ao encerrar sessão:", error.message);
  } finally {
    window.location.href = "login.html";
  }
});

if (nomeAdministradorHeader && nomeAdministradorMenu) {
  sincronizarNomeAdministradorNoMenu();
  const observadorNome = new MutationObserver(
    sincronizarNomeAdministradorNoMenu,
  );
  observadorNome.observe(nomeAdministradorHeader, {
    childList: true,
    characterData: true,
    subtree: true,
  });
}

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

  const totalPaginas = Math.ceil(lista.length / itensPorPagina) || 1;

  if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const listaPaginada = lista.slice(inicio, fim);

  listaPaginada.forEach((socio) => {
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
  pageInfo.textContent = `Página ${paginaAtual} de ${totalPaginas}`;

  btnPrevPage.disabled = paginaAtual === 1;
  btnNextPage.disabled = paginaAtual === totalPaginas || totalPaginas === 0;
}

btnPrevPage.addEventListener("click", () => {
  if (paginaAtual > 1) {
    paginaAtual--;
    filtrarSocios();
  }
});

btnNextPage.addEventListener("click", () => {
  paginaAtual++;
  filtrarSocios();
});

inputPesquisa.addEventListener("input", () => {
  paginaAtual = 1;
  filtrarSocios();
});

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

function abrirModal() {
  modalOverlay.classList.add("active");
}

function fecharModal() {
  modalOverlay.classList.remove("active");
  formNovoSocio.reset();
}

btnNovoSocio.addEventListener("click", abrirModal);
btnFecharModal.addEventListener("click", fecharModal);
btnCancelar.addEventListener("click", fecharModal);

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) fecharModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOverlay.classList.contains("active")) {
    fecharModal();
  }

  if (e.key === "Escape" && document.body.classList.contains("menu-lateral-aberto")) {
    fecharMenuLateral();
  }
});

formNovoSocio.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitButton = formNovoSocio.querySelector(".btn-salvar");
  submitButton.disabled = true;

  const nome = document.getElementById("nome").value.trim();
  const dataNascimento = document.getElementById("dataNascimento").value;
  const filiacaoMae = document.getElementById("filiacaoMae").value.trim();
  const filiacaoPai = document.getElementById("filiacaoPai").value.trim();
  const naturalidade = document.getElementById("naturalidade").value.trim();
  const rg = document.getElementById("rg").value.trim();
  const cpf = document.getElementById("cpf").value.trim();
  const profissao = document.getElementById("profissao").value.trim();
  const endereco = document.getElementById("endereco").value.trim();
  const telefone = document.getElementById("telefone").value.trim();

  if (!nome || !cpf || !telefone) {
    alert("Por favor, preencha os campos obrigatórios.");
    return;
  }

  const dataAtualISO = hoje.toISOString().split('T')[0];
  if (dataNascimento > dataAtualISO) {
    alert("A data de nascimento não pode ser no futuro.");
    document.getElementById("dataNascimento").focus();
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
  } finally {
    submitButton.disabled = false;
  }
});

const inputCpf = document.getElementById("cpf");
const inputRg = document.getElementById("rg");
const inputTelefone = document.getElementById("telefone");

inputCpf.addEventListener("input", (e) => {
  let value = e.target.value.replace(/\D/g, "").slice(0, 11);
  value = value.replace(/(\d{3})(\d)/, "$1.$2");
  value = value.replace(/(\d{3})(\d)/, "$1.$2");
  value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  e.target.value = value;
});

inputRg.addEventListener("input", (e) => {
  let value = e.target.value.replace(/\D/g, "").slice(0, 10);

  if (value.length > 1) {
    value = value.replace(/(\d+)(\d{1})$/, "$1-$2");
  }
  e.target.value = value;
});

inputTelefone.addEventListener("input", (e) => {
  let value = e.target.value.replace(/\D/g, "").slice(0, 11);

  value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
  value = value.replace(/(\d)(\d{4})$/, "$1-$2");

  e.target.value = value;
});

registrarSessaoCallback((resultadoSessao) => {
  if (!resultadoSessao) {
    return window.location.href = `${window.location.origin}/login.html`;
  }

  ocultarLoadingOverlay();
  carregarSociosDoBanco();
});
