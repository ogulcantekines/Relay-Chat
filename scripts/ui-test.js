// Real browser coverage. Required UI steps fail instead of being silently skipped.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { chromium } from "playwright";
import { startTestServer } from "./test-server.js";

let passed = 0;
const check = (name, condition, detail = "") => {
    assert.ok(condition, `${name}${detail ? `: ${detail}` : ""}`);
    console.log(`  PASS  ${name}`);
    passed++;
};
const eventually = async (assertion, timeout = 10000) => {
    const deadline = Date.now() + timeout;
    let lastError;
    while (Date.now() < deadline) {
        try { return await assertion(); } catch (error) { lastError = error; }
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw lastError;
};
const visible = async (locator) => {
    await locator.waitFor({ state: "visible", timeout: 10000 });
    return true;
};
async function api(context, base, path, method = "GET", body) {
    const response = await context.request.fetch(`${base}/api${path}`, {
        method, ...(body ? { data: body } : {})
    });
    assert.ok(response.ok(), `${method} ${path}: ${response.status()} ${await response.text()}`);
    return response.json();
}
async function signup(page, base, fullName) {
    const username = `ui_${randomBytes(6).toString("hex")}`;
    await page.goto(`${base}/signup`);
    await page.locator("#fullName").fill(fullName);
    await page.locator("#username").fill(username);
    await page.locator("#password").fill("Chat-test-2026!");
    await page.locator("#confirmPassword").fill("Chat-test-2026!");
    await page.getByText("Erkek", { exact: true }).click();
    await page.locator("button[type=submit]").click();
    await visible(page.getByRole("button", { name: "Sohbetler", exact: true }));
    const { user } = await api(page.context(), base, "/auth/me");
    return user;
}
async function assertLayout(page, name) {
    const overflowing = await page.evaluate(() => [...document.querySelectorAll("body *")]
        .filter((element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return rect.width > 1 && style.visibility !== "hidden" && style.position !== "absolute" &&
                (rect.right > innerWidth + 1 || rect.left < -1);
        }).map((element) => `${element.tagName}.${String(element.className).slice(0, 60)}`));
    check(`${name}: no horizontal overflow`, overflowing.length === 0, overflowing.join(", "));
}
async function showActions(page, mobile) {
    const bubble = page.locator(".bubble").last();
    if (mobile) await bubble.click();
    else await bubble.hover();
    await visible(page.getByTitle("Tepki ver").last());
    return bubble;
}
async function returnToSidebar(page, mobile) {
    if (mobile) await page.getByTitle("Geri", { exact: true }).click();
}

await mkdir("test-results", { recursive: true });
const server = await startTestServer({ production: true });
let browser;
let activePage;
const contexts = [];
try {
    browser = await chromium.launch();
    for (const [label, width, height] of [["desktop", 1440, 960], ["mobile", 390, 844]]) {
        console.log(`\n${label}`);
        const mobile = label === "mobile";
        const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
        contexts.push(context);
        await context.tracing.start({ screenshots: true, snapshots: true });
        const peerContext = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
        contexts.push(peerContext);
        const page = await context.newPage();
        activePage = page;
        const peer = await peerContext.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        peer.on("pageerror", (error) => errors.push(error.message));
        const a = await signup(page, server.base, "Deniz Yılmaz");
        const b = await signup(peer, server.base, "Ece Demir");
        check(`${label}: both users register through the UI`, Boolean(a._id && b._id));
        await assertLayout(page, `${label} sidebar`);

        await api(context, server.base, `/friends/send/${b._id}`, "POST");
        const { friendRequests } = await api(peerContext, server.base, "/friends/requests");
        assert.equal(friendRequests.length, 1);
        await api(peerContext, server.base, "/friends/respond", "POST", { requestId: friendRequests[0]._id, response: "accept" });
        await api(context, server.base, `/messages/send/${b._id}`, "POST", { message: "Merhaba! Yeni sohbet alanımıza hoş geldin 👋" });
        await api(peerContext, server.base, `/messages/send/${a._id}`, "POST", { message: "Merhaba Deniz! Burada olmak güzel." });
        await page.reload();
        await page.getByText(b.fullName, { exact: true }).first().click();
        await peer.reload();
        await peer.getByText(a.fullName, { exact: true }).first().click();
        check(`${label}: conversation history renders`, await visible(page.locator(".bubble").filter({ hasText: "Merhaba Deniz! Burada olmak güzel." })));
        const composer = page.locator("textarea").last();
        await composer.fill("Hafta sonu kahve içelim mi? ☕");
        await composer.press("Enter");
        check(`${label}: outgoing message renders`, await visible(page.locator(".bubble").filter({ hasText: "Hafta sonu kahve içelim mi? ☕" })));
        check(`${label}: peer receives the message without reloading`, await visible(peer.locator(".bubble").filter({ hasText: "Hafta sonu kahve içelim mi? ☕" })));
        await eventually(async () => assert.equal(await composer.inputValue(), ""));
        check(`${label}: successful send clears the composer`, true);

        await showActions(page, mobile);
        await page.getByTitle("Tepki ver").last().click();
        check(`${label}: reaction picker opens`, await visible(page.getByTitle("👍", { exact: true })));
        await page.getByTitle("👍", { exact: true }).click();
        await eventually(async () => {
            const messages = await api(context, server.base, `/messages/${b._id}`);
            assert.equal(messages.at(-1).reactions[0]?.emoji, "👍");
        });
        check(`${label}: reaction is persisted`, true);
        await assertLayout(page, `${label} chat`);
        await page.screenshot({ path: `test-results/${label}-chat.png`, fullPage: true, animations: "disabled" });

        // A failed request must preserve the draft so the user can retry.
        await page.route("**/api/messages/send/*", (route) => route.fulfill({
            status: 503, contentType: "application/json", body: JSON.stringify({ message: "Test: geçici bağlantı sorunu" })
        }));
        await composer.fill("Bu taslak kaybolmamalı");
        const failedSend = page.waitForResponse((response) => response.url().includes("/messages/send/") && response.status() === 503);
        await composer.press("Enter");
        await failedSend;
        await eventually(async () => assert.equal(await composer.inputValue(), "Bu taslak kaybolmamalı"));
        check(`${label}: failed send preserves the draft`, true);
        await page.unroute("**/api/messages/send/*");
        await composer.fill("");

        // Settings must be exercised on mobile as well, where the sidebar is hidden in chat.
        await returnToSidebar(page, mobile);
        const settingsButton = page.getByTitle("Hesap ayarları", { exact: true });
        await settingsButton.click();
        const modal = page.getByRole("dialog");
        check(`${label}: settings opens accessibly`, await visible(modal));
        await page.locator("#set-fullname").fill("Deniz Kaya");
        const saved = page.waitForResponse((response) => response.url().endsWith("/api/auth/profile") && response.request().method() === "PUT");
        await page.getByRole("button", { name: "Değişiklikleri kaydet", exact: true }).click();
        assert.ok((await saved).ok());
        await page.keyboard.press("Escape");
        await modal.waitFor({ state: "hidden" });
        check(`${label}: Escape closes settings`, true);
        await page.reload();
        check(`${label}: profile update survives reload`, await visible(page.getByText("Deniz Kaya", { exact: true }).first()));
        await settingsButton.click();
        await page.locator("#set-pic").fill("javascript:alert(1)");
        check(`${label}: unsafe avatar cannot be saved`, await page.getByRole("button", { name: "Değişiklikleri kaydet", exact: true }).isDisabled());
        await page.keyboard.press("Escape");
        await modal.waitFor({ state: "hidden" });
        await eventually(async () => assert.ok(await settingsButton.evaluate((element) => document.activeElement === element)));
        check(`${label}: closing settings restores keyboard focus`, true);

        await page.getByRole("button", { name: "Çıkış yap", exact: true }).click();
        await page.waitForURL("**/login");
        check(`${label}: logout removes the session`, (await context.request.get(`${server.base}/api/auth/me`)).status() === 401);
        await page.reload();
        check(`${label}: logout persists across reload`, await visible(page.getByRole("button", { name: "Giriş yap", exact: true })));
        await assertLayout(page, `${label} login`);
        check(`${label}: no uncaught browser errors`, errors.length === 0, errors.join(" | "));
        await context.tracing.stop({ path: `test-results/${label}-trace.zip` });
        await context.close();
        await peerContext.close();
    }
    console.log(`\n${passed} passed, 0 failed`);
} catch (error) {
    if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: "test-results/failure.png", fullPage: true }).catch(() => {});
    for (const [index, context] of contexts.entries()) await context.tracing.stop({ path: `test-results/failure-trace-${index}.zip` }).catch(() => {});
    console.error(`\nUI test failed after ${passed} checks:`, error);
    process.exitCode = 1;
} finally {
    await browser?.close();
    await server.stop();
}
