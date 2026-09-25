// Execute na pasta tms-backend: node tests/pedidos.e2e.cjs
// Usa exclusivamente o banco de testes existente e remove apenas suas fixtures.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const net = require('node:net');
const path = require('node:path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ quiet: true });

async function main() {
    const url = new URL(process.env.DATABASE_URL);
    url.pathname = '/tms_logistica_migrations_test';
    const db = await mysql.createConnection({
        host: url.hostname, port: Number(url.port || 3306),
        user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
        database: 'tms_logistica_migrations_test'
    });
    const tag = 'E2E-' + randomUUID().slice(0, 8).toUpperCase();
    const products = [], users = [];
    let child;
    const query = async (sql, params = []) => (await db.execute(sql, params))[0];
    try {
        assert.equal((await query('SELECT version_num FROM alembic_version'))[0].version_num, '6a833f9ac456');
        const listener = net.createServer();
        listener.listen(0, '127.0.0.1');
        await once(listener, 'listening');
        const port = listener.address().port;
        await new Promise(resolve => listener.close(resolve));
        child = spawn(process.execPath, ['-r', 'ts-node/register', 'src/server.ts'], {
            cwd: path.resolve(__dirname, '..'), windowsHide: true,
            env: { ...process.env, DATABASE_URL: url.toString(), PORT: String(port) },
            stdio: 'ignore'
        });
        child.on('error', () => {});
        const base = `http://127.0.0.1:${port}`;
        let ready = false;
        for (let attempt = 0; attempt < 100; attempt++) {
            try { ready = (await fetch(base + '/teste-banco', { signal: AbortSignal.timeout(1000) })).ok; } catch {}
            if (ready) break;
            if (child.exitCode !== null) throw new Error('Servidor de testes encerrou antes de iniciar.');
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        assert.ok(ready, 'Servidor de testes deve iniciar');
        const post = async (route, body, token) => {
            const response = await fetch(base + route, {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
                body: JSON.stringify(body), signal: AbortSignal.timeout(10000)
            });
            return { status: response.status, body: await response.json() };
        };
        const password = randomUUID();
        const hash = await bcrypt.hash(password, 10);
        const tokens = {};
        for (const role of ['ADMIN', 'MOTORISTA']) {
            const email = `${tag}-${role}@example.invalid`;
            const result = await query('INSERT INTO usuarios (nome,email,senha_hash,tipo_perfil) VALUES (?,?,?,?)', [tag, email, hash, role]);
            users.push(result.insertId);
            assert.equal((await post('/login', { email, senha: 'incorreta' })).status, 401);
            const login = await post('/login', { email, senha: password });
            assert.equal(login.status, 200);
            tokens[role] = login.body.token;
        }
        console.log('PASS login real ADMIN/MOTORISTA e senha incorreta');
        for (const [suffix, price, status, stock] of [['A', 19.90, 'ATIVO', 20], ['B', 7.35, 'ATIVO', 10], ['I', 5, 'INATIVO', 10], ['S', 5, 'ATIVO', null]]) {
            const result = await query('INSERT INTO produtos (sku,nome,preco_base,status) VALUES (?,?,?,?)', [`${tag}-${suffix}`, tag, price, status]);
            products.push(result.insertId);
            if (stock !== null) await query('INSERT INTO estoque (produto_id,quantidade_fisica,quantidade_reservada) VALUES (?,?,0)', [result.insertId, stock]);
        }
        const item = (suffix, quantidade = 1) => ({ sku: `${tag}-${suffix}`, quantidade });
        const payload = (itens = [item('A')]) => ({ cliente_nome: tag, endereco_entrega: 'Endereco de teste', itens });
        const state = async () => ({
            pedidos: await query('SELECT * FROM pedidos WHERE cliente_nome = ? ORDER BY id', [tag]),
            itens: await query('SELECT i.* FROM itens_pedido i JOIN produtos p ON p.id=i.produto_id WHERE p.nome = ? ORDER BY i.id', [tag]),
            estoque: await query('SELECT e.* FROM estoque e JOIN produtos p ON p.id=e.produto_id WHERE p.nome = ? ORDER BY e.id', [tag])
        });
        const reject = async (name, body, status, token = tokens.ADMIN) => {
            const before = await state();
            const response = await post('/pedidos', body, token);
            assert.equal(response.status, status, name + ': ' + JSON.stringify(response.body));
            assert.deepEqual(await state(), before, name + ': banco deve permanecer igual');
            console.log('PASS ' + name + ' (' + status + '), banco inalterado');
        };
        await reject('sem token', payload(), 401, '');
        await reject('token invalido', payload(), 401, 'invalido');
        await reject('perfil MOTORISTA', payload(), 403, tokens.MOTORISTA);
        const valid = payload([{ ...item('A', 2), sku: ` ${tag.toLowerCase()}-a `, preco_unitario: 0.01 }, item('B', 3)]);
        const created = await post('/pedidos', valid, tokens.ADMIN);
        assert.equal(created.status, 201);
        assert.equal(created.body.pedido.valor_total, 61.85);
        assert.equal(created.body.pedido.status, 'PENDENTE');
        const saved = await state();
        assert.equal(saved.pedidos.length, 1);
        assert.equal(saved.pedidos[0].id, created.body.pedido.id);
        assert.equal(saved.pedidos[0].status, 'PENDENTE');
        assert.equal(Number(saved.pedidos[0].valor_total), 61.85);
        assert.deepEqual(saved.itens.map(i => [i.produto_id, i.quantidade, Number(i.preco_unitario), Number(i.subtotal)]), [[products[0], 2, 19.9, 39.8], [products[1], 3, 7.35, 22.05]]);
        assert.ok(saved.itens.every(i => i.pedido_id === created.body.pedido.id));
        assert.deepEqual(saved.estoque.map(e => [e.quantidade_fisica, e.quantidade_reservada]), [[20, 2], [10, 3], [10, 0]]);
        console.log('PASS criacao 201, pedido/itens, precos do banco, total 61.85, normalizacao SKU e reservas');
        await reject('sem nome', { ...payload(), cliente_nome: '' }, 400);
        await reject('sem endereco', { ...payload(), endereco_entrega: '' }, 400);
        await reject('sem itens', payload([]), 400);
        for (const quantity of [0, -1, 1.5]) await reject('quantidade ' + quantity, payload([item('A', quantity)]), 400);
        await reject('SKU duplicado normalizado', payload([item('A'), { sku: ` ${tag.toLowerCase()}-a `, quantidade: 1 }]), 400);
        await reject('SKU inexistente', payload([item('X')]), 404);
        await reject('produto inativo', payload([item('I')]), 409);
        await reject('sem registro de estoque', payload([item('S')]), 404);
        await reject('estoque insuficiente', payload([item('A', 19)]), 409);
        await reject('rollback segundo item sem estoque suficiente', payload([item('A', 2), item('B', 8)]), 409);
        await reject('rollback segundo SKU inexistente', payload([item('A', 2), item('X')]), 404);
        console.log('SUCESSO: verificacoes HTTP + MySQL concluidas.');
    } finally {
        if (child && child.exitCode === null) {
            const stopped = once(child, 'exit');
            child.kill();
            await stopped;
        }
        try {
            await db.beginTransaction();
            await query('DELETE i FROM itens_pedido i JOIN pedidos p ON p.id=i.pedido_id WHERE p.cliente_nome=?', [tag]);
            await query('DELETE FROM pedidos WHERE cliente_nome=?', [tag]);
            for (const id of products) {
                await query('DELETE FROM estoque WHERE produto_id=?', [id]);
                await query('DELETE FROM produtos WHERE id=?', [id]);
            }
            for (const id of users) await query('DELETE FROM usuarios WHERE id=?', [id]);
            await db.commit();
            console.log('Fixtures removidas; servidor de testes encerrado.');
        } catch (error) { await db.rollback(); throw error; }
        finally { await db.end(); }
    }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
