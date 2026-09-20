// Regression tests for authentication, browser origins and access boundaries.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { io } from "socket.io-client";
import { startTestServer } from "./test-server.js";

const server = await startTestServer();
const sockets = [];
let passed = 0;
const check = (label, condition) => { assert.ok(condition, label); console.log(`  PASS  ${label}`); passed++; };
const api = (path, { method = "GET", cookie, body, origin } = {}) => fetch(`${server.base}/api${path}`, {
    method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...(origin ? { Origin: origin } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
});
const cookieOf = (response) => response.headers.getSetCookie().map((cookie) => cookie.split(";")[0]).join("; ");
const event = (socket, name, timeout = 5000) => new Promise((resolve, reject) => {
    const listener = (data) => { clearTimeout(timer); resolve(data); };
    const timer = setTimeout(() => { socket.off(name, listener); reject(new Error(`No ${name} event`)); }, timeout);
    socket.once(name, listener);
});
async function connect(cookie, extra = {}, reject = false) {
    const socket = io(server.base, { autoConnect: false, reconnection: false, extraHeaders: { ...(cookie ? { Cookie: cookie } : {}) }, ...extra });
    sockets.push(socket);
    const result = event(socket, reject ? "connect_error" : "connect");
    socket.connect();
    await result;
    return socket;
}
async function signup() {
    const body = { fullName: "Security Test", username: `sec_${randomBytes(5).toString("hex")}`, gender: "male", password: "Test-security-2026!", confirmPassword: "Test-security-2026!" };
    const response = await api("/auth/signup", { method: "POST", body });
    assert.equal(response.status, 201);
    return { ...(await response.json()).user, cookie: cookieOf(response), password: body.password };
}
try {
    const a = await signup(); const b = await signup(); const c = await signup();
    const health = await api("/health");
    check("health has hardened headers", health.headers.get("x-content-type-options") === "nosniff");
    check("HTTP local use does not force insecure-request upgrades", !health.headers.get("content-security-policy").includes("upgrade-insecure-requests"));
    check("readiness sees the database", (await api("/ready")).status === 200);
    const missing = await api("/not-a-route");
    check("unknown API routes return JSON 404", missing.status === 404 && missing.headers.get("content-type").includes("application/json"));
    check("login rejects object query injection", (await api("/auth/login", { method: "POST", body: { username: { $ne: null }, password: a.password } })).status === 400);
    check("signup rejects non-string profile fields", (await api("/auth/signup", { method: "POST", body: { fullName: {}, username: "abc", password: a.password, confirmPassword: a.password, gender: "male" } })).status === 400);
    check("oversized password is rejected before bcrypt", (await api("/auth/signup", { method: "POST", body: { fullName: "Test", username: "oversized", password: "x".repeat(73), confirmPassword: "x".repeat(73), gender: "male" } })).status === 400);
    check("foreign browser mutations are rejected", (await api("/auth/logout", { method: "POST", cookie: a.cookie, origin: "https://attacker.example" })).status === 403);
    check("malformed resource identifiers return 400", (await api("/messages/not-an-id", { cookie: a.cookie })).status === 400);
    check("regex search payloads are rejected", (await api("/friends/search?query=%28a%2B%29%2B", { cookie: a.cookie })).status === 400);
    check("missing search input returns 400", (await api("/friends/search", { cookie: a.cookie })).status === 400);
    check("self friendship is rejected", (await api(`/friends/send/${a._id}`, { method: "POST", cookie: a.cookie })).status === 400);
    check("message objects are rejected", (await api(`/messages/send/${b._id}`, { method: "POST", cookie: a.cookie, body: { message: { $gt: "" } } })).status === 400);
    check("nonexistent recipients are rejected", (await api("/messages/send/000000000000000000000001", { method: "POST", cookie: a.cookie, body: { message: "hello" } })).status === 404);
    check("large JSON bodies are rejected", (await api(`/messages/send/${b._id}`, { method: "POST", cookie: a.cookie, body: { message: "x".repeat(17000) } })).status === 413);
    await connect(undefined, { query: { userId: b._id } }, true);
    check("query userId cannot authenticate a socket", true);
    await connect(a.cookie, { extraHeaders: { Cookie: a.cookie, Origin: "https://attacker.example" } }, true);
    check("foreign-origin sockets are rejected", true);

    const sa = await connect(a.cookie, { query: { userId: b._id } });
    const sb = await connect(b.cookie);
    const sb2 = await connect(b.cookie);
    const messageResponse = await api(`/messages/send/${b._id}`, { method: "POST", cookie: a.cookie, body: { message: "request" } });
    const message = await messageResponse.json();
    const conversations = await (await api("/conversations", { cookie: a.cookie })).json();
    const conversationId = conversations[0]._id;
    check("sender cannot accept their own message request", (await api(`/conversations/accept/${conversationId}`, { method: "PUT", cookie: a.cookie })).status === 403);
    check("unrelated user cannot accept a conversation", (await api(`/conversations/accept/${conversationId}`, { method: "PUT", cookie: c.cookie })).status === 404);
    check("receiver can accept a message request", (await api(`/conversations/accept/${conversationId}`, { method: "PUT", cookie: b.cookie })).status === 200);
    check("third party cannot react to a message", (await api(`/messages/react/${message._id}`, { method: "POST", cookie: c.cookie, body: { emoji: "👍" } })).status === 403);
    check("third party cannot read another pair's history", (await (await api(`/messages/${a._id}`, { cookie: c.cookie })).json()).length === 0);
    const typing = event(sb, "userTyping");
    sa.emit("typing", { receiverId: b._id });
    check("socket identity comes from cookie despite forged query", (await typing).senderId === a._id);
    const delivery1 = event(sb, "newMessage"); const delivery2 = event(sb2, "newMessage");
    await api(`/messages/send/${b._id}`, { method: "POST", cookie: a.cookie, body: { message: "two tabs" } });
    check("both recipient tabs receive messages", (await delivery1)._id === (await delivery2)._id);
    sb.disconnect();
    const stillOnline = event(sb2, "newMessage");
    await api(`/messages/send/${b._id}`, { method: "POST", cookie: a.cookie, body: { message: "one tab remains" } });
    check("closing one tab preserves delivery to another", Boolean((await stillOnline)._id));
    sa.emit("typing", null); sa.emit("chatOpened", { otherUserId: { $ne: null } });
    check("malformed socket events do not crash the API", (await api("/health")).status === 200);

    for (let index = 0; index < 51; index++) {
        assert.equal((await api(`/messages/send/${b._id}`, { method: "POST", cookie: a.cookie, body: { message: `page-${index}` } })).status, 201);
    }
    const pageResponse = await api(`/messages/${b._id}`, { cookie: a.cookie });
    const page = await pageResponse.json();
    check("history is bounded to 50 newest messages", page.length === 50 && page.at(-1).message === "page-50" && pageResponse.headers.get("x-has-more") === "true");
    const older = await (await api(`/messages/${b._id}?before=${page[0]._id}`, { cookie: a.cookie })).json();
    check("older-message cursor has no overlap", older.length === 4 && older.every((message) => !page.some((item) => item._id === message._id)));
    check("invalid pagination cursor returns 400", (await api(`/messages/${b._id}?before=bad`, { cookie: a.cookie })).status === 400);
    await api(`/messages/clear/${b._id}`, { method: "DELETE", cookie: a.cookie });
    check("clear covers older pages too", (await (await api(`/messages/${b._id}`, { cookie: a.cookie })).json()).length === 0);
    check("clear preserves the peer's history", (await (await api(`/messages/${a._id}`, { cookie: b.cookie })).json()).length === 50);
    const changed = await api("/auth/password", { method: "PUT", cookie: a.cookie, body: { currentPassword: a.password, newPassword: "New-security-2026!" } });
    check("password change issues a fresh session", changed.status === 200 && cookieOf(changed).includes("token="));
    check("password change revokes the previous HTTP session", (await api("/auth/me", { cookie: a.cookie })).status === 401);
    const newCookie = cookieOf(changed);
    const newSocket = await connect(newCookie);
    const disconnected = event(newSocket, "disconnect");
    check("logout succeeds", (await api("/auth/logout", { method: "POST", cookie: newCookie })).status === 200);
    await disconnected;
    check("logout disconnects the active socket", !newSocket.connected);
    check("copied cookie cannot be reused after logout", (await api("/auth/me", { cookie: newCookie })).status === 401);
    await connect(newCookie, {}, true);
    check("revoked cookies cannot open new sockets", true);
    console.log(`\n${passed} passed, 0 failed`);
} catch (error) {
    console.error(`\nSecurity regression failed after ${passed} checks:`, error);
    process.exitCode = 1;
} finally {
    sockets.forEach((socket) => socket.close());
    await server.stop();
}
