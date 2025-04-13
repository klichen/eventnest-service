import { Postgres } from "../../db";
import { areasOfInterest } from "../../db/schema";

const predefinedAreasOfInterest = [
  { id: 39, key: "academic", value: "Academic" },
  { id: 44, key: "arts", value: "Arts" },
  { id: 307, key: "athletics-recreation", value: "Athletics & Recreation" },
  { id: 54, key: "community-service", value: "Community Service" },
  { id: 59, key: "culture-identities", value: "Culture & Identities" },
  {
    id: 64,
    key: "environment-sustainability",
    value: "Environment & Sustainability",
  },
  { id: 69, key: "global-interests", value: "Global Interests" },
  { id: 74, key: "hobby-leisure", value: "Hobby & Leisure" },
  { id: 79, key: "leadership", value: "Leadership" },
  { id: 84, key: "media", value: "Media" },
  { id: 89, key: "politics", value: "Politics" },
  { id: 94, key: "social", value: "Social" },
  {
    id: 99,
    key: "social-justice-advocacy",
    value: "Social Justice & Advocacy",
  },
  {
    id: 104,
    key: "spirituality-faith-communities",
    value: "Spirituality & Faith Communities",
  },
  {
    id: 109,
    key: "student-governments-councils-unions",
    value: "Student Governments, Councils & Unions",
  },
  {
    id: 114,
    key: "work-career-development",
    value: "Work & Career Development",
  },
];

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
