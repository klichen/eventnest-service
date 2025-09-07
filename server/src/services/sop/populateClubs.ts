import { Postgres } from "../../db";
import { syncSOPClubs, upsertSingleClub } from "./service";

const eventNestTestClub = {
  id: 55552255, // external id
  name: "EventNest Test Club",
  description: "test club description",
  group_Url: "",
  expires: "never",
  lastModifiedDate: "2025-05-05",
  social_Media: {
    instagram: "https://www.instagram.com/eventnest_service/",
    facebook: "",
    twitter: "",
    website: "",
  },
};

(async () => {
  const db = new Postgres();
  await syncSOPClubs(db.connection, true); // insert 25 clubs for local db
  await upsertSingleClub(eventNestTestClub, db.connection);
})();
