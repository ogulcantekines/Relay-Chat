// Uçtan uca duman testi.
// Gerçek sunucuyu ayağa kaldırır, ana kullanıcı akışını HTTP üzerinden sürer
// ve herhangi bir adım beklenen sonucu vermezse sıfırdan farklı kodla çıkar.
// Harici bir test kütüphanesi kullanmaz; Node ile doğrudan çalışır.

import { spawn } from "child_process";

const PORT = process.env.PORT || 5000;
const BASE = `http://127.0.0.1:${PORT}`;

let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
    if (condition) {
        console.log(`  PASS  ${name}`);
        passed++;
    } else {
        console.error(`  FAIL  ${name}${detail ? ` -> ${detail}` : ""}`);
        failed++;
    }
}

// Sunucunun dinlemeye başlamasını bekle
async function waitForServer(timeoutMs = 45000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            const res = await fetch(`${BASE}/api/health`);
            if (res.ok) return true;
        } catch {
            // henüz ayakta değil
        }
        await new Promise((r) => setTimeout(r, 500));
    }
    return false;
}

// Set-Cookie başlığını sonraki isteklerde kullanmak üzere sakla
function cookieFrom(res) {
    const raw = res.headers.getSetCookie?.() ?? [];
    return raw.map((c) => c.split(";")[0]).join("; ");
}

const api = (path, { method = "GET", body, cookie } = {}) =>
    fetch(`${BASE}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(cookie ? { Cookie: cookie } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
    });

const user = (n) => ({
    fullName: `Smoke ${n}`,
    username: `smoke_${n}_${Date.now().toString(36)}`,
    password: "pass1234",
    confirmPassword: "pass1234",
    gender: n % 2 === 0 ? "female" : "male"
});

async function run() {
    console.log("Starting server...");
    const server = spawn("node", ["backend/server.js"], {
        stdio: ["ignore", "inherit", "inherit"],
        env: process.env
    });

    let exitCode = 1;

    try {
        if (!(await waitForServer())) {
            console.error("Server did not become healthy in time");
            return;
        }

        console.log("\nHealth");
        const health = await api("/api/health");
        check("health returns 200", health.status === 200, `got ${health.status}`);

        console.log("\nAuth");
        const a = user(1);
        const b = user(2);

        const signupA = await api("/api/auth/signup", { method: "POST", body: a });
        check("signup succeeds", signupA.status === 201, `got ${signupA.status}`);
        const cookieA = cookieFrom(signupA);
        check("signup sets an auth cookie", cookieA.includes("token="));

        const signupB = await api("/api/auth/signup", { method: "POST", body: b });
        check("second signup succeeds", signupB.status === 201, `got ${signupB.status}`);
        const cookieB = cookieFrom(signupB);

        const dup = await api("/api/auth/signup", { method: "POST", body: a });
        check("duplicate username rejected", dup.status === 400, `got ${dup.status}`);

        const shortPw = await api("/api/auth/signup", {
            method: "POST",
            body: { ...user(3), password: "123", confirmPassword: "123" }
        });
        check("short password rejected", shortPw.status === 400, `got ${shortPw.status}`);

        const badLogin = await api("/api/auth/login", {
            method: "POST",
            body: { username: a.username, password: "wrong-password" }
        });
        check("wrong password rejected", badLogin.status === 400, `got ${badLogin.status}`);

        const noAuth = await api("/api/users");
        check("protected route requires auth", noAuth.status === 401, `got ${noAuth.status}`);

        console.log("\nFriends");
        const search = await api(`/api/friends/search?query=${b.username}`, { cookie: cookieA });
        const found = await search.json();
        check("search finds the other user", Array.isArray(found) && found.length === 1);

        const bId = found[0]?._id;
        check("search response omits the password", found[0] && !("password" in found[0]));

        const sent = await api(`/api/friends/send/${bId}`, { method: "POST", cookie: cookieA });
        check("friend request sent", sent.status === 200, `got ${sent.status}`);

        const inbox = await api("/api/friends/requests", { cookie: cookieB });
        const { friendRequests } = await inbox.json();
        check("request appears in the inbox", friendRequests?.length === 1);

        const reqId = friendRequests?.[0]?._id;
        const bogus = await api("/api/friends/respond", {
            method: "POST",
            cookie: cookieB,
            body: { requestId: reqId, response: "bogus" }
        });
        check("invalid response value rejected", bogus.status === 400, `got ${bogus.status}`);

        const accept = await api("/api/friends/respond", {
            method: "POST",
            cookie: cookieB,
            body: { requestId: reqId, response: "accept" }
        });
        check("friend request accepted", accept.status === 200, `got ${accept.status}`);

        const listA = await api("/api/friends/list", { cookie: cookieA });
        const { friends } = await listA.json();
        check("friendship is mutual", friends?.length === 1);

        console.log("\nMessages");
        const send = await api(`/api/messages/send/${bId}`, {
            method: "POST",
            cookie: cookieA,
            body: { message: "smoke test message" }
        });
        check("message sent", send.status === 201, `got ${send.status}`);
        const sentMessage = await send.json();

        const aId = sentMessage.senderId;
        const thread = await api(`/api/messages/${aId}`, { cookie: cookieB });
        const messages = await thread.json();
        check("message is readable by the recipient", messages?.length === 1);

        const editByOther = await api(`/api/messages/edit/${sentMessage._id}`, {
            method: "PUT",
            cookie: cookieB,
            body: { newMessage: "not mine to edit" }
        });
        check("editing someone else's message is forbidden", editByOther.status === 403, `got ${editByOther.status}`);

        const edit = await api(`/api/messages/edit/${sentMessage._id}`, {
            method: "PUT",
            cookie: cookieA,
            body: { newMessage: "edited by the sender" }
        });
        check("sender can edit their own message", edit.status === 200, `got ${edit.status}`);

        const tooLong = await api(`/api/messages/send/${bId}`, {
            method: "POST",
            cookie: cookieA,
            body: { message: "x".repeat(2001) }
        });
        check("over-long message rejected", tooLong.status === 400, `got ${tooLong.status}`);

        const emptyMsg = await api(`/api/messages/send/${bId}`, {
            method: "POST",
            cookie: cookieA,
            body: { message: "   " }
        });
        check("empty message rejected", emptyMsg.status === 400, `got ${emptyMsg.status}`);

        const deleteByOther = await api(`/api/messages/${sentMessage._id}`, {
            method: "DELETE",
            cookie: cookieB
        });
        check("deleting someone else's message is forbidden", deleteByOther.status === 403, `got ${deleteByOther.status}`);

        const del = await api(`/api/messages/${sentMessage._id}`, {
            method: "DELETE",
            cookie: cookieA
        });
        check("sender can delete their own message", del.status === 200, `got ${del.status}`);

        const editDeleted = await api(`/api/messages/edit/${sentMessage._id}`, {
            method: "PUT",
            cookie: cookieA,
            body: { newMessage: "bring it back" }
        });
        check("a deleted message cannot be edited", editDeleted.status === 400, `got ${editDeleted.status}`);

        console.log("\nProfile");
        const me = await api("/api/auth/me", { cookie: cookieA });
        const meBody = await me.json();
        check("session endpoint returns the user", me.status === 200 && meBody.user?.username === a.username);
        check("session response omits the password", meBody.user && !("password" in meBody.user));

        const profile = await api("/api/auth/profile", {
            method: "PUT",
            cookie: cookieA,
            body: { fullName: "Renamed User" }
        });
        check("profile can be updated", profile.status === 200, `got ${profile.status}`);

        const badPic = await api("/api/auth/profile", {
            method: "PUT",
            cookie: cookieA,
            body: { profilePic: "javascript:alert(1)" }
        });
        check("non-http profile picture rejected", badPic.status === 400, `got ${badPic.status}`);

        const wrongCurrent = await api("/api/auth/password", {
            method: "PUT",
            cookie: cookieA,
            body: { currentPassword: "not-it", newPassword: "newpass123" }
        });
        check("password change needs the current password", wrongCurrent.status === 400, `got ${wrongCurrent.status}`);

        const changed = await api("/api/auth/password", {
            method: "PUT",
            cookie: cookieA,
            body: { currentPassword: a.password, newPassword: "newpass123" }
        });
        check("password can be changed", changed.status === 200, `got ${changed.status}`);

        const loginNew = await api("/api/auth/login", {
            method: "POST",
            body: { username: a.username, password: "newpass123" }
        });
        check("login works with the new password", loginNew.status === 200, `got ${loginNew.status}`);

        const conversations = await api("/api/conversations", { cookie: cookieA });
        const convList = await conversations.json();
        check("conversation was created", Array.isArray(convList) && convList.length >= 1);

        console.log(`\n${passed} passed, ${failed} failed`);
        exitCode = failed === 0 ? 0 : 1;
    } catch (error) {
        console.error("\nSmoke test crashed:", error);
        exitCode = 1;
    } finally {
        server.kill("SIGTERM");
        setTimeout(() => process.exit(exitCode), 300);
    }
}

run();
