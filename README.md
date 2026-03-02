# AtomCraft

Welcome to the official repository for the AtomCraft website. This project is built using **Astro**, styled with **Tailwind CSS**, and features high-performance animations powered by **GSAP**. Content is managed via a **Notion** integration.

## Project Stack

- **Framework:** [Astro](https://astro.build/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [GSAP](https://greensock.com/gsap/)
- **CMS:** Notion API

## Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v20.17.0 or higher)
- npm or pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/lamingt/atomcraft.git
   ```

2. **Switch to the redesign branch:**
   ```bash
   cd atomcraft
   git checkout redesign
   ```

3. **Navigate to the frontend directory and install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

### Environment Setup

Create a `.env` file inside the **`./frontend`** directory and add your Notion integration keys:

```env
NOTION_API_KEY=your_notion_api_key
ROLES_DATASOURCE_ID=your_roles_datasource_id
TEAMS_DATASOURCE_ID=your_teams_datasource_id
NEWS_DATASOURCE_ID=your_news_datasource_id
```

### Fetching Notion Images (Prebuild)

Before starting the development server, you must fetch the images from Notion if they aren't already cached locally. 

If the `src/assets/notion-images` directory inside `frontend` is **empty** or **does not exist**, run the following command from inside the `frontend` directory:
```bash
npm run prebuild
```

### Development

Once your `.env` is set up and images are fetched, start the local development server:

```bash
npm run dev
```
Your site will be available at `http://localhost:4321`.

## Available Commands

All commands should be run from within the `./frontend` directory:

| Command             | Action                                                                |
| :------------------ | :-------------------------------------------------------------------- |
| `npm install`       | Installs project dependencies.                                        |
| `npm run prebuild`  | Fetches and caches Notion images to `src/assets/notion-images`.       |
| `npm run dev`       | Starts the local dev server at `localhost:4321`.                      |
| `npm run build`     | Builds your static Astro site to the `dist/` directory.               |
| `npm run preview`   | Previews your production build locally before deploying.              |
