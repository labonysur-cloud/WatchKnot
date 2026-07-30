import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { prisma } from "@/lib/prisma";
import { unauthorized, badRequest, serverError } from "@/lib/apiResponse";

export async function POST(req: Request) {
  const firebaseUser = await getAuthUser(req);
  if (!firebaseUser) return unauthorized();

  const { name, email, uid } = await req.json();

  if (!email || !uid) {
    return badRequest("Email and uid are required");
  }

  if (email !== firebaseUser.email || uid !== firebaseUser.uid) {
    return badRequest("User data does not match authenticated account");
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ user: existing });

    const user = await prisma.user.create({
      data: {
        id: uid,
        name: name ?? firebaseUser.name ?? null,
        email,
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Sync error:", error);
    return serverError("Error syncing user");
  }
}
