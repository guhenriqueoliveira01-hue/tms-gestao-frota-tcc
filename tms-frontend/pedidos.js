(() => {

    // ======================================================
    // CONFIGURAÇÕES
    // ======================================================

    const API_PEDIDOS_URL = 'http://localhost:3000';

    const tokenPedidos =
        localStorage.getItem('token');


    // ======================================================
    // PROTEÇÃO DA PÁGINA
    // ======================================================

    if (!tokenPedidos) {

        window.location.href = 'login.html';

        return;
    }


    // ======================================================
    // ELEMENTOS DA PÁGINA
    // ======================================================

    const corpoTabelaPedidos =
        document.getElementById(
            'corpoTabelaPedidos'
        );

    const totalPedidos =
        document.getElementById(
            'totalPedidos'
        );

    const totalPendentes =
        document.getElementById(
            'totalPendentes'
        );

    const totalSeparando =
        document.getElementById(
            'totalSeparando'
        );

    const totalProntos =
        document.getElementById(
            'totalProntos'
        );

    const totalEmTransporte =
        document.getElementById(
            'totalEmTransporte'
        );

    const totalEntregues =
        document.getElementById(
            'totalEntregues'
        );

    const totalCancelados =
        document.getElementById(
            'totalCancelados'
        );

    const mensagemPedidos =
        document.getElementById(
            'mensagemPedidos'
        );


    // ======================================================
    // MODAL DE DETALHES
    // ======================================================

    const modalDetalhesPedido =
        document.getElementById(
            'modalDetalhesPedido'
        );

    const btnFecharDetalhes =
        document.getElementById(
            'btnFecharDetalhes'
        );

    const conteudoDetalhesPedido =
        document.getElementById(
            'conteudoDetalhesPedido'
        );


    // ======================================================
    // MODAL DE NOVO PEDIDO
    // ======================================================

    const btnNovoPedido =
        document.getElementById(
            'btnNovoPedido'
        );

    const modalNovoPedido =
        document.getElementById(
            'modalNovoPedido'
        );

    const btnFecharNovoPedido =
        document.getElementById(
            'btnFecharNovoPedido'
        );

    const btnCancelarNovoPedido =
        document.getElementById(
            'btnCancelarNovoPedido'
        );

    const formNovoPedido =
        document.getElementById(
            'formNovoPedido'
        );


    // ======================================================
    // CAMPOS DO FORMULÁRIO
    // ======================================================

    const clienteNome =
        document.getElementById(
            'clienteNome'
        );

    const clienteEmail =
        document.getElementById(
            'clienteEmail'
        );

    const clienteTelefone =
        document.getElementById(
            'clienteTelefone'
        );

    const enderecoEntrega =
        document.getElementById(
            'enderecoEntrega'
        );

    const produtoSku =
        document.getElementById(
            'produtoSku'
        );

    const produtoQuantidade =
        document.getElementById(
            'produtoQuantidade'
        );


    // ======================================================
    // FORMATAR DINHEIRO
    // ======================================================

    function formatarMoeda(valor) {

        return Number(valor).toLocaleString(
            'pt-BR',
            {
                style: 'currency',
                currency: 'BRL'
            }
        );
    }


    // ======================================================
    // FORMATAR STATUS
    // ======================================================

    function formatarStatus(status) {

        const nomes = {

            PENDENTE:
                'Pendente',

            SEPARANDO:
                'Separando',

            PRONTO_PARA_ENVIO:
                'Pronto para envio',

            EM_TRANSPORTE:
                'Em transporte',

            ENTREGUE:
                'Entregue',

            CANCELADO:
                'Cancelado'
        };


        return nomes[status] || status;
    }


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
    // MENSAGENS
    // ======================================================

    function mostrarMensagemPedidos(
        mensagem,
        tipo = 'sucesso'
    ) {

        mensagemPedidos.textContent =
            mensagem;

        mensagemPedidos.className =
            `mensagem-sistema ${tipo}`;

        mensagemPedidos.hidden =
            false;


        setTimeout(() => {

            mensagemPedidos.hidden =
                true;

        }, 4500);
    }


    // ======================================================
    // ATUALIZAR CARDS
    // ======================================================

    function atualizarCards(pedidos) {

        totalPedidos.textContent =
            pedidos.length;


        totalPendentes.textContent =
            pedidos.filter(
                pedido =>
                    pedido.status === 'PENDENTE'
            ).length;


        totalSeparando.textContent =
            pedidos.filter(
                pedido =>
                    pedido.status === 'SEPARANDO'
            ).length;


        totalProntos.textContent =
            pedidos.filter(
                pedido =>
                    pedido.status ===
                    'PRONTO_PARA_ENVIO'
            ).length;


        totalEmTransporte.textContent =
            pedidos.filter(
                pedido =>
                    pedido.status ===
                    'EM_TRANSPORTE'
            ).length;


        totalEntregues.textContent =
            pedidos.filter(
                pedido =>
                    pedido.status === 'ENTREGUE'
            ).length;


        totalCancelados.textContent =
            pedidos.filter(
                pedido =>
                    pedido.status === 'CANCELADO'
            ).length;
    }


    // ======================================================
    // MONTAR AÇÕES DE CADA PEDIDO
    // ======================================================

    function montarAcoesPedido(pedido) {

        let botoes = `
            <button
                type="button"
                class="btn-secundario btn-detalhes-pedido"
                data-id="${pedido.id}"
            >
                Ver detalhes
            </button>
        `;


        if (pedido.status === 'PENDENTE') {

            botoes += `
                <button
                    type="button"
                    class="btn-secundario btn-status-pedido"
                    data-id="${pedido.id}"
                    data-status="SEPARANDO"
                >
                    Separar
                </button>

                <button
                    type="button"
                    class="btn-secundario btn-status-pedido"
                    data-id="${pedido.id}"
                    data-status="CANCELADO"
                >
                    Cancelar
                </button>
            `;
        }


        if (pedido.status === 'SEPARANDO') {

            botoes += `
                <button
                    type="button"
                    class="btn-secundario btn-status-pedido"
                    data-id="${pedido.id}"
                    data-status="PRONTO_PARA_ENVIO"
                >
                    Pronto para envio
                </button>

                <button
                    type="button"
                    class="btn-secundario btn-status-pedido"
                    data-id="${pedido.id}"
                    data-status="CANCELADO"
                >
                    Cancelar
                </button>
            `;
        }


        if (
            pedido.status ===
            'PRONTO_PARA_ENVIO'
        ) {

            botoes += `
                <button
                    type="button"
                    class="btn-secundario btn-status-pedido"
                    data-id="${pedido.id}"
                    data-status="CANCELADO"
                >
                    Cancelar
                </button>
            `;
        }


        return `
            <div
                class="acoes-pedido"
                style="
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                "
            >
                ${botoes}
            </div>
        `;
    }


    // ======================================================
    // PREENCHER TABELA
    // ======================================================

    function preencherTabela(pedidos) {

        corpoTabelaPedidos.innerHTML = '';


        if (pedidos.length === 0) {

            corpoTabelaPedidos.innerHTML = `
                <tr>
                    <td colspan="6">
                        Nenhum pedido cadastrado.
                    </td>
                </tr>
            `;

            return;
        }


        pedidos.forEach((pedido) => {

            const linha =
                document.createElement('tr');


            linha.innerHTML = `
                <td>
                    ${pedido.id}
                </td>

                <td>
                    ${escaparHtml(
                        pedido.cliente_nome
                    )}
                </td>

                <td>
                    ${escaparHtml(
                        pedido.endereco_entrega
                    )}
                </td>

                <td>
                    ${formatarMoeda(
                        pedido.valor_total
                    )}
                </td>

                <td>
                    ${escaparHtml(
                        formatarStatus(
                            pedido.status
                        )
                    )}
                </td>

                <td>
                    ${montarAcoesPedido(
                        pedido
                    )}
                </td>
            `;


            corpoTabelaPedidos.appendChild(
                linha
            );
        });
    }


    // ======================================================
    // BUSCAR PEDIDOS
    // ======================================================

    async function carregarPedidos() {

        try {

            const resposta =
                await fetch(
                    `${API_PEDIDOS_URL}/pedidos`,
                    {
                        method: 'GET',

                        headers: {
                            Authorization:
                                `Bearer ${tokenPedidos}`
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
                    'Erro ao carregar pedidos.'
                );
            }


            const pedidos =
                Array.isArray(dados.pedidos)
                    ? dados.pedidos
                    : [];


            atualizarCards(
                pedidos
            );


            preencherTabela(
                pedidos
            );


        } catch (erro) {

            console.error(
                'Erro ao carregar pedidos:',
                erro
            );


            corpoTabelaPedidos.innerHTML = `
                <tr>
                    <td colspan="6">
                        Não foi possível carregar os pedidos.
                    </td>
                </tr>
            `;
        }
    }


    // ======================================================
    // ALTERAR STATUS DO PEDIDO
    // ======================================================

    async function alterarStatusPedido(
        id,
        novoStatus,
        botao
    ) {

        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {

            mostrarMensagemPedidos(
                'ID do pedido inválido.',
                'erro'
            );

            return;
        }


        // Confirma cancelamento
        if (novoStatus === 'CANCELADO') {

            const confirmou =
                window.confirm(
                    'Tem certeza que deseja cancelar este pedido?'
                );


            if (!confirmou) {
                return;
            }
        }


        const textoOriginal =
            botao.textContent;


        try {

            botao.disabled = true;

            botao.textContent =
                'Aguarde...';


            const resposta =
                await fetch(
                    `${API_PEDIDOS_URL}/pedidos/${id}/status`,
                    {
                        method: 'PATCH',

                        headers: {

                            Authorization:
                                `Bearer ${tokenPedidos}`,

                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify({
                                status: novoStatus
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
                    'Não foi possível atualizar o pedido.'
                );
            }


            mostrarMensagemPedidos(
                dados.mensagem ||
                'Status do pedido atualizado com sucesso!',
                'sucesso'
            );


            await carregarPedidos();


        } catch (erro) {

            console.error(
                'Erro ao atualizar status:',
                erro
            );


            mostrarMensagemPedidos(
                erro.message ||
                'Não foi possível atualizar o pedido.',
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
    // ABRIR MODAL DE DETALHES
    // ======================================================

    function abrirModalDetalhes() {

        modalDetalhesPedido.hidden =
            false;

        document.body.style.overflow =
            'hidden';
    }


    // ======================================================
    // FECHAR MODAL DE DETALHES
    // ======================================================

    function fecharModalDetalhes() {

        modalDetalhesPedido.hidden =
            true;

        document.body.style.overflow =
            '';
    }


    // ======================================================
    // MONTAR ITENS DO PEDIDO
    // ======================================================

    function montarItensPedido(itens) {

        if (
            !Array.isArray(itens) ||
            itens.length === 0
        ) {

            return `
                <p>
                    Nenhum item encontrado neste pedido.
                </p>
            `;
        }


        return `
            <div class="tabela-responsiva">

                <table>

                    <thead>

                        <tr>

                            <th>
                                SKU
                            </th>

                            <th>
                                PRODUTO
                            </th>

                            <th>
                                QTD.
                            </th>

                            <th>
                                PREÇO
                            </th>

                            <th>
                                SUBTOTAL
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${itens.map((item) => {

                            return `
                                <tr>

                                    <td>
                                        ${escaparHtml(
                                            item.sku || '-'
                                        )}
                                    </td>

                                    <td>
                                        ${escaparHtml(
                                            item.nome || '-'
                                        )}
                                    </td>

                                    <td>
                                        ${Number(
                                            item.quantidade || 0
                                        )}
                                    </td>

                                    <td>
                                        ${formatarMoeda(
                                            item.preco_unitario || 0
                                        )}
                                    </td>

                                    <td>
                                        ${formatarMoeda(
                                            item.subtotal || 0
                                        )}
                                    </td>

                                </tr>
                            `;

                        }).join('')}

                    </tbody>

                </table>

            </div>
        `;
    }


    // ======================================================
    // EXIBIR DETALHES
    // ======================================================

    function exibirDetalhesPedido(pedido) {

        conteudoDetalhesPedido.innerHTML = `

            <div class="detalhes-pedido-grid">

                <div class="detalhe-pedido">

                    <span>
                        Pedido
                    </span>

                    <strong>
                        #${pedido.id}
                    </strong>

                </div>


                <div class="detalhe-pedido">

                    <span>
                        Status
                    </span>

                    <strong>
                        ${escaparHtml(
                            formatarStatus(
                                pedido.status
                            )
                        )}
                    </strong>

                </div>


                <div class="detalhe-pedido">

                    <span>
                        Cliente
                    </span>

                    <strong>
                        ${escaparHtml(
                            pedido.cliente_nome || '-'
                        )}
                    </strong>

                </div>


                <div class="detalhe-pedido">

                    <span>
                        Telefone
                    </span>

                    <strong>
                        ${escaparHtml(
                            pedido.cliente_telefone || '-'
                        )}
                    </strong>

                </div>


                <div class="detalhe-pedido">

                    <span>
                        E-mail
                    </span>

                    <strong>
                        ${escaparHtml(
                            pedido.cliente_email || '-'
                        )}
                    </strong>

                </div>


                <div class="detalhe-pedido">

                    <span>
                        Valor total
                    </span>

                    <strong>
                        ${formatarMoeda(
                            pedido.valor_total
                        )}
                    </strong>

                </div>

            </div>


            <div class="detalhe-endereco">

                <span>
                    Endereço de entrega
                </span>

                <strong>
                    ${escaparHtml(
                        pedido.endereco_entrega || '-'
                    )}
                </strong>

            </div>


            <div class="detalhes-itens">

                <h3>
                    Itens do pedido
                </h3>

                ${montarItensPedido(
                    pedido.itens
                )}

            </div>
        `;
    }


    // ======================================================
    // BUSCAR DETALHES NA API
    // ======================================================

    async function buscarDetalhesPedido(id) {

        try {

            conteudoDetalhesPedido.innerHTML = `
                <p>
                    Carregando detalhes...
                </p>
            `;


            abrirModalDetalhes();


            const resposta =
                await fetch(
                    `${API_PEDIDOS_URL}/pedidos/${id}`,
                    {
                        method: 'GET',

                        headers: {
                            Authorization:
                                `Bearer ${tokenPedidos}`
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
                    'Erro ao buscar detalhes do pedido.'
                );
            }


            exibirDetalhesPedido(
                dados.pedido
            );


        } catch (erro) {

            console.error(
                'Erro ao buscar detalhes:',
                erro
            );


            conteudoDetalhesPedido.innerHTML = `
                <p>
                    Não foi possível carregar os detalhes do pedido.
                </p>
            `;
        }
    }


    // ======================================================
    // ABRIR MODAL DE NOVO PEDIDO
    // ======================================================

    function abrirModalNovoPedido() {

        formNovoPedido.reset();

        produtoQuantidade.value =
            1;

        modalNovoPedido.hidden =
            false;

        document.body.style.overflow =
            'hidden';


        setTimeout(() => {

            clienteNome.focus();

        }, 50);
    }


    // ======================================================
    // FECHAR MODAL DE NOVO PEDIDO
    // ======================================================

    function fecharModalNovoPedido() {

        modalNovoPedido.hidden =
            true;

        document.body.style.overflow =
            '';
    }


    // ======================================================
    // CRIAR NOVO PEDIDO
    // ======================================================

    async function criarNovoPedidoFrontend(
        evento
    ) {

        evento.preventDefault();


        const nome =
            clienteNome.value.trim();

        const endereco =
            enderecoEntrega.value.trim();

        const sku =
            produtoSku.value
                .trim()
                .toUpperCase();

        const quantidade =
            Number(
                produtoQuantidade.value
            );


        if (!nome) {

            mostrarMensagemPedidos(
                'Informe o nome do cliente.',
                'erro'
            );

            return;
        }


        if (!endereco) {

            mostrarMensagemPedidos(
                'Informe o endereço de entrega.',
                'erro'
            );

            return;
        }


        if (!sku) {

            mostrarMensagemPedidos(
                'Informe o SKU do produto.',
                'erro'
            );

            return;
        }


        if (
            !Number.isInteger(quantidade) ||
            quantidade <= 0
        ) {

            mostrarMensagemPedidos(
                'Informe uma quantidade válida.',
                'erro'
            );

            return;
        }


        const corpo = {

            cliente_nome:
                nome,

            cliente_email:
                clienteEmail.value.trim() ||
                null,

            cliente_telefone:
                clienteTelefone.value.trim() ||
                null,

            endereco_entrega:
                endereco,

            itens: [
                {
                    sku,
                    quantidade
                }
            ]
        };


        try {

            const resposta =
                await fetch(
                    `${API_PEDIDOS_URL}/pedidos`,
                    {
                        method: 'POST',

                        headers: {

                            Authorization:
                                `Bearer ${tokenPedidos}`,

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
                    'Erro ao criar pedido.'
                );
            }


            fecharModalNovoPedido();


            mostrarMensagemPedidos(
                dados.mensagem ||
                'Pedido criado com sucesso!',
                'sucesso'
            );


            await carregarPedidos();


        } catch (erro) {

            console.error(
                'Erro ao criar pedido:',
                erro
            );


            mostrarMensagemPedidos(
                erro.message ||
                'Não foi possível criar o pedido.',
                'erro'
            );
        }
    }


    // ======================================================
    // CLIQUES NA TABELA
    // ======================================================

    corpoTabelaPedidos.addEventListener(
        'click',
        (evento) => {

            // ==============================================
            // VER DETALHES
            // ==============================================

            const botaoDetalhes =
                evento.target.closest(
                    '.btn-detalhes-pedido'
                );


            if (botaoDetalhes) {

                const id =
                    Number(
                        botaoDetalhes.dataset.id
                    );


                if (
                    Number.isInteger(id) &&
                    id > 0
                ) {

                    buscarDetalhesPedido(
                        id
                    );
                }


                return;
            }


            // ==============================================
            // ALTERAR STATUS
            // ==============================================

            const botaoStatus =
                evento.target.closest(
                    '.btn-status-pedido'
                );


            if (!botaoStatus) {
                return;
            }


            const id =
                Number(
                    botaoStatus.dataset.id
                );

            const novoStatus =
                botaoStatus.dataset.status;


            if (
                !Number.isInteger(id) ||
                id <= 0 ||
                !novoStatus
            ) {

                return;
            }


            alterarStatusPedido(
                id,
                novoStatus,
                botaoStatus
            );
        }
    );


    // ======================================================
    // MODAL DE DETALHES
    // ======================================================

    btnFecharDetalhes.addEventListener(
        'click',
        fecharModalDetalhes
    );


    // ======================================================
    // MODAL DE NOVO PEDIDO
    // ======================================================

    btnNovoPedido.addEventListener(
        'click',
        abrirModalNovoPedido
    );


    btnFecharNovoPedido.addEventListener(
        'click',
        fecharModalNovoPedido
    );


    btnCancelarNovoPedido.addEventListener(
        'click',
        fecharModalNovoPedido
    );


    formNovoPedido.addEventListener(
        'submit',
        criarNovoPedidoFrontend
    );


    // ======================================================
    // INICIALIZAÇÃO
    // ======================================================

    document.addEventListener(
        'DOMContentLoaded',
        () => {

            carregarPedidos();

        }
    );

})();