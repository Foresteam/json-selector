import { describe, expect, it } from 'vitest';
import { type DeepSelector, selectFields } from '../src'; // adjust path

interface User {
  id: number;
  name: string;
  email: string;
  address: {
    city: string;
    zip: string;
  };
  roles: {
    name: string;
    level: number;
  }[];
}

const user: User = {
  id: 42,
  name: 'Alice',
  email: 'alice@example.com',
  address: {
    city: 'Wonderland',
    zip: '12345'
  },
  roles: [
    { name: 'admin', level: 10 },
    { name: 'editor', level: 5 }
  ]
};

describe(`field selector ${selectFields.name} function`, () => {
  describe('include mode', () => {
    it('selects only specified fields', () => {
      const includeSelector = {
        name: true,
        address: {
          city: true
        },
        roles: {
          name: true
        }
      } satisfies DeepSelector<User>;

      const result = selectFields(user, includeSelector);

      expect(result).toEqual({
        name: 'Alice',
        address: { city: 'Wonderland' },
        roles: [{ name: 'admin' }, { name: 'editor' }]
      });
    });

    it('with empty selector returns empty object', () => {
      const emptySelector = {} satisfies DeepSelector<User>;
      const result = selectFields(user, emptySelector);
      expect(result).toEqual({});
    });

    it('selects nested arrays partially', () => {
      const selector = {
        roles: {
          level: true
        }
      } satisfies DeepSelector<User>;

      const result = selectFields(user, selector);
      expect(result).toEqual({
        roles: [{ level: 10 }, { level: 5 }]
      });
    });

    it('selects deeply nested fields', () => {
      const selector = {
        address: {
          city: true
        }
      } satisfies DeepSelector<User>;

      const result = selectFields(user, selector);
      expect(result).toEqual({
        address: {
          city: 'Wonderland'
        }
      });
    });

    it('includes fields with undefined or null values', () => {
      const userWithNulls: User = {
        ...user,
        email: undefined as any,
        address: null as any
      };

      const selector = {
        email: true,
        address: {
          city: true
        }
      } satisfies DeepSelector<User>;

      const result = selectFields(userWithNulls, selector);
      expect(result).toEqual({
        email: undefined,
        address: null
      });
    });
  });

  describe('exclude mode', () => {
    it('excludes specified fields', () => {
      const excludeSelector = {
        email: false,
        address: {
          zip: false
        }
      } satisfies DeepSelector<User>;

      const result = selectFields(user, excludeSelector, { mode: 'exclude' });

      expect(result).toEqual({
        id: 42,
        name: 'Alice',
        address: { city: 'Wonderland' },
        roles: [
          { name: 'admin', level: 10 },
          { name: 'editor', level: 5 }
        ]
      });
    });
    it('with empty selector returns full object', () => {
      const emptySelector = {} satisfies DeepSelector<User>;
      const result = selectFields(user, emptySelector, { mode: 'exclude' });
      expect(result).toEqual(user);
    });
    it('excludes nested arrays partially', () => {
      const selector = {
        roles: {
          name: false
        }
      } satisfies DeepSelector<User>;

      const result = selectFields(user, selector, { mode: 'exclude' });
      expect(result).toEqual({
        id: 42,
        name: 'Alice',
        email: 'alice@example.com',
        address: {
          city: 'Wonderland',
          zip: '12345'
        },
        roles: [{ level: 10 }, { level: 5 }]
      });
    });
    it('excludes deeply nested fields', () => {
      const selector = {
        address: {
          city: false
        }
      } satisfies DeepSelector<User>;

      const result = selectFields(user, selector, { mode: 'exclude' });
      expect(result).toEqual({
        id: 42,
        name: 'Alice',
        email: 'alice@example.com',
        address: {
          zip: '12345'
        },
        roles: [
          { name: 'admin', level: 10 },
          { name: 'editor', level: 5 }
        ]
      });
    });
  });
});
