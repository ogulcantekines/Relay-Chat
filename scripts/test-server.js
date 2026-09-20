import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { randomBytes } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

// Never silently run test accounts against the developer's .env database or
// mistake an already-running app for the child server under test.
export async function startTestServer({ defaultPort = 5000, production = false } = {}) {
    if (!process.env.MONGO_URI) {
        throw new Error("Set MONGO_URI explicitly to a disposable test database before running tests.");
    }
    const port = Number(process.env.PORT || defaultPort);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid test PORT.");
    await new Promise((resolve, reject) => {
        const probe = createServer();
        probe.once("error", () => reject(new Error(`Test port ${port} is occupied; select a different PORT.`)));
        probe.listen(port, () => probe.close(resolve));
    });
    const base = `http://127.0.0.1:${port}`;
    const child = spawn(process.execPath, ["backend/server.js"], {
        stdio: ["ignore", "inherit", "inherit"],
        env: {
            ...process.env,
            PORT: String(port),
            JWT_SECRET: process.env.JWT_SECRET || randomBytes(48).toString("hex"),
            NODE_ENV: production ? "production" : "test",
            COOKIE_SECURE: "false",
            CLIENT_URL: base,
            TRUST_PROXY: "0"
        }
    });
    let spawnError;
    child.once("error", (error) => { spawnError = error; });
    const stop = async () => {
        if (child.exitCode !== null || child.signalCode !== null || !child.pid) return;
        const exited = new Promise((resolve) => child.once("exit", resolve));
        child.kill("SIGTERM");
        let timer;
        await Promise.race([exited, new Promise((resolve) => {
            timer = setTimeout(() => { child.kill("SIGKILL"); resolve(); }, 5000);
        })]);
        clearTimeout(timer);
    };
    try {
        const deadline = Date.now() + 45000;
        while (Date.now() < deadline) {
            if (spawnError) throw spawnError;
            if (child.exitCode !== null || child.signalCode !== null) throw new Error("Test server exited before becoming healthy.");
            try {
                const response = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1000) });
                if (response.ok) return { base, port, stop };
            } catch { /* Wait for the child to connect to its database. */ }
            await delay(150);
        }
        throw new Error("Test server did not become healthy within 45 seconds.");
    } catch (error) {
        await stop();
        throw error;
    }
}
