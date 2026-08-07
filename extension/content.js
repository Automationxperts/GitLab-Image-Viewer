// GitLab Image Viewer
// Adds a thumbnail grid above the file list of any GitLab repository folder
// that contains images, plus a full-size lightbox. Settings are kept in
// chrome.storage.local.
(() => {
    "use strict";

    // The same extension can be injected by both the built-in gitlab.com
    // content script and a user-registered self-hosted instance.
    if (window.__givLoaded) return;
    window.__givLoaded = true;

    const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg|avif|ico)$/i;
    const defaults = { size: 160, perRow: 0, showNames: true, hideList: false, open: true };
    let settings = { ...defaults };
    let lastKey = "";
    let images = [];
    let order = [];
    let current = 0;
    let lastFocus = null;
    let box = null;

    const store = {
        load: () => new Promise(resolve => {
            try {
                chrome.storage.local.get(Object.keys(defaults), v => {
                    const next = { ...defaults };
                    for (const key of Object.keys(defaults)) {
                        if (v && key in v) next[key] = v[key];
                    }
                    resolve(next);
                });
            } catch (e) {
                resolve({ ...defaults });
            }
        }),
        save: () => {
            try {
                // Only write the grid keys: storage also holds the self-hosted
                // instance list, which the options page owns.
                const { size, perRow, showNames, hideList, open } = settings;
                chrome.storage.local.set({ size, perRow, showNames, hideList, open });
            } catch (e) {
                // Settings simply don't persist.
            }
        }
    };

    //-------------------------------------------------------------------------
    // GitLab page reading

    // GitLab renders the repository tree in a Vue app mounted at #js-tree-list.
    // Newer versions use data-testid="file-tree-table"; older ones use
    // table.tree-table. Both expose a.tree-item-link links to /-/blob/.
    function findTable() {
        return document.querySelector('table[data-testid="file-tree-table"]') ||
            document.querySelector('#js-tree-list table.tree-table') ||
            document.querySelector('#js-tree-list table') ||
            document.querySelector('table.tree-table');
    }

    function findHost(table) {
        const mount = document.getElementById('js-tree-list');
        if (mount && mount.contains(table)) return mount;
        return table.parentElement;
    }

    function findImages(table) {
        const links = table.querySelectorAll(
            'tr.tree-item a[data-testid="file-name-link"], ' +
            'tr.tree-item a.tree-item-link, ' +
            'tr.tree-item a[href*="/-/blob/"]'
        );
        const seen = new Map();
        for (const a of links) {
            const raw = a.getAttribute("href");
            if (!raw) continue;
            let url;
            try {
                url = new URL(raw, location.origin);
            } catch (e) {
                continue;
            }
            if (url.origin !== location.origin) continue;
            const path = url.pathname;
            if (!path.includes("/-/blob/") || !IMAGE_EXT.test(path)) continue;
            if (seen.has(path)) continue;
            let name;
            try {
                name = decodeURIComponent(path.split("/").pop());
            } catch (e) {
                name = path.split("/").pop();
            }
            seen.set(path, {
                href: path + url.search,
                name,
                src: path.replace("/-/blob/", "/-/raw/") + url.search
            });
        }
        return [...seen.values()];
    }

    //-------------------------------------------------------------------------
    // Grid

    function clearHide() {
        document.querySelectorAll(".giv-hidelist").forEach(el => el.classList.remove("giv-hidelist"));
    }

    function layout(panel) {
        const grid = panel.querySelector(".giv-grid");
        grid.style.gridTemplateColumns = settings.perRow > 0
            ? `repeat(${settings.perRow}, minmax(0, 1fr))`
            : `repeat(auto-fill, minmax(${settings.size}px, 1fr))`;
        grid.style.setProperty("--giv-size", `${settings.size}px`);
        grid.classList.toggle("giv-nonames", !settings.showNames);
        grid.style.display = settings.open ? "" : "none";

        const toggle = panel.querySelector(".giv-toggle");
        toggle.textContent = settings.open ? "Hide thumbnails" : "Show thumbnails";
        toggle.setAttribute("aria-expanded", String(settings.open));

        const table = findTable();
        const host = table ? findHost(table) : null;
        document.querySelectorAll(".giv-hidelist").forEach(el => {
            if (el !== host) el.classList.remove("giv-hidelist");
        });
        if (host) host.classList.toggle("giv-hidelist", settings.open && settings.hideList);
    }

    function control(labelText, html, key, read) {
        const label = document.createElement("label");
        label.className = "giv-control";
        if (labelText) {
            const span = document.createElement("span");
            span.textContent = labelText;
            label.append(span);
        }
        label.insertAdjacentHTML("beforeend", html);
        const input = label.querySelector("input");
        input.addEventListener("input", () => {
            settings[key] = read(input);
            const out = label.querySelector("output");
            if (out) out.textContent = input.value;
            store.save();
            const panel = label.closest(".giv-panel");
            if (panel) layout(panel);
        });
        // Keep number inputs honest after a free-form edit.
        input.addEventListener("change", () => {
            if (input.type === "number") input.value = settings[key];
        });
        return label;
    }

    function applyFilter(panel) {
        const input = panel.querySelector(".giv-filter");
        const q = input ? input.value.trim().toLowerCase() : "";
        const items = panel.querySelectorAll(".giv-item");
        order = [];
        images.forEach((im, index) => {
            const match = !q || im.name.toLowerCase().includes(q);
            if (items[index]) items[index].classList.toggle("giv-hidden", !match);
            if (match) order.push(index);
        });

        const count = panel.querySelector(".giv-count");
        if (count) {
            count.textContent = q
                ? `${order.length} of ${images.length} image${images.length === 1 ? "" : "s"}`
                : `${images.length} image${images.length === 1 ? "" : "s"}`;
        }
        const empty = panel.querySelector(".giv-empty");
        if (empty) empty.hidden = order.length > 0;

        // The lightbox follows the filtered order, so close it when that changes.
        if (box && box.classList.contains("giv-open")) closeLightbox();
    }

    function build(table) {
        const panel = document.createElement("div");
        panel.className = "giv-panel";
        panel.setAttribute("role", "region");
        panel.setAttribute("aria-label", "Image thumbnails");

        const bar = document.createElement("div");
        bar.className = "giv-bar";

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "giv-toggle";
        toggle.addEventListener("click", () => {
            settings.open = !settings.open;
            store.save();
            layout(panel);
        });

        const filter = document.createElement("input");
        filter.type = "search";
        filter.className = "giv-filter";
        filter.placeholder = "Filter images\u2026";
        filter.setAttribute("aria-label", "Filter images by file name");
        filter.addEventListener("input", () => applyFilter(panel));

        const count = document.createElement("span");
        count.className = "giv-count";
        count.setAttribute("aria-live", "polite");

        bar.append(
            toggle,
            control("Size", `<input type="range" min="48" max="512" step="8" value="${settings.size}" aria-label="Thumbnail size"><output>${settings.size}</output>px`,
                "size", i => Number(i.value)),
            control("Per row", `<input type="number" min="0" max="20" value="${settings.perRow}" title="0 = fit as many as the size allows" aria-label="Images per row">`,
                "perRow", i => Math.max(0, Math.min(20, Number(i.value) || 0))),
            control("", `<input type="checkbox" ${settings.showNames ? "checked" : ""}> Names`, "showNames", i => i.checked),
            control("", `<input type="checkbox" ${settings.hideList ? "checked" : ""}> Hide file list`, "hideList", i => i.checked),
            filter,
            count
        );

        const grid = document.createElement("div");
        grid.className = "giv-grid";
        images.forEach((im, index) => {
            const a = document.createElement("a");
            a.className = "giv-item";
            a.href = im.href;
            a.title = im.name;
            a.addEventListener("click", e => {
                // Plain click opens the lightbox; modified clicks keep the link.
                if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                openLightbox(index);
            });
            const img = document.createElement("img");
            img.loading = "lazy";
            img.decoding = "async";
            img.alt = im.name;
            img.src = im.src;
            img.addEventListener("error", () => a.classList.add("giv-broken"));
            const name = document.createElement("span");
            name.textContent = im.name;
            a.append(img, name);
            grid.append(a);
        });

        const empty = document.createElement("p");
        empty.className = "giv-empty";
        empty.hidden = true;
        empty.textContent = "No images match that filter.";

        panel.append(bar, grid, empty);
        insertPanel(panel, table);
        applyFilter(panel);
        layout(panel);
    }

    function insertPanel(panel, table) {
        const host = findHost(table);
        if (host && host.parentElement) {
            host.parentElement.insertBefore(panel, host);
            return;
        }
        if (table.parentElement) table.parentElement.insertBefore(panel, table);
    }

    //-------------------------------------------------------------------------
    // Lightbox

    function buildLightbox() {
        box = document.createElement("div");
        box.className = "giv-lightbox";
        box.setAttribute("role", "dialog");
        box.setAttribute("aria-modal", "true");
        box.setAttribute("aria-label", "Image preview");
        box.innerHTML = `
            <button type="button" class="giv-lb-close" aria-label="Close image preview">&times;</button>
            <button type="button" class="giv-lb-prev" aria-label="Previous image">&#8249;</button>
            <figure><img alt=""><figcaption><a target="_blank" rel="noopener noreferrer"></a><span></span></figcaption></figure>
            <button type="button" class="giv-lb-next" aria-label="Next image">&#8250;</button>`;

        box.addEventListener("click", e => {
            if (e.target === box || e.target.closest(".giv-lb-close")) closeLightbox();
            else if (e.target.closest(".giv-lb-prev")) step(-1);
            else if (e.target.closest(".giv-lb-next")) step(1);
        });

        box.addEventListener("keydown", e => {
            if (e.key !== "Tab") return;
            const focusable = [...box.querySelectorAll("button, a[href]")].filter(el => !el.disabled);
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        });

        const img = box.querySelector("img");
        img.addEventListener("load", () => {
            // Small images are scaled up; keep their pixels sharp.
            img.classList.toggle("giv-pixel", Math.max(img.naturalWidth, img.naturalHeight) < 256);
            updateCaption();
        });
        img.addEventListener("error", () => {
            img.classList.remove("giv-pixel");
            const span = box.querySelector("figcaption span");
            if (span) span.textContent = "Preview unavailable";
        });

        document.body.append(box);
    }

    function updateCaption() {
        if (!box) return;
        const im = images[order[current]];
        if (!im) return;
        const img = box.querySelector("img");
        const link = box.querySelector("figcaption a");
        link.href = im.href;
        link.textContent = im.name;
        const dims = img.naturalWidth && img.naturalHeight
            ? `${img.naturalWidth} \u00d7 ${img.naturalHeight} \u00b7 `
            : "";
        box.querySelector("figcaption span").textContent =
            `${dims}${current + 1} / ${order.length}`;
    }

    function show() {
        const im = images[order[current]];
        if (!im) return;
        const img = box.querySelector("img");
        img.classList.remove("giv-pixel");
        img.src = im.src;
        img.alt = im.name;
        const link = box.querySelector("figcaption a");
        link.href = im.href;
        link.textContent = im.name;
        box.querySelector("figcaption span").textContent = `${current + 1} / ${order.length}`;
    }

    function step(delta) {
        if (!order.length) return;
        current = (current + delta + order.length) % order.length;
        show();
    }

    function openLightbox(index) {
        if (!order.length) return;
        const position = order.indexOf(index);
        if (position === -1) return;
        if (!box) buildLightbox();
        current = position;
        lastFocus = document.activeElement;
        show();
        box.classList.add("giv-open");
        document.body.classList.add("giv-lock");
        const close = box.querySelector(".giv-lb-close");
        if (close) close.focus({ preventScroll: true });
    }

    function closeLightbox() {
        if (!box) return;
        const wasOpen = box.classList.contains("giv-open");
        box.classList.remove("giv-open");
        document.body.classList.remove("giv-lock");
        if (wasOpen && lastFocus && typeof lastFocus.focus === "function") {
            lastFocus.focus({ preventScroll: true });
        }
        lastFocus = null;
    }

    document.addEventListener("keydown", e => {
        if (!box || !box.classList.contains("giv-open")) return;
        if (e.key === "Escape") closeLightbox();
        else if (e.key === "ArrowLeft") step(-1);
        else if (e.key === "ArrowRight") step(1);
        else if (e.key === "Home") {
            current = 0;
            show();
        } else if (e.key === "End") {
            current = order.length - 1;
            show();
        } else return;
        e.preventDefault();
        e.stopPropagation();
    }, true);

    //-------------------------------------------------------------------------
    // Page tracking

    function refresh() {
        const table = findTable();
        const existing = document.querySelector(".giv-panel");

        if (!table) {
            if (existing) {
                clearHide();
                existing.remove();
            }
            lastKey = "";
            return;
        }

        const found = findImages(table);
        const key = location.pathname + location.search + "|" + found.map(i => i.href).join(",");
        const host = findHost(table);

        if (existing && key === lastKey) {
            if (host && existing.nextElementSibling !== host && host.parentElement) {
                host.parentElement.insertBefore(existing, host);
            }
            layout(existing);
            return;
        }

        if (existing) {
            clearHide();
            existing.remove();
        }
        closeLightbox();
        lastKey = key;
        images = found;
        if (images.length) build(table);
    }

    let timer = 0;
    const schedule = () => {
        clearTimeout(timer);
        timer = setTimeout(refresh, 200);
    };

    store.load().then(v => {
        settings = { ...defaults, ...v };
        refresh();
        // GitLab's repository browser is a Vue app, so watch the DOM for new
        // folders and for client-side route changes.
        new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
        document.addEventListener("turbo:load", schedule);
        document.addEventListener("pjax:end", schedule);
        window.addEventListener("popstate", schedule);
        window.addEventListener("hashchange", schedule);
    });
})();
