# @foresteam/json-selector

A simple utility library for **deeply selecting or excluding fields** from complex JSON-like objects with type safety, including support for nested arrays and objects.

Also includes integration with [Zod](https://github.com/colinhacks/zod) to automatically generate selector schemas from Zod validation schemas for runtime selector validation.

---

## Features

- **Deep field selection** on nested objects and arrays
- **Exclude mode** to remove specified fields instead of selecting
- Type-safe selectors leveraging advanced TypeScript generics
- Compatible with **optional** and **nullable** fields
- Generates **Zod selector schemas** from your existing Zod schemas for runtime validation
- Supports **primitive fields**, nested objects, arrays, and union types

---

## Installation

```sh
npm install @foresteam/json-selector
# or
yarn add @foresteam/json-selector
# or
pnpm add @foresteam/json-selector
```

## Examples

### Selecting fields

```typescript
import { DeepSelector, selectFields } from '@foresteam/json-selector';

interface User {
  id: number;
  name: string;
  email?: string;
  address: {
    city: string;
    zip: string;
  } | null;
  roles: {
    name: string;
    level: number;
  }[];
}

const user: User = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  address: { city: 'Wonderland', zip: '12345' },
  roles: [
    { name: 'admin', level: 10 },
    { name: 'editor', level: 5 }
  ]
};

const selector: DeepSelector<User> = {
  name: true,
  address: { city: true },
  roles: { name: true }
};

const selected = selectFields(user, selector);
// Result:
// {
//   name: 'Alice',
//   address: { city: 'Wonderland' },
//   roles: [{ name: 'admin' }, { name: 'editor' }],
// }
```

### Excluding fields

```typescript
const excludeSelector: DeepSelector<User> = {
  email: false,
  address: { zip: false }
};

const result = selectFields(user, excludeSelector, { mode: 'exclude' });
// Result:
// {
//   id: 1,
//   name: 'Alice',
//   address: { city: 'Wonderland' },
//   roles: [
//     { name: 'admin', level: 10 },
//     { name: 'editor', level: 5 },
//   ],
// }
```

### Generating Zod Selector Schemas

If you use Zod for schema validation, you can automatically generate a corresponding selector schema for runtime validation of selectors:

```typescript
import { zodSchemaToDeepSelectorSchema } from '@foresteam/json-selector';
import { z } from 'zod';

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

const selectorSchema = zodSchemaToDeepSelectorSchema(userSchema);

// Now you can validate selector inputs:
selectorSchema.parse({ name: true, address: { city: true } }); // passes
selectorSchema.parse({ name: 'yes' }); // throws validation error
```
