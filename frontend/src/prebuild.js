import { Client, isFullPage } from "@notionhq/client";
import fs from "fs";
import path from "path";
import "dotenv/config";
import fetch from "node-fetch";

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

async function downloadImages(pages, subfolder, propertyName) {
  const folderPath = path.join(imageDir, subfolder);
  fs.mkdirSync(folderPath, { recursive: true });

  for (const page of pages) {
    const imageUrl = getImageUrl(page.properties[propertyName]);
    if (!imageUrl) continue;

    try {
      const res = await fetch(imageUrl);
      const contentType = res.headers.get("content-type") || "";
      let ext = ".jpg";
      if (contentType.includes("png")) ext = ".png";
      else if (contentType.includes("jpeg")) ext = ".jpg";
      else if (contentType.includes("gif")) ext = ".gif";
      else if (contentType.includes("webp")) ext = ".webp";
      else if (contentType.includes("svg")) ext = ".svg";

      const buffer = await res.arrayBuffer();
      const filename = `${page.id}${ext}`;
      const filePath = path.join(folderPath, filename);
      fs.writeFileSync(filePath, Buffer.from(buffer));
      console.log(`Saved ${subfolder}/${filename}`);
    } catch (err) {
      console.error(`Error fetching image for page ${page.id}:`, err);
    }
  }
}

// ---------------- Prebuild Functions ----------------
async function prebuildTeams() {
  try {
    const notion = new Client({ auth: process.env.NOTION_API_KEY });

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
    const notion = new Client({ auth: process.env.NOTION_API_KEY });

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
  await prebuildTeams();
  await prebuildNews();
})();
