import OpenAI from "openai";
import { zodResponseFormat, zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import "dotenv/config";
import {
  AIExtractedEvent,
  buildEventDeterminationSystemPrompt,
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

// PERKS (free pizza) example: https://www.instagram.com/p/C0j3n61ymoT/

async function main() {
  // const postRepo = new InstagramPostRepo();
  // const batchHelper = new OpenAIBatchHelper();
  // const unprocessedPosts = await postRepo.getAllUnprocessedPosts();
  // const outputJson = await batchHelper.processPosts(unprocessedPosts);

  // FOR TESTING LLM RESPONSE QUALITY
  const postUrl = "https://www.instagram.com/p/DKpmYdVJV_T/media";
  const cdnUrl = await resolveInstagramMediaUrl(postUrl);
  const createdOn = new Date("2025-05-19 18:32:53");

  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    // model: "gpt-4.1-nano",
    input: [
      {
        role: "system",
        content: buildEventDeterminationSystemPrompt(createdOn.toISOString()),
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Caption: Hey everyone! We are BACK to our regular 6pm starting time this week! We can't let that 30 minutes of GLG time go to waste! Like the past couple of weeks, we'll be in Wilson Hall room 2002. Hope to see you there!",
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
