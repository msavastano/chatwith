import { json, redirect } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';

export const action: ActionFunction = async ({ request }) => {
  const requestText = await request.text();
  const form = new URLSearchParams(requestText);

  return json({ success: true });
};

export const loader = async () => redirect("/", { status: 404 });