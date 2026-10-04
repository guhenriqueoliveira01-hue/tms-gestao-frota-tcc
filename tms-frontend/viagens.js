(() => {

    // ======================================================
    // CONFIGURAÇÕES
    // ======================================================

    const API_URL = 'http://localhost:3000';

    const tokenViagens =
        localStorage.getItem('token');


    // ======================================================
    // PROTEÇÃO DA PÁGINA
    // ======================================================

    if (!tokenViagens) {

        window.location.href =
            'login.html';

        return;
    }


    // ======================================================
    // ELEMENTOS DA PÁGINA
    // ======================================================

    const corpoTabelaViagens =
        document.getElementById(
            'corpoTabelaViagens'
        );

    const totalViagens =
        document.getElementById(
            'totalViagens'
        );

    const totalPlanejadas =
        document.getElementById(
            'totalPlanejadas'
        );

    const totalEmAndamento =
        document.getElementById(
            'totalEmAndamento'
        );

    const totalConcluidas =
        document.getElementById(
            'totalConcluidas'
        );

    const totalCanceladas =
        document.getElementById(
            'totalCanceladas'
        );

    const mensagemViagens =
        document.getElementById(
            'mensagemViagens'
        );


    // ======================================================
    // MODAL NOVA VIAGEM
    // ======================================================

    const btnNovaViagem =
        document.getElementById(
            'btnNovaViagem'
        );

    const modalNovaViagem =
        document.getElementById(
            'modalNovaViagem'
        );

    const btnFecharNovaViagem =
        document.getElementById(
            'btnFecharNovaViagem'
        );

    const btnCancelarNovaViagem =
        document.getElementById(
            'btnCancelarNovaViagem'
        );

    const formNovaViagem =
        document.getElementById(
            'formNovaViagem'
        );


    // ======================================================
    // CAMPOS DO FORMULÁRIO
    // ======================================================

    const pedidoId =
        document.getElementById(
            'pedidoId'
        );

    const motoristaCnh =
        document.getElementById(
            'motoristaCnh'
        );

    const caminhaoId =
        document.getElementById(
            'caminhaoId'
        );

    const saidaPrevista =
        document.getElementById(
            'saidaPrevista'
        );


    // ======================================================
    // SEGURANÇA DE TEXTO
    // ======================================================

    function escaparHtml(valor) {

        return String(valor ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }


    // ======================================================
    // FORMATAR STATUS
    // ======================================================

    function formatarStatus(status) {

        const nomes = {

            PLANEJADA:
                'Planejada',

            EM_ANDAMENTO:
                'Em andamento',

            CONCLUIDA:
                'Concluída',

            CANCELADA:
                'Cancelada'
        };


        return nomes[status] || status;
    }


    // ======================================================
    // MENSAGENS
    // ======================================================

    function mostrarMensagemViagens(
        mensagem,
        tipo = 'sucesso'
    ) {

        mensagemViagens.textContent =
            mensagem;

        mensagemViagens.className =
            `mensagem-sistema ${tipo}`;

        mensagemViagens.hidden =
            false;


        setTimeout(() => {

            mensagemViagens.hidden =
                true;

        }, 4500);
    }


    // ======================================================
    // ATUALIZAR CARDS
    // ======================================================

    function atualizarCards(viagens) {

        totalViagens.textContent =
            viagens.length;


        totalPlanejadas.textContent =
            viagens.filter(
                viagem =>
                    viagem.status ===
                    'PLANEJADA'
            ).length;


        totalEmAndamento.textContent =
            viagens.filter(
                viagem =>
                    viagem.status ===
                    'EM_ANDAMENTO'
            ).length;


        totalConcluidas.textContent =
            viagens.filter(
                viagem =>
                    viagem.status ===
                    'CONCLUIDA'
            ).length;


        totalCanceladas.textContent =
            viagens.filter(
                viagem =>
                    viagem.status ===
                    'CANCELADA'
            ).length;
    }


    // ======================================================
    // MONTAR AÇÕES
    // ======================================================

    function montarAcoesViagem(viagem) {

        if (
            viagem.status ===
            'PLANEJADA'
        ) {

            return `
                <div
                    style="
                        display: flex;
                        gap: 8px;
                        flex-wrap: wrap;
                    "
                >

                    <button
                        type="button"
                        class="btn-secundario btn-status-viagem"
                        data-id="${viagem.id}"
                        data-status="EM_ANDAMENTO"
                    >
                        Iniciar
                    </button>


                    <button
                        type="button"
                        class="btn-secundario btn-status-viagem"
                        data-id="${viagem.id}"
                        data-status="CANCELADA"
                    >
                        Cancelar
                    </button>

                </div>
            `;
        }


        if (
            viagem.status ===
            'EM_ANDAMENTO'
        ) {

            return `
                <button
                    type="button"
                    class="btn-secundario btn-status-viagem"
                    data-id="${viagem.id}"
                    data-status="CONCLUIDA"
                >
                    Concluir
                </button>
            `;
        }


        return '—';
    }


    // ======================================================
    // PREENCHER TABELA
    // ======================================================

    function preencherTabela(viagens) {

        corpoTabelaViagens.innerHTML =
            '';


        if (viagens.length === 0) {

            corpoTabelaViagens.innerHTML = `
                <tr>

                    <td colspan="6">
                        Nenhuma viagem cadastrada.
                    </td>

                </tr>
            `;

            return;
        }


        viagens.forEach((viagem) => {

            const linha =
                document.createElement('tr');


            const motorista =
                viagem.motorista_nome
                    ? `${viagem.motorista_nome} (${viagem.motorista_cnh})`
                    : viagem.motorista_cnh;


            const caminhao =
                viagem.caminhao_placa
                    ? `${viagem.caminhao_placa} - ${viagem.caminhao_modelo || ''}`
                    : `Caminhão #${viagem.caminhao_id}`;


            linha.innerHTML = `

                <td>
                    ${viagem.id}
                </td>

                <td>
                    #${viagem.pedido_id}
                </td>

                <td>
                    ${escaparHtml(
                        motorista
                    )}
                </td>

                <td>
                    ${escaparHtml(
                        caminhao
                    )}
                </td>

                <td>
                    ${escaparHtml(
                        formatarStatus(
                            viagem.status
                        )
                    )}
                </td>

                <td>
                    ${montarAcoesViagem(
                        viagem
                    )}
                </td>
            `;


            corpoTabelaViagens.appendChild(
                linha
            );
        });
    }


    // ======================================================
    // CARREGAR VIAGENS
    // ======================================================

    async function carregarViagens() {

        try {

            const resposta =
                await fetch(
                    `${API_URL}/viagens`,
                    {
                        method: 'GET',

                        headers: {

                            Authorization:
                                `Bearer ${tokenViagens}`
                        }
                    }
                );


            if (
                resposta.status === 401 ||
                resposta.status === 403
            ) {

                localStorage.removeItem(
                    'token'
                );

                window.location.href =
                    'login.html';

                return;
            }


            const dados =
                await resposta.json();


            if (!resposta.ok) {

                throw new Error(
                    dados.erro ||
                    'Erro ao carregar viagens.'
                );
            }


            const viagens =
                Array.isArray(dados)
                    ? dados
                    : Array.isArray(
                        dados.viagens
                    )
                        ? dados.viagens
                        : [];


            atualizarCards(
                viagens
            );


            preencherTabela(
                viagens
            );


        } catch (erro) {

            console.error(
                'Erro ao carregar viagens:',
                erro
            );


            corpoTabelaViagens.innerHTML = `
                <tr>

                    <td colspan="6">

                        Não foi possível carregar
                        as viagens.

                    </td>

                </tr>
            `;
        }
    }


    // ======================================================
    // ALTERAR STATUS DA VIAGEM
    // ======================================================

    async function alterarStatusViagem(
        id,
        novoStatus,
        botao
    ) {

        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {

            mostrarMensagemViagens(
                'ID da viagem inválido.',
                'erro'
            );

            return;
        }


        // ==================================================
        // CONFIRMAÇÕES
        // ==================================================

        if (
            novoStatus ===
            'CANCELADA'
        ) {

            const confirmou =
                window.confirm(
                    'Tem certeza que deseja cancelar esta viagem?'
                );


            if (!confirmou) {
                return;
            }
        }


        if (
            novoStatus ===
            'CONCLUIDA'
        ) {

            const confirmou =
                window.confirm(
                    'Deseja concluir esta viagem e marcar o pedido como entregue?'
                );


            if (!confirmou) {
                return;
            }
        }


        const textoOriginal =
            botao.textContent;


        try {

            botao.disabled =
                true;

            botao.textContent =
                'Aguarde...';


            const resposta =
                await fetch(
                    `${API_URL}/viagens/${id}/status`,
                    {
                        method: 'PATCH',

                        headers: {

                            Authorization:
                                `Bearer ${tokenViagens}`,

                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify({
                                status:
                                    novoStatus
                            })
                    }
                );


            if (
                resposta.status === 401 ||
                resposta.status === 403
            ) {

                localStorage.removeItem(
                    'token'
                );

                window.location.href =
                    'login.html';

                return;
            }


            const dados =
                await resposta.json();


            if (!resposta.ok) {

                throw new Error(
                    dados.erro ||
                    'Não foi possível atualizar a viagem.'
                );
            }


            mostrarMensagemViagens(
                dados.mensagem ||
                'Status da viagem atualizado com sucesso!',
                'sucesso'
            );


            await carregarViagens();


        } catch (erro) {

            console.error(
                'Erro ao atualizar viagem:',
                erro
            );


            mostrarMensagemViagens(
                erro.message ||
                'Não foi possível atualizar a viagem.',
                'erro'
            );


        } finally {

            botao.disabled =
                false;

            botao.textContent =
                textoOriginal;
        }
    }


    // ======================================================
    // ABRIR MODAL NOVA VIAGEM
    // ======================================================

    function abrirModalNovaViagem() {

        formNovaViagem.reset();

        modalNovaViagem.hidden =
            false;

        document.body.style.overflow =
            'hidden';


        setTimeout(() => {

            pedidoId.focus();

        }, 50);
    }


    // ======================================================
    // FECHAR MODAL
    // ======================================================

    function fecharModalNovaViagem() {

        modalNovaViagem.hidden =
            true;

        document.body.style.overflow =
            '';
    }


    // ======================================================
    // CRIAR NOVA VIAGEM
    // ======================================================

    async function criarNovaViagem(
        evento
    ) {

        evento.preventDefault();


        const pedido =
            Number(
                pedidoId.value
            );

        const cnh =
            motoristaCnh.value
                .trim();

        const caminhao =
            Number(
                caminhaoId.value
            );

        const saida =
            saidaPrevista.value
                .trim();


        // ==================================================
        // VALIDAÇÕES
        // ==================================================

        if (
            !Number.isInteger(pedido) ||
            pedido <= 0
        ) {

            mostrarMensagemViagens(
                'Informe um ID de pedido válido.',
                'erro'
            );

            return;
        }


        if (!cnh) {

            mostrarMensagemViagens(
                'Informe a CNH do motorista.',
                'erro'
            );

            return;
        }


        if (
            !Number.isInteger(caminhao) ||
            caminhao <= 0
        ) {

            mostrarMensagemViagens(
                'Informe um ID de caminhão válido.',
                'erro'
            );

            return;
        }


        // ==================================================
        // CORPO DA REQUISIÇÃO
        // ==================================================

        const corpo = {

            pedido_id:
                pedido,

            motorista_cnh:
                cnh,

            caminhao_id:
                caminhao,

            saida_prevista:
                saida || null
        };


        const botaoEnviar =
            formNovaViagem.querySelector(
                'button[type="submit"]'
            );

        const textoOriginal =
            botaoEnviar.textContent;


        try {

            botaoEnviar.disabled =
                true;

            botaoEnviar.textContent =
                'Criando...';


            const resposta =
                await fetch(
                    `${API_URL}/viagens`,
                    {
                        method: 'POST',

                        headers: {

                            Authorization:
                                `Bearer ${tokenViagens}`,

                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify(
                                corpo
                            )
                    }
                );


            if (
                resposta.status === 401 ||
                resposta.status === 403
            ) {

                localStorage.removeItem(
                    'token'
                );

                window.location.href =
                    'login.html';

                return;
            }


            const dados =
                await resposta.json();


            if (!resposta.ok) {

                throw new Error(
                    dados.erro ||
                    'Não foi possível criar a viagem.'
                );
            }


            fecharModalNovaViagem();


            mostrarMensagemViagens(
                dados.mensagem ||
                'Viagem criada com sucesso!',
                'sucesso'
            );


            await carregarViagens();


        } catch (erro) {

            console.error(
                'Erro ao criar viagem:',
                erro
            );


            mostrarMensagemViagens(
                erro.message ||
                'Não foi possível criar a viagem.',
                'erro'
            );


        } finally {

            botaoEnviar.disabled =
                false;

            botaoEnviar.textContent =
                textoOriginal;
        }
    }


    // ======================================================
    // CLIQUES NA TABELA
    // ======================================================

    corpoTabelaViagens.addEventListener(
        'click',
        (evento) => {

            const botao =
                evento.target.closest(
                    '.btn-status-viagem'
                );


            if (!botao) {
                return;
            }


            const id =
                Number(
                    botao.dataset.id
                );


            const novoStatus =
                botao.dataset.status;


            if (
                !Number.isInteger(id) ||
                id <= 0 ||
                !novoStatus
            ) {

                return;
            }


            alterarStatusViagem(
                id,
                novoStatus,
                botao
            );
        }
    );


    // ======================================================
    // EVENTOS DO MODAL
    // ======================================================

    btnNovaViagem.addEventListener(
        'click',
        abrirModalNovaViagem
    );


    btnFecharNovaViagem.addEventListener(
        'click',
        fecharModalNovaViagem
    );


    btnCancelarNovaViagem.addEventListener(
        'click',
        fecharModalNovaViagem
    );


    formNovaViagem.addEventListener(
        'submit',
        criarNovaViagem
    );


    // ======================================================
    // INICIALIZAÇÃO
    // ======================================================

    document.addEventListener(
        'DOMContentLoaded',
        () => {

            carregarViagens();

        }
    );

})();