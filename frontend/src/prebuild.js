import { Client, isFullPage } from "@notionhq/client";
import fs from "fs";
import path from "path";
import "dotenv/config";
import fetch from "node-fetch";
import https from "https";
import { pipeline } from "stream/promises";

// ---------------- Setup & Agents ----------------
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
});

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const imageDir = path.resolve("./src/assets/notion-images");
fs.mkdirSync(imageDir, { recursive: true });

// ---------------- Utility ----------------
function getImageUrl(filesProperty) {
  const fileItem = filesProperty?.files?.[0];
  if (!fileItem) return "";

  if (fileItem.type === "file") return fileItem.file.url;
  if (fileItem.type === "external") return fileItem.external.url;
  return "";
}

// Check if the image already exists in the folder (handles unknown extensions)
function imageExistsLocally(folderPath, pageId) {
  const possibleExts = [".jpg", ".png", ".gif", ".webp", ".svg"];
  for (const ext of possibleExts) {
    const filePath = path.join(folderPath, `${pageId}${ext}`);
    if (fs.existsSync(filePath)) {
      return true; // Found a cached version
    }
  }
  return false;
}

async function fetchWithRetry(url, options = {}, retries = 3, backoff = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { ...options, agent: httpsAgent });
      if (!res.ok) throw new Error(`HTTP Status: ${res.status}`);
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn( 
        `Fetch failed, retrying in ${backoff}ms... (${i + 1}/${retries})`,
      );
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
}

async function processImage(page, folderPath, propertyName) {
  // 1. Check local cache first before doing any network requests
  if (imageExistsLocally(folderPath, page.id)) {
    console.log(`Skipped (Cached): ${path.basename(folderPath)}/${page.id}`);
    return;
  }

  const imageUrl = getImageUrl(page.properties[propertyName]);
  if (!imageUrl) return;

  try {
    const res = await fetchWithRetry(imageUrl);
    const contentType = res.headers.get("content-type") || "";

    let ext = ".jpg";
    if (contentType.includes("png")) ext = ".png";
    else if (contentType.includes("jpeg")) ext = ".jpg";
    else if (contentType.includes("gif")) ext = ".gif";
    else if (contentType.includes("webp")) ext = ".webp";
    else if (contentType.includes("svg")) ext = ".svg";

    const filename = `${page.id}${ext}`;
    const filePath = path.join(folderPath, filename);

    const fileStream = fs.createWriteStream(filePath);
    await pipeline(res.body, fileStream);

    console.log(`Saved ${path.basename(folderPath)}/${filename}`);
  } catch (err) {
    console.error(`Error fetching image for page ${page.id}:`, err.message);
  }
}

async function downloadImages(
  pages,
  subfolder,
  propertyName,
  concurrencyLimit = 5,
) {
  const folderPath = path.join(imageDir, subfolder);
  fs.mkdirSync(folderPath, { recursive: true });

  for (let i = 0; i < pages.length; i += concurrencyLimit) {
    const chunk = pages.slice(i, i + concurrencyLimit);
    await Promise.all(
      chunk.map((page) => processImage(page, folderPath, propertyName)),
    );
  }
}

// ---------------- Prebuild Functions ----------------
async function prebuildTeams() {
  try {
    const membersRes = await notion.dataSources.query({
      data_source_id: process.env.ROLES_DATASOURCE_ID,
      sorts: [{ property: "Order", direction: "ascending" }],
    });

    const members = membersRes.results.filter(isFullPage);
    await downloadImages(members, "members", "Photo");
  } catch (err) {
    console.error("Error prebuilding Teams:", err);
  }
}

async function prebuildNews() {
  try {
    const newsRes = await notion.dataSources.query({
      data_source_id: process.env.NEWS_DATASOURCE_ID,
      sorts: [{ property: "Date", direction: "descending" }],
    });

    const newsPages = newsRes.results.filter(isFullPage);
    await downloadImages(newsPages, "news", "Image");
  } catch (err) {
    console.error("Error prebuilding News:", err);
  }
}

// ---------------- Run ----------------
(async function main() {
  console.log("Starting Notion image build...");

  await prebuildTeams();
  await prebuildNews();

  console.log("Build complete!");
})();
