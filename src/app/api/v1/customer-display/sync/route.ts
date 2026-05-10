import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { publishCart } from "@/lib/realtime/cartBus";

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const payload = await req.json();
    publishCart(user.tenantId, payload);
    return ok({ ok: true });
  } catch (e) {
    console.error("Cart sync error:", e);
    return error("Internal server error", 500);
  }
}
