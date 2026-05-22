import * as v from 'valibot';

const UserSchema = v.object({
  id: v.pipe(v.string(), v.trim(), v.nonEmpty()),
  email: v.pipe(v.string(), v.email()),
  active: v.optional(v.boolean(), false),
  createdAt: v.date(),
});

function parseUser(input) {
  const result = v.safeParse(UserSchema, input);

  if (result.success) {
    return result.output;
  }

  return null;
}

export { UserSchema, parseUser };
