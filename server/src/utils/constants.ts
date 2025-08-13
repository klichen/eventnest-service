export const predefinedAreasOfInterest = [
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

export const predefinedCampuses = [
  { id: 24, key: "st-george", value: "St George" },
  { id: 29, key: "utm", value: "UTM" },
  { id: 34, key: "utsc", value: "UTSC" },
];

export const ALLOWED_INTEREST_KEYS = new Set(
  predefinedAreasOfInterest.map((a) => a.key.toLowerCase())
);

export const ALLOWED_CAMPUS_KEYS = new Set(
  predefinedCampuses.map((c) => c.key.toLowerCase())
);
