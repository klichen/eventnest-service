#!/usr/bin/env ts-node
/**
 * One-shot CLI utility:
 *   pnpm ts-node scripts/generateApiKey.ts --client uoft-mobile --env live
 *
 * Writes prefix+hash to DB and prints the *only* copy of the clear-text key.
 */
import "dotenv/config";
import crypto from "crypto";
import { Command } from "commander";
import { apiKeys } from "../db/schema";
import { Postgres } from "../db";
import { ApiKeysRepo } from "../repos/apiKeysRepo";

const program = new Command()
  .option("--client <name>", "Client name", "uoft-mobile-app")
  .option("--env <prod|staging|dev>", "Environment tag", "dev")
  .parse(process.argv);

const { client: consumerName, env } = program.opts<{
  client: string;
  env: string;
}>();

/* ▸ 1. Build label + random ------------------------------------------------ */
const labelName = consumerName.slice(0, 7);
const LABEL = `${labelName}_${env}_`; // ends with '_'
const RANDOM_BYTES_HEX = crypto.randomBytes(32).toString("hex"); // 64 chars

const PREFIX = LABEL + RANDOM_BYTES_HEX.slice(0, 4); // label+4
const API_KEY = LABEL + RANDOM_BYTES_HEX; // full key

/* ▸ 2. SHA-256 hash -------------------------------------------------------- */
const HASH = crypto.createHash("sha256").update(API_KEY).digest("hex");

/* ▸ 3. Insert into DB ------------------------------------------------------ */
const apiKeysRepo = new ApiKeysRepo();

// TODO update this to keep in apiKeyRepo
const savedOrError = apiKeysRepo.create(consumerName, PREFIX, HASH);
if (savedOrError instanceof Error) {
  console.error(`${savedOrError.message}`);
} else {
  console.log("\n✅  API key created for", consumerName);
  console.log("   ------------------------------------------------");
  console.log("   ", API_KEY);
  console.log("   ------------------------------------------------");
  console.log("⚠️  This is the ONLY time the key will be shown.\n");
}
