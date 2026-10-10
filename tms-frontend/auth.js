const API_URL = 'http://localhost:3000';


// ======================================================
// LOGIN
// ======================================================

const loginForm =
    document.getElementById('loginForm');


/*
 * O auth.js também pode ser carregado por páginas
 * internas que não possuem o formulário de login.
 *
 * Por isso, só configuramos o evento de submit
 * quando o formulário realmente existir.
 */
if (loginForm) {

    loginForm.addEventListener(
        'submit',
        async (evento) => {

            // Impede o formulário de recarregar a página.
            evento.preventDefault();


            const campoEmail =
                document.getElementById('email');

            const campoSenha =
                document.getElementById('senha');


            if (
                !campoEmail ||
                !campoSenha
            ) {

                console.error(
                    'Campos de login não encontrados.'
                );

                return;
            }


            const email =
                campoEmail.value.trim();

            const senha =
                campoSenha.value;


            try {

                const resposta = await fetch(
                    `${API_URL}/login`,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({
                            email,
                            senha
                        })
                    }
                );


                const dados =
                    await resposta.json();


                if (!resposta.ok) {

                    alert(
                        dados.erro ||
                        'Não foi possível realizar o login.'
                    );

                    return;
                }


                if (!dados.token) {

                    alert(
                        'O servidor não retornou um token de autenticação.'
                    );

                    return;
                }


                // Guarda o JWT para acessar as páginas protegidas.
                localStorage.setItem(
                    'token',
                    dados.token
                );


                // Redireciona para o painel administrativo.
                window.location.href =
                    'dashboard.html';


            } catch (erro) {

                console.error(
                    'Erro ao realizar login:',
                    erro
                );


                alert(
                    'Não foi possível conectar ao servidor.'
                );
            }
        }
    );
}