import { z } from "zod";

/** (value) => error message or null; use refineWith for Zod, toFormValidate for forms. */
export type Validator<T = string> = (value: T) => string | null;

export function refineWith<T>(validator: Validator<T>): (val: T, ctx: z.RefinementCtx) => void {
  return (val, ctx) => {
    const error = validator(val);
    if (error) ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
  };
}

export function toFormValidate(validator: Validator<string>) {
  return (value: string | undefined): true | string => {
    const error = validator(value ?? "");
    return error ?? true;
  };
}
