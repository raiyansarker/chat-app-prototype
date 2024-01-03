"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pusherClient } from "@/lib/pusher";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";

type ChatMessagesProps = {
  slug: string;
  userId: number;
  prevMessages: {
    data: string;
    userId: number;
  }[];
};

type Message = { message: string; sender: number };
export default function ChatMessages({
  slug,
  userId,
  prevMessages,
}: ChatMessagesProps) {
  const [incomingMessages, setIncomingMessages] = useState<Message[]>([]);
  const scrollToBottomRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (scrollToBottomRef.current) {
      scrollToBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [incomingMessages]);

  useEffect(() => {
    pusherClient.subscribe(slug);

    pusherClient.bind("message", (message: Message) => {
      setIncomingMessages((prev) => [...prev, message]);
    });

    return () => {
      pusherClient.unsubscribe(slug);
      pusherClient.unbind("message");
    };
  }, []);

  return (
    <>
      {prevMessages.map((chat, i) => (
        <div
          key={i}
          className="max-w-fit rounded-full"
          style={{
            backgroundColor:
              userId === chat.userId ? "rgb(99 102 241)" : "rgb(212 212 212)",
            justifySelf: userId === chat.userId ? "end" : "start",
          }}
        >
          <p
            className="inline-block px-4 py-2"
            style={{
              color: userId === chat.userId ? "white" : "black",
            }}
          >
            {chat.data}
          </p>
        </div>
      ))}
      {incomingMessages.map((chat, i) => (
        <div
          key={i}
          className="max-w-fit rounded-2xl"
          style={{
            backgroundColor:
              userId === chat.sender ? "rgb(99 102 241)" : "rgb(212 212 212)",
            justifySelf: userId === chat.sender ? "end" : "start",
          }}
        >
          <p
            className="inline-block px-4 py-2"
            style={{
              color: userId === chat.sender ? "white" : "black",
            }}
          >
            {chat.message}
          </p>
        </div>
      ))}
      <span ref={scrollToBottomRef} />
    </>
  );
}

type SendMessageProps = {
  slug: string;
  chatId: number;
};
const messageSchema = z.object({
  message: z.string().min(1),
});

export function SendMessage({ slug, chatId }: SendMessageProps) {
  const { mutateAsync: sendMessage } = api.message.sendMessage.useMutation();

  const { register, handleSubmit, reset } = useForm<
    z.infer<typeof messageSchema>
  >({
    resolver: zodResolver(messageSchema),
  });

  const addMessage: SubmitHandler<z.infer<typeof messageSchema>> = async (
    data,
  ) => {
    await sendMessage({
      chatId,
      message: data.message,
      slug,
    });
    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(addMessage)}
      className="sticky bottom-0 flex h-16 w-full flex-row items-center gap-x-4 bg-white p-4"
    >
      <Input
        {...register("message")}
        type="text"
        placeholder="Type a message"
        className="w-full"
      />
      <Button>Send</Button>
    </form>
  );
}
