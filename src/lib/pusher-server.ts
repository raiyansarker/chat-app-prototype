import "server-only";
import PusherServer from "pusher";
import { env } from "@/env";

export const pusherServer = new PusherServer({
  appId: env.PUSHER_APP_ID,
  key: env.NEXT_PUBLIC_PUSHER_KEY,
  secret: env.PUSHER_SECRET,
  cluster: "ap1",
  useTLS: true,
});
