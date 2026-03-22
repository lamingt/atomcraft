// src/content/config.ts
import { defineCollection, z } from "astro:content";
import { getTeams, getNews, type Team, type Article } from "../api.ts";

export const memberSchema = z.object({
  name: z.string(),
  role: z.string(),
  imageUrl: z.string(),
  imageAlt: z.string(),
  id: z.string(),
});

const teams = defineCollection({
  schema: z.object({
    name: z.string(),
    description: z.string(),
    members: z.array(memberSchema),
  }),
  loader: async () => {
    const teamsData: Team[] = await getTeams();
    return teamsData.map((team) => ({
      id: team.name.toLowerCase().replace(/\s+/g, "-"),
      ...team,
    }));
  },
});

const news = defineCollection({
  schema: z.object({
    name: z.string(),
    description: z.string(),
    date: z.string(),
    categories: z.array(z.string()),
    url: z.string(),
    imageUrl: z.string(),
    imageAlt: z.string(),
    type: z.enum(["Featured", "Regular"]),
  }),
  loader: async () => {
    const newsData: Article[] = await getNews();
    return newsData.map((article) => ({
      ...article,
    }));
  },
});

export const collections = { teams, news };
export type Member = z.infer<typeof memberSchema>;