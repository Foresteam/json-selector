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
  [K in keyof T as K extends keyof S ? (S[K] extends false ? never : K) : K]: K extends keyof S
    ? S[K] extends false
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

/**
 * @summary Selects deeply nested fields from an object based on a selector structure.
 *
 * @param data - The input object to extract fields from.
 * @param selector - Field selector in object form. Use `true` to include fields, nested objects to go deeper, and `false` to exclude.
 * @example
 * // Example selector:
 * const selector = {
 *   a: {
 *     nested: true,
 *     nested2: { field: true }
 *   },
 *   b: false
 * };
 *
 * @param options - Configuration options.
 * @param options.mode - Determines behavior of the selector:
 * - `'include'` (default): Select only the fields marked as `true` in the selector.
 * - `'exclude'`: Remove the fields marked as `true` in the selector and keep the rest.
 *
 * @returns A new object with fields selected according to the selector and mode.
 *
 * @example
 * // Include mode
 * const user: User = {
 *   id: 1,
 *   name: 'Alice',
 *   email: 'alice@example.com',
 *   address: { city: 'Wonderland', zip: '12345' },
 *   roles: [
 *     { name: 'admin', level: 10 },
 *     { name: 'editor', level: 5 }
 *   ]
 * };
 * const selector: DeepSelector<User> = {
 *   name: true,
 *   address: { city: true },
 *   roles: { name: true }
 * };
 * const selected = selectFields(user, selector);
 * // Result:
 * // {
 * //   name: 'Alice',
 * //   address: { city: 'Wonderland' },
 * //   roles: [{ name: 'admin' }, { name: 'editor' }],
 * // }
 *
 * @example
 * // Exclude mode
 * const user: User = {
 *   id: 1,
 *   name: 'Alice',
 *   email: 'alice@example.com',
 *   address: { city: 'Wonderland', zip: '12345' },
 *   roles: [
 *     { name: 'admin', level: 10 },
 *     { name: 'editor', level: 5 }
 *   ]
 * };
 * const excludeSelector: DeepSelector<User> = {
 *   email: false,
 *   address: { zip: false }
 * };
 *
 * const result = selectFields(user, excludeSelector, { mode: 'exclude' });
 * // Result:
 * // {
 * //   id: 1,
 * //   name: 'Alice',
 * //   address: { city: 'Wonderland' },
 * //   roles: [
 * //     { name: 'admin', level: 10 },
 * //     { name: 'editor', level: 5 },
 * //   ],
 * // }
 */
export function selectFields<T extends object, S extends DeepSelector<T>, M extends RefineMode>(
  data: T,
  selector: S,
  {
    mode = 'include' as M
  }: {
    /**
     * Determines behavior of the selector:
     * - `'include'` (default): Select only the fields marked as `true` in the selector.
     * - `'exclude'`: Remove the fields marked as `true` in the selector and keep the rest.
     */
    mode?: M;
  } = {}
): M extends 'exclude' ? DeepExclude<T, S> : DeepSelect<T, S> {
  const walk = (data: any, selector: any): any => {
    if (Array.isArray(data))
      return data.map(item => walk(item, selector));
    if (typeof data !== 'object' || data === null)
      return data;

    const result: Record<string, unknown> = {};
    for (const key in data) {
      const sel = selector?.[key];
      const val = data[key];

      if (mode === 'include') {
        if (sel === true)
          result[key] = val;
        else if (typeof sel === 'object' && sel !== null && val !== undefined)
          result[key] = walk(val, sel);
        continue;
      }

      if (sel === false)
        continue;
      if (typeof sel === 'object' && sel !== null && val !== undefined) {
        if (Array.isArray(val))
          result[key] = val.map((item: any) => walk(item, sel));
        else
          result[key] = walk(val, sel);
        continue;
      }
      result[key] = val;
    }

    return result;
  };

  return walk(data, selector);
}

/**
 * Converts a given Zod schema into a "deep selector" Zod schema.
 *
 * @param schema - The original Zod schema describing the data shape (e.g., `z.object(...)`).
 * @param zod - Optional Zod instance to use (useful when working with multiple Zod versions). Defaults to the imported `z`.
 *
 * @returns Schema for `selectFields` selector for the given `schema`
 *
 * @example
 * ```ts
 * const userSchema = z.object({
 *   id: z.number(),
 *   profile: z.object({
 *     name: z.string(),
 *     email: z.string(),
 *   }),
 * });
 *
 * const selectorSchema = zodSchemaToDeepSelectorSchema(userSchema);
 * // Produces schema matching:
 * // {
 * //   id?: boolean;
 * //   profile?: {
 * //     name?: boolean;
 * //     email?: boolean;
 * //   };
 * // }
 * ```
 */
export function zodSchemaToDeepSelectorSchema(schema: z.ZodSchema<any>, zod = z): z.ZodSchema<any> {
  const unwrap = (s: z.ZodTypeAny): z.ZodTypeAny => {
    const typeName = s._def.typeName;
    if (typeName === zod.ZodFirstPartyTypeKind.ZodOptional || typeName === zod.ZodFirstPartyTypeKind.ZodNullable)
      return unwrap(s._def.innerType);
    return s;
  };

  const s = unwrap(schema);
  const typeName = s._def.typeName;

  if (typeName === zod.ZodFirstPartyTypeKind.ZodObject) {
    const shape = (s as z.ZodObject<any>)._def.shape();

    const newShape: Record<string, z.ZodTypeAny> = {};
    for (const key in shape) {
      const field = shape[key];
      newShape[key] = zod.union([zod.boolean(), zodSchemaToDeepSelectorSchema(field)]).optional();
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
