import { type LoaderArgs, json } from "@remix-run/server-runtime";
import { agent } from '~/servers/agent.server';

export const loader = async ({ request }: LoaderArgs) => {
  const ag = await agent()
  
  const feed = await ag.getAuthorFeed({
    actor: process.env.BSKY_USERNAME!,
  })
  return json({ feed, success: true }, 200);
};