import { Postgres } from "../../db";
import { campuses } from "../../db/schema";
import { predefinedCampuses } from "../../utils/constants";

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
  await populateCampuses();
})();
