import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");

    const where: any = {
      userId: session.user.id,
    };

    if (tripId) {
      where.tripId = tripId;
    }

    const conversations = await prisma.chatConversation.findMany({
      where,
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return Response.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, tripId } = body;

    if (!title) {
      return new Response("Missing required fields", { status: 400 });
    }

    const conversation = await prisma.chatConversation.create({
      data: {
        userId: session.user.id,
        tripId: tripId || null,
        title,
      },
      include: {
        messages: true,
      },
    });

    return Response.json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
