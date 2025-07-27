import {
  OpenAIBatchHelper,
  BatchOutputSchema,
  type BatchOutput,
  type BatchOutputItem,
} from "./openAIBatchHelper";
import { InstagramPostRepo } from "../../repos/instagramPostsRepo";
import { fieldIsEmptyOrNullish, processDatetimeString } from "./helpers";
import { EventsRepo } from "../../repos/events/repo";

// TODO refactor this to use DI, initialize in one place and pass to necessary components
// check how this will need to be done when setting on the cron jobs
const postRepo = new InstagramPostRepo();
const eventsRepo = new EventsRepo();
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

    // parse with zod
    let aiResults: BatchOutput;
    const result = BatchOutputSchema.safeParse(aiResponses);
    if (!result.success) {
      return new Error("AI response did not match required schema");
    } else {
      aiResults = result.data;
    }

    // 3. Extract events + update post status to processed.
    console.log("Extracting events from AI responses");
    const events = aiResults.flatMap((res) => {
      const evt = processBatchItem(res);
      return evt
        ? [
            {
              postId: evt.postId,
              title: evt.title,
              description: evt.description,
              location: evt.location,
              startDatetime: evt.startDate,
              endDatetime: evt.endDate,
              incentives: evt.incentives,
            },
          ]
        : [];
    });

    // 4. Persist events in db.
    await eventsRepo.saveMany(events);

    console.log(
      `Processed ${postsToProcess.length} posts; created ${events.length} events.`
    );
  } catch (error) {
    console.log(error);
    return new Error("An error occurred while processing instagram posts");
  }
}

function processBatchItem(response: BatchOutputItem) {
  const {
    postId,
    title,
    description,
    startDatetime,
    endDatetime,
    location,
    incentives,
  } = response;

  if (
    [title, description, startDatetime, location].every(
      (f) => !fieldIsEmptyOrNullish(f)
    )
  ) {
    const startDate = processDatetimeString(startDatetime);
    if (startDate === null) return null;
    const endDate = processDatetimeString(endDatetime);
    return {
      postId,
      title,
      description,
      location,
      startDate,
      endDate,
      incentives: incentives || null,
    };
  } else {
    return null;
  }
}
