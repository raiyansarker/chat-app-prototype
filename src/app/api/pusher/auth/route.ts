import { pusherServer } from "@/lib/pusher-server";
import { createId } from "@paralleldrive/cuid2";

export async function POST(req: Request) {
  console.log("Check Here");
  const data = await req.text();
  console.log(data);
  const [socketId, channelName] = data
    .split("&")
    .map((str) => str.split("=")[1]);

  const id = createId();

  const presenceData = {
    user_id: id,
    user_data: { user_id: id },
  };

  const auth = pusherServer.authorizeChannel(
    socketId!,
    channelName!,
    presenceData,
  );

  return new Response(JSON.stringify(auth));
}
