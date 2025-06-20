import { z } from 'zod';

export type DeepSelector<T> = {
  [K in keyof T]?: true | (T[K] extends Array<infer U> ? DeepSelector<U> : T[K] extends object ? DeepSelector<T[K]> : never);
};

type DeepSelect<T, S> = {
  [K in keyof S]: K extends keyof T
    ? S[K] extends true
      ? T[K]
      : T[K] extends Array<infer U>
        ? S[K] extends DeepSelector<U>
          ? DeepSelect<U, S[K]>[]
          : never
        : T[K] extends object
          ? S[K] extends DeepSelector<T[K]>
            ? DeepSelect<T[K], S[K]>
            : never
          : never
    : never;
};

type DeepExclude<T, S> = {
  [K in keyof T as K extends keyof S ? (S[K] extends true ? never : K) : K]: K extends keyof S
    ? S[K] extends true
      ? never
      : T[K] extends Array<infer U>
        ? S[K] extends DeepSelector<U>
          ? DeepExclude<U, S[K]>[]
          : T[K]
        : T[K] extends object
          ? S[K] extends DeepSelector<T[K]>
            ? DeepExclude<T[K], S[K]>
            : T[K]
          : T[K]
    : T[K];
};

type RefineMode = 'include' | 'exclude';

export function selectFields<T, S extends DeepSelector<T>, M extends RefineMode = 'include'>(
  data: T,
  selector: S,
  options?: { mode?: M }
): M extends 'exclude' ? DeepExclude<T, S> : DeepSelect<T, S> {
  const mode = options?.mode ?? 'include';

  const walk = (data: any, selector: any): any => {
    if (Array.isArray(data)) {
      return data.map(item => walk(item, selector));
    }

    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const result: Record<string, unknown> = {};

    for (const key in data) {
      const sel = selector?.[key];
      const val = data[key];

      if (mode === 'include') {
        if (sel === true) {
          result[key] = val;
        } else if (typeof sel === 'object' && sel !== null && val !== undefined) {
          result[key] = walk(val, sel);
        }
      } else if (mode === 'exclude') {
        if (sel === true) {
          continue;
        } else if (typeof sel === 'object' && sel !== null && val !== undefined) {
          if (Array.isArray(val)) {
            result[key] = val.map((item: any) => walk(item, sel));
          } else {
            result[key] = walk(val, sel);
          }
        } else {
          result[key] = val;
        }
      }
    }

    return result;
  };

  return walk(data, selector);
}

export function zodSchemaToDeepSelectorSchema<T extends z.ZodTypeAny>(schema: T): z.ZodTypeAny {
  const unwrap = (s: z.ZodTypeAny): z.ZodTypeAny => {
    if (s instanceof z.ZodOptional || s instanceof z.ZodNullable) {
      return unwrap(s.unwrap());
    }
    return s;
  };

  const s = unwrap(schema);

  if (s instanceof z.ZodObject) {
    const shape = s.shape;
    const newShape: Record<string, z.ZodTypeAny> = {};
    for (const key in shape) {
      newShape[key] = z.union([z.literal(true), zodSchemaToDeepSelectorSchema(shape[key])]).optional();
    }
    return z.object(newShape);
  }

  if (s instanceof z.ZodArray) {
    return zodSchemaToDeepSelectorSchema(s.element);
  }

  if (s instanceof z.ZodUnion) {
    const options = s._def.options as z.ZodTypeAny[];
    const schemas = options.map(opt => zodSchemaToDeepSelectorSchema(opt));
    return schemas.reduce((a, b) => z.union([a, b]));
  }

  // Primitive: just allow true
  return z.literal(true);
}
