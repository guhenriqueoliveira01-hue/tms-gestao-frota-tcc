// 1. Verifica se o usuário tem o "crachá" (Token) salvo no navegador
const token = localStorage.getItem('token');

// Se não tiver token, manda de volta para o login na hora!
//if (!token) {
//    alert('Acesso negado! Por favor, faça login.');
//    window.location.href = 'index.html';
//}

// 2. Funcionalidade do botão "Sair"
const btnSair = document.getElementById('btnSair');

btnSair.addEventListener('click', (evento) => {
    evento.preventDefault(); // Evita recarregar a tela
    
    // Rasga o crachá (remove o token do navegador)
    localStorage.removeItem('token');
    
    // Manda para a tela de login
    window.location.href = 'index.html';
});

// Função para buscar os caminhões no backend
async function carregarCaminhoes() {
    try {
        // Substitua a URL abaixo pela rota correta do seu backend (ex: http://localhost:3000/caminhoes)
        const resposta = await fetch('http://localhost:3000/caminhoes'); 
        const caminhoes = await resposta.json();

        const corpoTabela = document.getElementById('corpo-tabela-caminhoes');
        corpoTabela.innerHTML = ''; // Limpa a tabela antes de preencher

        // Para cada caminhão no banco, cria uma linha (tr) na tabela
        caminhoes.forEach(caminhao => {
            const linha = document.createElement('tr');
            
            // AQUI ESTÁ A CORREÇÃO: trocamos capacidade por capacidade_kg e adicionamos o "kg"
            linha.innerHTML = `
                <td>${caminhao.id}</td>
                <td>${caminhao.placa}</td>
                <td>${caminhao.modelo}</td>
                <td>${caminhao.capacidade_kg} kg</td>
            `;
            
            corpoTabela.appendChild(linha);
        });

    } catch (erro) {
        console.error('Erro ao buscar caminhões:', erro);
    }
}

// Chama a função assim que a página carregar
window.onload = carregarCaminhoes;