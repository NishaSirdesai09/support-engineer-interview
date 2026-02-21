/**
 * Shared validation: one validator per domain (returns error message or null),
 * Zod schemas for API, and form helpers. Import from here or from specific modules.
 */
export type { Validator } from "./refine";
export { refineWith, toFormValidate } from "./refine";

export {
  normalizeEmail,
  validateEmail,
  emailSchema,
} from "./email";

export {
  MIN_AGE_YEARS,
  validateDateOfBirth,
  dateOfBirthSchema,
  getDateOfBirthMin,
  getDateOfBirthMax,
} from "./dateOfBirth";

export {
  validateState,
  stateSchema,
  STATE_CODES_SORTED,
} from "./state";

export {
  normalizePhone,
  validatePhone,
  phoneSchema,
} from "./phone";

export {
  validateFundingAmount,
  normalizeAmount,
} from "./amount";

export { validateCardNumber } from "./card";

export { validatePassword, passwordSchema } from "./password";

export { validateRoutingNumber } from "./routing";
