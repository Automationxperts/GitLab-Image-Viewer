// Validates the extension and the landing page.
// Run with: node tools/validate.mjs
import { chromium } from "playwright";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensionDir = path.join(root, "extension");
const docsIndex = path.join(root, "docs", "index.html");
const failures = [];

function check(name, ok, detail = "") {
    if (ok) {
        console.log(`PASS  ${name}`);
    } else {
        failures.push(name);
        console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
    }
}

function mockTreeHtml() {
    const names = ["hero_idle.png", "slime_green.png", "icon_sword.png", "notes.txt"];
    const rows = names.map(name => `<tr class="tree-item">
      <td><a class="tree-item-link" data-testid="file-name-link" href="/o/p/-/blob/main/assets/${name}?ref_type=heads">${name}</a></td>
      <td>commit</td><td>now</td></tr>`).join("");
    return `<!doctype html><html><head><meta charset="utf-8"><title>assets · main · o / p · GitLab</title>
    <style>body{margin:0;background:#1f1e24;color:#ececef;font:14px system-ui;padding:24px}
    table{width:100%;border-collapse:collapse;background:#1f1e24}td{padding:8px;border-bottom:1px solid #3f3d47}
    a{color:#ececef;text-decoration:none}</style></head><body>
    <div id="js-tree-list"><table data-testid="file-tree-table"><tbody>${rows}</tbody></table></div>
    </body></html>`;
}

function mockRawSvg(name) {
    const hue = (name.length * 47) % 360;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
      <rect width="256" height="256" fill="hsl(${hue} 70% 40%)"/>
      <circle cx="128" cy="112" r="52" fill="hsl(${hue} 85% 72%)"/>
      <rect x="72" y="168" width="112" height="18" rx="9" fill="hsl(${hue} 85% 82%)"/>
    </svg>`;
}

async function validateDocs(browser) {
    const errors = [];
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("console", msg => {
        if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", err => errors.push(err.message));

    await page.goto(`file:///${docsIndex.replace(/\\/g, "/")}`, { waitUntil: "load" });
    // Scroll the whole page so lazy-loaded screenshots actually load.
    await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 400) {
            window.scrollTo(0, y);
            await new Promise(r => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1200);

    const missingImages = await page.evaluate(() => [...document.images]
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.getAttribute("src")));
    check("docs: all images load", missingImages.length === 0, missingImages.join(", "));

    const meta = await page.evaluate(() => ({
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content || "",
        canonical: document.querySelector('link[rel="canonical"]')?.href || "",
        ogImage: document.querySelector('meta[property="og:image"]')?.content || "",
        h1: document.querySelector("h1")?.textContent?.trim() || ""
    }));
    check("docs: has title", meta.title.length > 20);
    check("docs: has description", meta.description.length > 80);
    check("docs: canonical URL", meta.canonical === "https://AutomationXpert.github.io/Gitlab-Image-Viewer/", meta.canonical);
    check("docs: og image", meta.ogImage.endsWith("/assets/og.png"), meta.ogImage);
    check("docs: single h1", meta.h1.length > 0, meta.h1);

    // The demo controls should change the grid.
    const before = await page.locator("#grid").evaluate(el => getComputedStyle(el).gridTemplateColumns);
    await page.locator("#plus").click();
    await page.locator("#plus").click();
    const after = await page.locator("#grid").evaluate(el => getComputedStyle(el).gridTemplateColumns);
    check("docs: per-row stepper changes layout", before !== after);

    await page.locator("#filter").fill("potion");
    const visible = await page.locator("#grid .tile:not(.hidden)").count();
    const countText = await page.locator("#count").textContent();
    check("docs: filter narrows the demo grid", visible === 2 && /2 of 18/.test(countText), `${visible} / ${countText}`);
    await page.locator("#filter").fill("");

    await page.locator("#size").evaluate(el => {
        el.value = "200";
        el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const sizeText = await page.locator("#sizeOut").textContent();
    check("docs: size slider updates label", sizeText === "200 px", sizeText);

    // Every internal anchor should resolve.
    const badAnchors = await page.evaluate(() => {
        const bad = [];
        for (const a of document.querySelectorAll('a[href^="#"]')) {
            const id = a.getAttribute("href").slice(1);
            if (id && !document.getElementById(id)) bad.push(a.getAttribute("href"));
        }
        return bad;
    });
    check("docs: internal anchors resolve", badAnchors.length === 0, badAnchors.join(", "));

    // No horizontal overflow at phone width.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check("docs: no horizontal overflow at 390px", overflow <= 1, `${overflow}px`);

    check("docs: no console errors", errors.length === 0, errors.join(" | "));

    // Save a preview for manual review.
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(os.tmpdir(), "giv-docs-preview.png"), fullPage: false });
    await page.close();
}

async function validateExtension() {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "giv-validate-"));
    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: true,
        channel: "chromium",
        viewport: { width: 1280, height: 800 },
        args: [
            `--disable-extensions-except=${extensionDir}`,
            `--load-extension=${extensionDir}`,
            "--no-first-run",
            "--no-default-browser-check"
        ]
    });

    const consoleErrors = [];
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent("serviceworker", { timeout: 15000 });
    const extensionId = new URL(worker.url()).host;

    await context.route("https://gitlab.com/**", route => {
        const url = new URL(route.request().url());
        if (url.pathname === "/o/p/-/tree/main/assets") {
            return route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: mockTreeHtml() });
        }
        const raw = url.pathname.match(/^\/o\/p\/-\/raw\/main\/assets\/(.+\.png)$/);
        if (raw) {
            return route.fulfill({ status: 200, contentType: "image/svg+xml", body: mockRawSvg(raw[1]) });
        }
        if (url.pathname === "/o/p/-/blob/main/assets/notes.txt") {
            return route.fulfill({ status: 200, contentType: "text/plain", body: "not an image" });
        }
        return route.fulfill({ status: 204, body: "" });
    });

    const page = await context.newPage();
    page.on("console", msg => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", err => consoleErrors.push(err.message));

    await page.goto("https://gitlab.com/o/p/-/tree/main/assets", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".giv-panel", { timeout: 10000 });

    check("ext: panel injected", await page.locator(".giv-panel").count() === 1);
    check("ext: only image files shown", await page.locator(".giv-item").count() === 3);
    check("ext: non-image excluded", !(await page.locator(".giv-item", { hasText: "notes.txt" }).count()));

    const srcs = await page.locator(".giv-item img").evaluateAll(imgs => imgs.map(img => img.getAttribute("src")));
    check("ext: thumbnails use raw URLs", srcs.every(src => src.includes("/-/raw/")), srcs.join(", "));

    // Filter
    await page.locator(".giv-filter").fill("slime");
    check("ext: filter keeps one item", await page.locator(".giv-item:not(.giv-hidden)").count() === 1);
    check("ext: filter count label", (await page.locator(".giv-count").textContent()).includes("1 of 3"));
    await page.locator(".giv-filter").fill("zzz");
    check("ext: empty state appears", await page.locator(".giv-empty").isVisible());
    await page.locator(".giv-filter").fill("");
    check("ext: filter reset restores items", await page.locator(".giv-item:not(.giv-hidden)").count() === 3);

    // Settings: size and per-row
    await page.locator(".giv-bar input[type=range]").evaluate(el => {
        el.value = "96";
        el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const gridStyle = await page.locator(".giv-grid").evaluate(el => el.getAttribute("style"));
    check("ext: size slider applies", gridStyle.includes("96px"), gridStyle);

    const perRow = page.locator(".giv-bar input[type=number]");
    await perRow.fill("5");
    const cols = await page.locator(".giv-grid").evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    check("ext: per-row applies", cols === 5, `${cols} columns`);

    // Hide file list
    await page.locator(".giv-bar label", { hasText: "Hide file list" }).locator("input").check();
    check("ext: file list hidden", await page.locator("#js-tree-list.giv-hidelist").count() === 1);
    await page.locator(".giv-bar label", { hasText: "Hide file list" }).locator("input").uncheck();
    check("ext: file list restored", await page.locator("#js-tree-list.giv-hidelist").count() === 0);

    // Collapse and expand
    await page.locator(".giv-toggle").click();
    check("ext: collapse hides grid", !(await page.locator(".giv-grid").isVisible()));
    check("ext: toggle label updates", (await page.locator(".giv-toggle").textContent()) === "Show thumbnails");
    await page.locator(".giv-toggle").click();
    check("ext: expand shows grid", await page.locator(".giv-grid").isVisible());

    // Lightbox
    await page.locator(".giv-item").first().click();
    await page.waitForSelector(".giv-lightbox.giv-open", { timeout: 5000 });
    await page.waitForFunction(() => {
        const img = document.querySelector(".giv-lightbox img");
        return img && img.complete && img.naturalWidth > 0;
    }, null, { timeout: 5000 });
    const caption = await page.locator(".giv-lightbox figcaption").textContent();
    check("ext: lightbox caption has dimensions", /256 × 256/.test(caption), caption);
    check("ext: body scroll locked", await page.evaluate(() => document.body.classList.contains("giv-lock")));

    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(100);
    const second = await page.locator(".giv-lightbox figcaption span").textContent();
    check("ext: arrow key navigates", /2 \/ 3/.test(second), second);

    await page.keyboard.press("Escape");
    check("ext: escape closes lightbox", !(await page.locator(".giv-lightbox").evaluate(el => el.classList.contains("giv-open"))));
    check("ext: scroll lock released", !(await page.evaluate(() => document.body.classList.contains("giv-lock"))));

    // Settings persistence across reload
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector(".giv-panel", { timeout: 10000 });
    const persisted = await page.locator(".giv-bar input[type=number]").inputValue();
    check("ext: settings persist after reload", persisted === "5", persisted);

    // SPA-style DOM replacement should rebuild the panel once.
    await page.evaluate(() => {
        const table = document.querySelector('[data-testid="file-tree-table"]');
        table.querySelector("tbody").insertAdjacentHTML("beforeend",
            `<tr class="tree-item"><td><a class="tree-item-link" data-testid="file-name-link" href="/o/p/-/blob/main/assets/portal_rift.png?ref_type=heads">portal_rift.png</a></td><td>c</td><td>now</td></tr>`);
    });
    await page.waitForTimeout(600);
    check("ext: DOM change adds new image", await page.locator(".giv-item").count() === 4);
    check("ext: still only one panel", await page.locator(".giv-panel").count() === 1);

    // Grid saves must not overwrite the options page's instance list.
    await worker.evaluate(() => chrome.storage.local.set({ instances: ["https://gitlab.example.com"] }));
    await page.locator(".giv-bar input[type=number]").fill("6");
    await page.waitForTimeout(300);
    const stored = await worker.evaluate(() => chrome.storage.local.get(null));
    check("ext: saving grid settings keeps instances", (
        Array.isArray(stored.instances) && stored.instances[0] === "https://gitlab.example.com"
    ), JSON.stringify(stored.instances));
    await worker.evaluate(() => chrome.storage.local.set({ instances: [] }));

    // Options page
    const options = await context.newPage();
    const optionErrors = [];
    options.on("console", msg => {
        if (msg.type() === "error") optionErrors.push(msg.text());
    });
    options.on("pageerror", err => optionErrors.push(err.message));
    await options.goto(`chrome-extension://${extensionId}/options.html`, { waitUntil: "domcontentloaded" });
    await options.waitForSelector("#instances", { timeout: 5000 });
    const headings = await options.locator("h2").allTextContents();
    check("ext: options shows built-in gitlab.com", headings.includes("gitlab.com"), headings.join(", "));
    check("ext: options footer link", await options.locator('footer a[href$="privacy.html"]').count() === 1);

    // Reject invalid input without touching permissions.
    await options.locator("#origin").fill("not a url");
    await options.locator('#add-form button[type="submit"]').click();
    await options.waitForTimeout(300);
    const status = await options.locator("#message").textContent();
    check("ext: invalid instance is rejected", /valid/i.test(status), status);
    check("ext: invalid instance is not listed", await options.locator("#instances .empty").count() === 1);
    check("ext: add button re-enabled", await options.locator('#add-form button[type="submit"]').isEnabled());

    const normalized = await options.evaluate(() => {
        const n = window.GIVShared.normalizeOrigin;
        return {
            spaces: n("not a url"),
            bare: n("gitlab.example.com"),
            subpath: n("https://example.com/gitlab"),
            ftp: n("ftp://example.com"),
            local: n("http://localhost:8080"),
            creds: n("https://user:pass@example.com"),
            builtin: n("https://gitlab.com/group/project"),
            empty: n("")
        };
    });
    check("ext: origin normalization", (
        normalized.spaces === "" &&
        normalized.bare === "https://gitlab.example.com" &&
        normalized.subpath === "https://example.com" &&
        normalized.ftp === "" &&
        normalized.local === "http://localhost:8080" &&
        normalized.creds === "" &&
        normalized.builtin === "https://gitlab.com" &&
        normalized.empty === ""
    ), JSON.stringify(normalized));

    check("ext: no console errors on GitLab page", consoleErrors.length === 0, consoleErrors.join(" | "));
    check("ext: no console errors on options page", optionErrors.length === 0, optionErrors.join(" | "));

    await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
}

const browser = await chromium.launch({ headless: true });
await validateDocs(browser);
await browser.close();
await validateExtension();

console.log("");
if (failures.length) {
    console.log(`${failures.length} check(s) failed:`);
    for (const name of failures) console.log(` - ${name}`);
    process.exitCode = 1;
} else {
    console.log("All checks passed.");
}
