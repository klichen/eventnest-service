import { Postgres } from "../../db";
import { areasOfInterest } from "../../db/schema";
import { predefinedAreasOfInterest } from "../../utils/constants";

// Function to populate the areas_of_interest table with predefined rows
async function populateAreasOfInterest() {
  const db = new Postgres();
  try {
    await db.connection
      .insert(areasOfInterest)
      .values(predefinedAreasOfInterest)
      .onConflictDoNothing(); // prevents duplicate inserts if data already exists

    console.log("Areas of Interest populated successfully.");
    db.close();
  } catch (error) {
    console.error("Error populating Areas of Interest:", error);
  }
}

// Populates the db with areas of interests from SOP
// Might need to rerun / update the db if SOP ever changes these values
(async () => {
  await populateAreasOfInterest();
})();
