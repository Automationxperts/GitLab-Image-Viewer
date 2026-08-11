// GitLab Image Viewer — options page.
(() => {
    "use strict";

    const { normalizeOrigin, isBuiltin, getInstances, setInstances } = GIVShared;

    const form = document.getElementById("add-form");
    const input = document.getElementById("origin");
    const list = document.getElementById("instances");
    const message = document.getElementById("message");
    const submit = form.querySelector('button[type="submit"]');

    let busy = false;

    function say(text, kind = "") {
        message.textContent = text;
        message.className = `message ${kind}`.trim();
    }

    function sendSync() {
        return new Promise(resolve => {
            try {
                chrome.runtime.sendMessage({ type: "giv-sync" }, response => {
                    if (chrome.runtime.lastError) {
                        resolve({ ok: false, error: chrome.runtime.lastError.message });
                    } else {
                        resolve(response || { ok: false, error: "No response from the extension." });
                    }
                });
            } catch (err) {
                resolve({ ok: false, error: err.message || String(err) });
            }
        });
    }

    async function hasPermission(origin) {
        try {
            return await chrome.permissions.contains({ origins: [`${origin}/*`] });
        } catch (err) {
            return false;
        }
    }

    function badge(text, kind) {
        const span = document.createElement("span");
        span.className = `badge ${kind}`;
        span.textContent = text;
        return span;
    }

    function action(text, kind, handler) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `btn btn-small ${kind}`.trim();
        button.textContent = text;
        button.addEventListener("click", handler);
        return button;
    }

    async function grant(origin) {
        let granted = false;
        try {
            granted = await chrome.permissions.request({ origins: [`${origin}/*`] });
        } catch (err) {
            say(`Could not request access: ${err.message || err}`, "error");
            return;
        }
        if (!granted) {
            say("Permission was not granted.", "error");
            return;
        }
        const result = await sendSync();
        if (!result.ok) {
            say(`Could not activate ${origin}: ${result.error}`, "error");
            return;
        }
        say(`Access granted for ${origin}. Reload its GitLab tabs.`, "ok");
        refresh();
    }

    async function remove(origin) {
        const instances = await getInstances();
        await setInstances(instances.filter(item => item !== origin));
        try {
            await chrome.permissions.remove({ origins: [`${origin}/*`] });
        } catch (err) {
            // The permission may already be gone.
        }
        const result = await sendSync();
        if (!result.ok) {
            say(`Removed ${origin}, but cleanup failed: ${result.error}`, "error");
        } else {
            say(`Removed ${origin}.`, "ok");
        }
        refresh();
    }

    async function render() {
        const instances = await getInstances();
        list.textContent = "";

        if (!instances.length) {
            const empty = document.createElement("li");
            empty.className = "empty";
            empty.textContent = "No self-hosted instances yet.";
            list.append(empty);
            return;
        }

        for (const origin of instances) {
            const allowed = await hasPermission(origin);

            const item = document.createElement("li");
            const info = document.createElement("div");
            info.className = "instance-info";

            const name = document.createElement("span");
            name.className = "instance-name";
            name.textContent = origin;

            info.append(name, badge(allowed ? "Active" : "Permission needed", allowed ? "ok" : "warn"));

            const actions = document.createElement("div");
            actions.className = "instance-actions";
            if (!allowed) {
                actions.append(action("Grant access", "btn-ghost", () => grant(origin)));
            }
            actions.append(action("Remove", "btn-ghost", () => remove(origin)));

            item.append(info, actions);
            list.append(item);
        }
    }

    function refresh() {
        render().catch(err => say(`Could not read settings: ${err.message || err}`, "error"));
    }

    form.addEventListener("submit", async e => {
        e.preventDefault();
        if (busy) return;

        const origin = normalizeOrigin(input.value);
        if (!origin) {
            say("Enter a valid http:// or https:// address.", "error");
            return;
        }
        if (isBuiltin(origin)) {
            say("gitlab.com is already supported.", "info");
            return;
        }

        busy = true;
        submit.disabled = true;
        try {
            // Ask for the origin first: chrome.permissions.request must run
            // inside the user gesture, before any other await.
            let granted = false;
            try {
                granted = await chrome.permissions.request({ origins: [`${origin}/*`] });
            } catch (err) {
                say(`Could not request access: ${err.message || err}`, "error");
                return;
            }
            if (!granted) {
                say("Permission was not granted, so the instance was not added.", "error");
                return;
            }

            const instances = await getInstances();
            if (instances.includes(origin)) {
                say("That instance is already in the list.", "info");
                input.value = "";
                return;
            }

            await setInstances([...instances, origin]);
            const result = await sendSync();
            if (!result.ok) {
                say(`Added ${origin}, but activation failed: ${result.error}`, "error");
                return;
            }

            input.value = "";
            say(`Added ${origin}. Reload its open GitLab tabs to see thumbnails.`, "ok");
            refresh();
        } finally {
            busy = false;
            submit.disabled = false;
        }
    });

    chrome.permissions.onAdded.addListener(refresh);
    chrome.permissions.onRemoved.addListener(refresh);
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local" && changes.instances) refresh();
    });

    document.getElementById("year").textContent = new Date().getFullYear();

    (async () => {
        const result = await sendSync();
        if (!result.ok) say(`Could not sync instances: ${result.error}`, "error");
        refresh();
    })();
})();
