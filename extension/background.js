// GitLab Image Viewer — background service worker.
// Keeps the dynamically registered content scripts in sync with the
// self-hosted GitLab instances the user has enabled.
importScripts("shared.js");

const { PREFIX, idFor, getInstances, setInstances } = GIVShared;

async function sync() {
    const stored = await getInstances();
    const permitted = [];

    for (const origin of stored) {
        let allowed = false;
        try {
            allowed = await chrome.permissions.contains({ origins: [`${origin}/*`] });
        } catch (e) {
            allowed = false;
        }
        if (allowed) permitted.push(origin);
    }

    if (permitted.length !== stored.length) await setInstances(permitted);

    const registered = await chrome.scripting.getRegisteredContentScripts();
    const wanted = new Map(permitted.map(origin => [idFor(origin), origin]));

    const stale = registered
        .filter(script => script.id.startsWith(PREFIX) && !wanted.has(script.id))
        .map(script => script.id);
    if (stale.length) {
        await chrome.scripting.unregisterContentScripts({ ids: stale });
    }

    const existing = new Set(registered.map(script => script.id));
    const toAdd = [];
    for (const [id, origin] of wanted) {
        if (existing.has(id)) continue;
        toAdd.push({
            id,
            matches: [`${origin}/*`],
            js: ["content.js"],
            css: ["content.css"],
            runAt: "document_idle",
            allFrames: false,
            persistAcrossSessions: true
        });
    }

    if (toAdd.length) {
        try {
            await chrome.scripting.registerContentScripts(toAdd);
        } catch (e) {
            // Another sync may have registered some of them concurrently.
            for (const script of toAdd) {
                try {
                    await chrome.scripting.registerContentScripts([script]);
                } catch (ignored) {
                    // Already registered, or the host permission vanished.
                }
            }
        }
    }

    return permitted;
}

chrome.runtime.onInstalled.addListener(() => {
    sync().catch(err => console.warn("GitLab Image Viewer sync failed:", err));
});

chrome.runtime.onStartup.addListener(() => {
    sync().catch(err => console.warn("GitLab Image Viewer sync failed:", err));
});

chrome.permissions.onAdded.addListener(() => {
    sync().catch(err => console.warn("GitLab Image Viewer sync failed:", err));
});

chrome.permissions.onRemoved.addListener(() => {
    sync().catch(err => console.warn("GitLab Image Viewer sync failed:", err));
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== "giv-sync") return false;
    sync()
        .then(instances => sendResponse({ ok: true, instances }))
        .catch(err => sendResponse({ ok: false, error: err.message || String(err) }));
    return true;
});

chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});
