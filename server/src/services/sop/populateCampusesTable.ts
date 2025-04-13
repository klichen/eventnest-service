import { Postgres } from "../../db";
import { campuses } from "../../db/schema";
import { upsertSOPClubs } from "./service";

const predefinedCampuses = [
  { id: 24, key: "st-george", value: "St George" },
  { id: 29, key: "utm", value: "UTM" },
  { id: 34, key: "utsc", value: "UTSC" },
];

// Function to populate the campuses table with predefined rows
async function populateCampuses() {
  const db = new Postgres();
  try {
    await db.connection
      .insert(campuses)
      .values(predefinedCampuses)
      .onConflictDoNothing(); // Prevents duplicate inserts if data already exists

    console.log("Campuses populated successfully.");
  } catch (error) {
    console.error("Error populating Campuses:", error);
  }
}

// Populates the db with UofT campuses
// Might need to rerun / update the db if SOP changes campus names / anything of that nature
(async () => {
  // await populateCampuses();
  await upsertSOPClubs(); // testing SOP upsert logic
})();
