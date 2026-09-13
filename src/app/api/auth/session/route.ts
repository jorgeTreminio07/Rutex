import { getCurrentUser } from "@/lib/server/auth";
import { ok, serverError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return ok(null);
    }
    return ok({
      id: user.id,
      username: user.username ?? "",
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      imageUrl: user.imageUrl,
      roleId: user.roleId,
      permissions: user.permissions,
    });
  } catch (error) {
    return serverError(error);
  }
}
