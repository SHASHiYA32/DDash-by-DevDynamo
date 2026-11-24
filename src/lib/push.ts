import "server-only";
import { sendNotification, setVapidDetails } from "web-push";
import { deletePushSubscriptions, listPushSubscriptions } from "@/lib/db";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

/** True once both VAPID keys are set. Until then the push switch stays hidden and nothing is sent. */
export const pushEnabled = Boolean(PUBLIC_KEY && PRIVATE_KEY);

if (pushEnabled) {
  setVapidDetails(process.env.VAPID_SUBJECT ?? "https://dev-dynamo-official.vercel.app", PUBLIC_KEY!, PRIVATE_KEY!);
}

export interface PushPayload {
  title: string;
  body: string;
  /** where the tap opens: an in-app path or an https link */
  url: string;
  tag: string;
}

/** Sends to every device of one business (or all). Dead subscriptions are cleaned up. */
export async function sendPush(businessId: string | null, payload: PushPayload) {
  if (!pushEnabled) return { sent: 0, failed: 0, removed: 0 };
  const subs = await listPushSubscriptions(businessId);
  const body = JSON.stringify(payload);
  const dead: string[] = [];
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < subs.length; i += 25) {
    await Promise.all(
      subs.slice(i, i + 25).map(async (s) => {
        try {
          await sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, {
            TTL: 60 * 60 * 24,
            urgency: "normal",
          });
          sent++;
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) dead.push(s.endpoint);
          failed++;
        }
      }),
    );
  }
  await deletePushSubscriptions(dead);
  return { sent, failed, removed: dead.length };
}
