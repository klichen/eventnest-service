import { fetchAndSaveAllInstagramPosts } from "../services/instagram-posts/service";
import { refreshExpiringTokens } from "../services/instagram-tokens/service";
import { processInstagramEvents } from "../services/posts-processing/service";

(async () => {
  // await refreshExpiringTokens();
  // await fetchAndSaveAllInstagramPosts();
  await processInstagramEvents();
})();
