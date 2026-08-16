// Renders the extension icons, store art, and screenshots.
// Run with: npm run assets
import { chromium } from "playwright";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensionDir = path.join(root, "extension");
const docsAssets = path.join(root, "docs", "assets");
const storeDir = path.join(root, "store");
const iconDir = path.join(extensionDir, "icons");

for (const dir of [docsAssets, storeDir, iconDir]) {
    fs.mkdirSync(dir, { recursive: true });
}

const iconSvg = fs.readFileSync(path.join(docsAssets, "icon.svg"), "utf8");
const iconSmallSvg = fs.readFileSync(path.join(docsAssets, "icon-small.svg"), "utf8");
const iconDataUri = `data:image/svg+xml;base64,${Buffer.from(iconSvg).toString("base64")}`;

const palettes = {
    hero_idle: ["#8b5cf6", "#2a1a6e"],
    hero_run_01: ["#a78bfa", "#3b1d8f"],
    hero_run_02: ["#c4b5fd", "#4c1d95"],
    slime_green: ["#5eead4", "#047857"],
    icon_sword: ["#93c5fd", "#1e3a8a"],
    icon_shield: ["#fcd34d", "#b45309"],
    potion_red: ["#fb7185", "#9f1239"],
    potion_blue: ["#60a5fa", "#1e40af"],
    chest_gold: ["#fbbf24", "#92400e"],
    gem_violet: ["#d8b4fe", "#6b21a8"],
    tree_oak: ["#86efac", "#166534"],
    rock_basalt: ["#cbd5e1", "#334155"],
    portal_rift: ["#67e8f9", "#4c1d95"],
    coin_spin: ["#fde68a", "#b45309"],
    key_iron: ["#e2e8f0", "#475569"],
    map_marker: ["#fdba74", "#c2410c"],
    torch_lit: ["#fcd34d", "#b91c1c"],
    crown_relic: ["#fde047", "#a16207"],
    tileset_forest: ["#4ade80", "#14532d"],
    sprite_sheet: ["#c4b5fd", "#5b21b6"]
};

const pixelArt = new Set(["slime_green", "coin_spin", "key_iron", "map_marker"]);

function defsFor(p) {
    return `
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${p[0]}"/>
        <stop offset="1" stop-color="${p[1]}"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="32%" r="62%">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".30"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>`;
}

function gridLines() {
    return `<g stroke="#ffffff" stroke-opacity=".055" stroke-width="2">
      <path d="M0 128H512M0 256H512M0 384H512M128 0V512M256 0V512M384 0V512"/>
    </g>`;
}

function shadow() {
    return `<ellipse cx="256" cy="442" rx="150" ry="24" fill="#000000" opacity=".28"/>`;
}

function shape512(name) {
    switch (name) {
        case "hero_idle":
            return `${shadow()}
            <circle cx="256" cy="148" r="54" fill="#f5e6ff" opacity=".96"/>
            <path d="M200 196 Q256 112 312 196 L304 258 Q256 220 208 258 Z" fill="#241542"/>
            <path d="M168 470 Q168 322 210 276 Q256 238 302 276 Q344 322 344 470 Z" fill="#1a0f33"/>
            <path d="M210 470 Q210 352 230 310 Q256 282 282 310 Q302 352 302 470 Z" fill="#7c5cff" opacity=".55"/>
            <path d="M330 276 L382 430" stroke="#e9d5ff" stroke-width="13" stroke-linecap="round"/>
            <path d="M356 262 L396 282" stroke="#fcd34d" stroke-width="13" stroke-linecap="round"/>
            <circle cx="382" cy="438" r="12" fill="#fcd34d"/>
            <path d="M112 300 l24 -8 -14 22 -22 4 z" fill="#c4b5fd" opacity=".7"/>
            <circle cx="126" cy="254" r="5" fill="#ffffff" opacity=".8"/>`;
        case "hero_run_01":
        case "hero_run_02": {
            const lean = name.endsWith("02") ? -18 : 18;
            return `${shadow()}
            <g transform="translate(${lean} 0)">
              <circle cx="266" cy="150" r="48" fill="#f5e6ff" opacity=".95"/>
              <path d="M218 194 Q266 124 314 194 L306 250 Q266 218 226 250 Z" fill="#241542"/>
              <path d="M204 460 Q214 330 246 282 Q266 252 286 282 Q318 330 328 460 Z" fill="#1a0f33"/>
              <path d="M214 460 Q222 356 238 314 Q262 286 284 314 Q302 356 310 460 Z" fill="#8b5cf6" opacity=".55"/>
              <path d="M212 430 L170 470 M320 420 L360 450" stroke="#241542" stroke-width="24" stroke-linecap="round"/>
              <path d="M340 300 L400 330" stroke="#e9d5ff" stroke-width="12" stroke-linecap="round"/>
            </g>
            <g stroke="#c4b5fd" stroke-opacity=".45" stroke-width="8" stroke-linecap="round">
              <path d="M100 250H52M112 300H44M108 350H64"/>
            </g>`;
        }
        case "icon_sword":
            return `<g transform="rotate(-34 256 256)">
              <rect x="238" y="70" width="36" height="292" rx="10" fill="#dbeafe"/>
              <path d="M238 70 L256 28 L274 70 Z" fill="#eff6ff"/>
              <rect x="206" y="344" width="100" height="22" rx="11" fill="#fcd34d"/>
              <rect x="242" y="366" width="28" height="86" rx="10" fill="#92400e"/>
              <circle cx="256" cy="464" r="15" fill="#fcd34d"/>
              <path d="M256 92 V330" stroke="#ffffff" stroke-opacity=".5" stroke-width="4"/>
            </g>`;
        case "icon_shield":
            return `${shadow()}
            <path d="M256 70 L408 126 V268 C408 360 336 422 256 452 C176 422 104 360 104 268 V126 Z" fill="#fcd34d"/>
            <path d="M256 112 L368 154 V266 C368 336 314 386 256 412 C198 386 144 336 144 266 V154 Z" fill="#1e3a8a"/>
            <path d="M256 150 V372 M176 240 H336" stroke="#fcd34d" stroke-width="18" stroke-linecap="round"/>
            <circle cx="256" cy="240" r="22" fill="#fef3c7"/>`;
        case "potion_red":
        case "potion_blue": {
            const liquid = name.endsWith("red") ? "#fb7185" : "#60a5fa";
            const glow = name.endsWith("red") ? "#fecdd3" : "#bfdbfe";
            return `${shadow()}
            <rect x="220" y="74" width="72" height="42" rx="10" fill="#e5e7eb"/>
            <path d="M228 114 H284 L326 214 Q352 300 304 382 Q256 424 208 382 Q160 300 186 214 Z" fill="#ffffff" opacity=".16" stroke="#ffffff" stroke-opacity=".45" stroke-width="5"/>
            <path d="M196 300 Q256 268 316 300 Q332 348 304 382 Q256 414 208 382 Q180 348 196 300 Z" fill="${liquid}"/>
            <path d="M206 292 Q256 266 306 292" stroke="${glow}" stroke-width="10" stroke-linecap="round" opacity=".8"/>
            <circle cx="238" cy="340" r="12" fill="${glow}" opacity=".8"/>
            <circle cx="282" cy="362" r="8" fill="${glow}" opacity=".65"/>
            <circle cx="266" cy="320" r="5" fill="${glow}" opacity=".9"/>`;
        }
        case "chest_gold":
            return `${shadow()}
            <path d="M112 244 Q112 168 256 168 Q400 168 400 244 Z" fill="#b45309"/>
            <rect x="112" y="244" width="288" height="180" rx="18" fill="#92400e"/>
            <path d="M112 244 H400" stroke="#fbbf24" stroke-width="10"/>
            <rect x="230" y="286" width="52" height="64" rx="8" fill="#fcd34d"/>
            <circle cx="256" cy="314" r="9" fill="#78350f"/>
            <path d="M256 322 V338" stroke="#78350f" stroke-width="6" stroke-linecap="round"/>
            <path d="M128 264 V404 M384 264 V404" stroke="#fbbf24" stroke-opacity=".45" stroke-width="8"/>`;
        case "gem_violet":
            return `${shadow()}
            <path d="M256 62 L404 188 L344 414 L168 414 L108 188 Z" fill="#d8b4fe"/>
            <path d="M256 62 L308 188 L256 414 L204 188 Z" fill="#f3e8ff" opacity=".75"/>
            <path d="M108 188 H404 M168 414 L204 188 L256 62 L308 188 L344 414" fill="none" stroke="#6b21a8" stroke-opacity=".45" stroke-width="5"/>
            <path d="M142 168 L220 108" stroke="#ffffff" stroke-opacity=".7" stroke-width="10" stroke-linecap="round"/>`;
        case "tree_oak":
            return `${shadow()}
            <rect x="238" y="272" width="36" height="164" rx="10" fill="#78350f"/>
            <circle cx="256" cy="210" r="112" fill="#166534"/>
            <circle cx="184" cy="258" r="76" fill="#15803d"/>
            <circle cx="330" cy="254" r="82" fill="#22c55e"/>
            <circle cx="238" cy="166" r="64" fill="#4ade80" opacity=".8"/>
            <circle cx="196" cy="216" r="14" fill="#86efac" opacity=".65"/>
            <circle cx="312" cy="192" r="10" fill="#86efac" opacity=".55"/>`;
        case "rock_basalt":
            return `${shadow()}
            <path d="M92 398 L154 244 L246 184 L356 224 L424 336 L402 408 L120 416 Z" fill="#64748b"/>
            <path d="M154 244 L246 184 L282 284 L198 330 Z" fill="#94a3b8"/>
            <path d="M282 284 L356 224 L424 336 L340 356 Z" fill="#475569"/>
            <path d="M198 330 L282 284 L340 356 L260 392 Z" fill="#334155"/>
            <path d="M120 416 L154 360 L220 382" stroke="#cbd5e1" stroke-opacity=".35" stroke-width="8" stroke-linecap="round"/>`;
        case "portal_rift":
            return `${shadow()}
            <ellipse cx="256" cy="246" rx="150" ry="190" fill="#4c1d95"/>
            <ellipse cx="256" cy="246" rx="112" ry="150" fill="#67e8f9" opacity=".85"/>
            <ellipse cx="256" cy="246" rx="74" ry="112" fill="#c4b5fd"/>
            <ellipse cx="256" cy="246" rx="34" ry="66" fill="#f5f3ff"/>
            <g fill="#ffffff">
              <circle cx="108" cy="140" r="5" opacity=".8"/>
              <circle cx="402" cy="178" r="4" opacity=".7"/>
              <circle cx="382" cy="354" r="6" opacity=".6"/>
              <circle cx="126" cy="344" r="4" opacity=".7"/>
              <path d="M352 98 l8 18 18 8 -18 8 -8 18 -8 -18 -18 -8 18 -8 z" opacity=".7"/>
            </g>`;
        case "torch_lit":
            return `${shadow()}
            <rect x="238" y="256" width="36" height="184" rx="12" fill="#78350f"/>
            <rect x="222" y="240" width="68" height="26" rx="10" fill="#92400e"/>
            <path d="M256 70 Q322 146 304 204 Q292 246 256 258 Q220 246 208 204 Q190 146 256 70 Z" fill="#f97316"/>
            <path d="M256 116 Q296 166 286 204 Q278 232 256 240 Q234 232 226 204 Q216 166 256 116 Z" fill="#fcd34d"/>
            <path d="M256 166 Q276 194 268 214 Q262 228 256 232 Q250 228 244 214 Q236 194 256 166 Z" fill="#fef3c7"/>
            <circle cx="196" cy="176" r="4" fill="#fcd34d" opacity=".8"/>
            <circle cx="324" cy="148" r="3" fill="#fcd34d" opacity=".7"/>`;
        case "crown_relic":
            return `${shadow()}
            <path d="M112 356 L92 166 L190 250 L256 118 L322 250 L420 166 L400 356 Z" fill="#fde047"/>
            <rect x="112" y="356" width="288" height="56" rx="14" fill="#a16207"/>
            <circle cx="256" cy="214" r="18" fill="#fb7185"/>
            <circle cx="172" cy="300" r="14" fill="#60a5fa"/>
            <circle cx="340" cy="300" r="14" fill="#5eead4"/>
            <path d="M140 350 H372" stroke="#fef3c7" stroke-width="8" stroke-linecap="round" opacity=".7"/>`;
        case "tileset_forest": {
            let tiles = "";
            const shades = ["#166534", "#15803d", "#22c55e", "#4ade80", "#14532d", "#86efac"];
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 4; x++) {
                    const color = shades[(x + y * 3) % shades.length];
                    tiles += `<rect x="${x * 128}" y="${y * 128}" width="128" height="128" fill="${color}"/>`;
                    tiles += `<circle cx="${x * 128 + 64}" cy="${y * 128 + 58}" r="${18 + ((x * 7 + y * 5) % 14)}" fill="#052e16" opacity=".35"/>`;
                    tiles += `<rect x="${x * 128 + 18}" y="${y * 128 + 86}" width="20" height="26" fill="#052e16" opacity=".28"/>`;
                }
            }
            return tiles + `<rect width="512" height="512" fill="none" stroke="#052e16" stroke-opacity=".35" stroke-width="4"/>`;
        }
        case "sprite_sheet": {
            let sprites = "";
            const colors = ["#c4b5fd", "#a78bfa", "#8b5cf6", "#f0abfc", "#e9d5ff", "#7c3aed"];
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 4; x++) {
                    const cx = x * 128 + 64;
                    const cy = y * 128 + 54;
                    const color = colors[(x + y) % colors.length];
                    sprites += `<circle cx="${cx}" cy="${cy}" r="20" fill="${color}"/>`;
                    sprites += `<rect x="${cx - 18}" y="${cy + 20}" width="36" height="42" rx="12" fill="${color}" opacity=".85"/>`;
                    sprites += `<rect x="${cx - 22}" y="${cy + 64}" width="12" height="22" rx="5" fill="${color}" opacity=".65"/>`;
                    sprites += `<rect x="${cx + 10}" y="${cy + 64}" width="12" height="22" rx="5" fill="${color}" opacity=".65"/>`;
                }
            }
            return sprites;
        }
        default:
            return `${shadow()}<circle cx="256" cy="256" r="150" fill="#ffffff" opacity=".2"/>`;
    }
}

function shape64(name) {
    switch (name) {
        case "slime_green":
            return `<path d="M10 46 Q10 18 32 18 Q54 18 54 46 Z" fill="#5eead4"/>
            <rect x="18" y="30" width="6" height="9" fill="#083344"/>
            <rect x="40" y="30" width="6" height="9" fill="#083344"/>
            <rect x="20" y="44" width="24" height="4" fill="#083344" opacity=".55"/>
            <rect x="22" y="24" width="8" height="4" fill="#ccfbf1" opacity=".8"/>`;
        case "coin_spin":
            return `<circle cx="32" cy="32" r="20" fill="#fbbf24"/>
            <circle cx="32" cy="32" r="14" fill="#fde68a"/>
            <rect x="28" y="20" width="8" height="24" rx="3" fill="#b45309"/>
            <rect x="20" y="28" width="24" height="8" rx="3" fill="#b45309"/>
            <rect x="16" y="18" width="4" height="28" fill="#ffffff" opacity=".35"/>`;
        case "key_iron":
            return `<circle cx="20" cy="24" r="12" fill="none" stroke="#e2e8f0" stroke-width="7"/>
            <rect x="28" y="30" width="28" height="7" rx="3" fill="#e2e8f0"/>
            <rect x="46" y="36" width="6" height="9" fill="#e2e8f0"/>
            <rect x="36" y="36" width="6" height="7" fill="#e2e8f0"/>`;
        case "map_marker":
            return `<path d="M32 8 C18 8 8 18 8 32 C8 48 32 60 32 60 C32 60 56 48 56 32 C56 18 46 8 32 8 Z" fill="#fdba74"/>
            <circle cx="32" cy="30" r="9" fill="#7c2d12"/>
            <rect x="18" y="16" width="5" height="12" rx="2" fill="#ffffff" opacity=".5"/>`;
        default:
            return `<circle cx="32" cy="32" r="18" fill="#ffffff" opacity=".2"/>`;
    }
}

function assetSvg(name) {
    const p = palettes[name] || ["#a78bfa", "#3b1d8f"];
    const isPixel = pixelArt.has(name);
    const size = isPixel ? 64 : 512;
    const shape = isPixel ? shape64(name) : shape512(name);
    const pixelAttr = isPixel ? ' shape-rendering="crispEdges"' : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"${pixelAttr}>
      ${defsFor(p)}
      <rect width="${size}" height="${size}" fill="url(#bg)"/>
      <rect width="${size}" height="${size}" fill="url(#glow)"/>
      ${isPixel ? "" : gridLines()}
      ${shape}
      <rect x="0.5" y="0.5" width="${size - 1}" height="${size - 1}" fill="none" stroke="#ffffff" stroke-opacity=".10"/>
    </svg>`;
}

const imageFiles = [
    "hero_idle.png",
    "hero_run_01.png",
    "hero_run_02.png",
    "slime_green.png",
    "icon_sword.png",
    "icon_shield.png",
    "potion_red.png",
    "potion_blue.png",
    "chest_gold.png",
    "gem_violet.png",
    "tree_oak.png",
    "rock_basalt.png",
    "portal_rift.png",
    "coin_spin.png",
    "key_iron.png",
    "map_marker.png",
    "torch_lit.png",
    "crown_relic.png",
    "tileset_forest.png",
    "sprite_sheet.png"
];

const folderIcon = `<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M1.75 2A1.75 1.75 0 0 0 0 3.75v8.5C0 13.22.78 14 1.75 14h12.5A1.75 1.75 0 0 0 16 12.25v-6.5A1.75 1.75 0 0 0 14.25 4H8.06L6.2 2.2A1.75 1.75 0 0 0 5 1.75Z"/></svg>`;
const fileIcon = `<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2 1.75C2 .78 2.78 0 3.75 0h6.59c.47 0 .91.18 1.24.51l2.91 2.91c.33.33.51.77.51 1.24v9.59A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Z"/></svg>`;
const imageIcon = `<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2 2.75A1.75 1.75 0 0 1 3.75 1h8.5A1.75 1.75 0 0 1 14 2.75v10.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25Zm1.5 0v6.19l2.22-2.22a1 1 0 0 1 1.41 0l2.4 2.4 1.1-1.1a1 1 0 0 1 1.42 0l1.45 1.45V2.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25Zm8.75 9.75-2.1-2.1-1.1 1.1a1 1 0 0 1-1.42 0l-2.4-2.4-2.23 2.23v1.17c0 .14.11.25.25.25h8.5a.25.25 0 0 0 .25-.25ZM5.5 5.75a1.25 1.25 0 1 1 2.5 0 1.25 1.25 0 0 1-2.5 0Z"/></svg>`;

const commits = [
    "Add the forest tileset and sprite sheet",
    "Polish hero run cycle",
    "Tune potion colors",
    "Add UI icon set",
    "First pass at the asset pack"
];
const times = ["2 hours ago", "yesterday", "3 days ago", "last week", "2 weeks ago"];

const rows = [
    { name: "ui", folder: true },
    { name: "tiles", folder: true },
    { name: "README.md", folder: false },
    ...imageFiles.map(name => ({ name, folder: false }))
];

const rowsHtml = rows.map((file, index) => {
    const href = file.folder
        ? `/your-org/your-game/-/tree/main/assets/${file.name}`
        : `/your-org/your-game/-/blob/main/assets/${file.name}?ref_type=heads`;
    const icon = file.folder ? folderIcon : file.name.endsWith(".png") ? imageIcon : fileIcon;
    const commit = commits[index % commits.length];
    const time = times[index % times.length];
    return `<tr class="tree-item">
      <td class="tree-item-file-name">
        <a class="tree-item-link" data-testid="file-name-link" href="${href}" title="${file.name}">${icon}<span>${file.name}</span></a>
      </td>
      <td class="commit-msg">${commit}</td>
      <td class="time">${time}</td>
    </tr>`;
}).join("");

const mockHtml = `<!doctype html>
<html lang="en" class="gl-dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>assets · main · Your Org / your-game · GitLab</title>
<style>
  :root {
    color-scheme: dark;
    --gl-background-color-default: #1f1e24;
    --gl-background-color-subtle: #28272d;
    --gl-border-color-default: #3f3d47;
    --gl-text-color-default: #ececef;
    --gl-text-color-subtle: #a4a2ad;
    --gl-color-orange-500: #fc6d26;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--gl-background-color-default); color: var(--gl-text-color-default); font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
  a { color: inherit; }
  .topbar { display: flex; align-items: center; gap: 14px; height: 48px; padding: 0 16px; background: #2b2931; border-bottom: 1px solid var(--gl-border-color-default); }
  .brand { display: flex; align-items: center; gap: 9px; font-weight: 600; white-space: nowrap; }
  .mark { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 7px; background: linear-gradient(135deg, #ff9a5c, #6e49cb); }
  .mark svg { width: 18px; height: 18px; }
  .search { flex: 1; max-width: 420px; margin-left: 12px; padding: 6px 11px; border: 1px solid var(--gl-border-color-default); border-radius: 6px; background: #1f1e24; color: var(--gl-text-color-subtle); font-size: 12px; }
  .top-actions { display: flex; gap: 14px; align-items: center; margin-left: auto; color: var(--gl-text-color-subtle); font-size: 12px; }
  .avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #a78bfa, #6e49cb); }
  .shell { display: flex; min-height: calc(100vh - 48px); }
  .sidebar { width: 220px; flex: none; padding: 16px 10px; border-right: 1px solid var(--gl-border-color-default); background: #1f1e24; }
  .side-label { padding: 0 10px 8px; color: var(--gl-text-color-subtle); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
  .side-item { display: flex; gap: 10px; align-items: center; padding: 7px 10px; border-radius: 6px; color: var(--gl-text-color-subtle); font-size: 13px; }
  .side-item.active { background: #33313a; color: #fff; }
  .side-item i { width: 15px; height: 15px; border: 1.5px solid currentColor; border-radius: 4px; opacity: .8; }
  .side-sep { height: 1px; margin: 12px 10px; background: var(--gl-border-color-default); }
  .main { flex: 1; min-width: 0; padding: 24px 32px 40px; }
  .breadcrumbs { color: var(--gl-text-color-subtle); font-size: 12px; }
  .title-row { display: flex; align-items: center; gap: 12px; margin: 8px 0 16px; }
  h1 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -.01em; }
  .branch { display: inline-flex; align-items: center; gap: 6px; padding: 3px 9px; border: 1px solid var(--gl-border-color-default); border-radius: 6px; background: #28272d; color: var(--gl-text-color-subtle); font-size: 12px; }
  .commit { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding: 10px 14px; border: 1px solid var(--gl-border-color-default); border-radius: 8px; background: #28272d; color: var(--gl-text-color-subtle); font-size: 12px; }
  .commit b { color: var(--gl-text-color-default); font-weight: 500; }
  .commit .avatar { width: 22px; height: 22px; }
  .commit .sha { margin-left: auto; font: 11px ui-monospace, Consolas, monospace; }
  table { width: 100%; border: 1px solid var(--gl-border-color-default); border-collapse: separate; border-spacing: 0; border-radius: 8px; overflow: hidden; background: #1f1e24; }
  thead th { padding: 9px 14px; border-bottom: 1px solid var(--gl-border-color-default); background: #28272d; color: var(--gl-text-color-subtle); font-size: 12px; font-weight: 600; text-align: left; }
  thead th:last-child { text-align: right; }
  tbody td { padding: 9px 14px; border-bottom: 1px solid var(--gl-border-color-default); font-size: 13px; }
  tbody tr:last-child td { border-bottom: 0; }
  tbody tr:hover td { background: #28272d; }
  .tree-item-link { display: inline-flex; align-items: center; gap: 8px; color: var(--gl-text-color-default); text-decoration: none; }
  .tree-item-link svg { width: 16px; height: 16px; flex: none; color: var(--gl-text-color-subtle); }
  .commit-msg { color: var(--gl-text-color-subtle); }
  .time { color: var(--gl-text-color-subtle); text-align: right; white-space: nowrap; }
</style>
</head>
<body>
  <header class="topbar">
    <div class="brand">
      <span class="mark">${iconSvg.replace(/width="128" height="128"/, 'width="18" height="18"')}</span>
      Your Org / your-game
    </div>
    <div class="search">Search or go to…</div>
    <div class="top-actions"><span>⌘ K</span><span>Help</span><div class="avatar"></div></div>
  </header>
  <div class="shell">
    <aside class="sidebar">
      <div class="side-label">your-game</div>
      <div class="side-item"><i></i>Project overview</div>
      <div class="side-item active"><i></i>Repository</div>
      <div class="side-item"><i></i>Issues</div>
      <div class="side-item"><i></i>Merge requests</div>
      <div class="side-sep"></div>
      <div class="side-label">Build</div>
      <div class="side-item"><i></i>Pipelines</div>
      <div class="side-item"><i></i>Jobs</div>
      <div class="side-sep"></div>
      <div class="side-label">Deploy</div>
      <div class="side-item"><i></i>Releases</div>
      <div class="side-item"><i></i>Environments</div>
    </aside>
    <main class="main">
      <div class="breadcrumbs">Your Org / your-game / Repository</div>
      <div class="title-row"><h1>assets</h1><span class="branch">main</span></div>
      <div class="commit">
        <div class="avatar"></div>
        <span><b>Add the forest tileset and sprite sheet</b> · 2 hours ago</span>
        <span class="sha">a1b2c3d4</span>
      </div>
      <div id="js-tree-list">
        <table class="table tree-table" data-testid="file-tree-table" aria-label="Files">
          <thead><tr><th>Name</th><th>Last commit</th><th>Last update</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </main>
  </div>
</body>
</html>`;

function marketingPage({ width, height, headlineSize, subSize, layout }) {
    return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  html, body { margin: 0; width: ${width}px; height: ${height}px; overflow: hidden; }
  body {
    position: relative;
    background: #0b0711;
    color: #f6f2fb;
    font-family: "Segoe UI", Inter, system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .bg {
    position: absolute; inset: 0;
    background:
      radial-gradient(55% 60% at 88% 8%, rgba(252, 109, 38, .30), transparent 70%),
      radial-gradient(45% 55% at 8% 88%, rgba(110, 73, 203, .28), transparent 70%),
      radial-gradient(60% 50% at 50% 120%, rgba(167, 139, 250, .12), transparent 70%),
      linear-gradient(160deg, #140c1d 0%, #0b0711 55%, #07040b 100%);
  }
  .grid-lines {
    position: absolute; inset: 0; opacity: .35;
    background-image:
      linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
    background-size: 56px 56px;
    mask-image: radial-gradient(75% 70% at 50% 40%, #000, transparent);
  }
  .content { position: relative; display: flex; height: 100%; align-items: center; padding: ${layout.padding}; gap: ${layout.gap}; }
  .left { flex: 1; min-width: 0; }
  .brand { display: flex; align-items: center; gap: ${layout.brandGap}; margin-bottom: ${layout.brandGap}; font-weight: 600; letter-spacing: -.01em; }
  .brand img { width: ${layout.icon}px; height: ${layout.icon}px; filter: drop-shadow(0 12px 28px rgba(252,109,38,.35)); }
  .brand span { font-size: ${layout.brandSize}px; color: #d9d2e6; }
  h1 { margin: 0 0 ${layout.headlineGap}; font-size: ${headlineSize}px; line-height: 1.02; letter-spacing: -.045em; font-weight: 700; }
  h1 em { font-family: Georgia, "Times New Roman", serif; font-style: italic; font-weight: 400; letter-spacing: -.02em;
    background: linear-gradient(100deg, #ffe8d8 0%, #ffb38a 38%, #fc6d26 70%, #c4b5fd 100%);
    -webkit-background-clip: text; background-clip: text; color: transparent; }
  p { max-width: ${layout.textWidth}; margin: 0 0 ${layout.subGap}; color: #b7afc7; font-size: ${subSize}px; line-height: 1.55; }
  .pill { display: inline-flex; align-items: center; gap: 8px; padding: ${layout.pillPad}; border: 1px solid rgba(252,109,38,.35); border-radius: 999px; background: rgba(252,109,38,.10); color: #ffc4a3; font: 500 ${layout.pillSize}px ui-monospace, Consolas, monospace; letter-spacing: .02em; }
  .pill b { color: #fff; }
  .right { flex: ${layout.rightFlex}; display: flex; justify-content: center; }
  .frame { width: 100%; max-width: ${layout.frameWidth}; border: 1px solid rgba(255,255,255,.14); border-radius: ${layout.radius}; overflow: hidden; background: #17111f; box-shadow: 0 40px 90px -20px rgba(0,0,0,.9), 0 0 0 1px rgba(252,109,38,.08); transform: rotate(${layout.rotate ?? -2}deg); }
  .frame-bar { display: flex; align-items: center; gap: 8px; padding: ${layout.barPad}; border-bottom: 1px solid rgba(255,255,255,.08); background: #1e1728; }
  .frame-bar i { width: 8px; height: 8px; border-radius: 50%; background: #3a3048; }
  .frame-bar .url { flex: 1; margin-left: 6px; padding: 4px 8px; border-radius: 5px; background: #120d18; color: #8b819d; font: ${layout.urlSize}px ui-monospace, Consolas, monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tiles { display: grid; grid-template-columns: repeat(${layout.cols}, 1fr); gap: ${layout.tileGap}px; padding: ${layout.tilePad}px; }
  .tile { position: relative; aspect-ratio: 1; overflow: hidden; border-radius: ${layout.tileRadius}px; background: var(--g); }
  .tile::before { content: ""; position: absolute; inset: 18%; border-radius: 28%; background: rgba(0,0,0,.22); }
  .tile::after { content: ""; position: absolute; inset: 32% 30% 24%; border-radius: 18% 18% 40% 40%; background: var(--s); opacity: .9; }
  .tile:nth-child(3n)::after { border-radius: 50%; inset: 30%; }
  .tile:nth-child(4n)::after { border-radius: 8%; inset: 26% 34% 30%; }
  .label { display: flex; align-items: center; gap: 8px; padding: ${layout.labelPad}; border-top: 1px solid rgba(255,255,255,.07); color: #8b819d; font: ${layout.urlSize}px ui-monospace, Consolas, monospace; }
  .label b { color: #d9d2e6; font-weight: 500; }
</style></head>
<body>
  <div class="bg"></div><div class="grid-lines"></div>
  <div class="content">
    <div class="left">
      <div class="brand"><img src="${iconDataUri}" alt=""><span>GitLab Image Viewer</span></div>
      <h1>Every image in the repo,<br><em>at a glance.</em></h1>
      <p>Turn a GitLab folder into a thumbnail gallery. Works with gitlab.com and self-hosted GitLab.</p>
      <div class="pill"><b>Free</b> · Open source · Chrome extension</div>
    </div>
    <div class="right">
      <div class="frame">
        <div class="frame-bar"><i></i><i></i><i></i><div class="url">gitlab.com/your-org/your-game/-/tree/main/assets</div></div>
        <div class="tiles">
          ${[
            ["#8b5cf6", "#2a1a6e", "#c4b5fd"],
            ["#5eead4", "#047857", "#a7f3d0"],
            ["#fcd34d", "#b45309", "#fef3c7"],
            ["#fb7185", "#9f1239", "#fecdd3"],
            ["#67e8f9", "#4c1d95", "#e0f2fe"],
            ["#86efac", "#166534", "#dcfce7"],
            ["#d8b4fe", "#6b21a8", "#f3e8ff"],
            ["#fbbf24", "#92400e", "#fde68a"],
            ["#93c5fd", "#1e3a8a", "#dbeafe"],
            ["#f472b6", "#9d174d", "#fbcfe8"],
            ["#34d399", "#065f46", "#a7f3d0"],
            ["#fde68a", "#a16207", "#fef3c7"]
          ].slice(0, layout.tileCount).map(([a, b, s]) => `<div class="tile" style="--g:linear-gradient(145deg,${a},${b});--s:${s}"></div>`).join("")}
        </div>
        <div class="label"><b>20 images</b> · adjustable grid</div>
      </div>
    </div>
  </div>
</body></html>`;
}

async function renderStaticAssets(browser) {
    // Icons. 16 and 32 use the compact artwork so the toolbar icon stays crisp.
    for (const [size, out, source] of [
        [16, path.join(iconDir, "icon16.png"), iconSmallSvg],
        [32, path.join(iconDir, "icon32.png"), iconSmallSvg],
        [48, path.join(iconDir, "icon48.png"), iconSvg],
        [128, path.join(iconDir, "icon128.png"), iconSvg],
        [256, path.join(docsAssets, "icon-256.png"), iconSvg],
        [32, path.join(root, "docs", "favicon.png"), iconSmallSvg],
        [128, path.join(storeDir, "store-icon-128.png"), iconSvg]
    ]) {
        const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
        const svg = source.replace(/width="(128|32)" height="(128|32)"/, `width="${size}" height="${size}"`);
        await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${svg}</body></html>`);
        await page.screenshot({ path: out, omitBackground: true });
        await page.close();
    }

    const shots = [
        {
            width: 1200, height: 630,
            out: path.join(docsAssets, "og.png"),
            html: marketingPage({
                width: 1200, height: 630, headlineSize: 50, subSize: 18,
                layout: {
                    padding: "58px 56px", gap: "42px", brandGap: "18px", brandSize: 18, icon: 48,
                    headlineGap: "18px", textWidth: "540px", subGap: "24px", pillPad: "7px 14px", pillSize: 12,
                    rightFlex: "0 0 440px", frameWidth: "420px", radius: "18px", barPad: "9px 12px", urlSize: 9,
                    cols: 3, tileCount: 9, tileGap: 7, tilePad: 10, tileRadius: 8, labelPad: "8px 12px"
                }
            })
        },
        {
            width: 440, height: 280,
            out: path.join(storeDir, "promo-small-440x280.png"),
            html: marketingPage({
                width: 440, height: 280, headlineSize: 26, subSize: 11,
                layout: {
                    padding: "20px 22px", gap: "12px", brandGap: "9px", brandSize: 11, icon: 26,
                    headlineGap: "7px", textWidth: "250px", subGap: "9px", pillPad: "3px 8px", pillSize: 8,
                    rightFlex: "0 0 104px", frameWidth: "96px", radius: "9px", barPad: "4px 5px", urlSize: 4,
                    cols: 2, tileCount: 6, tileGap: 3, tilePad: 4, tileRadius: 4, labelPad: "4px 5px", rotate: 0
                }
            })
        },
        {
            width: 1400, height: 560,
            out: path.join(storeDir, "promo-marquee-1400x560.png"),
            html: marketingPage({
                width: 1400, height: 560, headlineSize: 54, subSize: 18,
                layout: {
                    padding: "48px 80px 48px 54px", gap: "48px", brandGap: "16px", brandSize: 17, icon: 44,
                    headlineGap: "16px", textWidth: "600px", subGap: "22px", pillPad: "6px 13px", pillSize: 11,
                    rightFlex: "0 0 520px", frameWidth: "500px", radius: "18px", barPad: "9px 12px", urlSize: 10,
                    cols: 4, tileCount: 12, tileGap: 7, tilePad: 10, tileRadius: 8, labelPad: "8px 12px"
                }
            })
        }
    ];

    for (const shot of shots) {
        const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height }, deviceScaleFactor: 1 });
        await page.setContent(shot.html, { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: shot.out });
        await page.close();
    }
}

async function renderExtensionShots() {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "giv-profile-"));
    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: true,
        channel: "chromium",
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
        args: [
            `--disable-extensions-except=${extensionDir}`,
            `--load-extension=${extensionDir}`,
            "--no-first-run",
            "--no-default-browser-check"
        ]
    });

    await context.route("https://gitlab.com/**", route => {
        const url = new URL(route.request().url());
        if (url.pathname === "/your-org/your-game/-/tree/main/assets" || url.pathname === "/your-org/your-game/-/tree/main/assets/") {
            return route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: mockHtml });
        }
        const raw = url.pathname.match(/^\/your-org\/your-game\/-\/raw\/main\/assets\/([^/]+\.png)$/);
        if (raw) {
            const name = decodeURIComponent(raw[1]).replace(/\.png$/, "");
            return route.fulfill({
                status: 200,
                contentType: "image/svg+xml",
                headers: { "cache-control": "no-store" },
                body: assetSvg(name)
            });
        }
        return route.fulfill({ status: 204, body: "" });
    });

    const page = await context.newPage();
    await page.goto("https://gitlab.com/your-org/your-game/-/tree/main/assets", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".giv-panel", { timeout: 15000 });
    // Lazy images below the fold would never finish loading on their own.
    await page.evaluate(() => {
        document.querySelectorAll(".giv-panel img").forEach(img => {
            img.loading = "eager";
        });
    });
    await page.waitForFunction(() => {
        const imgs = [...document.querySelectorAll(".giv-panel img")];
        return imgs.length > 0 && imgs.every(img => img.complete && img.naturalWidth > 0);
    }, null, { timeout: 15000 });

    async function setRange(value) {
        await page.locator(".giv-bar input[type=range]").evaluate((el, v) => {
            el.value = String(v);
            el.dispatchEvent(new Event("input", { bubbles: true }));
        }, value);
    }

    async function setPerRow(value) {
        const input = page.locator(".giv-bar input[type=number]");
        await input.fill(String(value));
        await input.dispatchEvent("input");
    }

    // 1. Grid: seven per row keeps the file list visible in a 1280x800 shot.
    await setPerRow(7);
    await setRange(112);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(docsAssets, "screenshot-grid.png") });
    await page.screenshot({ path: path.join(storeDir, "screenshot-1-grid.png") });

    // 2. Fixed seven per row at a larger size.
    await setRange(128);
    await setPerRow(7);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(docsAssets, "screenshot-perrow.png") });
    await page.screenshot({ path: path.join(storeDir, "screenshot-2-perrow.png") });

    // 3. Lightbox
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator(".giv-item").nth(1).click();
    await page.waitForSelector(".giv-lightbox.giv-open", { timeout: 5000 });
    await page.waitForFunction(() => {
        const img = document.querySelector(".giv-lightbox img");
        return img && img.complete && img.naturalWidth > 0;
    }, null, { timeout: 10000 });
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(docsAssets, "screenshot-lightbox.png") });
    await page.screenshot({ path: path.join(storeDir, "screenshot-3-lightbox.png") });
    await page.keyboard.press("Escape");

    // 4. Options page
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent("serviceworker", { timeout: 10000 });
    const extensionId = new URL(worker.url()).host;
    const options = await context.newPage();
    await options.goto(`chrome-extension://${extensionId}/options.html`, { waitUntil: "domcontentloaded" });
    await options.waitForSelector("#instances", { timeout: 5000 });
    await options.waitForTimeout(400);
    await options.screenshot({ path: path.join(docsAssets, "screenshot-options.png") });
    await options.screenshot({ path: path.join(storeDir, "screenshot-4-options.png") });

    await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
}

const browser = await chromium.launch({ headless: true });
await renderStaticAssets(browser);
await browser.close();
await renderExtensionShots();
console.log("Assets written to docs/assets, store, and extension/icons.");
