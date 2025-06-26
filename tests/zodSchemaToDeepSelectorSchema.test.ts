import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { zodSchemaToDeepSelectorSchema } from '../src'; // Adjust path as needed

// Reusable schemas
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().optional(),
  address: z
    .object({
      city: z.string(),
      zip: z.string()
    })
    .nullable(),
  roles: z.array(
    z.object({
      name: z.string(),
      level: z.number()
    })
  )
});

const unionSchema = z.union([
  z.object({ type: z.literal('a'), value: z.string() }),
  z.object({ type: z.literal('b'), value: z.number() })
]);

describe('zodSchemaToDeepSelectorSchema', () => {
  it('converts flat object schema to selector schema', () => {
    const schema = z.object({
      id: z.number(),
      name: z.string()
    });

    const selectorSchema = zodSchemaToDeepSelectorSchema(schema);

    expect(selectorSchema.parse({ id: true })).toEqual({ id: true });
    expect(selectorSchema.parse({ name: false })).toEqual({ name: false });
  });

  it('converts nested object schema with true/false', () => {
    const schema = z.object({
      address: z.object({
        city: z.string(),
        zip: z.string()
      })
    });

    const selectorSchema = zodSchemaToDeepSelectorSchema(schema);

    expect(selectorSchema.parse({ address: { city: true } })).toEqual({
      address: { city: true }
    });

    expect(selectorSchema.parse({ address: { zip: false } })).toEqual({
      address: { zip: false }
    });
  });

  it('converts array of objects schema', () => {
    const schema = z.object({
      roles: z.array(
        z.object({
          name: z.string(),
          level: z.number()
        })
      )
    });

    const selectorSchema = zodSchemaToDeepSelectorSchema(schema);

    expect(selectorSchema.parse({ roles: { name: true } })).toEqual({
      roles: { name: true }
    });

    expect(selectorSchema.parse({ roles: { level: false } })).toEqual({
      roles: { level: false }
    });
  });

  it('converts schema with optional and nullable fields', () => {
    const schema = z.object({
      email: z.string().optional(),
      phone: z.string().nullable()
    });

    const selectorSchema = zodSchemaToDeepSelectorSchema(schema);

    expect(selectorSchema.parse({ email: true })).toEqual({ email: true });
    expect(selectorSchema.parse({ phone: true })).toEqual({ phone: true });
    expect(selectorSchema.parse({ phone: false })).toEqual({ phone: false });
    expect(selectorSchema.parse({})).toEqual({});
  });

  it('converts union types', () => {
    const selectorSchema = zodSchemaToDeepSelectorSchema(unionSchema);

    expect(selectorSchema.parse({ type: true, value: true })).toEqual({
      type: true,
      value: true
    });

    expect(selectorSchema.parse({ type: false })).toEqual({ type: false });
  });

  it('allows just true or false for primitive schemas', () => {
    const schema = z.string();
    const selectorSchema = zodSchemaToDeepSelectorSchema(schema);

    expect(selectorSchema.parse(true)).toBe(true);
    expect(selectorSchema.parse(false)).toBe(false);
  });

  it('handles full complex user schema with combinations', () => {
    const selectorSchema = zodSchemaToDeepSelectorSchema(userSchema);

    expect(
      selectorSchema.parse({
        name: true,
        email: false,
        address: {
          city: true
        },
        roles: {
          name: false
        }
      })
    ).toEqual({
      name: true,
      email: false,
      address: { city: true },
      roles: { name: false }
    });
  });

  describe('invalid inputs', () => {
    it('throws on non-boolean primitives', () => {
      const schema = z.object({
        id: z.number()
      });
      const selectorSchema = zodSchemaToDeepSelectorSchema(schema);

      expect(() => selectorSchema.parse({ id: 123 })).toThrow();
    });

    it('throws on unknown top-level field', () => {
      const schema = z.object({
        id: z.number()
      });
      const selectorSchema = zodSchemaToDeepSelectorSchema(schema);

      expect(() => selectorSchema.parse({ unknown: true })).toThrow();
    });

    it('throws on invalid nested field value', () => {
      const schema = z.object({
        address: z.object({
          city: z.string()
        })
      });
      const selectorSchema = zodSchemaToDeepSelectorSchema(schema);

      expect(() => selectorSchema.parse({ address: { city: 123 } })).toThrow();
    });

    it('throws on invalid array subfield value', () => {
      const schema = z.object({
        roles: z.array(z.object({ name: z.string() }))
      });
      const selectorSchema = zodSchemaToDeepSelectorSchema(schema);

      expect(() => selectorSchema.parse({ roles: { name: 123 } })).toThrow();
    });

    it('throws on invalid union field value', () => {
      const selectorSchema = zodSchemaToDeepSelectorSchema(unionSchema);

      expect(() => selectorSchema.parse({ type: 1 })).toThrow();
    });

    it('throws on invalid primitive selector', () => {
      const schema = z.string();
      const selectorSchema = zodSchemaToDeepSelectorSchema(schema);

      expect(() => selectorSchema.parse('invalid')).toThrow();
    });

    it('throws on wrong type in complex user schema', () => {
      const selectorSchema = zodSchemaToDeepSelectorSchema(userSchema);

      expect(() =>
        selectorSchema.parse({
          id: 'not a boolean'
        })
      ).toThrow();
    });
  });
});
