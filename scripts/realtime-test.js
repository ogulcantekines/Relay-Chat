// Gerçek zamanlı olay testi.
//
// Sunucuyu başlatır, iki gerçek Socket.IO istemcisi bağlar ve her olayın
// karşı tarafa ulaşıp ulaşmadığını ölçer. HTTP duman testi uçların doğru
// yanıt verdiğini gösterir; bu test ise soketin gerçekten çalıştığını.
//
// Çalıştırmak için: npm run test:realtime

import { spawn } from "child_process";
import { io } from "socket.io-client";

const PORT = process.env.PORT || 5000;
const BASE = `http://127.0.0.1:${PORT}`;

let passed = 0;
let failed = 0;

const check = (name, condition, detail = "") => {
    if (condition) {
        console.log(`  PASS  ${name}`);
        passed++;
    } else {
        console.error(`  FAIL  ${name}${detail ? ` -> ${detail}` : ""}`);
        failed++;
    }
};

const api = (path, { method = "GET", body, cookie } = {}) =>
    fetch(`${BASE}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(cookie ? { Cookie: cookie } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
    });

const cookieFrom = (res) =>
    (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");

const user = (n) => ({
    fullName: `Realtime ${n}`,
    username: `rt_${n}_${Date.now().toString(36)}`,
    password: "pass1234",
    confirmPassword: "pass1234",
    gender: n % 2 === 0 ? "female" : "male"
});

// Belirli bir olayı bekle; süre dolarsa null dön (test başarısız sayılır)
const waitFor = (socket, event, ms = 8000) =>
    new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), ms);
        socket.once(event, (data) => {
            clearTimeout(timer);
            resolve(data ?? true);
        });
    });

async function waitForServer(timeoutMs = 45000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            if ((await fetch(`${BASE}/api/health`)).ok) return true;
        } catch {
            // henüz ayakta değil
        }
        await new Promise((r) => setTimeout(r, 500));
    }
    return false;
}

async function run() {
    console.log("Starting server...");
    const server = spawn("node", ["backend/server.js"], {
        stdio: ["ignore", "inherit", "inherit"],
        env: process.env
    });

    let exitCode = 1;
    let socketA, socketB;

    try {
        if (!(await waitForServer())) {
            console.error("Server did not become healthy in time");
            return;
        }

        const a = user(1);
        const b = user(2);

        const resA = await api("/api/auth/signup", { method: "POST", body: a });
        const resB = await api("/api/auth/signup", { method: "POST", body: b });
        const cookieA = cookieFrom(resA);
        const cookieB = cookieFrom(resB);
        const aId = (await resA.json()).user._id;
        const bId = (await resB.json()).user._id;

        socketA = io(BASE, { query: { userId: aId } });
        socketB = io(BASE, { query: { userId: bId } });

        await new Promise((resolve) => {
            let connected = 0;
            const done = () => { if (++connected === 2) resolve(); };
            socketA.on("connect", done);
            socketB.on("connect", done);
        });

        console.log("\nFriend events");
        const incoming = waitFor(socketB, "newFriendRequest");
        await api(`/api/friends/send/${bId}`, { method: "POST", cookie: cookieA });
        const request = await incoming;
        check("friend request arrives instantly", !!request);
        check("request carries the sender profile", !!request?.sender?.fullName);

        const inbox = await (await api("/api/friends/requests", { cookie: cookieB })).json();
        const requestId = inbox.friendRequests[0]._id;

        const accepted = waitFor(socketA, "friendRequestResponse");
        await api("/api/friends/respond", {
            method: "POST",
            cookie: cookieB,
            body: { requestId, response: "accept" }
        });
        check("acceptance reaches the sender instantly", !!(await accepted));

        console.log("\nMessage events");
        const incomingMessage = waitFor(socketB, "newMessage");
        const message = await (await api(`/api/messages/send/${bId}`, {
            method: "POST",
            cookie: cookieA,
            body: { message: "realtime check" }
        })).json();
        const delivered = await incomingMessage;
        check("message is delivered instantly", !!delivered);
        // Alıcıda sohbet henüz açılmamışsa kutucuğun kendiliğinden oluşması bu alana bağlı
        check("message carries the sender profile", !!delivered?.sender?.fullName);

        const typing = waitFor(socketB, "userTyping");
        socketA.emit("typing", { receiverId: bId });
        check("typing indicator is delivered", !!(await typing));

        const reaction = waitFor(socketA, "messageReaction");
        await api(`/api/messages/react/${message._id}`, {
            method: "POST",
            cookie: cookieB,
            body: { emoji: "\u{1F44D}" }
        });
        const reacted = await reaction;
        check("reaction is delivered instantly", reacted?.reactions?.length === 1);

        const deletion = waitFor(socketB, "messageDeleted");
        await api(`/api/messages/${message._id}`, { method: "DELETE", cookie: cookieA });
        check("deletion is delivered instantly", !!(await deletion));

        console.log(`\n${passed} passed, ${failed} failed`);
        exitCode = failed === 0 ? 0 : 1;
    } catch (error) {
        console.error("\nRealtime test crashed:", error);
        exitCode = 1;
    } finally {
        socketA?.close();
        socketB?.close();
        server.kill("SIGTERM");
        setTimeout(() => process.exit(exitCode), 300);
    }
}

run();
