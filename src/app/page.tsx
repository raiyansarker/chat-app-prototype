import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const auth = cookies().get("username");
  if (auth) {
    redirect("/chat");
  }

  const login = async (formData: FormData) => {
    "use server";
    const username = String(formData.get("username"));

    function signCookie(value: string) {
      cookies().set("username", value, {
        secure: true,
        expires: new Date(Date.now() + 1000 * 60 * 60),
      });
    }

    let value: unknown = undefined;
    const data = await db
      .select({ id: user.id, username: user.username })
      .from(user)
      .where(eq(user.username, username))
      .limit(1)
      .then((row) => row[0]);

    if (!data) {
      await db.insert(user).values({ username });
      value = await db
        .select({ id: user.id, username: user.username })
        .from(user)
        .where(eq(user.username, username))
        .limit(1)
        .then((row) => row[0]);
    }

    signCookie(value ? JSON.stringify(value) : JSON.stringify(data));
  };

  return (
    <form action={login} className="grid h-screen w-full place-items-center">
      <Card className="min-w-[25rem]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Login To Chat</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="username">Username</Label>
          <Input
            name="username"
            type="text"
            placeholder="darklord"
            id="username"
          />
        </CardContent>
        <CardFooter>
          <Button type="submit">Chat</Button>
        </CardFooter>
      </Card>
    </form>
  );
}
