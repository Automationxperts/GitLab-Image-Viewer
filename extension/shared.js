// Shared helpers for the options page and the background service worker.
(() => {
    "use strict";

    const BUILTIN = "https://gitlab.com";
    const PREFIX = "giv-";

    function normalizeOrigin(input) {
        let value = String(input || "").trim();
        if (!value) return "";
        // Spaces and control characters are never valid in a host, and the URL
        // parser would happily percent-encode them into a bogus origin.
        if (/\s/.test(value)) return "";
        if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) value = "https://" + value;
        let url;
        try {
            url = new URL(value);
        } catch (e) {
            return "";
        }
        if (url.protocol !== "http:" && url.protocol !== "https:") return "";
        if (url.username || url.password) return "";
        const host = url.hostname;
        const validHost = host === "localhost" ||
            /^\[[0-9a-f:.]+\]$/i.test(host) ||
            /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i.test(host);
        if (!validHost) return "";
        return url.origin;
    }

    function hash(value) {
        let h = 2166136261;
        for (let i = 0; i < value.length; i++) {
            h ^= value.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return (h >>> 0).toString(36);
    }

    function idFor(origin) {
        const slug = origin
            .replace(/^https?:\/\//i, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 24);
        return `${PREFIX}${slug}-${hash(origin)}`;
    }

    function isBuiltin(origin) {
        return origin === BUILTIN || origin === "http://gitlab.com";
    }

    async function getInstances() {
        try {
            const stored = await chrome.storage.local.get({ instances: [] });
            const list = Array.isArray(stored.instances) ? stored.instances : [];
            return [...new Set(list.filter(item => typeof item === "string" && item))];
        } catch (e) {
            return [];
        }
    }

    async function setInstances(list) {
        const clean = [...new Set(list.filter(item => typeof item === "string" && item))].sort();
        await chrome.storage.local.set({ instances: clean });
        return clean;
    }

    globalThis.GIVShared = {
        BUILTIN,
        PREFIX,
        normalizeOrigin,
        idFor,
        isBuiltin,
        getInstances,
        setInstances
    };
})();
