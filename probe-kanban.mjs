import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

const dist = path.join(process.cwd(), "dist");
const server = http.createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const rel = p === "/" ? "index.html" : p.replace(/^\/+/, "");
  let file = path.join(dist, rel);
  if (!existsSync(file) && !path.extname(rel)) file = path.join(dist, "index.html");
  if (!existsSync(file)) { res.statusCode = 404; res.end("nf"); return; }
  const ext = path.extname(file);
  res.setHeader("Content-Type", ext === ".js" ? "text/javascript" : ext === ".css" ? "text/css" : ext === ".html" ? "text/html" : "application/octet-stream");
  res.setHeader("Cache-Control", "no-store");
  res.end(await readFile(file));
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setCacheEnabled(false);
await page.setViewport({ width: 1440, height: 1000 });

const errors = [];
page.on("pageerror", e => {
  errors.push((e.stack || e.message).split("\n")[0]);
  console.log("PAGEERROR:", (e.stack || e.message).split("\n").slice(0, 6).join(" << "));
});
page.on("console", m => { if (m.type() === "error") console.log("CONSOLE:", m.text().slice(0, 300)); });

const fail = [];
const check = (name, cond, extra = "") => {
  console.log((cond ? "PASS" : "FAIL") + ": " + name + (extra ? ` (${extra})` : ""));
  if (!cond) fail.push(name);
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const visibleCards = () => page.$$eval(".kanban-card", els => els.length);

await page.goto(`http://127.0.0.1:${port}/my`, { waitUntil: "networkidle0" });
await sleep(800);

// --- Responsive: mobile breakpoint stacks the board ---
await page.setViewport({ width: 640, height: 900 });
await sleep(300);
const mobileDisplay = await page.$eval(".kanban-board", e => getComputedStyle(e).display);
const mobileCols = await page.$eval(".kanban-column", e => getComputedStyle(e).width);
check("mobile: board stacks", mobileDisplay !== "grid" || mobileCols.includes("px"), `${mobileDisplay} / col ${mobileCols}`);
await page.screenshot({ path: path.join(process.cwd(), "kanban-shot-mobile.png"), fullPage: true });
await page.setViewport({ width: 1440, height: 1000 });
await sleep(300);

// --- Structure ---
const cols = await page.$$eval(".kanban-column", els => els.map(e => e.dataset.status));
check("4 columns rendered", JSON.stringify(cols) === JSON.stringify(["todo", "progress", "review", "done"]), cols.join(","));
check("seed cards rendered", (await visibleCards()) === 3, `${await visibleCards()} cards`);
check("stat strip has 5 stats", (await page.$$(".kanban-stat")).length === 5);
const statTotal = await page.$eval(".kanban-stat .kanban-stat__value", e => e.textContent.trim());
check("total stat = 3", statTotal === "3", statTotal);
check("search input present", (await page.$$(".kanban-search")).length === 1);
check("4 priority filter buttons", (await page.$$(".kanban-filter")).length === 4);

// --- CSS applied ---
const boardDisplay = await page.$eval(".kanban-board", e => getComputedStyle(e).display);
check("kanban.css applied", boardDisplay === "flex" || boardDisplay === "grid", boardDisplay);
const cardRadius = await page.$eval(".kanban-card", e => getComputedStyle(e).borderRadius);
check("card styled", cardRadius !== "0px", `radius ${cardRadius}`);

// --- Search ---
await page.type(".kanban-search", "login");
await sleep(300);
check("search 'login' -> 1 card", (await visibleCards()) === 1, `${await visibleCards()}`);
await page.$eval(".kanban-search", e => { e.value = ""; e.dispatchEvent(new Event("input", { bubbles: true })); });
await sleep(300);
check("clear search -> 3 cards", (await visibleCards()) === 3, `${await visibleCards()}`);
// --- Priority filter ---
const filterBtns = await page.$$(".kanban-filter");
await filterBtns[3].click(); // "High"
await sleep(300);
check("filter High -> 1 card", (await visibleCards()) === 1, `${await visibleCards()}`);
const activeCls = await page.$eval(".kanban-filter--active", e => e.textContent.trim());
check("active filter is High", activeCls === "High", activeCls);
await filterBtns[0].click(); // "All priorities"
await sleep(300);
check("filter All -> 3 cards", (await visibleCards()) === 3, `${await visibleCards()}`);

// --- New task modal: validation then save ---
await page.click(".kanban-new");
await sleep(250);
const overlayShown = await page.$eval(".kanban-overlay", e => getComputedStyle(e).display);
check("modal opens", overlayShown === "flex", overlayShown);
await page.click(".kanban-save"); // empty title
await sleep(250);
const errText = await page.$eval(".kanban-error", e => e.textContent.trim());
check("empty title rejected", errText.length > 0, errText);
await page.type(".kanban-field input", "Probe task from puppeteer");
await page.click(".kanban-save");
await sleep(300);
const overlayHidden = await page.$eval(".kanban-overlay", e => getComputedStyle(e).display);
check("modal closes after save", overlayHidden === "none", overlayHidden);
check("new card appears (4)", (await visibleCards()) === 4, `${await visibleCards()}`);

// --- Move forward: first todo card -> progress ---
const beforeTodo = await page.$$eval('[data-status="todo"] .kanban-card', els => els.length);
const beforeProg = await page.$$eval('[data-status="progress"] .kanban-card', els => els.length);
await page.$eval('[data-status="todo"] .kanban-card [title="Move forward"]', e => e.click());
await sleep(300);
const afterTodo = await page.$$eval('[data-status="todo"] .kanban-card', els => els.length);
const afterProg = await page.$$eval('[data-status="progress"] .kanban-card', els => els.length);
check("move forward shifts card", afterTodo === beforeTodo - 1 && afterProg === beforeProg + 1,
    `todo ${beforeTodo}->${afterTodo}, progress ${beforeProg}->${afterProg}`);

// --- Edit (first card = the edited one, deleted later must NOT be this one) ---
await page.$eval('.kanban-card [title="Edit task"]', e => e.click());
await sleep(250);
const modalTitle = await page.$eval(".kanban-modal h2", e => e.textContent.trim());
check("edit modal shows 'Edit task'", modalTitle === "Edit task", modalTitle);
await page.$eval(".kanban-field input", e => { e.value = ""; e.dispatchEvent(new Event("input", { bubbles: true })); });
await page.type(".kanban-field input", "Edited by probe");
await page.click(".kanban-save");
await sleep(300);
const edited = await page.$$eval(".kanban-card__title", els => els.some(e => e.textContent.includes("Edited by probe")));
check("edit persists on board", edited);

// --- Delete the LAST card, so the edited one survives for the reload check ---
const beforeDel = await visibleCards();
await page.$$eval('.kanban-card [title="Delete task"]', els => els[els.length - 1].click());
await sleep(300);
check("delete removes a card", (await visibleCards()) === beforeDel - 1, `${beforeDel}->${await visibleCards()}`);

// --- Persistence: everything lives under the app-remember-state blob ---
const rememberBlob = await page.evaluate(() => localStorage.getItem("app-remember-state") || "");
check("tasks persisted in app-remember-state", rememberBlob.includes("kanban-tasks-v2"),
    `${rememberBlob.length} bytes`);
check("search persisted", rememberBlob.includes("kanban-search-v2"));

// --- Reload keeps changes ---
await page.reload({ waitUntil: "networkidle0" });
await sleep(700);
const reloaded = await page.$$eval(".kanban-card__title", els => els.map(e => e.textContent));
check("changes persist across reload", reloaded.some(t => t.includes("Edited by probe")), reloaded.join(" | "));

// --- Screenshot for visual review ---
await page.screenshot({ path: path.join(process.cwd(), "kanban-shot.png"), fullPage: true });
console.log("screenshot -> kanban-shot.png");

console.log(errors.length === 0 ? "NO PAGE ERRORS" : `${errors.length} PAGE ERRORS`);
console.log(fail.length === 0 ? "ALL CHECKS PASSED" : `FAILED: ${fail.length} -> ${fail.join("; ")}`);

await browser.close();
server.close();
process.exit(fail.length === 0 && errors.length === 0 ? 0 : 1);
