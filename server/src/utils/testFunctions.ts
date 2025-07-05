import { fetchAndSaveAllInstagramPosts } from "../services/instagram-posts/service";
import { refreshExpiringTokens } from "../services/instagram-tokens/service";

(async () => {
  // await refreshExpiringTokens();
  await fetchAndSaveAllInstagramPosts();
})();
