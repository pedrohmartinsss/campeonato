const grupos = {
    A: ["Fabricio Geraldo dos Santos/Charles Godoi", "Alef Jonas Fortunato Costa/Bruno Soares Bifano",
        "Pedro Henrique Martins Rodrigues Diniz/ Gabriel Fernando Oliveira Sá"],
    B: ["Nílton Gonçalves de Souza/Weberson Correia", "Erick Bruno Mota Lannes/Marcos Douglas da Silva Ferreira",
        "Lucas Alves de Moura/Nain Ávila de Pinho", "Welinton José do Nascimento/Gilberto Fortunato"],
    C: ["Paulo Otávio Assis Andrade/Romero de Souza Fortunato", "Renato Lima Coura Junior/Fernando Martins Hermógenes",
        "Jedielson de Souza Gomes/Marcos Antonio do Carmos Dias"]
};

let estatisticas = {};
let jogosRegistrados = [];

// 🔹 Carregar jogos do localStorage ao iniciar
function carregarJogos() {
    const dados = localStorage.getItem("jogosRegistrados");
    if (dados) {
        jogosRegistrados = JSON.parse(dados);
    }
}

// 🔹 Salvar jogos no localStorage sempre que mudar
function salvarJogos() {
    localStorage.setItem("jogosRegistrados", JSON.stringify(jogosRegistrados));
}

function inicializar() {
    carregarJogos(); // 🔹 carrega jogos antes de calcular

    // Inicializa estatísticas
    for (const grupo in grupos) {
        grupos[grupo].forEach(equipe => {
            estatisticas[equipe] = {
                pontos: 0,
                vitorias: 0,
                saldoSets: 0,
                saldoPontos: 0
            };
        });
    }

    recalcularEstatisticas();
    atualizarTabelas();
    atualizarListaJogos();

    // Só atualiza selects se estiver na página de registro
    if (document.getElementById("formJogo")) {
        atualizarSelects();
    }
}

function atualizarSelects() {
    const grupoSel = document.getElementById("grupo");
    const eq1 = document.getElementById("equipe1");
    const eq2 = document.getElementById("equipe2");

    function preencher(grupo) {
        eq1.innerHTML = "";
        eq2.innerHTML = "";
        grupos[grupo].forEach(equipe => {
            eq1.innerHTML += `<option value="${equipe}">${equipe}</option>`;
            eq2.innerHTML += `<option value="${equipe}">${equipe}</option>`;
        });
    }

    preencher(grupoSel.value);
    grupoSel.addEventListener("change", () => preencher(grupoSel.value));
}

function registrarJogo(event) {
    event.preventDefault();
    const grupo = document.getElementById("grupo").value;
    const equipe1 = document.getElementById("equipe1").value;
    const equipe2 = document.getElementById("equipe2").value;

    if (equipe1 === equipe2) {
        alert("Selecione equipes diferentes!");
        return;
    }

    // Pontos de cada set
    const sets = [
        [parseInt(document.getElementById("s1e1").value) || 0, parseInt(document.getElementById("s1e2").value) || 0],
        [parseInt(document.getElementById("s2e1").value) || 0, parseInt(document.getElementById("s2e2").value) || 0],
        [parseInt(document.getElementById("s3e1").value) || 0, parseInt(document.getElementById("s3e2").value) || 0]
    ];

    let setsG1 = 0, setsG2 = 0;
    let pontosTotais1 = 0, pontosTotais2 = 0;

    sets.forEach(([p1, p2]) => {
        pontosTotais1 += p1;
        pontosTotais2 += p2;
        if (p1 > p2) setsG1++;
        else if (p2 > p1) setsG2++;
    });

    let vencedor = null;
    if (setsG1 > setsG2) vencedor = equipe1;
    else if (setsG2 > setsG1) vencedor = equipe2;

    // Remove jogo anterior entre essas equipes
    jogosRegistrados = jogosRegistrados.filter(
        j => !(j.e1 === equipe1 && j.e2 === equipe2 && j.grupo === grupo)
    );

    // Adiciona o jogo
    jogosRegistrados.push({
        grupo, e1: equipe1, e2: equipe2,
        sets, setsG1, setsG2,
        pontosTotais1, pontosTotais2,
        vencedor
    });

    salvarJogos(); // 🔹 salva no localStorage
    recalcularEstatisticas();
    atualizarTabelas();
    atualizarListaJogos();
    event.target.reset();
}

function excluirJogo(index) {
    jogosRegistrados.splice(index, 1);
    salvarJogos(); // 🔹 salva no localStorage
    recalcularEstatisticas();
    atualizarTabelas();
    atualizarListaJogos();
}

function recalcularEstatisticas() {
    // Resetar todas estatísticas
    for (const equipe in estatisticas) {
        estatisticas[equipe] = { pontos: 0, vitorias: 0, saldoSets: 0, saldoPontos: 0 };
    }

    // Reaplicar todos os jogos
    jogosRegistrados.forEach(j => {
        estatisticas[j.e1].saldoSets += j.setsG1 - j.setsG2;
        estatisticas[j.e2].saldoSets += j.setsG2 - j.setsG1;

        estatisticas[j.e1].saldoPontos += j.pontosTotais1 - j.pontosTotais2;
        estatisticas[j.e2].saldoPontos += j.pontosTotais2 - j.pontosTotais1;

        if (j.vencedor === j.e1) {
            estatisticas[j.e1].pontos += 3;
            estatisticas[j.e1].vitorias++;
        } else if (j.vencedor === j.e2) {
            estatisticas[j.e2].pontos += 3;
            estatisticas[j.e2].vitorias++;
        }
    });
}

function atualizarTabelas() {
    for (const grupo in grupos) {
        const tabela = document.querySelector(`#tabela${grupo} tbody`);
        if (!tabela) continue; // só existe em classificacao.html
        tabela.innerHTML = "";

        const ordenado = [...grupos[grupo]].sort((a, b) => {
            const ea = estatisticas[a];
            const eb = estatisticas[b];
            if (eb.pontos !== ea.pontos) return eb.pontos - ea.pontos;
            if (eb.vitorias !== ea.vitorias) return eb.vitorias - ea.vitorias;
            if (eb.saldoSets !== ea.saldoSets) return eb.saldoSets - ea.saldoSets;
            if (eb.saldoPontos !== ea.saldoPontos) return eb.saldoPontos - ea.saldoPontos;
        });

        ordenado.forEach(equipe => {
            const e = estatisticas[equipe];
            tabela.innerHTML += `
        <tr>
          <td>${equipe}</td>
          <td>${e.pontos}</td>
          <td>${e.vitorias}</td>
          <td>${e.saldoSets}</td>
          <td>${e.saldoPontos}</td>
        </tr>`;
        });
    }
}

function atualizarListaJogos() {
    const lista = document.getElementById("listaJogos");
    if (!lista) return; // só existe em classificacao.html
    lista.innerHTML = "";
    const isRegistro = document.getElementById("formJogo") !== null;
    jogosRegistrados.forEach((j, index) => {
        const setsStr = j.sets.map(([p1, p2], i) => (p1 || p2) ? `Set${i + 1}: ${p1}x${p2}` : "").join(" ");
        const li = document.createElement("li");
        li.innerHTML = `[Grupo ${j.grupo}] ${j.e1} x ${j.e2} | ${setsStr}` +
            (isRegistro ? ` <button onclick="excluirJogo(${index})" style="margin-left:10px; color:white; background:red; border:none; padding:3px 6px; cursor:pointer;">⨉</button>` : "");
        lista.appendChild(li);
    });
}

// 🔹 Adiciona listener só na página de registro
const form = document.getElementById("formJogo");
if (form) {
    form.addEventListener("submit", registrarJogo);
    atualizarSelects();
}

inicializar();
