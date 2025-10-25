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
let cache: Teams = [];
let lastRetrieval = Date.now();

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

export async function getTeams(): Promise<Teams> {
  // Slightly less than one hour, as images on notion only last for one hour.
  if (Date.now() - lastRetrieval <= 3500000 && cache.length != 0) {
    return Promise.resolve(cache);
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

    cache = Object.values(teamsMap);
    return cache;
  } catch (error) {
    console.log(error);
    return [];
  }
}
