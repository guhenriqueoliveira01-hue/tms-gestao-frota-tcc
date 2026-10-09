// ======================================================
// CONFIGURAÇÕES GERAIS
// ======================================================

const API_URL = 'http://localhost:3000';


// ======================================================
// AUTENTICAÇÃO
// ======================================================

// Recupera o token salvo após o login.
const token = localStorage.getItem('token');


// Se não existir token, o usuário não pode acessar
// a área administrativa.
if (!token) {

    alert('Acesso negado! Por favor, faça login.');

    window.location.href = 'index.html';
}


// ======================================================
// LOGOUT
// ======================================================

const btnSair = document.getElementById('btnSair');


btnSair.addEventListener('click', (evento) => {

    evento.preventDefault();

    localStorage.removeItem('token');

    window.location.href = 'index.html';
});


// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

function formatarMoeda(valor) {

    return Number(valor || 0).toLocaleString(
        'pt-BR',
        {
            style: 'currency',
            currency: 'BRL'
        }
    );
}


function mostrarErro(mensagem) {

    const elementoErro =
        document.getElementById('dashboard-erro');


    if (!elementoErro) {
        return;
    }


    elementoErro.textContent = mensagem;
    elementoErro.hidden = false;
}


function esconderErro() {

    const elementoErro =
        document.getElementById('dashboard-erro');


    if (!elementoErro) {
        return;
    }


    elementoErro.hidden = true;
    elementoErro.textContent = '';
}


// ======================================================
// TRATAMENTO DE SESSÃO EXPIRADA / TOKEN INVÁLIDO
// ======================================================

function tratarErroAutenticacao(resposta) {

    if (
        resposta.status === 401 ||
        resposta.status === 403
    ) {

        localStorage.removeItem('token');

        alert(
            'Sua sessão expirou ou você não possui permissão. Faça login novamente.'
        );

        window.location.href = 'index.html';

        return true;
    }


    return false;
}


// ======================================================
// DASHBOARD
// ======================================================

async function carregarResumoDashboard() {

    try {

        esconderErro();


        const resposta = await fetch(
            `${API_URL}/dashboard/resumo`,
            {
                method: 'GET',

                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );


        if (tratarErroAutenticacao(resposta)) {
            return;
        }


        const dados = await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                dados.erro ||
                'Não foi possível carregar o dashboard.'
            );
        }


        const dashboard = dados.dashboard;


        // ==================================================
        // CARDS PRINCIPAIS
        // ==================================================

        document.getElementById(
            'total-pedidos'
        ).textContent =
            dashboard.pedidos.total;


        document.getElementById(
            'total-viagens'
        ).textContent =
            dashboard.viagens.total;


        document.getElementById(
            'total-despesas'
        ).textContent =
            formatarMoeda(
                dashboard.despesas.total
            );


        // ==================================================
        // FROTA
        // ==================================================

        document.getElementById(
            'caminhoes-disponiveis'
        ).textContent =
            dashboard.frota.caminhoes.disponiveis;


        document.getElementById(
            'total-caminhoes'
        ).textContent =
            `${dashboard.frota.caminhoes.total} caminhão(ões) cadastrado(s)`;


        document.getElementById(
            'motoristas-disponiveis'
        ).textContent =
            dashboard.frota.motoristas.disponiveis;


        document.getElementById(
            'total-motoristas'
        ).textContent =
            `${dashboard.frota.motoristas.total} motorista(s) cadastrado(s)`;


        // ==================================================
        // PEDIDOS POR STATUS
        // ==================================================

        document.getElementById(
            'pedidos-entregues'
        ).textContent =
            dashboard.pedidos.por_status.ENTREGUE ?? 0;


        document.getElementById(
            'pedidos-cancelados'
        ).textContent =
            dashboard.pedidos.por_status.CANCELADO ?? 0;


        // ==================================================
        // VIAGENS POR STATUS
        // ==================================================

        document.getElementById(
            'viagens-concluidas'
        ).textContent =
            dashboard.viagens.por_status.CONCLUIDA ?? 0;


        document.getElementById(
            'viagens-canceladas'
        ).textContent =
            dashboard.viagens.por_status.CANCELADA ?? 0;


        // ==================================================
        // DESPESAS POR TIPO
        // ==================================================

        document.getElementById(
            'despesas-combustivel'
        ).textContent =
            formatarMoeda(
                dashboard.despesas.por_tipo.COMBUSTIVEL ?? 0
            );


        document.getElementById(
            'despesas-pedagio'
        ).textContent =
            formatarMoeda(
                dashboard.despesas.por_tipo.PEDAGIO ?? 0
            );


        document.getElementById(
            'despesas-manutencao'
        ).textContent =
            formatarMoeda(
                dashboard.despesas.por_tipo.MANUTENCAO ?? 0
            );


        document.getElementById(
            'despesas-outros'
        ).textContent =
            formatarMoeda(
                dashboard.despesas.por_tipo.OUTROS ?? 0
            );


    } catch (erro) {

        console.error(
            'Erro ao carregar dashboard:',
            erro
        );


        mostrarErro(
            'Não foi possível carregar os dados do dashboard.'
        );
    }
}


// ======================================================
// CAMINHÕES
// ======================================================

// ======================================================
// CAMINHÕES
// ======================================================

async function carregarCaminhoes() {

    const corpoTabela =
        document.getElementById(
            'corpo-tabela-caminhoes'
        );


    try {

        const resposta = await fetch(
            `${API_URL}/caminhoes`,
            {
                method: 'GET',

                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );


        if (tratarErroAutenticacao(resposta)) {
            return;
        }


        const dados = await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                dados.erro ||
                'Não foi possível carregar os caminhões.'
            );
        }


        /*
         * Suporta tanto uma resposta direta em array:
         *
         * [...]
         *
         * quanto:
         *
         * {
         *     caminhoes: [...]
         * }
         */
        const caminhoes =
            Array.isArray(dados)
                ? dados
                : dados.caminhoes ?? [];


        // Remove as linhas existentes sem utilizar innerHTML.
        corpoTabela.replaceChildren();


        if (caminhoes.length === 0) {

            const linha =
                document.createElement('tr');

            const celula =
                document.createElement('td');


            celula.colSpan = 5;

            celula.textContent =
                'Nenhum caminhão cadastrado.';


            linha.appendChild(celula);

            corpoTabela.appendChild(linha);

            return;
        }


        caminhoes.forEach((caminhao) => {

            const linha =
                document.createElement('tr');


            const valores = [
                caminhao.id ?? '-',
                caminhao.placa ?? '-',
                caminhao.modelo ?? '-',
                `${caminhao.capacidade_kg ?? 0} kg`,
                caminhao.status ?? '-'
            ];


            valores.forEach((valor) => {

                const celula =
                    document.createElement('td');

                /*
                 * textContent trata o conteúdo como texto,
                 * impedindo que HTML vindo da API seja
                 * interpretado pelo navegador.
                 */
                celula.textContent =
                    String(valor);

                linha.appendChild(celula);
            });


            corpoTabela.appendChild(linha);
        });


    } catch (erro) {

        console.error(
            'Erro ao buscar caminhões:',
            erro
        );


        corpoTabela.replaceChildren();


        const linha =
            document.createElement('tr');

        const celula =
            document.createElement('td');


        celula.colSpan = 5;

        celula.textContent =
            'Não foi possível carregar os caminhões.';


        linha.appendChild(celula);

        corpoTabela.appendChild(linha);
    }
}


// ======================================================
// INICIALIZAÇÃO DA DASHBOARD
// ======================================================

async function iniciarDashboard() {

    await Promise.all([
        carregarResumoDashboard(),
        carregarCaminhoes()
    ]);
}


document.addEventListener(
    'DOMContentLoaded',
    iniciarDashboard
);