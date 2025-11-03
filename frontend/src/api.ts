import { Client, isFullPage } from "@notionhq/client";

export type Member = {
  name: string;
  role: string;
  imageUrl: string;
  imageAlt: string;
};

export type Team = {
  name: string;
  description: string;
  members: Member[];
};

export type Teams = Team[];
type articleType = "Featured" | "Regular";

export type Article = {
  name: string;
  description: string;
  date: string;
  categories: string[];
  url: string;
  imageUrl: string;
  imageAlt: string;
  type: articleType;
};

export type News = Article[];

let teamsCache: Teams = [];
let teamsLastRetrieval = Date.now();
let newsCache: News = [];
let newsLastRetrieval = Date.now();

function getPlainText(property: any, defaultValue = ""): string {
  if (!property) return defaultValue;

  switch (property.type) {
    case "title":
      return property.title?.[0]?.plain_text ?? defaultValue;
    case "rich_text":
      return property.rich_text?.[0]?.plain_text ?? defaultValue;
    default:
      return defaultValue;
  }
}

function getImageUrl(filesProperty: any): string {
  const fileItem = filesProperty?.files?.[0];
  if (!fileItem) return "";

  if (fileItem.type === "file") return fileItem.file.url;
  if (fileItem.type === "external") return fileItem.external.url;
  return "";
}

function getDate(property: any, defaultValue = ""): string {
  if (property.type === "date") {
    return property.date.start;
  } else {
    return defaultValue;
  }
}

function getURL(property: any, defaultValue = ""): string {
  if (property.type === "url") {
    return property.url;
  } else {
    return defaultValue;
  }
}

function getSelect(
  property: any,
  defaultValue: articleType = "Regular",
): articleType {
  if (property.type === "select") {
    return property.select.name;
  } else {
    return defaultValue;
  }
}

function getCategories(property: any): string[] {
  if (property.type === "multi_select") {
    return property.multi_select.map(
      (category: { id: string; name: string; color: string }) => category.name,
    );
  } else {
    return [];
  }
}

export async function getTeams(): Promise<Teams> {
  // Slightly less than one hour, as images on notion only last for one hour.
  if (Date.now() - teamsLastRetrieval <= 3500000 && teamsCache.length != 0) {
    return Promise.resolve(teamsCache);
  }

  try {
    const notion = new Client({
      auth: import.meta.env.NOTION_API_KEY,
    });

    const teamsRes = await notion.dataSources.query({
      data_source_id: import.meta.env.TEAMS_DATASOURCE_ID,
      sorts: [
        {
          property: "Order",
          direction: "ascending",
        },
      ],
    });

    const teamsMap: Record<string, Team> = {};

    teamsRes.results.filter(isFullPage).forEach((teamPage) => {
      const id = teamPage.id;
      teamsMap[id] = {
        name: getPlainText(teamPage.properties.Name, "Untitled"),
        description: getPlainText(teamPage.properties.Team_Description),
        members: [],
      };
    });

    const membersRes = await notion.dataSources.query({
      data_source_id: import.meta.env.ROLES_DATASOURCE_ID,
      sorts: [
        {
          property: "Order",
          direction: "ascending",
        },
      ],
    });

    membersRes.results.filter(isFullPage).forEach((memberPage) => {
      const memberName = getPlainText(memberPage.properties.Name, "Unknown");
      const role = getPlainText(memberPage.properties.Role, "");
      const imageUrl = getImageUrl(memberPage.properties.Photo);
      const imageAlt = getPlainText(memberPage.properties.ImageAlt, "");

      if (memberPage.properties.Team.type == "relation") {
        const teamRelations = memberPage.properties.Team.relation || [];
        teamRelations.forEach((teamRel) => {
          const team = teamsMap[teamRel.id];
          if (team) {
            team.members.push({ name: memberName, role, imageUrl, imageAlt });
          }
        });
      }
    });

    teamsCache = Object.values(teamsMap);
    teamsLastRetrieval = Date.now();
    return teamsCache;
  } catch (error) {
    console.log(error);
    return [];
  }
}

export async function getNews(): Promise<News> {
  // Slightly less than one hour, as images on notion only last for one hour.
  if (Date.now() - newsLastRetrieval <= 3500000 && newsCache.length != 0) {
    return Promise.resolve(newsCache);
  }

  try {
    const notion = new Client({
      auth: import.meta.env.NOTION_API_KEY,
    });

    const newsRes = await notion.dataSources.query({
      data_source_id: import.meta.env.NEWS_DATASOURCE_ID,
      sorts: [
        {
          property: "Date",
          direction: "descending",
        },
      ],
    });
    // console.log(newsRes);
    const news: News = [];
    newsRes.results.filter(isFullPage).forEach((newsPage) => {
      const article: Article = {
        name: "",
        description: "",
        date: "",
        categories: [],
        url: "",
        imageUrl: "",
        imageAlt: "",
        type: "Regular",
      };

      article.name = getPlainText(newsPage.properties.Name, "Unknown");
      article.description = getPlainText(newsPage.properties.Description);
      article.date = getDate(newsPage.properties.Date);
      article.categories = getCategories(newsPage.properties.Categories);
      article.url = getURL(newsPage.properties.URL);
      article.imageUrl = getImageUrl(newsPage.properties.Image);
      article.imageAlt = getPlainText(newsPage.properties.ImageAlt);
      article.type = getSelect(newsPage.properties.Type);
      news.push(article);
    });

    return news;
  } catch (error) {
    console.log(error);
    return [];
  }
}
