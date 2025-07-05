import OpenAI from "openai";
import { zodResponseFormat, zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import "dotenv/config";
import {
  AIExtractedEvent,
  eventDeterminationSystemPrompt,
} from "./openAIBatchHelper";

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

async function main() {
  // const postRepo = new InstagramPostRepo();
  // const batchHelper = new OpenAIBatchHelper();
  // const unprocessedPosts = await postRepo.getAllUnprocessedPosts();
  // const outputJson = await batchHelper.processPosts(unprocessedPosts);

  // FOR TESTING LLM RESPONSE QUALITY
  const postUrl = "https://www.instagram.com/p/DIwY8nYuP2z/media";
  const cdnUrl = await resolveInstagramMediaUrl(postUrl);

  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    // model: "gpt-4.1-nano",
    input: [
      {
        role: "system",
        content: eventDeterminationSystemPrompt,
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Caption: We're hiring executives for the 2025-2026 year!Want to make a difference and get more involved in UofT's climbing community? Join our executive team to bring your ideas to life, help run awesome events, and be part of an amazing crew! Apply now! All positions and responsibilities can be found in the application. Link in bio and below :) https://forms.gle/97V2scAhDyWZCT6d9",
          },
          {
            type: "input_image",
            image_url: cdnUrl,
            detail: "low",
          },
        ],
      },
    ],
    text: {
      format: zodTextFormat(AIExtractedEvent, "EventDetermination"),
    },
  });
  // @ts-ignore
  console.log(JSON.parse(response.output[0].content[0].text));
}
main();
