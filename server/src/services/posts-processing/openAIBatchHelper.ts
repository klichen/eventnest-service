import path from "path";
import OpenAI from "openai";
import type { Batch, FileObject } from "openai/resources/index";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import fs from "fs";
import os from "os";
import type { InstagramPostRecord } from "../../repos/instagramPostsRepo";
import { resolveInstagramMediaUrl } from "../../utils/helpers";

export const AIExtractedEvent = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  startDatetime: z.string().nullable(),
  endDatetime: z.string().nullable(),
  location: z.string().nullable(),
  incentives: z.string().nullable(), // e.g. free food or drinks
});

export const BatchOutputSchema = z.array(
  z.object({
    postId: z.string(),
    title: z.string(),
    description: z.string(),
    startDatetime: z.string(),
    endDatetime: z.string(),
    location: z.string(),
    incentives: z.string(),
  })
);

export type BatchOutput = z.infer<typeof BatchOutputSchema>;
export type BatchOutputItem = BatchOutput[number];

export class OpenAIBatchHelper {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI();
  }

  // Determine if a list of posts is an event with an LLM
  public async processPosts(
    posts: InstagramPostRecord[]
  ): Promise<BatchOutput | Error> {
    try {
      if (posts.length === 0) return new Error("there are no posts to process");

      // 1. Serialize posts to JSONL and upload as an input file.
      const jsonlPath = await this.createInstagramPostProcessingJsonlFile(
        posts
      );
      const inputFile = await this.uploadFile(jsonlPath);

      // 2. Kick off the batch job.
      const batch = await this.createBatch(inputFile.id);

      // 2.5 clean up jsonl file
      await fs.promises.unlink(jsonlPath);

      // 3. Wait for completion.
      const completed = await this.waitForBatch(batch.id);
      if (completed instanceof Error) {
        console.log(`Batch ${batch.id} failed to complete`);
        return new Error(`Batch ${batch.id} failed to complete`);
      }
      // 4. Get the output file.
      const outputFileId = completed.output_file_id;
      if (!outputFileId) {
        return new Error("Batch finished without an output file id.");
      }
      const jsonString = await this.getBatchOutput(outputFileId);

      // 5. Parse each line as JSON and extract needed fields.
      const outputs = jsonString
        .trim()
        .split("\n")
        .flatMap((line) => {
          const res = JSON.parse(line);
          return {
            postId: res.custom_id,
            ...JSON.parse(res.response.body.output[0].content[0].text),
          };
        });

      return outputs;
    } catch (error) {
      console.log(error);
      return new Error("An error occurred during post processing.");
    }
  }

  private async createInstagramPostProcessingJsonlFile(
    posts: InstagramPostRecord[]
  ): Promise<string> {
    console.log("creating jsonl input file...");
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `batch-${Date.now()}.jsonl`);
    const postsToProcess = await Promise.all(
      posts.map(async (p) => ({
        id: p.id,
        caption: p.caption,
        createdOn: p.createdOn,
        mediaUrl: await resolveInstagramMediaUrl(p.imageUrl),
      }))
    );
    const jsonlContent = postsToProcess
      .map((post) =>
        JSON.stringify({
          custom_id: post.id,
          method: "POST",
          url: "/v1/responses",
          body: {
            model: "gpt-4o-mini",
            input: [
              {
                role: "system",
                content: buildEventDeterminationSystemPrompt(
                  post.createdOn.toISOString()
                ),
              },
              {
                role: "user",
                content: [
                  { type: "input_text", text: `Post caption: ${post.caption}` },
                  { type: "input_image", image_url: post.mediaUrl },
                ],
              },
            ],
            text: {
              format: zodTextFormat(AIExtractedEvent, "EventDetermination"),
            },
          },
        })
      )
      .join("\n");

    await fs.promises.writeFile(tempFile, jsonlContent);
    return tempFile;
  }

  private async uploadFile(filePath: string): Promise<FileObject> {
    console.log("uploading jsonl input file to openAI...");
    return await this.openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: "batch",
    });
  }

  private async createBatch(inputFileId: string): Promise<Batch> {
    console.log("creating batch...");
    return await this.openai.batches.create({
      input_file_id: inputFileId,
      endpoint: "/v1/responses",
      completion_window: "24h",
    });
  }

  private async waitForBatch(
    batchId: string,
    pollIntervalMs = 30000
  ): Promise<Batch | Error> {
    while (true) {
      const b = await this.openai.batches.retrieve(batchId);
      if (b.status === "completed") {
        console.log("batch completed, proceeding...");
        return b;
      }

      if (b.status === "failed" || b.status === "expired") {
        return new Error(`Batch ${batchId} finished with status ${b.status}`);
      }
      console.log("batch not completed yet, checking again in 30s...");
      await new Promise((res) => setTimeout(res, pollIntervalMs));
    }
  }

  private async getBatchOutput(outputFileId: string): Promise<string> {
    const content = await this.openai.files.content(outputFileId);
    return content.text();
  }
}

export function buildEventDeterminationSystemPrompt(
  createdOnISO: string
): string {
  return `
You are an information-extraction assistant.

The Instagram post was created on **${createdOnISO}** (this is your reference date/time for resolving any relative dates or inferring years).

Your job is to analyze the Instagram post (caption + image) and decide if it's advertising a future event someone could attend (in person or online).
Please treat information from captions with more weight. If there are contradictions between the image and caption, trust the information in the caption more since it can be updated after posting. 

- If you detect a **future** event:
  1. Resolve any relative dates (“next Friday”, “tomorrow”, etc.) against the creation date of ${createdOnISO}.  
     • If that yields a date that is already past, assume the **next** occurrence (e.g. “next Friday” on Monday → that week; on Friday → the following week).  
  2. If an absolute date is given (e.g. “May 19th”), infer the correct year based on ${createdOnISO}.  
  3. Output a JSON object with these fields (use null when a field is missing or irrelevant):
     • **title**: one-line event title  
     • **description**: important details about the event 
     • **startDatetime**: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ) or null
     • **endDatetime**: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ) or null  
     • **location**: location string (address, “Zoom”, etc.) or null
     • **incentives**: any perks or amenities offered that might be pique a student's interest (e.g. free food, drinks, giveaways, exclusive benefits) as a string, or null
`;
}
