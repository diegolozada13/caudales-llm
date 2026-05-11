import { getLLMProvider } from "@/src/lib/llm";

export async function GET() {
  const provider = getLLMProvider();
  return new Response(JSON.stringify({ provider }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
