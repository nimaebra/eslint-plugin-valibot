import * as v from 'valibot';

const UserSchema = v.object(
  {
    id: v.string('User ID must be text'),
  },
  'User payload is invalid',
);

export type User = typeof UserSchema;

export { UserSchema };
