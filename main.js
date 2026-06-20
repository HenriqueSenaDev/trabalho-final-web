let socios = [
    { nome: "José Silva", telefone: "(00) 00000-0000", situacao: "pago" },
    { nome: "Maria Souza", telefone: "(00) 00000-0000", situacao: "pendente" },
    { nome: "João Santos", telefone: "(00) 00000-0000", situacao: "pago" },
    { nome: "Pedro Lucas", telefone: "(00) 00000-0000", situacao: "pago" },
    { nome: "Paulo Henrique", telefone: "(00) 00000-0000", situacao: "pendente" },
    { nome: "Francisca Joana", telefone: "(00) 00000-0000", situacao: "pago" },
    { nome: "Ana Luiza", telefone: "(00) 00000-0000", situacao: "pago" },
    { nome: "Maria Eduarda", telefone: "(00) 00000-0000", situacao: "pendente" },
    { nome: "Gabriela", telefone: "(00) 00000-0000", situacao: "pago" }
];

const tabelaSocios = document.getElementById("tabelaSocios");
const totalSociosEl = document.getElementById("totalSocios");
const inputPesquisa = document.getElementById("inputPesquisa");

function renderTabela(lista) {
    tabelaSocios.innerHTML = "";

    lista.forEach((socio) => {
    const tr = document.createElement("tr");

    const badgeClasse = socio.situacao === "pago" ? "status-pago" : "status-pendente";
    const badgeTexto = socio.situacao === "pago" ? "✓ Pago" : "✕ Pendente";

    tr.innerHTML = `
        <td class="nome-socio">${socio.nome}</td>
        <td>${socio.telefone}</td>
        <td><span class="status-badge ${badgeClasse}">${badgeTexto}</span></td>
        <td><button class="btn-detalhes">Ver detalhes</button></td>
    `;

    tabelaSocios.appendChild(tr);
    });

    totalSociosEl.textContent = `Total de Sócios: ${socios.length}`;
}

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
    if (e.target === modalOverlay) {
    fecharModal();
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay.classList.contains("active")) {
    fecharModal();
    }
});

formNovoSocio.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    if (!nome) return;

    socios.push({
    nome: nome,
    telefone: "(00) 00000-0000",
    situacao: "pendente"
    });

    filtrarSocios();
    fecharModal();
});

renderTabela(socios);