import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { prisma } from "@/lib/prisma";
import { unauthorized, serverError } from "@/lib/apiResponse";

export async function PUT(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  try {
    const { name, image } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: user.uid },
      data: {
        ...(name && { name }),
        ...(image !== undefined && { image }),
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return serverError();
  }
}
