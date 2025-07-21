import * as p from "drizzle-orm/pg-core";

// clubs table
export const clubs = p.pgTable("clubs", {
  id: p.uuid("id").defaultRandom().primaryKey(),
  name: p.text("name").notNull(),
  description: p.text("description"),
  groupUrl: p.text("group_url"),
  groupEmail: p.text("group_email"),
  facebookUrl: p.text("facebook_url"),
  twitterUrl: p.text("twitter_url"),
  instagramUrl: p.text("instagram_url"),
  websiteUrl: p.text("website_url"),
  instagramUsername: p.text("instagram_username").unique(),
  lastModifiedDate: p.timestamp("last_modified_date").notNull(),
  externalId: p.integer("external_id").notNull().unique(),
});

// areas_of_interest table
export const areasOfInterest = p.pgTable("areas_of_interest", {
  id: p.integer("id").primaryKey(), // matches SOP APi ids
  key: p.text("key").notNull(),
  value: p.text("value").notNull(),
});

// club_areas_of_interest table with composite primary key
export const clubAreasOfInterest = p.pgTable(
  "club_areas_of_interest",
  {
    clubId: p
      .uuid("club_id")
      .notNull()
      .references(() => clubs.id),
    interestId: p
      .integer("interest_id")
      .notNull()
      .references(() => areasOfInterest.id),
  },
  (table) => [p.primaryKey({ columns: [table.clubId, table.interestId] })]
);

// campuses table
export const campuses = p.pgTable("campuses", {
  id: p.integer("id").primaryKey(), // matches SOP APi ids
  key: p.text("key").notNull(),
  value: p.text("value").notNull(),
});

// clubs_campuses table with composite primary key
export const clubsCampuses = p.pgTable(
  "clubs_campuses",
  {
    campusId: p
      .integer("campus_id")
      .notNull()
      .references(() => campuses.id),
    clubId: p
      .uuid("club_id")
      .notNull()
      .references(() => clubs.id),
  },
  (table) => [p.primaryKey({ columns: [table.clubId, table.campusId] })]
);

// club_instagram_tokens table
export const clubInstagramTokens = p.pgTable("club_instagram_tokens", {
  clubId: p
    .uuid("club_id")
    .primaryKey()
    .references(() => clubs.id),
  instagramUsername: p.text("instagram_username").notNull().unique(),
  accessToken: p.text("access_token").notNull(),
  expiration: p.timestamp("expiration").notNull(),
});

export const postStatusEnum = p.pgEnum("status_enum", [
  "unprocessed",
  "processing",
  "processed",
]);

// instagram_posts table
export const instagramPosts = p.pgTable(
  "instagram_posts",
  {
    id: p.uuid("id").primaryKey().defaultRandom(),
    caption: p.text("caption"),
    postUrl: p.text("post_url").notNull(), // not unique because sometimes clubs can collaborate on posts and it would be under both their accounts
    imageUrl: p.text("image_url").notNull(),
    createdOn: p.timestamp("created_on").notNull(),
    status: postStatusEnum("status").notNull(),
    clubId: p
      .uuid("club_id")
      .notNull()
      .references(() => clubs.id),
  },
  (table) => [p.index("club_id_idx").on(table.clubId)]
);

// events table
export const events = p.pgTable(
  "events",
  {
    id: p.uuid("id").primaryKey().defaultRandom(),
    title: p.text("title").notNull(),
    description: p.text("description"),
    startDatetime: p.timestamp("start_datetime").notNull(),
    endDatetime: p.timestamp("end_datetime"),
    location: p.text("location").notNull(),
    postId: p
      .uuid("post_id")
      .notNull()
      .references(() => instagramPosts.id),
  },
  (table) => [p.index("post_id_idx").on(table.postId)]
);
