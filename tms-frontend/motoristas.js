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
// ESTADO
// ======================================================

let motoristasCarregados = [];

let modoEdicao = false;

let cnhEmEdicao = null;


// ======================================================
// ELEMENTOS DA PÁGINA
// ======================================================

const corpoTabelaMotoristas =
    document.getElementById('corpoTabelaMotoristas');

const totalMotoristas =
    document.getElementById('totalMotoristas');

const motoristasDisponiveis =
    document.getElementById('motoristasDisponiveis');

const motoristasInativos =
    document.getElementById('motoristasInativos');

const mensagemMotoristas =
    document.getElementById('mensagemMotoristas');

const btnSair =
    document.getElementById('btnSair');


// ======================================================
// MODAL
// ======================================================

const modalMotorista =
    document.getElementById('modalMotorista');

const btnNovoMotorista =
    document.getElementById('btnNovoMotorista');

const btnFecharModalMotorista =
    document.getElementById('btnFecharModalMotorista');

const btnCancelarMotorista =
    document.getElementById('btnCancelarMotorista');

const formMotorista =
    document.getElementById('formMotorista');

const btnSalvarMotorista =
    document.getElementById('btnSalvarMotorista');

const tituloModalMotorista =
    document.getElementById('tituloModalMotorista');


// ======================================================
// CAMPOS
// ======================================================

const campoCnh =
    document.getElementById('cnh');

const campoNome =
    document.getElementById('nome');

const campoTelefone =
    document.getElementById('telefone');

const campoStatus =
    document.getElementById('statusMotorista');


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

    mensagemMotoristas.hidden = false;

    mensagemMotoristas.textContent = texto;


    if (tipo === 'erro') {

        mensagemMotoristas.style.background =
            'rgba(239, 68, 68, 0.08)';

        mensagemMotoristas.style.borderColor =
            'rgba(239, 68, 68, 0.20)';

        mensagemMotoristas.style.color =
            '#fecaca';

    } else {

        mensagemMotoristas.style.background =
            'rgba(34, 197, 94, 0.08)';

        mensagemMotoristas.style.borderColor =
            'rgba(34, 197, 94, 0.20)';

        mensagemMotoristas.style.color =
            '#bbf7d0';
    }


    setTimeout(() => {
        mensagemMotoristas.hidden = true;
    }, 4000);
}


// ======================================================
// FORMATAÇÃO
// ======================================================

function formatarStatus(status) {

    switch (status) {

        case 'DISPONIVEL':
            return 'Disponível';

        case 'INATIVO':
            return 'Inativo';

        default:
            return status || '-';
    }
}


function formatarTelefone(telefone) {

    const numeros =
        String(telefone ?? '')
            .replace(/\D/g, '');


    if (numeros.length === 11) {

        return numeros.replace(
            /(\d{2})(\d{5})(\d{4})/,
            '($1) $2-$3'
        );
    }


    if (numeros.length === 10) {

        return numeros.replace(
            /(\d{2})(\d{4})(\d{4})/,
            '($1) $2-$3'
        );
    }


    return telefone || '-';
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
// ABRIR MODAL DE CADASTRO
// ======================================================

function abrirModalCadastro() {

    modoEdicao = false;

    cnhEmEdicao = null;

    formMotorista.reset();

    campoCnh.disabled = false;

    campoStatus.value = 'DISPONIVEL';

    tituloModalMotorista.textContent =
        'Novo motorista';

    btnSalvarMotorista.textContent =
        'Salvar motorista';

    modalMotorista.hidden = false;

    campoCnh.focus();
}


// ======================================================
// ABRIR MODAL DE EDIÇÃO
// ======================================================

function abrirModalEdicao(cnh) {

    const motorista =
        motoristasCarregados.find(
            (item) =>
                String(item.cnh) === String(cnh)
        );


    if (!motorista) {

        mostrarMensagem(
            'Motorista não encontrado.',
            'erro'
        );

        return;
    }


    modoEdicao = true;

    cnhEmEdicao =
        motorista.cnh;


    campoCnh.value =
        motorista.cnh;

    campoNome.value =
        motorista.nome ?? '';

    campoTelefone.value =
        motorista.telefone ?? '';

    campoStatus.value =
        motorista.status;


    /*
     * A CNH identifica o motorista em:
     *
     * PUT /motoristas/:cnh
     *
     * Portanto ela fica bloqueada durante
     * a edição.
     */

    campoCnh.disabled = true;


    tituloModalMotorista.textContent =
        'Editar motorista';

    btnSalvarMotorista.textContent =
        'Salvar alterações';


    modalMotorista.hidden = false;

    campoNome.focus();
}


// ======================================================
// FECHAR MODAL
// ======================================================

function fecharModal() {

    modalMotorista.hidden = true;

    formMotorista.reset();

    campoCnh.disabled = false;

    modoEdicao = false;

    cnhEmEdicao = null;

    tituloModalMotorista.textContent =
        'Novo motorista';

    btnSalvarMotorista.textContent =
        'Salvar motorista';
}


// ======================================================
// EVENTOS DO MODAL
// ======================================================

btnNovoMotorista.addEventListener(
    'click',
    abrirModalCadastro
);


btnFecharModalMotorista.addEventListener(
    'click',
    fecharModal
);


btnCancelarMotorista.addEventListener(
    'click',
    fecharModal
);


document.addEventListener(
    'keydown',
    (evento) => {

        if (
            evento.key === 'Escape' &&
            !modalMotorista.hidden
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
            !modalMotorista.hidden
        ) {
            fecharModal();
        }
    }
);


// ======================================================
// CLIQUE EM EDITAR
// ======================================================

corpoTabelaMotoristas.addEventListener(
    'click',
    (evento) => {

        const botaoEditar =
            evento.target.closest(
                '.btn-editar-motorista'
            );


        if (!botaoEditar) {
            return;
        }


        abrirModalEdicao(
            botaoEditar.dataset.cnh
        );
    }
);


// ======================================================
// CLIQUE EM EXCLUIR
// ======================================================

corpoTabelaMotoristas.addEventListener(
    'click',
    async (evento) => {

        const botaoExcluir =
            evento.target.closest(
                '.btn-excluir-motorista'
            );


        if (!botaoExcluir) {
            return;
        }


        const cnh =
            botaoExcluir.dataset.cnh;


        const motorista =
            motoristasCarregados.find(
                (item) =>
                    String(item.cnh) === String(cnh)
            );


        const nome =
            motorista?.nome || cnh;


        const confirmar =
            window.confirm(
                `Tem certeza que deseja excluir o motorista ${nome}?`
            );


        if (!confirmar) {
            return;
        }


        const textoOriginal =
            botaoExcluir.textContent;


        try {

            botaoExcluir.disabled = true;

            botaoExcluir.textContent =
                'Excluindo...';


            const resposta = await fetch(
                `${API_URL}/motoristas/${encodeURIComponent(cnh)}`,
                {
                    method: 'DELETE',

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
                    'Não foi possível excluir o motorista.'
                );
            }


            mostrarMensagem(
                dados.mensagem ||
                'Motorista removido com sucesso!'
            );


            await carregarMotoristas();


        } catch (erro) {

            console.error(
                'Erro ao excluir motorista:',
                erro
            );


            mostrarMensagem(
                erro.message ||
                'Erro ao excluir motorista.',
                'erro'
            );


            botaoExcluir.disabled = false;

            botaoExcluir.textContent =
                textoOriginal;
        }
    }
);


// ======================================================
// CADASTRAR OU EDITAR
// ======================================================

formMotorista.addEventListener(
    'submit',
    async (evento) => {

        evento.preventDefault();


        const cnh =
            campoCnh.value.trim();

        const nome =
            campoNome.value.trim();

        const telefone =
            campoTelefone.value.trim();

        const status =
            campoStatus.value;


        if (
            !cnh ||
            !nome ||
            !status
        ) {

            mostrarMensagem(
                'Preencha corretamente os campos obrigatórios.',
                'erro'
            );

            return;
        }


        try {

            btnSalvarMotorista.disabled = true;

            btnSalvarMotorista.textContent =
                modoEdicao
                    ? 'Salvando...'
                    : 'Cadastrando...';


            const url =
                modoEdicao
                    ? `${API_URL}/motoristas/${encodeURIComponent(cnhEmEdicao)}`
                    : `${API_URL}/motoristas`;


            const metodo =
                modoEdicao
                    ? 'PUT'
                    : 'POST';


            const corpo =
                modoEdicao
                    ? {
                        nome,
                        telefone,
                        status
                    }
                    : {
                        cnh,
                        nome,
                        telefone,
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
                            ? 'Não foi possível atualizar o motorista.'
                            : 'Não foi possível cadastrar o motorista.'
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
                        ? 'Motorista atualizado com sucesso!'
                        : 'Motorista cadastrado com sucesso!'
                )
            );


            await carregarMotoristas();


        } catch (erro) {

            console.error(
                'Erro ao salvar motorista:',
                erro
            );


            mostrarMensagem(
                erro.message ||
                'Erro ao salvar motorista.',
                'erro'
            );


        } finally {

            btnSalvarMotorista.disabled = false;

            btnSalvarMotorista.textContent =
                modoEdicao
                    ? 'Salvar alterações'
                    : 'Salvar motorista';
        }
    }
);


// ======================================================
// CARREGAR MOTORISTAS
// ======================================================

async function carregarMotoristas() {

    try {

        const resposta = await fetch(
            `${API_URL}/motoristas`,
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
                'Não foi possível carregar os motoristas.'
            );
        }


        motoristasCarregados =
            Array.isArray(dados)
                ? dados
                : [];


        atualizarResumo(
            motoristasCarregados
        );


        preencherTabela(
            motoristasCarregados
        );


    } catch (erro) {

        console.error(
            'Erro ao carregar motoristas:',
            erro
        );


        corpoTabelaMotoristas.innerHTML = `
            <tr>
                <td colspan="5">
                    Não foi possível carregar os motoristas.
                </td>
            </tr>
        `;


        mostrarMensagem(
            'Não foi possível carregar os motoristas.',
            'erro'
        );
    }
}


// ======================================================
// CARDS
// ======================================================

function atualizarResumo(motoristas) {

    totalMotoristas.textContent =
        motoristas.length;


    motoristasDisponiveis.textContent =
        motoristas.filter(
            (motorista) =>
                motorista.status ===
                'DISPONIVEL'
        ).length;


    motoristasInativos.textContent =
        motoristas.filter(
            (motorista) =>
                motorista.status ===
                'INATIVO'
        ).length;
}


// ======================================================
// TABELA
// ======================================================

function preencherTabela(motoristas) {

    corpoTabelaMotoristas.innerHTML = '';


    if (motoristas.length === 0) {

        corpoTabelaMotoristas.innerHTML = `
            <tr>
                <td colspan="5">
                    Nenhum motorista cadastrado.
                </td>
            </tr>
        `;

        return;
    }


    motoristas.forEach((motorista) => {

        const linha =
            document.createElement('tr');


        linha.innerHTML = `
            <td>
                ${escaparHtml(motorista.cnh)}
            </td>

            <td>
                ${escaparHtml(motorista.nome)}
            </td>

            <td>
                ${escaparHtml(
                    formatarTelefone(
                        motorista.telefone
                    )
                )}
            </td>

            <td>
                ${escaparHtml(
                    formatarStatus(
                        motorista.status
                    )
                )}
            </td>

            <td class="acoes-tabela">

                <button
                    type="button"
                    class="btn-tabela btn-editar-motorista"
                    data-cnh="${escaparHtml(motorista.cnh)}"
                >
                    Editar
                </button>

                <button
                    type="button"
                    class="btn-tabela btn-excluir-caminhao btn-excluir-motorista"
                    data-cnh="${escaparHtml(motorista.cnh)}"
                >
                    Excluir
                </button>

            </td>
        `;


        corpoTabelaMotoristas.appendChild(
            linha
        );
    });
}


// ======================================================
// INICIALIZAÇÃO
// ======================================================

document.addEventListener(
    'DOMContentLoaded',
    carregarMotoristas
);