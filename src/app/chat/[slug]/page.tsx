import { db } from "@/server/db";
import { chat, message } from "@/server/db/schema";
import { asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessages, { SendMessage } from "./chat";

export default async function Chat({ params }: { params: { slug: string } }) {
  const data = await db
    .select({ id: chat.id })
    .from(chat)
    .where(eq(chat.slug, params.slug))
    .limit(1)
    .then((row) => row[0]);

  // const prevMessages = await db.query.message.findMany({
  //   with: {
  //     chat: {
  //       // @ts-expect-error Something I don't know
  //       where: eq(chat.slug, params.slug),
  //       columns: {
  //         id: true,
  //       },
  //     },
  //   },
  //   columns: {
  //     userId: true,
  //     data: true,
  //   },
  //   orderBy: asc(message.createdAt),
  // });

  const prevMessages = await db
    .select({ data: message.data, userId: message.userId })
    .from(message)
    .leftJoin(chat, eq(message.chatId, chat.id))
    .where(eq(chat.slug, params.slug))
    .orderBy(asc(message.createdAt))
    .limit(20);

  if (!data) {
    notFound();
  }

  const auth = cookies().get("username");
  if (!auth) {
    redirect("/");
  }

  const authData = JSON.parse(auth.value) as { id: number; username: string };

  return (
    <div className="relative h-[calc(100vh-theme(spacing[16]))] w-[70%] shrink [&>div]:h-full">
      <ScrollArea>
        <div className="grid h-auto gap-y-3 px-4 py-2">
          <ChatMessages
            slug={params.slug}
            userId={authData.id}
            prevMessages={prevMessages}
          />
        </div>
      </ScrollArea>
      <SendMessage slug={params.slug} chatId={data.id} />
    </div>
  );
}
