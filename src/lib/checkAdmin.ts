import { getAuthUser } from "./getAuthUser";
import { prisma } from "./prisma";

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "labonysur473@gmail.com";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function checkAdmin(req: Request) {
  const firebaseUser = await getAuthUser(req);
  if (!firebaseUser?.email) return false;

  const email = firebaseUser.email.toLowerCase();
  if (getAdminEmails().includes(email)) return true;

  const user = await prisma.user.findUnique({
    where: { email: firebaseUser.email },
    select: { isAdmin: true },
  });

  return user?.isAdmin === true;
}
