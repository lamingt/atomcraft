import { Client, isFullPage } from "@notionhq/client";

export async function getDataFromSource(dataSourceId: string) {
  try {
    const notion = new Client({
      auth: import.meta.env.NOTION_API_KEY,
    });

    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
    });

    const fullPages = res.results.filter(isFullPage);

    return fullPages.map((row) => {
      let name = "Unnamed";
      let role = "Team Member";
      let image = null;
      let imageAlt = "";

      const nameProperty = row.properties.Name;
      const roleProperty = row.properties.Role;
      const imageProperty = row.properties.Image;
      const imageAltProperty = row.properties.ImageAlt;

      if (nameProperty.type === "title") {
        name = nameProperty.title[0]?.plain_text ?? name;
      }
      if (roleProperty.type === "rich_text") {
        role = roleProperty.rich_text[0]?.plain_text ?? role;
      }
      if (imageProperty.type === "files") {
        const firstFile = imageProperty.files[0];

        if (firstFile.type === "external") {
          image = firstFile.external.url;
        } else if (firstFile.type === "file") {
          image = firstFile.file.url;
        }
      }
      if (imageAltProperty.type === "rich_text") {
        imageAlt = imageAltProperty.rich_text[0]?.plain_text ?? role;
      }

      console.log(`Name: ${name}`);
      console.log(`Role: ${role}`);
      console.log(`Image: ${JSON.stringify(image)}`);
      console.log(`ImageAlt: ${JSON.stringify(imageAlt)}`);
    });
  } catch (error) {
    console.log(error);
  }
}
