import { refreshExpiringTokens } from "../services/instagram-tokens/service";

(async () => {
  await refreshExpiringTokens();
  // await upsertSOPClubs(); // testing SOP upsert logic
})();
