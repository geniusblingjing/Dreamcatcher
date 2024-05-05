import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { gptPrompt, makeImage } from "../shared/openai.ts";
import { createExitSignal, staticServer } from "../shared/server.ts";


const app = new Application();
const router = new Router();

// API routes
router.get("/api/gpt", async (ctx) => {
  const prompt = ctx.request.url.searchParams.get("prompt");
  const shortPrompt = prompt.slice(0, 50);
  const result = await gptPrompt(shortPrompt, { max_tokens: 600 });
  ctx.response.body = result;
});

router.post("/api/generate-image", async (ctx) => {
  const { dream } = await ctx.request.body().value;
  if (!dream) {
      ctx.response.status = 400;
      ctx.response.body = 'Invalid or missing dream';
      return;
  }

  try {
      const imageUrl = await makeImage(dream);
      ctx.response.body = { imageUrl };
  } catch (error) {
      console.error('Error generating image:', error);
      ctx.response.status = 500;
      ctx.response.body = 'Internal Server Error';
  }
});

app.use(router.routes());
app.use(router.allowedMethods());
app.use(staticServer);

console.log("Listening on http://localhost:8000");

await app.listen({ port: 8000, signal: createExitSignal() });
