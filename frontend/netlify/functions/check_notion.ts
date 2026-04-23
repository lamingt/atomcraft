import type { Config } from "@netlify/functions";
import { Client, isFullPage } from "@notionhq/client";

export default async (req: Request) => {
  try {
    const notionApiKey = process.env.NOTION_API_KEY;
    const dataSourceId = process.env.UPDATE_DATASOURCE_ID;
    const buildHookUrl = process.env.NETLIFY_BUILD_HOOK_URL;

    if (!notionApiKey || !dataSourceId || !buildHookUrl) {
      console.error("Missing required environment variables.");
      return new Response("Missing env vars", { status: 500 });
    }

    const notion = new Client({ auth: notionApiKey });

    console.log(`Checking Notion data source ${dataSourceId} for 'Trigger Update' row...`);

    // Using the modern dataSources endpoint with an inline filter
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        property: "Name", // Change this if your title column has a different name
        title: {
          equals: "Trigger Update"
        }
      }
    });

    if (!response.results || response.results.length === 0) {
      console.log("No row found with title 'Trigger Update'.");
      return new Response("Row not found", { status: 404 });
    }

    const triggerPage = response.results[0];
    
    if (!isFullPage(triggerPage)) {
      return new Response("Page properties not available", { status: 400 });
    }

    // Iterate safely to find the checkbox property
    let checkboxPropName = "";
    let isChecked = false;
    
    for (const [propName, propData] of Object.entries(triggerPage.properties)) {
      if (propData.type === "checkbox") {
        checkboxPropName = propName;
        isChecked = propData.checkbox;
        break; // Assume the first checkbox found is the trigger
      }
    }

    if (!checkboxPropName) {
      console.log("No checkbox property found in the 'Trigger Update' row.");
      return new Response("No checkbox property", { status: 400 });
    }

    if (isChecked) {
      console.log("Trigger checkbox is TRUE. Triggering Netlify build hook...");
      
      const buildRes = await fetch(buildHookUrl, {
        method: "POST",
      });

      if (!buildRes.ok) {
        console.error("Failed to trigger Netlify build hook:", await buildRes.text());
        return new Response("Failed to trigger build", { status: 500 });
      }

      console.log("Netlify build triggered successfully. Unchecking the box in Notion...");

      // Update the Notion page to set the checkbox back to false
      await notion.pages.update({
        page_id: triggerPage.id,
        properties: {
          [checkboxPropName]: {
            checkbox: false,
          },
        },
      });

      console.log("Checkbox successfully set back to false.");
      return new Response("Build triggered and checkbox reset", { status: 200 });
    } else {
      console.log("Trigger checkbox is FALSE. No action taken.");
      return new Response("No action taken", { status: 200 });
    }
  } catch (error) {
    console.error("Error in check_notion scheduled function:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};

export const config: Config = {
  schedule: "0 */12 * * *"
};