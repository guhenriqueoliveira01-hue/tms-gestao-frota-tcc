// 1. Verifica se o usuário tem o "crachá" (Token) salvo no navegador
const token = localStorage.getItem('token');

// Se não tiver token, manda de volta para o login na hora!
if (!token) {
    alert('Acesso negado! Por favor, faça login.');
    window.location.href = 'index.html';
}

// 2. Funcionalidade do botão "Sair"
const btnSair = document.getElementById('btnSair');

btnSair.addEventListener('click', (evento) => {
    evento.preventDefault(); // Evita recarregar a tela
    
    // Rasga o crachá (remove o token do navegador)
    localStorage.removeItem('token');
    
    // Manda para a tela de login
    window.location.href = 'index.html';
});