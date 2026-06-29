import { supabase } from "./supabaseClient.js";
import { registrarSessaoCallback } from "./session.js";

const meses = [
  { numero: 1, curto: "Jan", nome: "Janeiro" },
  { numero: 2, curto: "Fev", nome: "Fevereiro" },
  { numero: 3, curto: "Mar", nome: "Março" },
  { numero: 4, curto: "Abr", nome: "Abril" },
  { numero: 5, curto: "Mai", nome: "Maio" },
  { numero: 6, curto: "Jun", nome: "Junho" },
  { numero: 7, curto: "Jul", nome: "Julho" },
  { numero: 8, curto: "Ago", nome: "Agosto" },
  { numero: 9, curto: "Set", nome: "Setembro" },
  { numero: 10, curto: "Out", nome: "Outubro" },
  { numero: 11, curto: "Nov", nome: "Novembro" },
  { numero: 12, curto: "Dez", nome: "Dezembro" },
];

const params = new URLSearchParams(window.location.search);
let socioId = params.get("id");
const anoAtual = new Date().getFullYear();
const mesAtual = new Date().getMonth() + 1;
const STATUS_PAGO = "Pago";
const STATUS_PENDENTE = "Pendente";
const statusPermitidos = [STATUS_PAGO, STATUS_PENDENTE];
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let socioAtual = null;
let pagamentos = [];
let mesSelecionado = mesAtual;

const detalheNome = document.getElementById("detalheNome");
const detalheTelefone = document.getElementById("detalheTelefone");
const detalheDataFiliacao = document.getElementById("detalheDataFiliacao");
const detalheSituacao = document.getElementById("detalheSituacao");
const infoNascimento = document.getElementById("infoNascimento");
const infoMae = document.getElementById("infoMae");
const infoPai = document.getElementById("infoPai");
const infoNaturalidade = document.getElementById("infoNaturalidade");
const infoRg = document.getElementById("infoRg");
const infoCpf = document.getElementById("infoCpf");
const infoProfissao = document.getElementById("infoProfissao");
const infoEndereco = document.getElementById("infoEndereco");
const selectAno = document.getElementById("selectAno");
const selectMes = document.getElementById("selectMes");
const mesesGrid = document.getElementById("mesesGrid");
const detalhesMessage = document.getElementById("detalhesMessage");
const btnEditarSocio = document.getElementById("btnEditarSocio");
const btnEditarCadastro = document.getElementById("btnEditarCadastro");
const btnExcluirSocio = document.getElementById("btnExcluirSocio");
const menuEditarSocio = document.getElementById("menuEditarSocio");
const modalEditarSocioOverlay = document.getElementById("modalEditarSocioOverlay");
const formEditarSocio = document.getElementById("formEditarSocio");
const btnFecharEditarSocio = document.getElementById("btnFecharEditarSocio");
const btnCancelarEditarSocio = document.getElementById("btnCancelarEditarSocio");
const editarSocioMessage = document.getElementById("editarSocioMessage");
const editarNome = document.getElementById("editarNome");
const editarDataNascimento = document.getElementById("editarDataNascimento");
const editarDataFiliacao = document.getElementById("editarDataFiliacao");
const editarFiliacaoMae = document.getElementById("editarFiliacaoMae");
const editarFiliacaoPai = document.getElementById("editarFiliacaoPai");
const editarNaturalidade = document.getElementById("editarNaturalidade");
const editarRg = document.getElementById("editarRg");
const editarCpf = document.getElementById("editarCpf");
const editarTelefone = document.getElementById("editarTelefone");
const editarProfissao = document.getElementById("editarProfissao");
const editarAtivo = document.getElementById("editarAtivo");
const editarEndereco = document.getElementById("editarEndereco");
const loadingOverlay = document.getElementById("loadingOverlay");
const menuIcon = document.querySelector(".menu-icon");
const sidebar = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const btnSairMenu = document.getElementById("btnSairMenu");
const nomeAdministradorMenu = document.getElementById("nomeAdministradorMenu");

function abrirMenuLateral() {
  document.body.classList.add("menu-lateral-aberto");
  menuIcon?.setAttribute("aria-expanded", "true");
}

function fecharMenuLateral() {
  document.body.classList.remove("menu-lateral-aberto");
  menuIcon?.setAttribute("aria-expanded", "false");
}

function alternarMenuLateral() {
  if (document.body.classList.contains("menu-lateral-aberto")) {
    fecharMenuLateral();
    return;
  }

  abrirMenuLateral();
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

if (nomeAdministradorMenu) {
  supabase.auth.getUser().then(({ data }) => {
    const nome = data?.user?.user_metadata?.nome_completo;
    if (nome) {
      nomeAdministradorMenu.textContent = nome;
    }
  });
}

function ocultarLoadingOverlay() {
  loadingOverlay?.classList.add("hidden");
  loadingOverlay?.setAttribute("aria-hidden", "true");
}

function formatarData(data) {
  if (!data) return "-";

  const [ano, mes, dia] = data.split("-");
  if (!ano || !mes || !dia) return data;

  return `${dia}/${mes}/${ano}`;
}

function mostrarMensagem(texto, tipo) {
  detalhesMessage.textContent = texto;
  detalhesMessage.className = `form-message ${tipo}`;
}

function limparMensagem() {
  detalhesMessage.textContent = "";
  detalhesMessage.className = "form-message";
}

function mostrarMensagemEdicao(texto, tipo) {
  editarSocioMessage.textContent = texto;
  editarSocioMessage.className = `form-message ${tipo}`;
}

function limparMensagemEdicao() {
  editarSocioMessage.textContent = "";
  editarSocioMessage.className = "form-message";
}

function dataHojeISO() {
  return new Date().toISOString().split("T")[0];
}

function somenteLetrasEspacos(valor, limite = 100) {
  return valor
    .replace(/[0-9]/g, "")
    .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, limite);
}

function textoNaturalidade(valor) {
  return valor
    .replace(/[0-9]/g, "")
    .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s-]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 80);
}

function formatarCpf(valor) {
  let cpf = valor.replace(/\D/g, "").slice(0, 11);
  cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
  cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
  cpf = cpf.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return cpf;
}

function formatarRg(valor) {
  let rg = valor.replace(/\D/g, "").slice(0, 10);

  if (rg.length > 1) {
    rg = rg.replace(/(\d+)(\d{1})$/, "$1-$2");
  }

  return rg;
}

function formatarTelefone(valor) {
  let telefone = valor.replace(/\D/g, "").slice(0, 11);
  telefone = telefone.replace(/^(\d{2})(\d)/g, "($1) $2");
  telefone = telefone.replace(/(\d)(\d{4})$/, "$1-$2");
  return telefone;
}

function quantidadeDigitos(valor) {
  return valor.replace(/\D/g, "").length;
}

function validarSocioId() {
  return typeof socioId === "string" && uuidRegex.test(socioId);
}

function validarAno(ano) {
  return Number.isInteger(ano) && ano >= 2000 && ano <= anoAtual + 5;
}

function validarMes(mes) {
  return Number.isInteger(mes) && mes >= 1 && mes <= 12;
}

function validarStatus(status) {
  return statusPermitidos.includes(status);
}

function validarSelecaoPagamento(status) {
  const ano = Number(selectAno.value);
  const mes = Number(mesSelecionado);

  if (!validarSocioId()) {
    mostrarMensagem(
      "Sócio inválido. Volte para a lista e abra os detalhes novamente.",
      "erro",
    );
    return false;
  }

  if (!validarAno(ano)) {
    mostrarMensagem("Ano inválido para pagamento.", "erro");
    return false;
  }

  if (!validarMes(mes)) {
    mostrarMensagem("Mês inválido para pagamento.", "erro");
    return false;
  }

  if (!validarStatus(status)) {
    mostrarMensagem("Situação de pagamento inválida.", "erro");
    return false;
  }

  return true;
}

function preencherSelects() {
  const anos = [anoAtual - 1, anoAtual, anoAtual + 1];
  selectAno.innerHTML = anos
    .map(
      (ano) =>
        `<option value="${ano}" ${ano === anoAtual ? "selected" : ""}>${ano}</option>`,
    )
    .join("");

  selectMes.innerHTML = meses
    .map(
      (mes) =>
        `<option value="${mes.numero}" ${mes.numero === mesSelecionado ? "selected" : ""}>${mes.nome}</option>`,
    )
    .join("");
}

function pagamentoDoMes(numeroMes) {
  return pagamentos.find((pagamento) => Number(pagamento.mes) === numeroMes);
}

function mesSemPagamentoEhPendente(numeroMes) {
  return Number(selectAno.value) === anoAtual && numeroMes === mesAtual;
}

function obterVisualPagamento(mes) {
  const pagamento = pagamentoDoMes(mes.numero);
  const status = pagamento?.status;
  const semRegistroPendente = !status && mesSemPagamentoEhPendente(mes.numero);

  if (status === STATUS_PAGO) {
    return { classe: "pago", icone: "✓", texto: STATUS_PAGO };
  }

  if (status === STATUS_PENDENTE || semRegistroPendente) {
    return { classe: "pendente", icone: "x", texto: STATUS_PENDENTE };
  }

  return { classe: "sem-status", icone: "-", texto: "-" };
}

function renderSocio() {
  detalheNome.textContent = socioAtual.nome;
  detalheTelefone.textContent = socioAtual.telefone || "(00) 00000-0000";
  detalheDataFiliacao.textContent = `Sócio desde: ${formatarData(socioAtual.data_filiacao)}`;

  detalheSituacao.innerHTML = `
    <span class="${socioAtual.ativo ? "material-symbols-outlined " : ""}badge-icone" aria-hidden="true">${socioAtual.ativo ? "check" : "x"}</span>
    ${socioAtual.ativo ? "Sócio Ativo" : "Sócio Inativo"}
  `;
  detalheSituacao.classList.toggle("inativo", !socioAtual.ativo);

  infoNascimento.textContent = formatarData(socioAtual.data_nascimento);
  infoMae.textContent = socioAtual.filiacao_mae || "-";
  infoPai.textContent = socioAtual.filiacao_pai || "-";
  infoNaturalidade.textContent = socioAtual.naturalidade || "-";
  infoRg.textContent = socioAtual.rg || "-";
  infoCpf.textContent = socioAtual.cpf || "-";
  infoProfissao.textContent = socioAtual.profissao || "-";
  infoEndereco.textContent = socioAtual.endereco || "-";
}

function preencherFormularioEditarSocio() {
  if (!socioAtual) return;

  editarNome.value = socioAtual.nome || "";
  editarDataNascimento.value = socioAtual.data_nascimento || "";
  editarDataFiliacao.value = socioAtual.data_filiacao || "";
  editarFiliacaoMae.value = socioAtual.filiacao_mae || "";
  editarFiliacaoPai.value = socioAtual.filiacao_pai || "";
  editarNaturalidade.value = socioAtual.naturalidade || "";
  editarRg.value = formatarRg(socioAtual.rg || "");
  editarCpf.value = formatarCpf(socioAtual.cpf || "");
  editarTelefone.value = formatarTelefone(socioAtual.telefone || "");
  editarProfissao.value = socioAtual.profissao || "";
  editarAtivo.value = String(socioAtual.ativo !== false);
  editarEndereco.value = socioAtual.endereco || "";
  limparMensagemEdicao();
}

function abrirModalEditarSocio() {
  if (!socioAtual) {
    mostrarMensagem("Carregue o sócio antes de editar.", "erro");
    return;
  }

  preencherFormularioEditarSocio();
  modalEditarSocioOverlay.classList.add("active");
}

function fecharModalEditarSocio() {
  modalEditarSocioOverlay.classList.remove("active");
  formEditarSocio.reset();
  limparMensagemEdicao();
}

function obterDadosFormularioSocio() {
  const dados = {
    nome: somenteLetrasEspacos(editarNome.value, 100).trim(),
    dataNascimento: editarDataNascimento.value,
    dataFiliacao: editarDataFiliacao.value,
    filiacaoMae: somenteLetrasEspacos(editarFiliacaoMae.value, 100).trim(),
    filiacaoPai: somenteLetrasEspacos(editarFiliacaoPai.value, 100).trim(),
    naturalidade: textoNaturalidade(editarNaturalidade.value).trim(),
    rg: formatarRg(editarRg.value),
    cpf: formatarCpf(editarCpf.value),
    telefone: formatarTelefone(editarTelefone.value),
    profissao: somenteLetrasEspacos(editarProfissao.value, 80).trim(),
    ativo: editarAtivo.value === "true",
    endereco: editarEndereco.value.trim().replace(/\s{2,}/g, " ").slice(0, 180),
  };

  editarNome.value = dados.nome;
  editarFiliacaoMae.value = dados.filiacaoMae;
  editarFiliacaoPai.value = dados.filiacaoPai;
  editarNaturalidade.value = dados.naturalidade;
  editarRg.value = dados.rg;
  editarCpf.value = dados.cpf;
  editarTelefone.value = dados.telefone;
  editarProfissao.value = dados.profissao;
  editarEndereco.value = dados.endereco;

  return dados;
}

function validarFormularioSocio(dados) {
  const hojeISO = dataHojeISO();

  if (dados.nome.length < 3) {
    return "O nome deve ter pelo menos 3 caracteres.";
  }

  if (!dados.dataNascimento) {
    return "Informe a data de nascimento.";
  }

  if (dados.dataNascimento > hojeISO) {
    return "A data de nascimento não pode ser no futuro.";
  }

  if (dados.dataFiliacao && dados.dataFiliacao > hojeISO) {
    return "A data de filiação não pode ser no futuro.";
  }

  if (dados.filiacaoMae.length < 3 || dados.filiacaoPai.length < 3) {
    return "Informe a filiação com pelo menos 3 caracteres.";
  }

  if (dados.naturalidade.length < 2) {
    return "Informe uma naturalidade válida.";
  }

  if (quantidadeDigitos(dados.rg) < 3) {
    return "Informe um RG válido.";
  }

  if (quantidadeDigitos(dados.cpf) !== 11) {
    return "Informe um CPF válido.";
  }

  if (![10, 11].includes(quantidadeDigitos(dados.telefone))) {
    return "Informe um telefone válido.";
  }

  if (dados.profissao.length < 2) {
    return "Informe uma profissão válida.";
  }

  if (dados.endereco.length < 5) {
    return "Informe um endereço válido.";
  }

  return "";
}

function mensagemErroSalvarSocio(error) {
  const mensagem = (error?.message || "").toLowerCase();

  if (mensagem.includes("socios_cpf_key") || mensagem.includes("duplicate")) {
    return "Já existe um sócio cadastrado com esse CPF.";
  }

  if (mensagem.includes("row-level security")) {
    return "Não foi possível salvar. Verifique as permissões no Supabase.";
  }

  return "Não foi possível atualizar as informações do sócio.";
}

async function salvarEdicaoSocio(event) {
  event.preventDefault();

  if (!validarSocioId()) {
    mostrarMensagemEdicao("Sócio inválido. Volte para a lista e abra novamente.", "erro");
    return;
  }

  const dados = obterDadosFormularioSocio();
  const erroValidacao = validarFormularioSocio(dados);

  if (erroValidacao) {
    mostrarMensagemEdicao(erroValidacao, "erro");
    return;
  }

  const submitButton = formEditarSocio.querySelector(".btn-salvar");
  submitButton.disabled = true;
  limparMensagemEdicao();

  const payload = {
    nome: dados.nome,
    data_nascimento: dados.dataNascimento,
    data_filiacao: dados.dataFiliacao || null,
    filiacao_mae: dados.filiacaoMae,
    filiacao_pai: dados.filiacaoPai,
    naturalidade: dados.naturalidade,
    rg: dados.rg,
    cpf: dados.cpf,
    telefone: dados.telefone,
    profissao: dados.profissao,
    endereco: dados.endereco,
    ativo: dados.ativo,
  };

  try {
    const { data, error } = await supabase
      .from("socios")
      .update(payload)
      .eq("id", socioId)
      .select("*")
      .maybeSingle();

    if (error) throw error;

    socioAtual = data || { ...socioAtual, ...payload };
    localStorage.setItem("socioSelecionado", JSON.stringify(socioAtual));
    renderSocio();
    fecharModalEditarSocio();
    mostrarMensagem("Informações do sócio atualizadas.", "sucesso");
  } catch (error) {
    console.error("Erro ao atualizar sócio:", error.message);
    mostrarMensagemEdicao(mensagemErroSalvarSocio(error), "erro");
  } finally {
    submitButton.disabled = false;
  }
}

function tentarRenderizarSocioDoCache() {
  const cache = localStorage.getItem("socioSelecionado");
  if (!cache) return false;

  try {
    const socio = JSON.parse(cache);

    if (!socio?.id) return false;

    if (!socioId) {
      socioId = socio.id;
      window.history.replaceState(
        null,
        "",
        `socio-detalhes.html?id=${socioId}`,
      );
    }

    if (!validarSocioId()) return false;

    if (socio.id !== socioId) return false;

    socioAtual = socio;
    renderSocio();
    return true;
  } catch {
    return false;
  }
}

function renderPagamentos() {
  mesesGrid.innerHTML = meses
    .map((mes) => {
      const visual = obterVisualPagamento(mes);
      const selecionado = mes.numero === mesSelecionado ? "selecionado" : "";

      return `
        <button class="mes-card ${visual.classe} ${selecionado}" type="button" data-mes="${mes.numero}">
          <strong>${mes.curto}</strong>
          <span class="icone-status">${visual.icone}</span>
          <span class="texto-status">${visual.texto}</span>
        </button>
      `;
    })
    .join("");

  const pagamentoSelecionado = pagamentoDoMes(mesSelecionado);
  const statusSelecionado =
    pagamentoSelecionado?.status === STATUS_PAGO
      ? STATUS_PAGO
      : STATUS_PENDENTE;
  const radioSelecionado = document.querySelector(
    `input[name="situacaoPagamento"][value="${statusSelecionado}"]`,
  );

  document
    .querySelectorAll('input[name="situacaoPagamento"]')
    .forEach((input) => {
      input.checked = false;
    });

  if (radioSelecionado) {
    radioSelecionado.checked = true;
  }
}

async function carregarSocio() {
  if (!validarSocioId()) {
    throw new Error("ID do sócio inválido.");
  }

  const { data, error } = await supabase
    .from("socios")
    .select("*")
    .eq("id", socioId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Sócio não encontrado.");

  socioAtual = data;
  renderSocio();
}

async function carregarPagamentos() {
  const ano = Number(selectAno.value || anoAtual);

  if (!validarSocioId()) {
    throw new Error("ID do sócio inválido.");
  }

  if (!validarAno(ano)) {
    throw new Error("Ano inválido.");
  }

  const { data, error } = await supabase
    .from("pagamentos")
    .select("*")
    .eq("socio_id", socioId)
    .eq("ano", ano)
    .order("mes", { ascending: true });

  if (error) throw error;

  pagamentos = data || [];
  renderPagamentos();
}

async function salvarSituacao(status) {
  if (!validarSelecaoPagamento(status)) return;

  limparMensagem();

  const payload = {
    socio_id: socioId,
    ano: Number(selectAno.value),
    mes: Number(mesSelecionado),
    status,
  };

  const { error } = await supabase
    .from("pagamentos")
    .upsert(payload, { onConflict: "socio_id,ano,mes" });

  if (error) throw error;

  await carregarPagamentos();
  mostrarMensagem("Situação do pagamento atualizada.", "sucesso");
}

async function excluirSocio() {
  if (!validarSocioId()) {
    mostrarMensagem(
      "Sócio inválido. Volte para a lista e abra os detalhes novamente.",
      "erro",
    );
    return;
  }

  const confirmar = window.confirm(
    "Tem certeza que deseja excluir este sócio?",
  );
  if (!confirmar) return;

  const { error } = await supabase.from("socios").delete().eq("id", socioId);

  if (error) {
    mostrarMensagem("Não foi possível excluir o sócio.", "erro");
    return;
  }

  window.location.href = "index.html";
}

mesesGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".mes-card");
  if (!card) return;

  mesSelecionado = Number(card.dataset.mes);

  if (!validarMes(mesSelecionado)) {
    mostrarMensagem("Mês inválido.", "erro");
    return;
  }

  selectMes.value = String(mesSelecionado);
  renderPagamentos();
});

selectAno.addEventListener("change", async () => {
  limparMensagem();
  await carregarPagamentos();
});

selectMes.addEventListener("change", () => {
  mesSelecionado = Number(selectMes.value);

  if (!validarMes(mesSelecionado)) {
    mostrarMensagem("Mês inválido.", "erro");
    return;
  }

  renderPagamentos();
});

document
  .querySelectorAll('input[name="situacaoPagamento"]')
  .forEach((input) => {
    input.addEventListener("change", async () => {
      try {
        await salvarSituacao(input.value);
      } catch (error) {
        console.error("Erro ao salvar pagamento:", error.message);
        mostrarMensagem("Não foi possível atualizar o pagamento.", "erro");
      }
    });
  });

btnEditarSocio.addEventListener("click", () => {
  const estaAberto = menuEditarSocio.classList.toggle("aberto");
  btnEditarSocio.setAttribute("aria-expanded", String(estaAberto));
});

document.addEventListener("click", (e) => {
  if (e.target.closest(".dropdown-acoes")) return;

  menuEditarSocio.classList.remove("aberto");
  btnEditarSocio.setAttribute("aria-expanded", "false");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.body.classList.contains("menu-lateral-aberto")) {
    fecharMenuLateral();
  }

  if (e.key === "Escape" && modalEditarSocioOverlay.classList.contains("active")) {
    fecharModalEditarSocio();
  }
});

btnEditarCadastro.addEventListener("click", () => {
  menuEditarSocio.classList.remove("aberto");
  btnEditarSocio.setAttribute("aria-expanded", "false");
  abrirModalEditarSocio();
});

btnExcluirSocio.addEventListener("click", excluirSocio);
btnFecharEditarSocio.addEventListener("click", fecharModalEditarSocio);
btnCancelarEditarSocio.addEventListener("click", fecharModalEditarSocio);
formEditarSocio.addEventListener("submit", salvarEdicaoSocio);

modalEditarSocioOverlay.addEventListener("click", (e) => {
  if (e.target === modalEditarSocioOverlay) fecharModalEditarSocio();
});

editarDataNascimento.max = dataHojeISO();
editarDataFiliacao.max = dataHojeISO();

editarNome.addEventListener("input", () => {
  editarNome.value = somenteLetrasEspacos(editarNome.value, 100);
});

editarFiliacaoMae.addEventListener("input", () => {
  editarFiliacaoMae.value = somenteLetrasEspacos(editarFiliacaoMae.value, 100);
});

editarFiliacaoPai.addEventListener("input", () => {
  editarFiliacaoPai.value = somenteLetrasEspacos(editarFiliacaoPai.value, 100);
});

editarNaturalidade.addEventListener("input", () => {
  editarNaturalidade.value = textoNaturalidade(editarNaturalidade.value);
});

editarProfissao.addEventListener("input", () => {
  editarProfissao.value = somenteLetrasEspacos(editarProfissao.value, 80);
});

editarRg.addEventListener("input", () => {
  editarRg.value = formatarRg(editarRg.value);
});

editarCpf.addEventListener("input", () => {
  editarCpf.value = formatarCpf(editarCpf.value);
});

editarTelefone.addEventListener("input", () => {
  editarTelefone.value = formatarTelefone(editarTelefone.value);
});

async function iniciarTela() {
  const exibiuCache = tentarRenderizarSocioDoCache();

  if (!socioId) {
    mostrarMensagem("Sócio não informado na URL.", "erro");
    return;
  }

  if (!validarSocioId()) {
    detalheNome.textContent = "Sócio inválido";
    mostrarMensagem(
      "O id do sócio na URL é inválido. Volte para a lista e abra os detalhes novamente.",
      "erro",
    );
    return;
  }

  try {
    preencherSelects();

    try {
      await carregarSocio();
    } catch (error) {
      console.error("Erro ao carregar sócio:", error.message);

      if (!exibiuCache) {
        detalheNome.textContent = "Sócio não encontrado";
        mostrarMensagem(
          "Não foi possível carregar o sócio. Confira se a tabela socios existe e se o id da URL está correto.",
          "erro",
        );
        return;
      }

      mostrarMensagem(
        "Mostrando dados da lista. Confirme no Supabase se a tabela socios permite leitura.",
        "erro",
      );
    }

    try {
      await carregarPagamentos();
    } catch (error) {
      console.error("Erro ao carregar pagamentos:", error.message);
      pagamentos = [];
      renderPagamentos();
      mostrarMensagem(
        "Dados do sócio carregados. Para pagamentos, confirme se a tabela pagamentos existe no Supabase.",
        "erro",
      );
    }
  } catch (error) {
    console.error("Erro ao carregar detalhes:", error.message);
    mostrarMensagem("Não foi possível carregar os detalhes do sócio.", "erro");
  }
}

registrarSessaoCallback((resultadoSessao) => {
  const pathname = window.location.pathname;
  const caminhosDetalhes = ["/socio-detalhes", "/socio-detalhes.html"];
  if (!caminhosDetalhes.includes(pathname)) return;

  if (!resultadoSessao) {
    // Protected path, user will be redirected
    return window.location.href = `${window.location.origin}/login`;
  }

  ocultarLoadingOverlay();
  iniciarTela();
});
