const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const chromium = require("@sparticuz/chromium");
const axios = require("axios");
const net = require("net");

puppeteer.use(StealthPlugin());
const BASE_URL = "https://am.alwayscodex.eu.cc";

async function findWorkingProxy() {
  try {
    const res = await axios.get("https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt", { timeout: 8000 });
    const proxies = res.data.trim().split("\n").filter(Boolean);
    for (const p of proxies.slice(0, 60)) {
      const [host, port] = p.trim().split(":");
      if (!host || !port) continue;
      const works = await new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1200);
        socket.on("connect", () => { socket.destroy(); resolve(true); });
        socket.on("error", () => { socket.destroy(); resolve(false); });
        socket.on("timeout", () => { socket.destroy(); resolve(false); });
        socket.connect(parseInt(port), host);
      });
      if (works) return p.trim();
    }
  } catch (e) {}
  return null;
}

async function getBrowserInstance(headless = true, proxy = null) {
  const isVercel = !!process.env.VERCEL;
  let args = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"];
  let executablePath = null;

  if (isVercel) {
    args = await chromium.args;
    executablePath = await chromium.executablePath();
  }

  if (proxy) args.push(`--proxy-server=http://${proxy}`);

  return await puppeteer.launch({
    args,
    defaultViewport: isVercel ? chromium.defaultViewport : { width: 1280, height: 720 },
    executablePath: executablePath,
    headless: isVercel ? chromium.headless : headless,
    ignoreHTTPSErrors: true,
  });
}

async function createTempEmail() {
  try {
    const res = await axios.get("https://api.tempmail.lol/v2/inbox/create", { timeout: 5000 });
    if (res.data && res.data.address && res.data.token) {
      return { status: true, provider: "tempmail.lol", address: res.data.address, token: res.data.token };
    }
  } catch (e) {}
  try {
    const domRes = await axios.get("https://api.mail.tm/domains", { timeout: 5000 });
    const domain = domRes.data["hydra:member"][0].domain;
    const address = `user${Date.now()}@${domain}`;
    const password = "Pass" + Math.random().toString(36).slice(-8);
    await axios.post("https://api.mail.tm/accounts", { address, password }, { timeout: 5000 });
    const tokenRes = await axios.post("https://api.mail.tm/token", { address, password }, { timeout: 5000 });
    if (tokenRes.data && tokenRes.data.token) {
      return { status: true, provider: "mail.tm", address, token: tokenRes.data.token };
    }
  } catch (e) {}
  try {
    const res = await axios.get("https://api.guerrillamail.com/ajax.php?f=get_email_address", { timeout: 5000 });
    if (res.data && res.data.email_addr && res.data.sid_token) {
      return { status: true, provider: "guerrillamail", address: res.data.email_addr, token: res.data.sid_token };
    }
  } catch (e) {}
  return { status: false, error: "All temp mail providers are currently unreachable" };
}

async function getTempMailMessages(tempMailObj) {
  if (!tempMailObj || !tempMailObj.token) return { status: false, emails: [] };
  const { provider, token } = tempMailObj;

  if (provider === "tempmail.lol") {
    try {
      const res = await axios.get(`https://api.tempmail.lol/v2/inbox?token=${token}`, { timeout: 8000 });
      return { status: true, emails: res.data ? (res.data.emails || []) : [] };
    } catch (err) { return { status: false, emails: [] }; }
  }

  if (provider === "mail.tm") {
    try {
      const res = await axios.get("https://api.mail.tm/messages", {
        headers: { Authorization: `Bearer ${token}` }, timeout: 8000
      });
      const msgs = res.data ? (res.data["hydra:member"] || []) : [];
      const detailedEmails = [];
      for (const m of msgs) {
        try {
          const detail = await axios.get(`https://api.mail.tm/messages/${m.id}`, {
            headers: { Authorization: `Bearer ${token}` }, timeout: 5000
          });
          detailedEmails.push({
            html: detail.data.html ? detail.data.html.join(" ") : "",
            body: detail.data.text || "",
            subject: detail.data.subject
          });
        } catch (e) {}
      }
      return { status: true, emails: detailedEmails };
    } catch (err) { return { status: false, emails: [] }; }
  }

  if (provider === "guerrillamail") {
    try {
      const res = await axios.get(`https://api.guerrillamail.com/ajax.php?f=check_email&sid_token=${token}&seq=0`, { timeout: 8000 });
      const list = res.data ? (res.data.list || []) : [];
      const detailedEmails = [];
      for (const item of list) {
        try {
          const detail = await axios.get(`https://api.guerrillamail.com/ajax.php?f=fetch_email&email_id=${item.mail_id}&sid_token=${token}`, { timeout: 5000 });
          detailedEmails.push({
            html: detail.data.mail_body || "",
            body: detail.data.mail_body || "",
            subject: item.mail_subject
          });
        } catch (e) {}
      }
      return { status: true, emails: detailedEmails };
    } catch (err) { return { status: false, emails: [] }; }
  }
  return { status: false, emails: [] };
}

function extractMagicLink(emailObj) {
  if (!emailObj) return null;
  const content = (emailObj.html || "") + " " + (emailObj.body || "");
  const match = content.match(/href=['"](https?:\/\/[^'"]+auth\/links\?[^'"]+)['"]/i) ||
                content.match(/(https?:\/\/[^\s<>"']+alightcreative[^\s<>"']+)/i) ||
                content.match(/(https?:\/\/[^\s<>"']+firebaseapp[^\s<>"']+)/i);
  if (match) {
    let url = match[1] || match[0];
    return url.replace(/&amp;/g, "&");
  }
  return null;
}

async function autoCreateWithTempMail(options = {}) {
  let {
    username = "user" + Math.floor(Math.random() * 10000000),
    password = "Pass" + Math.random().toString(36).slice(-8),
    referralCode = "",
    autoActivate = true,
    timeoutSeconds = 45,
    headless = true,
    proxy = null,
    autoBypassIp = true
  } = options;

  const tempMail = await createTempEmail();
  if (!tempMail.status) {
    return { status: false, error: "Failed to generate temp mail: " + tempMail.error };
  }

  const targetEmail = tempMail.address;
  let currentProxy = proxy;
  let browser = await getBrowserInstance(headless, currentProxy);

  try {
    let page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 30000 });

    let step1Result = await page.evaluate(async (u, p, e, ref) => {
      let regRes = null;
      try {
        const regPayload = { username: u, password: p };
        if (ref) regPayload.referralCode = ref;
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(regPayload)
        });
        regRes = await res.json();
      } catch (err) {
        regRes = { success: false, message: err.message };
      }
      if (regRes && !regRes.success) {
        return {
          success: false,
          error: regRes.message || "Registration failed",
          isIpLimit: regRes.message ? regRes.message.includes("IP") : false
        };
      }
      let loginRes = await (await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p })
      })).json();
      if (!loginRes || !loginRes.success) {
        return { success: false, error: "Login failed: " + (loginRes ? loginRes.message : "Unknown error") };
      }
      const sendLinkRes = await (await fetch("/api/am/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e })
      })).json();
      return { success: true, credentials: { username: u, password: p }, sendLinkRes };
    }, username, password, targetEmail, referralCode);

    if (!step1Result.success && step1Result.isIpLimit && autoBypassIp) {
      const activeProxy = await findWorkingProxy();
      if (activeProxy) {
        await browser.close();
        currentProxy = activeProxy;
        username = "user" + Math.floor(Math.random() * 10000000);
        password = "Pass" + Math.random().toString(36).slice(-8);
        browser = await getBrowserInstance(headless, currentProxy);
        page = await browser.newPage();
        await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 30000 });
        step1Result = await page.evaluate(async (u, p, e, ref) => {
          let regRes = null;
          try {
            const regPayload = { username: u, password: p };
            if (ref) regPayload.referralCode = ref;
            const res = await fetch("/api/auth/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(regPayload)
            });
            regRes = await res.json();
          } catch (err) {
            regRes = { success: false, message: err.message };
          }
          if (regRes && !regRes.success) {
            return { success: false, error: regRes.message || "Registration failed" };
          }
          let loginRes = await (await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: u, password: p })
          })).json();
          if (!loginRes || !loginRes.success) {
            return { success: false, error: "Login failed: " + (loginRes ? loginRes.message : "Unknown error") };
          }
          const sendLinkRes = await (await fetch("/api/am/send-link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: e })
          })).json();
          return { success: true, credentials: { username: u, password: p }, sendLinkRes };
        }, username, password, targetEmail, referralCode);
      }
    }

    if (!step1Result.success) {
      await browser.close();
      return { status: false, error: step1Result.error };
    }

    let magicLink = null;
    let receivedEmail = null;
    const maxRetries = Math.ceil(timeoutSeconds / 3);
    for (let i = 0; i < maxRetries; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const inbox = await getTempMailMessages(tempMail);
      if (inbox.status && inbox.emails && inbox.emails.length > 0) {
        receivedEmail = inbox.emails[0];
        magicLink = extractMagicLink(receivedEmail);
        if (magicLink) break;
      }
    }

    let claimResult = null;
    if (magicLink && autoActivate) {
      claimResult = await page.evaluate(async (e, link, u, p) => {
        await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: u, password: p })
        });
        const res = await (await fetch("/api/am/claim-premium", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: e, magicLink: link })
        })).json();
        return res;
      }, targetEmail, magicLink, step1Result.credentials.username, step1Result.credentials.password);
    }

    await browser.close();
    return {
      status: true,
      email: targetEmail,
      account: step1Result.credentials,
      proxyUsed: currentProxy || "direct",
      codeorder: claimResult?.codeorder || null,
      orderId: claimResult?.orderId || step1Result.sendLinkRes?.orderId || null,
      magicLink: magicLink
    };
  } catch (error) {
    if (browser) await browser.close();
    return { status: false, error: error.message };
  }
}

async function bulkAutoCreateWithTempMail(count = 1, options = {}) {
  const totalCount = Math.max(1, parseInt(count) || 1);
  if (totalCount === 1) return await autoCreateWithTempMail(options);

  const results = [];
  let successful = 0;
  let failed = 0;
  for (let i = 0; i < totalCount; i++) {
    const res = await autoCreateWithTempMail(options);
    results.push(res);
    if (res.status) successful++; else failed++;
    if (i < totalCount - 1) await new Promise(r => setTimeout(r, 2000));
  }
  return { status: true, total: totalCount, successful, failed, results };
}

module.exports = {
  createTempEmail,
  getTempMailMessages,
  autoCreateWithTempMail,
  bulkAutoCreateWithTempMail
};
