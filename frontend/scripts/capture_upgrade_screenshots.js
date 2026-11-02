import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const SCREENSHOT_DIR = "/Users/shafiq/Desktop/cineview3d/screenshots";
const ARTIFACT_DIR = "/Users/shafiq/.gemini/antigravity/brain/a31c04c6-13d8-4084-a76c-3ea577b3ce75";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--enable-webgl",
      "--use-gl=angle",
      "--window-size=1400,920"
    ],
    defaultViewport: { width: 1400, height: 920 }
  });

  const page = await browser.newPage();

  page.on("console", msg => console.log("BROWSER:", msg.type(), msg.text()));
  page.on("pageerror", err => console.error("PAGE ERROR:", err.message));

  console.log("1. Logging in as Demo User...");
  await page.goto("http://localhost:5173/login", { waitUntil: "networkidle0" });
  await page.waitForSelector("form");
  await page.click('form button[type="submit"]');
  await page.waitForFunction(() => location.pathname === "/", { timeout: 6000 });
  await new Promise(r => setTimeout(r, 1500));

  // Screenshot 1: Home Page
  console.log("Saving Home Page screenshot...");
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "home.png") });
  fs.copyFileSync(path.join(SCREENSHOT_DIR, "home.png"), path.join(ARTIFACT_DIR, "home.png"));

  // 2. Open first movie: Dune: Part Two
  console.log("Navigating to Movie Details & Showtimes page...");
  await page.waitForSelector(".movie-card-container");
  await page.click(".movie-card-container:first-child a, .movie-card-container:first-child button");
  await page.waitForFunction(() => location.pathname.startsWith("/movie/"), { timeout: 6000 });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll to showtimes section
  await page.evaluate(() => {
    const el = document.getElementById("showtimes-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  });
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot 2: Showtime Page
  console.log("Saving Showtime page screenshot...");
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "showtime_page.png") });
  fs.copyFileSync(path.join(SCREENSHOT_DIR, "showtime_page.png"), path.join(ARTIFACT_DIR, "showtime_page.png"));

  // 3. Open a Showtime -> Seats Page
  console.log("Selecting a showtime...");
  await page.waitForSelector('a[href^="/show/"]');
  await page.click('a[href^="/show/"]:first-child');
  await page.waitForFunction(() => location.pathname.startsWith("/show/"), { timeout: 6000 });
  await new Promise(r => setTimeout(r, 2500));

  // Interact with seats: Click Recommend best seats
  console.log("Recommending best seats...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const recBtn = btns.find(b => b.textContent.includes("Recommend"));
    if (recBtn) recBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Toggle heatmap on
  console.log("Enabling Best-Seat Heatmap...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const heatBtn = btns.find(b => b.textContent.includes("Heatmap"));
    if (heatBtn) heatBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot 3: 3D Seat Selection
  console.log("Saving 3D Seat Selection screenshot...");
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "seat_selection.png") });
  fs.copyFileSync(path.join(SCREENSHOT_DIR, "seat_selection.png"), path.join(ARTIFACT_DIR, "seat_selection.png"));

  // 4. Click "Proceed to Pay" to open Order Summary / Payment Drawer
  console.log("Opening Checkout / Payment Drawer...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const payBtn = btns.find(b => b.textContent.includes("Proceed to Pay"));
    if (payBtn) payBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Screenshot 4: Payment Page / Order Summary
  console.log("Saving Payment page screenshot...");
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "payment_page.png") });
  fs.copyFileSync(path.join(SCREENSHOT_DIR, "payment_page.png"), path.join(ARTIFACT_DIR, "payment_page.png"));

  // Pay and complete booking
  console.log("Submitting Payment...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const confirmBtn = btns.find(b => b.textContent.includes("Pay ₹"));
    if (confirmBtn) confirmBtn.click();
  });
  await page.waitForFunction(() => location.pathname.includes("/confirmed") || location.pathname.includes("/bookings"), { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));

  // Screenshot 5: Confirmation Ticket
  console.log("Saving Confirmation Ticket screenshot...");
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "confirmation_ticket.png") });
  fs.copyFileSync(path.join(SCREENSHOT_DIR, "confirmation_ticket.png"), path.join(ARTIFACT_DIR, "confirmation_ticket.png"));

  // 5. Navigate to Dashboard (as Admin)
  console.log("Navigating to Admin Dashboard...");
  await page.evaluate(async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@cine.dev", password: "demo123" })
    }).then(r => r.json());
    localStorage.setItem("cine360_token", res.token);
    localStorage.setItem("t", res.token);
    localStorage.setItem("cine360_name", res.name);
    localStorage.setItem("name", res.name);
    localStorage.setItem("cine360_role", res.role);
    localStorage.setItem("cine360_email", res.email);
  });

  await page.goto("http://localhost:5173/admin", { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 2500));

  // Screenshot 6: Dashboard
  console.log("Saving Dashboard screenshot...");
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "dashboard.png") });
  fs.copyFileSync(path.join(SCREENSHOT_DIR, "dashboard.png"), path.join(ARTIFACT_DIR, "dashboard.png"));

  console.log("ALL UPGRADE SCREENSHOTS CAPTURED SUCCESSFULLY!");
  await browser.close();
}

run().catch(err => {
  console.error("CAPTURE ERROR:", err);
  process.exit(1);
});
