import { type LoaderArgs, json } from "@remix-run/server-runtime";
import { agent } from '~/servers/agent.server';

export const loader = async ({ request }: LoaderArgs) => {
  const ag = await agent()
  
  const follows = await ag.getFollowers({
    actor: process.env.BSKY_USERNAME!,
  })
  return json({ follows, success: true }, 200);
};