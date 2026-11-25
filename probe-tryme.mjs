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
await page.setViewport({ width: 1280, height: 900 });
page.on("pageerror", e => console.log("PAGEERROR:", (e.stack || e.message).split("\n").slice(0,6).join(" << ")));
page.on("console", m => { if (m.type() === "error") console.log("CONSOLE:", m.text().slice(0, 300)); });
await page.goto(`http://127.0.0.1:${port}/my`, { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 1200));
const state = await page.evaluate(() => ({
  title: document.title,
  appChildren: document.querySelector("#app")?.children.length ?? -1,
  appText: (document.querySelector("#app")?.textContent ?? "").trim().slice(0, 120),
  bodyText: document.body.innerText.trim().slice(0, 200),
}));
console.log("STATE:", JSON.stringify(state, null, 1));
await browser.close();
server.close();
