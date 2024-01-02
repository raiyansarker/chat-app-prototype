import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/server/db";
import { chat, user, userToChat } from "@/server/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { type ReactNode } from "react";

export default async function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  const auth = cookies().get("username");
  if (!auth) {
    redirect("/");
  }

  const authData = JSON.parse(auth.value) as { id: number; username: string };

  const createChat = async (formData: FormData) => {
    "use server";
    const username = String(formData.get("username"));

    /**
     * check user is requesting to chat with himself
     */
    if (username === authData.username) return;

    const exist = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username))
      .limit(1)
      .then((row) => row[0]);
    if (!exist) {
      // handle error
      console.log("User doesn't exist");
    }

    if (exist) {
      /**
       * check if a chat is already exist
       */
      const parent = alias(userToChat, "parent");
      const chatExist = await db
        .select()
        .from(userToChat)
        .innerJoin(parent, eq(userToChat.chatId, parent.chatId))
        .where(
          and(eq(userToChat.userId, authData.id), eq(parent.userId, exist.id)),
        );
      console.log(chatExist);
      if (!!chatExist.length) return;

      const chatId = createId();
      await db.insert(chat).values({
        slug: chatId,
      });
      const chatInfo = await db
        .select({ id: chat.id })
        .from(chat)
        .where(eq(chat.slug, chatId))
        .limit(1)
        .then((row) => row[0]);

      await db.insert(userToChat).values([
        {
          chatId: chatInfo!.id,
          userId: authData.id,
        },
        {
          chatId: chatInfo!.id,
          userId: exist.id,
        },
      ]);
    }

    revalidatePath("/chat", "layout");
  };

  const data = await db.query.userToChat.findMany({
    where: eq(userToChat.userId, authData.id),
    with: {
      chat: {
        with: {
          users: {
            where: ne(userToChat.userId, authData.id),
            with: {
              user: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="flex h-screen w-screen flex-row overflow-hidden bg-stone-100">
      <div className="sticky left-0 h-full w-[30%] bg-white shadow">
        <h1 className="my-4 inline-flex items-center gap-x-2 px-4 text-3xl">
          Chat
          <span className="rounded-lg bg-indigo-200 px-2 py-0.5 text-sm">
            {authData.username}
          </span>
        </h1>
        <form action={createChat} className="my-3 flex flex-row gap-x-2 px-2">
          <Input type="text" name="username" placeholder="Search Username" />
          <Button type="submit">Send Request</Button>
        </form>
        <div className="flex flex-col items-start justify-center gap-y-1 px-3 py-1.5">
          {!data.length && <h2>No one is available to chat</h2>}

          {data.map((info) => (
            <Link
              href={`/chat/${info.chat.slug}`}
              className="flex w-full flex-row items-center gap-x-3 rounded-md bg-slate-950/5 p-2"
              key={info.chat.slug}
            >
              <Avatar>
                <AvatarImage src="https://github.com/adamwathan.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col items-start">
                <h1 className="text-base">
                  {info.chat.users[0]?.user.username.toLowerCase()}
                </h1>
                <p className="truncate text-sm text-muted-foreground">
                  Lorem ipsum dolor sit
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}
