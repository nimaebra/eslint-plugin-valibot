import * as v from 'valibot';

const UserSchema = v.object({
  id: v.string(),
  email: v.pipe(v.string(), v.email()),
});

const UserResult = v.safeParse(UserSchema, {
  id: 'user-1',
  email: 'jane@example.com',
});

export type User = v.InferOutput<typeof UserSchema>;

export { UserResult, UserSchema };
