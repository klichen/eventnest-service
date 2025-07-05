import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import "dotenv/config";
import { eventDeterminationSystemPrompt } from "./openAIBatchHelper";

export async function resolveInstagramMediaUrl(
  mediaUrl: string
): Promise<string> {
  // Use HEAD so you don’t download the whole image
  const res = await fetch(mediaUrl, {
    method: "GET",
    redirect: "follow", // (default) follow 302 → CDN
  });

  if (!res.ok) {
    throw new Error(`Failed to resolve media URL (${res.status})`);
  }

  // `res.url` is the final URL after following all redirects
  return res.url;
}

const openai = new OpenAI();

const DateTimeString = z.string().refine(
  (str) => {
    const d = new Date(str);
    return !isNaN(d.getTime());
  },
  {
    message: "Must be a valid datetime string",
  }
);

const responseSchema = z.object({
  title: z.string(),
  summary: z.string(),
  location: z.string().nullable(),
  startDatetime: DateTimeString.nullable(),
});

async function main() {
  // const postRepo = new InstagramPostRepo();
  // const batchHelper = new OpenAIBatchHelper();
  // const unprocessedPosts = await postRepo.getAllUnprocessedPosts();
  // const outputJson = await batchHelper.processPosts(unprocessedPosts);

  // FOR TESTING LLM RESPONSE QUALITY
  const postUrl = "https://www.instagram.com/p/DKpmYdVJV_T/media";
  const cdnUrl = await resolveInstagramMediaUrl(postUrl);

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: eventDeterminationSystemPrompt,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Caption: Join us for board games on Monday May 19th, 2025 @ Wilson Hall WI2002",
          },
          {
            type: "image_url",
            image_url: {
              url: cdnUrl, // Use the resolved CDN URL
            },
          },
        ],
      },
    ],
    response_format: zodResponseFormat(
      responseSchema,
      "event_extraction_response"
    ),
  });
  console.log(response.choices[0].message.content);
}
main();
