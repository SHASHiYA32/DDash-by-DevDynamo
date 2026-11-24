import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, getSession, ok } from "@/lib/auth";
import { updateRequest } from "@/lib/db";

const schema = z.object({
  id: z.string(),
  status: z.enum(["pending", "in_progress", "delivered", "declined"]).optional(),
  devNote: z.string().max(1000).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isDev) return fail("Not allowed", 403);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Invalid request");
  return (await updateRequest(parsed.data.id, parsed.data)) ? ok() : fail("Request not found", 404);
}
