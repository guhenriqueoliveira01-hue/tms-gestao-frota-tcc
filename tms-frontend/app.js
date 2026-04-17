// Pegando os elementos da tela
const formLogin = document.getElementById('formLogin');
const mensagemErro = document.getElementById('mensagemErro');

// Função que roda quando o usuário clica em "Fazer Login"
formLogin.addEventListener('submit', async (evento) => {
    // Evita que a página recarregue ao enviar o formulário
    evento.preventDefault(); 

    const emailDigitado = document.getElementById('email').value;
    const senhaDigitada = document.getElementById('senha').value;

    try {
        // Disparando a requisição para o nosso back-end
        const resposta = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: emailDigitado,
                senha: senhaDigitada
            })
        });

        // Convertendo a resposta do servidor para entender o que ele disse
        const dados = await resposta.json();

        // Se o status da resposta não for verde (OK), mostramos o erro na tela
        if (!resposta.ok) {
            mensagemErro.innerText = dados.erro || 'Erro ao realizar login.';
            mensagemErro.style.display = 'block';
            return;
        }

        // --- SUCESSO! ---
        mensagemErro.style.display = 'none';
        
        // 1. Guardamos o Token no navegador (LocalStorage) para usar depois
        localStorage.setItem('token', dados.token);
        
        // 2. Avisamos que deu tudo certo
        alert('Login realizado com sucesso!');
        
        // 3. Redireciona o usuário para a tela principal (Dashboard)
        window.location.href = 'dashboard.html';

    } catch (erro) {
        console.error("Erro na comunicação com a API:", erro);
        mensagemErro.innerText = 'Servidor fora do ar. Tente novamente mais tarde.';
        mensagemErro.style.display = 'block';
    }
});