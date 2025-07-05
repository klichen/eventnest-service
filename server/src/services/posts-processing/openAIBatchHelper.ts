import path from "path";
import OpenAI from "openai";
import type { Batch, FileObject } from "openai/resources/index";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import fs from "fs";
import os from "os";
import type { InstagramPostRecord } from "../../repos/instagramPostsRepo";
import { resolveInstagramMediaUrl } from "../../utils/helpers";

export interface AIExtractedEvent {
  postId: string;
  title?: string;
  description?: string;
  startDatetime?: string;
  endDatetime?: string;
  location?: string;
}

const AIExtractedEvent = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  startDatetime: z.string().nullable(),
  endDatetime: z.string().nullable(),
  location: z.string().nullable(),
});

export class OpenAIBatchHelper {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI();
  }

  // Determine if a list of posts is an event with an LLM
  public async processPosts(
    posts: InstagramPostRecord[]
  ): Promise<AIExtractedEvent[] | Error> {
    if (posts.length === 0) return new Error("there are no posts to process");

    // 1. Serialize posts to JSONL and upload as an input file.
    const jsonlPath = await this.createInstagramPostProcessingJsonlFile(posts);
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
                content: eventDeterminationSystemPrompt,
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
      if (b.status === "completed") return b;
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

export const eventDeterminationSystemPrompt = `
You are an extractor that reads an Instagram post (caption + image) and determines whether or not this post is for an event. 

Return **only** a JSON object with these fields:
• title (one-line event title)  
• description (concise summary of the event)  
• startDatetime in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ) or null 
• endDatetime in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ) or null 
• location or null

If a field if is not applicable or there is not enough information, set it as null
`;
