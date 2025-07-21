import { parseESTIsoAsUtc } from "../../utils/helpers";

export function fieldIsEmptyOrNullish(field: string) {
  if (field === null) return true;

  const trimmed = field.trim();
  if (trimmed === "" || trimmed.length < 8) return true;

  return /null|undefined/i.test(trimmed);
}

/**
 * Handles the AI outputted datetimes by converting from EST to the correct UTC date object
 */
export function processDatetimeString(date: string) {
  if (fieldIsEmptyOrNullish(date)) return null;
  return parseESTIsoAsUtc(date);
}
