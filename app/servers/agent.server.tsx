import type { AtpSessionEvent, AtpSessionData } from '@atproto/api';
import { BskyAgent  } from '@atproto/api';

export async function agent() {
  const agent: BskyAgent = new BskyAgent({
    service: 'https://bsky.social',
  });
  await agent.login({
    identifier: process.env.BSKY_USERNAME!,
    password: process.env.BSKY_PASSWORD!,
  });

  return agent;
}