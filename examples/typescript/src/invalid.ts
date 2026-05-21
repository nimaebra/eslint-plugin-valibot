import * as v from 'valibot';

const UserSchema = v.object({
  id: v.string(),
});

export type User = typeof UserSchema;

export { UserSchema };
