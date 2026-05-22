import * as v from 'valibot';

const UserSchema = v.object(
  {
    id: v.string('User ID must be text'),
    email: v.pipe(
      v.string('Email must be text'),
      v.email('Email must be valid'),
    ),
  },
  'User payload is invalid',
);

const UserResult = v.safeParse(UserSchema, {
  id: 'user-1',
  email: 'jane@example.com',
});

export type User = v.InferOutput<typeof UserSchema>;

export { UserResult, UserSchema };
