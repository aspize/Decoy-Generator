/* =========================
   Decoy Generator - script.js
   - Requires first.txt + last.txt
   - Username max length: 15
   - DOB range: 2009–2012
   ========================= */

let firstNames = [];
let lastNames = [];

const USERNAME_MAX = 15;

const cuteWords = [
  "angel","bby","spark","star","glow","doll","prince","fairy","sweet","cutie"
];

const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const slug = (s) => String(s).toLowerCase().replace(/[^a-z]/g, "");

function parseLines(txt) {
  return txt
    .split(/\r?\n/)
    .map(x => x.trim())
    .filter(Boolean)
    .filter(x => !x.startsWith("#"));
}

async function loadNames() {
  const [fRes, lRes] = await Promise.all([
    fetch("first.txt", { cache: "no-store" }),
    fetch("last.txt", { cache: "no-store" })
  ]);

  if (!fRes.ok || !lRes.ok) throw new Error("missing files");

  const [fTxt, lTxt] = await Promise.all([fRes.text(), lRes.text()]);
  const f = parseLines(fTxt);
  const l = parseLines(lTxt);

  if (!f.length || !l.length) throw new Error("empty lists");

  firstNames = f;
  lastNames = l;
}

function randomDigits() {
  const roll = Math.random();
  let digits = 2;
  if (roll < 0.12) digits = 0;
  else if (roll < 0.82) digits = 2;
  else digits = 3;

  let out = "";
  for (let i = 0; i < digits; i++) out += String(randInt(0, 9));
  return out;
}

function pickSep() {
  return choice(["", "_", "."]);
}

function clamp(str, maxLen) {
  return str.length <= maxLen ? str : str.slice(0, maxLen);
}

function makeBase(first, last) {
  const f = slug(first);
  const l = slug(last);
  const li = l[0] || "x";

  const bases = [
    f,
    `${f}${li}`,
    `${f.slice(0, 5)}${l.slice(0, 3)}`,
    `${f.slice(0, 4)}${l.slice(0, 4)}`
  ];

  return choice(bases).replace(/[^a-z]/g, "");
}

function buildUsername(first, last) {
  const f = slug(first);
  const l = slug(last);
  const plain = `${f}${l}`;

  const base = makeBase(first, last);
  const word = choice(cuteWords);
  const nums = randomDigits();
  const sep = pickSep();

  const patterns = [
    () => `${base}${nums}`,
    () => `${base}${sep}${nums}`,
    () => `${word}${sep}${base}${nums}`,
    () => `${base}${sep}${word}${nums}`,
    () => `xo${sep}${base}${nums}`,
    () => `its${base}${nums || randInt(10, 99)}`,
    () => `${f.slice(0, 5)}${sep}${(l[0] || "x")}${nums || randInt(10, 99)}`
  ];

  for (let tries = 0; tries < 25; tries++) {
    let u = choice(patterns)();

    u = u.replace(/[_\.]{2,}/g, sep || "_");
    u = u.replace(/([_.])$/g, "");
    u = u.replace(/(_\.)|(\._)/g, sep);

    if (u === plain) u = `${base}_${randInt(10, 99)}`;

    u = clamp(u, USERNAME_MAX);

    const hasModifier =
      /\d/.test(u) ||
      /[_.]/.test(u) ||
      cuteWords.some(w => u.includes(w)) ||
      /^(xo|its)/.test(u);

    if (u.length >= 6 && hasModifier) return u;
  }

  return clamp(`${base}_${randInt(10, 99)}`, USERNAME_MAX);
}

function calcAge(year, monthIndex0, day) {
  const today = new Date();
  let age = today.getFullYear() - year;
  const birthdayThisYear = new Date(today.getFullYear(), monthIndex0, day);
  if (today < birthdayThisYear) age--;
  return age;
}

function generateDOBPretty() {
  const year = randInt(2009, 2012);
  const monthIndex0 = randInt(0, 11);
  const dayMax = new Date(year, monthIndex0 + 1, 0).getDate();
  const day = randInt(1, dayMax);
  const age = calcAge(year, monthIndex0, day);
  return `${monthNames[monthIndex0]} ${day}, ${year} (Age: ${age})`;
}

function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 900);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    toast("Copied");
  }
}

function generate() {
  if (!firstNames.length || !lastNames.length) return;

  const first = choice(firstNames);
  const last = choice(lastNames);

  document.getElementById("fullName").textContent = `${first} ${last}`;
  document.getElementById("username").textContent = buildUsername(first, last);
  document.getElementById("dob").textContent = generateDOBPretty();
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadNames();
    generate();
  } catch (err) {
    console.error(err);
    document.getElementById("fullName").textContent = "ERROR";
    document.getElementById("username").textContent = "—";
    document.getElementById("dob").textContent = "—";
  }

  const fullNameEl = document.getElementById("fullName");
  const usernameEl = document.getElementById("username");
  const dobEl = document.getElementById("dob");

  document.getElementById("generateBtn").addEventListener("click", generate);

  document.getElementById("copyNameBtn").addEventListener("click", () => copyText(fullNameEl.textContent));
  document.getElementById("copyUserBtn").addEventListener("click", () => copyText(usernameEl.textContent));
  document.getElementById("copyDobBtn").addEventListener("click", () => copyText(dobEl.textContent));

  document.getElementById("copyAllBtn").addEventListener("click", () =>
    copyText(`Name: ${fullNameEl.textContent}\nUsername: ${usernameEl.textContent}\nDOB: ${dobEl.textContent}`)
  );
});
