(() => {

    const API_URL = 'http://localhost:3000';

    const tokenDespesas =
        localStorage.getItem('token');


    // ======================================================
    // PROTEÇÃO
    // ======================================================

    if (!tokenDespesas) {

        window.location.href =
            'login.html';

        return;
    }


    // ======================================================
    // ELEMENTOS
    // ======================================================

    const formBuscarViagem =
        document.getElementById(
            'formBuscarViagem'
        );

    const viagemConsultaId =
        document.getElementById(
            'viagemConsultaId'
        );

    const corpoTabelaDespesas =
        document.getElementById(
            'corpoTabelaDespesas'
        );

    const textoViagemSelecionada =
        document.getElementById(
            'textoViagemSelecionada'
        );

    const mensagemDespesas =
        document.getElementById(
            'mensagemDespesas'
        );


    const totalDespesas =
        document.getElementById(
            'totalDespesas'
        );

    const totalCombustivel =
        document.getElementById(
            'totalCombustivel'
        );

    const totalPedagio =
        document.getElementById(
            'totalPedagio'
        );

    const totalManutencao =
        document.getElementById(
            'totalManutencao'
        );

    const totalOutros =
        document.getElementById(
            'totalOutros'
        );


    // ======================================================
    // MODAL
    // ======================================================

    const btnNovaDespesa =
        document.getElementById(
            'btnNovaDespesa'
        );

    const modalNovaDespesa =
        document.getElementById(
            'modalNovaDespesa'
        );

    const btnFecharNovaDespesa =
        document.getElementById(
            'btnFecharNovaDespesa'
        );

    const btnCancelarNovaDespesa =
        document.getElementById(
            'btnCancelarNovaDespesa'
        );

    const formNovaDespesa =
        document.getElementById(
            'formNovaDespesa'
        );


    const despesaViagemId =
        document.getElementById(
            'despesaViagemId'
        );

    const tipoDespesa =
        document.getElementById(
            'tipoDespesa'
        );

    const valorDespesa =
        document.getElementById(
            'valorDespesa'
        );

    const descricaoDespesa =
        document.getElementById(
            'descricaoDespesa'
        );


    // ======================================================
    // UTILITÁRIOS
    // ======================================================

    function formatarDinheiro(valor) {

        return Number(valor || 0)
            .toLocaleString(
                'pt-BR',
                {
                    style: 'currency',
                    currency: 'BRL'
                }
            );
    }


    function formatarData(valor) {

        if (!valor) {
            return '-';
        }

        const data =
            new Date(valor);

        if (
            Number.isNaN(
                data.getTime()
            )
        ) {
            return '-';
        }

        return data.toLocaleString(
            'pt-BR'
        );
    }


    function formatarTipo(tipo) {

        const tipos = {

            COMBUSTIVEL:
                'Combustível',

            PEDAGIO:
                'Pedágio',

            MANUTENCAO:
                'Manutenção',

            OUTROS:
                'Outros'
        };

        return tipos[tipo] || tipo;
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
    // MENSAGEM
    // ======================================================

    function mostrarMensagem(
        mensagem,
        tipo = 'sucesso'
    ) {

        mensagemDespesas.textContent =
            mensagem;

        mensagemDespesas.className =
            `mensagem-sistema ${tipo}`;

        mensagemDespesas.hidden =
            false;


        setTimeout(() => {

            mensagemDespesas.hidden =
                true;

        }, 4500);
    }


    // ======================================================
    // CARDS
    // ======================================================

    function atualizarCards(
        despesas,
        total
    ) {

        totalDespesas.textContent =
            formatarDinheiro(total);


        function somarTipo(tipo) {

            return despesas
                .filter(
                    despesa =>
                        despesa.tipo_despesa ===
                        tipo
                )
                .reduce(
                    (soma, despesa) =>
                        soma +
                        Number(despesa.valor),
                    0
                );
        }


        totalCombustivel.textContent =
            formatarDinheiro(
                somarTipo(
                    'COMBUSTIVEL'
                )
            );

        totalPedagio.textContent =
            formatarDinheiro(
                somarTipo(
                    'PEDAGIO'
                )
            );

        totalManutencao.textContent =
            formatarDinheiro(
                somarTipo(
                    'MANUTENCAO'
                )
            );

        totalOutros.textContent =
            formatarDinheiro(
                somarTipo(
                    'OUTROS'
                )
            );
    }


    // ======================================================
    // TABELA
    // ======================================================

    function preencherTabela(
        despesas
    ) {

        corpoTabelaDespesas.innerHTML =
            '';


        if (despesas.length === 0) {

            corpoTabelaDespesas.innerHTML = `
                <tr>
                    <td colspan="5">
                        Nenhuma despesa registrada para esta viagem.
                    </td>
                </tr>
            `;

            return;
        }


        despesas.forEach(
            despesa => {

                const linha =
                    document.createElement(
                        'tr'
                    );


                linha.innerHTML = `

                    <td>
                        ${despesa.id}
                    </td>

                    <td>
                        ${escaparHtml(
                            formatarTipo(
                                despesa.tipo_despesa
                            )
                        )}
                    </td>

                    <td>
                        ${escaparHtml(
                            despesa.descricao || '-'
                        )}
                    </td>

                    <td>
                        ${formatarDinheiro(
                            despesa.valor
                        )}
                    </td>

                    <td>
                        ${formatarData(
                            despesa.data_hora
                        )}
                    </td>
                `;


                corpoTabelaDespesas
                    .appendChild(
                        linha
                    );
            }
        );
    }


    // ======================================================
    // CONSULTAR DESPESAS
    // ======================================================

    async function carregarDespesasDaViagem(
        viagemId
    ) {

        try {

            const resposta =
                await fetch(
                    `${API_URL}/viagens/${viagemId}/despesas`,
                    {
                        headers: {

                            Authorization:
                                `Bearer ${tokenDespesas}`
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
                    'Não foi possível carregar as despesas.'
                );
            }


            const despesas =
                Array.isArray(
                    dados.despesas
                )
                    ? dados.despesas
                    : [];


            textoViagemSelecionada.textContent =
                `Viagem #${dados.viagem_id}`;


            atualizarCards(
                despesas,
                dados.total_despesas
            );


            preencherTabela(
                despesas
            );


        } catch (erro) {

            console.error(
                'Erro ao buscar despesas:',
                erro
            );


            mostrarMensagem(
                erro.message,
                'erro'
            );
        }
    }


    // ======================================================
    // FORMULÁRIO DE CONSULTA
    // ======================================================

    formBuscarViagem.addEventListener(
        'submit',
        async (evento) => {

            evento.preventDefault();


            const viagemId =
                Number(
                    viagemConsultaId.value
                );


            if (
                !Number.isInteger(
                    viagemId
                ) ||
                viagemId <= 0
            ) {

                mostrarMensagem(
                    'Informe um ID de viagem válido.',
                    'erro'
                );

                return;
            }


            await carregarDespesasDaViagem(
                viagemId
            );
        }
    );


    // ======================================================
    // ABRIR MODAL
    // ======================================================

    function abrirModalNovaDespesa() {

        formNovaDespesa.reset();


        const viagemAtual =
            Number(
                viagemConsultaId.value
            );


        if (
            Number.isInteger(
                viagemAtual
            ) &&
            viagemAtual > 0
        ) {

            despesaViagemId.value =
                viagemAtual;
        }


        modalNovaDespesa.hidden =
            false;

        document.body.style.overflow =
            'hidden';
    }


    // ======================================================
    // FECHAR MODAL
    // ======================================================

    function fecharModalNovaDespesa() {

        modalNovaDespesa.hidden =
            true;

        document.body.style.overflow =
            '';
    }


    // ======================================================
    // CADASTRAR DESPESA
    // ======================================================

    async function cadastrarNovaDespesa(
        evento
    ) {

        evento.preventDefault();


        const viagemId =
            Number(
                despesaViagemId.value
            );

        const tipo =
            tipoDespesa.value;

        const valor =
            Number(
                valorDespesa.value
            );

        const descricao =
            descricaoDespesa.value
                .trim();


        if (
            !Number.isInteger(
                viagemId
            ) ||
            viagemId <= 0
        ) {

            mostrarMensagem(
                'Informe um ID de viagem válido.',
                'erro'
            );

            return;
        }


        if (!tipo) {

            mostrarMensagem(
                'Selecione o tipo da despesa.',
                'erro'
            );

            return;
        }


        if (
            !Number.isFinite(valor) ||
            valor <= 0
        ) {

            mostrarMensagem(
                'Informe um valor maior que zero.',
                'erro'
            );

            return;
        }


        const botaoSalvar =
            formNovaDespesa.querySelector(
                'button[type="submit"]'
            );

        const textoOriginal =
            botaoSalvar.textContent;


        try {

            botaoSalvar.disabled =
                true;

            botaoSalvar.textContent =
                'Salvando...';


            const resposta =
                await fetch(
                    `${API_URL}/despesas`,
                    {
                        method: 'POST',

                        headers: {

                            Authorization:
                                `Bearer ${tokenDespesas}`,

                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify({

                                viagem_id:
                                    viagemId,

                                tipo_despesa:
                                    tipo,

                                valor,

                                descricao:
                                    descricao || null
                            })
                    }
                );


            const dados =
                await resposta.json();


            if (!resposta.ok) {

                throw new Error(
                    dados.erro ||
                    'Não foi possível cadastrar a despesa.'
                );
            }


            fecharModalNovaDespesa();


            mostrarMensagem(
                dados.mensagem ||
                'Despesa cadastrada com sucesso!'
            );


            viagemConsultaId.value =
                viagemId;


            await carregarDespesasDaViagem(
                viagemId
            );


        } catch (erro) {

            console.error(
                'Erro ao cadastrar despesa:',
                erro
            );


            mostrarMensagem(
                erro.message,
                'erro'
            );


        } finally {

            botaoSalvar.disabled =
                false;

            botaoSalvar.textContent =
                textoOriginal;
        }
    }


    // ======================================================
    // EVENTOS DO MODAL
    // ======================================================

    btnNovaDespesa.addEventListener(
        'click',
        abrirModalNovaDespesa
    );


    btnFecharNovaDespesa.addEventListener(
        'click',
        fecharModalNovaDespesa
    );


    btnCancelarNovaDespesa.addEventListener(
        'click',
        fecharModalNovaDespesa
    );


    formNovaDespesa.addEventListener(
        'submit',
        cadastrarNovaDespesa
    );

})();