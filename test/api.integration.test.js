import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import { after, before, test } from 'node:test';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const databaseName = `bookhaven_api_test_${Date.now()}`;
const mongoUri = `mongodb://127.0.0.1:27017/${databaseName}`;
let serverProcess;
let baseUrl;
let adminToken;
let sellerToken;
let customerToken;
let startupOutput = '';

async function getPort() {
    const listener = net.createServer();
    listener.listen(0, '127.0.0.1');
    await once(listener, 'listening');
    const { port } = listener.address();
    await new Promise((resolve, reject) => listener.close(error => error ? reject(error) : resolve()));
    return port;
}

async function api(path, { method = 'GET', token, body } = {}) {
    const response = await fetch(`${baseUrl}/api/v1${path}`, {
        method,
        headers: {
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
}

async function expectStatus(path, status, options) {
    const result = await api(path, options);
    assert.equal(result.status, status, `${options?.method || 'GET'} ${path}: ${JSON.stringify(result.body)}`);
    return result.body;
}

before(async () => {
    assert.match(mongoUri, /^mongodb:\/\/127\.0\.0\.1:27017\/bookhaven_api_test_/);
    const port = await getPort();
    baseUrl = `http://127.0.0.1:${port}`;
    serverProcess = spawn(process.execPath, ['src/app.js'], {
        cwd: new URL('..', import.meta.url),
        env: {
            ...process.env,
            NODE_ENV: 'test',
            PORT: String(port),
            MONGO_URI_DEV: mongoUri,
            JWT_SECRET: 'integration-test-access-secret',
            JWT_REFRESH_SECRET: 'integration-test-refresh-secret',
            APP_BASE_URL: baseUrl,
            ADMIN_EMAIL: 'admin@test.invalid',
            ADMIN_PASSWORD: 'IntegrationAdmin123!',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    serverProcess.stdout.setEncoding('utf8').on('data', chunk => { startupOutput += chunk; });
    serverProcess.stderr.setEncoding('utf8').on('data', chunk => { startupOutput += chunk; });

    let ready = false;
    for (let i = 0; i < 40; i += 1) {
        if (serverProcess.exitCode !== null) break;
        try {
            const response = await fetch(`${baseUrl}/health`);
            if (response.ok) { ready = true; break; }
        } catch { /* server is still starting */ }
        await new Promise(resolve => setTimeout(resolve, 250));
    }
    assert.equal(ready, true, `API did not start. ${startupOutput}`);

    await mongoose.connect(mongoUri);
    const admin = await User.create({ name: 'Test Admin', email: 'admin@test.invalid', password: 'IntegrationAdmin123!', role: 'admin' });
    const login = await api('/auth/login', { method: 'POST', body: { email: admin.email, password: 'IntegrationAdmin123!' } });
    adminToken = login.body.data.accessToken;
});

after(async () => {
    if (serverProcess && serverProcess.exitCode === null) {
        serverProcess.kill();
        await Promise.race([once(serverProcess, 'exit'), new Promise(resolve => setTimeout(resolve, 3000))]);
    }
    if (mongoose.connection.readyState === 1) {
        // This connection targets a uniquely named local test database only.
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    }
});

test('health, authentication, roles, and account lifecycle', async () => {
    const health = await fetch(`${baseUrl}/health`).then(response => response.json());
    assert.equal(health.success, true);
    await expectStatus('/books', 200);
    await expectStatus('/not-a-route', 404);
    await expectStatus('/auth/me', 401);

    await expectStatus('/auth/register', 422, { method: 'POST', body: { name: '', email: 'bad', password: 'x' } });
    await expectStatus('/auth/register', 422, { method: 'POST', body: { name: 'Admin', email: 'admin2@test.invalid', password: 'password', role: 'admin' } });

    const seller = await expectStatus('/auth/register', 201, { method: 'POST', body: { name: 'Seller', email: 'seller@test.invalid', password: 'password123', role: 'user' } });
    const customer = await expectStatus('/auth/register', 201, { method: 'POST', body: { name: 'Customer', email: 'customer@test.invalid', password: 'password123' } });
    sellerToken = seller.data.accessToken;
    customerToken = customer.data.accessToken;
    assert.equal(seller.data.user.password, undefined);
    await expectStatus('/auth/register', 409, { method: 'POST', body: { name: 'Seller', email: 'seller@test.invalid', password: 'password123' } });
    await expectStatus('/auth/login', 401, { method: 'POST', body: { email: 'seller@test.invalid', password: 'wrong-password' } });
    await expectStatus('/auth/me', 200, { token: sellerToken });
    await expectStatus('/customer/dashboard', 403, { token: sellerToken });
    await expectStatus('/user/dashboard', 403, { token: customerToken });
    await expectStatus('/auth/logout', 200, { method: 'POST' });

    const publicRegistration = await api('/auth/register', { method: 'POST', body: { name: 'Admin', email: 'admin2@test.invalid', password: 'password', role: 'admin' } });
    assert.equal(publicRegistration.status, 422);
});

test('books, inventory, orders, and order-state transitions', async () => {
    const seller = sellerToken;
    const customer = customerToken;

    const badBook = await api('/books', { method: 'POST', token: seller, body: { title: '', author: '', price: -1, condition: 'Bad', category: '' } });
    assert.equal(badBook.status, 422);
    const created = await expectStatus('/books', 201, { method: 'POST', token: seller, body: { title: 'Test Book', author: 'A. Author', price: 100, condition: 'Good', category: 'Fiction', stock: 2 } });
    const bookId = created.data._id;
    await expectStatus('/books/my/listings', 200, { token: seller });
    await expectStatus(`/books/${bookId}`, 200);
    await expectStatus('/books/not-an-object-id', 400);
    await expectStatus(`/books/${bookId}`, 403, { method: 'PUT', token: customer, body: { price: 1 } });
    await expectStatus(`/books/${bookId}`, 200, { method: 'PUT', token: seller, body: { price: 120 } });
    await expectStatus('/orders', 401, { method: 'POST', body: { bookId, shippingAddress: 'Test' } });
    await expectStatus('/orders', 422, { method: 'POST', token: customer, body: { bookId, quantity: 0, shippingAddress: 'Test' } });
    await expectStatus('/orders', 422, { method: 'POST', token: customer, body: { bookId, paymentMethod: 'card', shippingAddress: 'Test' } });
    await expectStatus('/orders', 403, { method: 'POST', token: seller, body: { bookId, shippingAddress: 'Test' } });
    await expectStatus('/orders', 422, { method: 'POST', token: customer, body: { bookId } });

    const pending = await expectStatus('/orders', 201, { method: 'POST', token: customer, body: { bookId, quantity: 1, shippingAddress: 'Test Address' } });
    const orderId = pending.data._id;
    await expectStatus('/orders/customer', 200, { token: customer });
    await expectStatus('/orders/seller', 200, { token: seller });
    await expectStatus(`/orders/${orderId}`, 200, { token: adminToken });
    await expectStatus(`/orders/${orderId}`, 200, { token: customer });
    await expectStatus(`/orders/${orderId}/cancel`, 200, { method: 'PATCH', token: customer });
    await expectStatus(`/orders/${orderId}/cancel`, 409, { method: 'PATCH', token: customer });

    const second = await expectStatus('/orders', 201, { method: 'POST', token: customer, body: { bookId, quantity: 2, shippingAddress: 'Test Address' } });
    await expectStatus(`/orders/${second.data._id}/accept`, 200, { method: 'PATCH', token: seller });
    await expectStatus(`/orders/${second.data._id}/status`, 422, { method: 'PATCH', token: seller, body: { status: 'unknown' } });
    await expectStatus(`/orders/${second.data._id}/status`, 409, { method: 'PATCH', token: seller, body: { status: 'completed' } });
    await expectStatus(`/orders/${second.data._id}/status`, 200, { method: 'PATCH', token: seller, body: { status: 'shipped' } });
    await expectStatus(`/orders/${second.data._id}/reject`, 409, { method: 'PATCH', token: seller });
    await expectStatus(`/orders/${second.data._id}/status`, 200, { method: 'PATCH', token: seller, body: { status: 'completed' } });

    const soldOut = await api('/orders', { method: 'POST', token: customer, body: { bookId, quantity: 1, shippingAddress: 'Test Address' } });
    assert.equal(soldOut.status, 409);
    const limitedBook = await expectStatus('/books', 201, { method: 'POST', token: seller, body: { title: 'Single Copy', author: 'C. Writer', price: 25, condition: 'Fair', category: 'Fiction', stock: 1 } });
    const competingOrders = await Promise.all([
        api('/orders', { method: 'POST', token: customer, body: { bookId: limitedBook.data._id, quantity: 1, shippingAddress: 'First' } }),
        api('/orders', { method: 'POST', token: customer, body: { bookId: limitedBook.data._id, quantity: 1, shippingAddress: 'Second' } }),
    ]);
    assert.deepEqual(competingOrders.map(result => result.status).sort(), [201, 409]);
    const rejectedOrder = competingOrders.find(result => result.status === 201).body.data;
    await expectStatus(`/orders/${rejectedOrder._id}/reject`, 200, { method: 'PATCH', token: seller, body: { reason: 'Out of stock' } });
    const restoredBook = await expectStatus(`/books/${limitedBook.data._id}`, 200);
    assert.equal(restoredBook.data.stock, 1);
    const boundedPage = await api('/books?limit=100000');
    assert.equal(boundedPage.body.pagination.limit, 100);
    await expectStatus(`/user/dashboard`, 200, { token: seller });
    await expectStatus(`/user/earnings`, 200, { token: seller });
    await expectStatus(`/books/${bookId}`, 200, { method: 'DELETE', token: seller });
    await expectStatus(`/books/${bookId}`, 404);
});

test('wishlist, reviews, chat, profiles, and admin APIs', async () => {
    const seller = sellerToken;
    const customer = customerToken;
    const book = await expectStatus('/books', 201, { method: 'POST', token: seller, body: { title: 'Reviewable Book', author: 'B. Writer', price: 50, condition: 'Very Good', category: 'Fiction', stock: 3 } });
    const bookId = book.data._id;

    await expectStatus('/wishlist', 401);
    await expectStatus(`/wishlist/${bookId}`, 201, { method: 'POST', token: customer });
    await expectStatus(`/wishlist/${bookId}`, 409, { method: 'POST', token: customer });
    await expectStatus('/wishlist', 200, { token: customer });
    await expectStatus(`/wishlist/${bookId}`, 200, { method: 'DELETE', token: customer });
    await expectStatus('/wishlist', 200, { method: 'DELETE', token: customer });

    await expectStatus('/reviews/book/not-an-object-id', 400);
    await expectStatus(`/reviews/book/${bookId}`, 200);
    const review = await expectStatus(`/reviews/book/${bookId}`, 201, { method: 'POST', token: customer, body: { rating: 5, comment: 'Lovely copy' } });
    await expectStatus(`/reviews/book/${bookId}`, 409, { method: 'POST', token: customer, body: { rating: 4 } });
    await expectStatus(`/reviews/${review.data._id}`, 200, { method: 'PUT', token: customer, body: { rating: 4, comment: 'Updated' } });
    await expectStatus(`/reviews/${review.data._id}`, 200, { method: 'DELETE', token: customer });

    await expectStatus('/chat/conversations', 200, { token: customer });
    await expectStatus('/chat/conversations', 422, { method: 'POST', token: customer, body: { participantId: 'missing-field' } });
    const customerId = (await User.findOne({ email: 'customer@test.invalid' }))._id.toString();
    await expectStatus('/chat/conversations', 400, { method: 'POST', token: customer, body: { userId: customerId } });
    const conversation = await expectStatus('/chat/conversations', 201, { method: 'POST', token: customer, body: { userId: (await User.findOne({ email: 'seller@test.invalid' }))._id.toString() } });
    const conversationId = conversation.data._id;
    await expectStatus(`/chat/conversations/${conversationId}/messages`, 422, { method: 'POST', token: customer, body: { content: 'frontend old field' } });
    await expectStatus(`/chat/conversations/${conversationId}/messages`, 201, { method: 'POST', token: customer, body: { text: 'Hello seller' } });
    await expectStatus(`/chat/conversations/${conversationId}/messages`, 200, { token: customer });
    await expectStatus(`/chat/conversations/${conversationId}/read`, 200, { method: 'PATCH', token: customer });

    await expectStatus('/customer/profile', 200, { token: customer });
    await expectStatus('/customer/profile', 200, { method: 'PUT', token: customer, body: { name: 'Updated Buyer' } });
    await expectStatus('/customer/dashboard', 200, { token: customer });
    await expectStatus('/admin/stats', 200, { token: adminToken });
    await expectStatus('/admin/users', 200, { token: adminToken });
    await expectStatus('/admin/books', 200, { token: adminToken });
    await expectStatus('/admin/orders', 200, { token: adminToken });
    await expectStatus(`/admin/users/${(await User.findOne({ email: 'customer@test.invalid' }))._id}/status`, 200, { method: 'PATCH', token: adminToken });
    await expectStatus(`/admin/users/${(await User.findOne({ email: 'customer@test.invalid' }))._id}`, 200, { method: 'DELETE', token: adminToken });
    await expectStatus(`/admin/books/${bookId}`, 200, { method: 'DELETE', token: adminToken });
});
