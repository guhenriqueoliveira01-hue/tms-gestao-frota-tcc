const API_URL = 'http://localhost:3000';

const token = localStorage.getItem('token');


// ======================================================
// PROTEÇÃO DA PÁGINA
// ======================================================

if (!token) {
    alert('Acesso negado! Faça login novamente.');
    window.location.href = 'login.html';
}


// ======================================================
// ESTADO DA PÁGINA
// ======================================================

let caminhoesCarregados = [];

let modoEdicao = false;

let placaEmEdicao = null;


// ======================================================
// ELEMENTOS DA PÁGINA
// ======================================================

const corpoTabelaCaminhoes =
    document.getElementById('corpoTabelaCaminhoes');

const totalCaminhoes =
    document.getElementById('totalCaminhoes');

const caminhoesDisponiveis =
    document.getElementById('caminhoesDisponiveis');

const caminhoesManutencao =
    document.getElementById('caminhoesManutencao');

const caminhoesInativos =
    document.getElementById('caminhoesInativos');

const btnSair =
    document.getElementById('btnSair');

const mensagemCaminhoes =
    document.getElementById('mensagemCaminhoes');


// ======================================================
// MODAL
// ======================================================

const modalCaminhao =
    document.getElementById('modalCaminhao');

const btnNovoCaminhao =
    document.getElementById('btnNovoCaminhao');

const btnFecharModal =
    document.getElementById('btnFecharModal');

const btnCancelarFormulario =
    document.getElementById('btnCancelarFormulario');

const formCaminhao =
    document.getElementById('formCaminhao');

const btnSalvarCaminhao =
    document.getElementById('btnSalvarCaminhao');

const tituloModalCaminhao =
    document.getElementById('tituloModalCaminhao');


// ======================================================
// CAMPOS DO FORMULÁRIO
// ======================================================

const campoPlaca =
    document.getElementById('placa');

const campoModelo =
    document.getElementById('modelo');

const campoCapacidade =
    document.getElementById('capacidade_kg');

const campoStatus =
    document.getElementById('status');


// ======================================================
// LOGOUT
// ======================================================

btnSair.addEventListener('click', (evento) => {

    evento.preventDefault();

    localStorage.removeItem('token');

    window.location.href = 'login.html';
});


// ======================================================
// AUTENTICAÇÃO
// ======================================================

function tratarAutenticacao(resposta) {

    if (
        resposta.status === 401 ||
        resposta.status === 403
    ) {

        localStorage.removeItem('token');

        alert(
            'Sua sessão expirou ou você não possui permissão.'
        );

        window.location.href = 'login.html';

        return true;
    }

    return false;
}


// ======================================================
// MENSAGENS
// ======================================================

function mostrarMensagem(
    texto,
    tipo = 'sucesso'
) {

    mensagemCaminhoes.hidden = false;

    mensagemCaminhoes.textContent = texto;


    if (tipo === 'erro') {

        mensagemCaminhoes.style.background =
            'rgba(239, 68, 68, 0.08)';

        mensagemCaminhoes.style.borderColor =
            'rgba(239, 68, 68, 0.20)';

        mensagemCaminhoes.style.color =
            '#fecaca';

    } else {

        mensagemCaminhoes.style.background =
            'rgba(34, 197, 94, 0.08)';

        mensagemCaminhoes.style.borderColor =
            'rgba(34, 197, 94, 0.20)';

        mensagemCaminhoes.style.color =
            '#bbf7d0';
    }


    setTimeout(() => {

        mensagemCaminhoes.hidden = true;

    }, 4000);
}


// ======================================================
// FORMATAÇÃO
// ======================================================

function formatarCapacidade(valor) {

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return '-';
    }

    return `${numero.toLocaleString('pt-BR')} kg`;
}


function formatarStatus(status) {

    switch (status) {

        case 'DISPONIVEL':
            return 'Disponível';

        case 'EM_MANUTENCAO':
            return 'Em manutenção';

        case 'INATIVO':
            return 'Inativo';

        default:
            return status || '-';
    }
}


function escaparHtml(valor) {

    return String(valor ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}


// ======================================================
// ABRIR MODAL PARA CADASTRO
// ======================================================

function abrirModalCadastro() {

    modoEdicao = false;

    placaEmEdicao = null;

    formCaminhao.reset();

    campoPlaca.disabled = false;

    campoStatus.value = 'DISPONIVEL';

    tituloModalCaminhao.textContent =
        'Novo caminhão';

    btnSalvarCaminhao.textContent =
        'Salvar caminhão';

    modalCaminhao.hidden = false;

    campoPlaca.focus();
}


// ======================================================
// ABRIR MODAL PARA EDIÇÃO
// ======================================================

function abrirModalEdicao(placa) {

    const caminhao =
        caminhoesCarregados.find(
            (item) =>
                item.placa === placa
        );


    if (!caminhao) {

        mostrarMensagem(
            'Caminhão não encontrado.',
            'erro'
        );

        return;
    }


    modoEdicao = true;

    placaEmEdicao = caminhao.placa;


    campoPlaca.value =
        caminhao.placa;

    campoModelo.value =
        caminhao.modelo;

    campoCapacidade.value =
        Number(caminhao.capacidade_kg);

    campoStatus.value =
        caminhao.status;


    /*
     * A placa identifica o caminhão na rota:
     *
     * PUT /caminhoes/:placa
     *
     * Por isso não permitimos alterar a placa
     * durante a edição.
     */
    campoPlaca.disabled = true;


    tituloModalCaminhao.textContent =
        'Editar caminhão';

    btnSalvarCaminhao.textContent =
        'Salvar alterações';


    modalCaminhao.hidden = false;

    campoModelo.focus();
}


// ======================================================
// FECHAR MODAL
// ======================================================

function fecharModal() {

    modalCaminhao.hidden = true;

    formCaminhao.reset();

    campoPlaca.disabled = false;

    modoEdicao = false;

    placaEmEdicao = null;

    tituloModalCaminhao.textContent =
        'Novo caminhão';

    btnSalvarCaminhao.textContent =
        'Salvar caminhão';
}


// ======================================================
// EVENTOS DO MODAL
// ======================================================

btnNovoCaminhao.addEventListener(
    'click',
    abrirModalCadastro
);


btnFecharModal.addEventListener(
    'click',
    fecharModal
);


btnCancelarFormulario.addEventListener(
    'click',
    fecharModal
);


modalCaminhao.addEventListener(
    'click',
    (evento) => {

        if (
            evento.target === modalCaminhao
        ) {

            fecharModal();
        }
    }
);


document.addEventListener(
    'keydown',
    (evento) => {

        if (
            evento.key === 'Escape' &&
            !modalCaminhao.hidden
        ) {

            fecharModal();
        }
    }
);


// ======================================================
// CLIQUE NO BOTÃO EDITAR
// ======================================================

corpoTabelaCaminhoes.addEventListener(
    'click',
    (evento) => {

        const botaoEditar =
            evento.target.closest(
                '.btn-editar-caminhao'
            );


        if (!botaoEditar) {
            return;
        }


        const placa =
            botaoEditar.dataset.placa;


        abrirModalEdicao(placa);
    }
);


// ======================================================
// SALVAR CADASTRO OU EDIÇÃO
// ======================================================

formCaminhao.addEventListener(
    'submit',
    async (evento) => {

        evento.preventDefault();


        const placa =
            campoPlaca.value
                .trim()
                .toUpperCase();

        const modelo =
            campoModelo.value.trim();

        const capacidade_kg =
            Number(campoCapacidade.value);

        const status =
            campoStatus.value;


        if (
            !placa ||
            !modelo ||
            !Number.isFinite(capacidade_kg) ||
            capacidade_kg <= 0 ||
            !status
        ) {

            mostrarMensagem(
                'Preencha corretamente todos os campos.',
                'erro'
            );

            return;
        }


        try {

            btnSalvarCaminhao.disabled = true;

            btnSalvarCaminhao.textContent =
                modoEdicao
                    ? 'Salvando...'
                    : 'Cadastrando...';


            /*
             * Se estiver editando:
             *
             * PUT /caminhoes/:placa
             *
             * Caso contrário:
             *
             * POST /caminhoes
             */

            const url =
                modoEdicao
                    ? `${API_URL}/caminhoes/${encodeURIComponent(placaEmEdicao)}`
                    : `${API_URL}/caminhoes`;


            const metodo =
                modoEdicao
                    ? 'PUT'
                    : 'POST';


            const corpo =
                modoEdicao
                    ? {
                        modelo,
                        capacidade_kg,
                        status
                    }
                    : {
                        placa,
                        modelo,
                        capacidade_kg,
                        status
                    };


            const resposta = await fetch(
                url,
                {
                    method: metodo,

                    headers: {

                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify(corpo)
                }
            );


            if (tratarAutenticacao(resposta)) {
                return;
            }


            const dados =
                await resposta.json();


            if (!resposta.ok) {

                throw new Error(
                    dados.erro ||
                    (
                        modoEdicao
                            ? 'Não foi possível atualizar o caminhão.'
                            : 'Não foi possível cadastrar o caminhão.'
                    )
                );
            }


            const estavaEditando =
                modoEdicao;


            fecharModal();


            mostrarMensagem(
                dados.mensagem ||
                (
                    estavaEditando
                        ? 'Caminhão atualizado com sucesso!'
                        : 'Caminhão cadastrado com sucesso!'
                )
            );


            await carregarCaminhoes();


        } catch (erro) {

            console.error(
                'Erro ao salvar caminhão:',
                erro
            );


            mostrarMensagem(
                erro.message ||
                'Erro ao salvar caminhão.',
                'erro'
            );


        } finally {

            btnSalvarCaminhao.disabled = false;

            btnSalvarCaminhao.textContent =
                modoEdicao
                    ? 'Salvar alterações'
                    : 'Salvar caminhão';
        }
    }
);


// ======================================================
// CARREGAR CAMINHÕES
// ======================================================

async function carregarCaminhoes() {

    try {

        const resposta = await fetch(
            `${API_URL}/caminhoes`,
            {
                method: 'GET',

                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );


        if (tratarAutenticacao(resposta)) {
            return;
        }


        const dados =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                dados.erro ||
                'Não foi possível carregar os caminhões.'
            );
        }


        caminhoesCarregados =
            Array.isArray(dados)
                ? dados
                : [];


        atualizarResumo(
            caminhoesCarregados
        );


        preencherTabela(
            caminhoesCarregados
        );


    } catch (erro) {

        console.error(
            'Erro ao carregar caminhões:',
            erro
        );


        corpoTabelaCaminhoes.innerHTML = `
            <tr>
                <td colspan="6">
                    Não foi possível carregar os caminhões.
                </td>
            </tr>
        `;


        mostrarMensagem(
            'Não foi possível carregar os caminhões.',
            'erro'
        );
    }
}


// ======================================================
// CARDS
// ======================================================

function atualizarResumo(caminhoes) {

    totalCaminhoes.textContent =
        caminhoes.length;


    caminhoesDisponiveis.textContent =
        caminhoes.filter(
            (caminhao) =>
                caminhao.status ===
                'DISPONIVEL'
        ).length;


    caminhoesManutencao.textContent =
        caminhoes.filter(
            (caminhao) =>
                caminhao.status ===
                'EM_MANUTENCAO'
        ).length;


    caminhoesInativos.textContent =
        caminhoes.filter(
            (caminhao) =>
                caminhao.status ===
                'INATIVO'
        ).length;
}


// ======================================================
// TABELA
// ======================================================

function preencherTabela(caminhoes) {

    corpoTabelaCaminhoes.innerHTML = '';


    if (caminhoes.length === 0) {

        corpoTabelaCaminhoes.innerHTML = `
            <tr>
                <td colspan="6">
                    Nenhum caminhão cadastrado.
                </td>
            </tr>
        `;

        return;
    }


    caminhoes.forEach((caminhao) => {

        const linha =
            document.createElement('tr');


        linha.innerHTML = `
            <td>
                ${escaparHtml(caminhao.id)}
            </td>

            <td>
                ${escaparHtml(caminhao.placa)}
            </td>

            <td>
                ${escaparHtml(caminhao.modelo)}
            </td>

            <td>
                ${formatarCapacidade(
                    caminhao.capacidade_kg
                )}
            </td>

            <td>
                ${escaparHtml(
                    formatarStatus(
                        caminhao.status
                    )
                )}
            </td>

            <td>

                <button
                    type="button"
                    class="btn-tabela btn-editar-caminhao"
                    data-placa="${escaparHtml(caminhao.placa)}"
                >
                    Editar
                </button>

            </td>
        `;


        corpoTabelaCaminhoes.appendChild(
            linha
        );
    });
}


// ======================================================
// INICIALIZAÇÃO
// ======================================================

document.addEventListener(
    'DOMContentLoaded',
    carregarCaminhoes
);