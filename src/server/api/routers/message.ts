import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { message } from "@/server/db/schema";
import { pusherServer } from "@/lib/pusher-server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const messageRouter = createTRPCRouter({
  sendMessage: publicProcedure
    .input(
      z.object({
        message: z.string().min(1),
        slug: z.string().min(1),
        chatId: z.number().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const auth = cookies().get("username");
      if (!auth) {
        redirect("/");
      }

      const authData = JSON.parse(auth.value) as {
        id: number;
        username: string;
      };

      await pusherServer.trigger(input.slug, "message", {
        message: input.message,
        sender: authData.id,
      });
      await ctx.db.insert(message).values({
        chatId: input.chatId,
        userId: authData.id,
        data: input.message,
      });
    }),
});
