// Tarayıcı arayüzü testi.
//
// Gerçek bir tarayıcı açar, uygulamayı kullanıcı gibi sürer ve arayüzün
// bozulup bozulmadığını ölçer: taşma, ikon/metin çakışması, konsol hatası,
// ve emoji seçici gibi etkileşimlerin gerçekten çalışıp çalışmadığı.
//
// HTTP ve socket testleri sunucunun doğru çalıştığını gösterir; bu test
// kullanıcının gördüğü tarafın doğru çalıştığını gösterir.
//
// Çalıştırmak için: npm run test:ui
// Playwright gerektirir: npx playwright install chromium

import { spawn } from "child_process";
import { chromium } from "playwright";

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

const user = (n) => ({
    fullName: `UI ${n}`,
    username: `ui_${n}_${Date.now().toString(36).slice(-5)}`,
    password: "pass1234",
    gender: n % 2 === 0 ? "Kadın" : "Erkek"
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

// Kayıt olup uygulamaya giren bir sayfa döndürür
async function signUp(browser, width, height, who) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height });

    const errors = [];
    page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text().slice(0, 120));
    });

    await page.goto(`${BASE}/signup`);
    await page.fill("#fullName", who.fullName);
    await page.fill("#username", who.username);
    await page.fill("#password", who.password);
    await page.fill("#confirmPassword", who.password);
    await page.locator("label:has(input[type=checkbox])").first().click();
    await page.click("button[type=submit]");
    await page.waitForTimeout(3000);

    return { page, errors };
}

// Sayfadaki her öğenin görünüm alanı içinde kaldığını doğrula
const findOverflow = (page) =>
    page.evaluate(() => {
        const vw = window.innerWidth;
        return [...document.querySelectorAll("body *")].filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && (r.right > vw + 1 || r.left < -1);
        }).length;
    });

// Bir input'un ikonunun metnin üstüne binip binmediğini doğrula
const findIconOverlap = (page) =>
    page.evaluate(() => {
        let hits = 0;
        for (const input of document.querySelectorAll("input, textarea")) {
            const parent = input.parentElement;
            if (!parent) continue;
            const cs = getComputedStyle(input);
            const box = input.getBoundingClientRect();
            const textStart = box.left + parseFloat(cs.paddingLeft);
            const textEnd = box.right - parseFloat(cs.paddingRight);
            for (const glyph of parent.querySelectorAll("svg, button")) {
                const g = glyph.getBoundingClientRect();
                if (g.width === 0) continue;
                const mid = box.left + box.width / 2;
                if (g.right > textStart + 1 && g.left < mid) hits++;
                if (g.left < textEnd - 1 && g.left > mid) hits++;
            }
        }
        return hits;
    });

async function run() {
    console.log("Starting server...");
    const server = spawn("node", ["backend/server.js"], {
        stdio: ["ignore", "inherit", "inherit"],
        env: process.env
    });

    let exitCode = 1;
    let browser;

    try {
        if (!(await waitForServer())) {
            console.error("Server did not become healthy in time");
            return;
        }

        browser = await chromium.launch();

        for (const [label, width, height] of [
            ["desktop", 1280, 800],
            ["mobile", 390, 844]
        ]) {
            console.log(`\n${label}`);

            const a = user(1);
            const b = user(2);
            const { page, errors } = await signUp(browser, width, height, a);
            check(`${label}: signup lands in the app`, await page.locator("text=Sohbetler").isVisible().catch(() => false));

            check(`${label}: nothing overflows the viewport`, (await findOverflow(page)) === 0);
            check(`${label}: no icon sits on an input's text`, (await findIconOverlap(page)) === 0);

            // İkinci kullanıcı, sohbet edebilmek için
            const second = await signUp(browser, width, height, b);
            const peerId = await second.page.evaluate(async () =>
                (await (await fetch("/api/auth/me")).json()).user._id
            );
            await second.page.close();

            // Arkadaşlık kurup mesajlaş
            await page.evaluate(async (id) => {
                await fetch(`/api/messages/send/${id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: "ui test" })
                });
            }, peerId);
            await page.reload();
            await page.waitForTimeout(2500);

            const tile = page.locator(`text=${b.fullName}`).first();
            if (await tile.count()) {
                await tile.click();
                await page.waitForTimeout(2000);

                if (label === "mobile") {
                    const back = page.locator('[title="Geri"]');
                    check("mobile: back button is reachable", await back.isVisible().catch(() => false));
                }

                // Mesaj gönder
                const composer = page.locator("textarea");
                await composer.fill("merhaba");
                await composer.press("Enter");
                await page.waitForTimeout(2200);
                check(`${label}: message appears after sending`, (await page.locator("text=merhaba").count()) > 0);

                // Tepki: seçici açılmalı ve açık kalmalı
                const bubble = page.locator(".bubble").last();
                if (label === "mobile") await bubble.click();
                else await bubble.hover();
                await page.waitForTimeout(600);

                const reactButton = page.locator('[title="Tepki ver"]').last();
                if (await reactButton.isVisible().catch(() => false)) {
                    await reactButton.click();
                    await page.waitForTimeout(400);
                    check(`${label}: reaction picker opens`, await page.locator('[title="👍"]').isVisible().catch(() => false));

                    // Beklemek seçiciyi kapatmamalı
                    await page.waitForTimeout(900);
                    check(`${label}: picker stays open while reaching for it`,
                        await page.locator('[title="👍"]').isVisible().catch(() => false));

                    await page.locator('[title="👍"]').click();
                    await page.waitForTimeout(2000);
                    const html = await bubble.locator("xpath=../..").innerHTML();
                    check(`${label}: reaction is applied`, html.includes("👍"));
                } else {
                    check(`${label}: reaction button is reachable`, false, "not visible");
                }
            }

            check(`${label}: no console errors`, errors.length === 0, errors.slice(0, 2).join(" | "));
            await page.close();
        }

        console.log(`\n${passed} passed, ${failed} failed`);
        exitCode = failed === 0 ? 0 : 1;
    } catch (error) {
        console.error("\nUI test crashed:", error);
        exitCode = 1;
    } finally {
        await browser?.close();
        server.kill("SIGTERM");
        setTimeout(() => process.exit(exitCode), 300);
    }
}

run();
