import { translatePost } from "@/app/actions";

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const id = new URL(req.url).searchParams.get("id") ?? "";
  return Response.json(await translatePost(id, "en"));
}