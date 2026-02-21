import { z } from "zod";

/**
 * Validator contract: pure function (value) => error message or null.
 * Validators are the single source of truth; use refineWith() for Zod and toFormValidate() for forms.
 */
export type Validator<T = string> = (value: T) => string | null;

/**
 * Builds a Zod superRefine that calls the validator once and adds the issue with that message.
 * Avoids calling the validator twice (predicate + message callback).
 */
export function refineWith<T>(validator: Validator<T>): (val: T, ctx: z.RefinementCtx) => void {
  return (val, ctx) => {
    const error = validator(val);
    if (error) ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
  };
}

/**
 * Adapts a validator to React Hook Form's validate API (return true if valid, else error string).
 */
export function toFormValidate(validator: Validator<string>) {
  return (value: string | undefined): true | string => {
    const error = validator(value ?? "");
    return error ?? true;
  };
}
