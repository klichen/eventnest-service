import { refreshExpiringTokens } from "../services/instagram-tokens/service";

(async () => {
  await refreshExpiringTokens();
  // await syncSOPClubs(); // testing SOP upsert logic
})();
