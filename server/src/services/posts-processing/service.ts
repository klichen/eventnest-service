import { drizzle } from "drizzle-orm/node-postgres";

import {
  OpenAIBatchHelper,
  AIExtractedEvent,
  type AIResponse,
} from "./openAIBatchHelper";
import { InstagramPostRepo } from "../../repos/instagramPostsRepo";
import { parseESTIsoAsUtc } from "../../utils/helpers";

// TODO refactor this to use DI, initialize in one place and pass to necessary components
// check how this will need to be done when setting on the cron jobs
const postRepo = new InstagramPostRepo();
const batchHelper = new OpenAIBatchHelper();

export async function processInstagramEvents() {
  try {
    // 1. Fetch unprocessed posts.
    const postsToProcess = await postRepo.getAllUnprocessedPosts();

    if (postsToProcess.length === 0) {
      console.log("No new posts to process.");
      return "No new posts to process";
    }

    // 2. Send to OpenAI Batch.
    const aiResponses = await batchHelper.processPosts(postsToProcess);
    if (aiResponses instanceof Error) return new Error(aiResponses.message);

    // 3. Extract events + update post status to processed.

    // 4. Persist events in db.

    console.log(`Processed ${postsToProcess.length} posts; created X events.`);
  } catch (error) {
    console.log(error);
    return new Error("An error occurred while processing instagram posts");
  }
}

function processAiResponse(response: AIResponse) {
  const { postId, title, description, startDatetime, endDatetime, location } =
    response;

  if (
    [title, description, startDatetime, location].every(
      (f) => !fieldIsEmptyOrNullish(f)
    )
  ) {
    const startDate = processDatetimeString(startDatetime);
    const endDate = processDatetimeString(endDatetime);
    return {
      postId,
      title,
      description,
      location,
      startDate,
      endDate,
    };
  } else {
    return null;
  }
}

function fieldIsEmptyOrNullish(field: string) {
  if (field === null) return true;

  const trimmed = field.trim();
  if (trimmed === "" || trimmed.length < 8) return true;

  return /null|undefined/i.test(trimmed);
}

/**
 * Handles the AI outputted datetimes by converting from EST to the correct UTC date object
 */
function processDatetimeString(date: string) {
  if (fieldIsEmptyOrNullish(date)) return null;
  return parseESTIsoAsUtc(date);
}
