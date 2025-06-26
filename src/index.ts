import { z } from 'zod';

export type DeepSelector<T> = {
  [K in keyof T]?: boolean | (T[K] extends Array<infer U> ? DeepSelector<U> : T[K] extends object ? DeepSelector<T[K]> : never);
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
      } else {
        if (sel === false) {
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

export function zodSchemaToDeepSelectorSchema(schema: z.ZodSchema<any>, zod = z): z.ZodSchema<any> {
  const unwrap = (s: z.ZodTypeAny): z.ZodTypeAny => {
    const typeName = s._def.typeName;

    if (typeName === zod.ZodFirstPartyTypeKind.ZodOptional || typeName === zod.ZodFirstPartyTypeKind.ZodNullable) {
      return unwrap(s._def.innerType);
    }

    return s;
  };

  const s = unwrap(schema);
  const typeName = s._def.typeName;

  if (typeName === zod.ZodFirstPartyTypeKind.ZodObject) {
    const shape = (s as z.ZodObject<any>)._def.shape();

    const newShape: Record<string, z.ZodTypeAny> = {};
    for (const key in shape) {
      const field = shape[key];
      newShape[key] = zod.union([
        zod.boolean(),
        zodSchemaToDeepSelectorSchema(field)
      ]).optional();
    }

    return zod.object(newShape).strict();
  }

  if (typeName === zod.ZodFirstPartyTypeKind.ZodArray) {
    const element = (s as z.ZodArray<any>)._def.type;
    return zodSchemaToDeepSelectorSchema(element);
  }

  if (typeName === zod.ZodFirstPartyTypeKind.ZodUnion) {
    const options = (s as z.ZodUnion<[z.ZodTypeAny, ...z.ZodTypeAny[]]>)._def.options;
    const schemas = options.map(opt => zodSchemaToDeepSelectorSchema(opt));
    return schemas.reduce((a, b) => zod.union([a, b]));
  }

  // Fallback for primitives and unknowns
  return zod.boolean();
}
