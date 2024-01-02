import { env } from "@/env";
import PusherClient from "pusher-js";

export const pusherClient = new PusherClient(env.NEXT_PUBLIC_PUSHER_KEY, {
  cluster: "ap1",
  authEndpoint: "/api/pusher/auth",
});
