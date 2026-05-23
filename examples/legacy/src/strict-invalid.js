import * as v from 'valibot';

const input = 'value';
const PayloadSchema = v.any();
const UnknownSchema = v.unknown();
const WrappedSchema = v.optional(v.optional(v.string()));
const MaybeSchema = v.optional(v.nullable(v.string()));
const NullableUnionSchema = v.union([v.string(), v.null()]);
const OptionalUnionSchema = v.union([v.string(), v.undefined()]);
const ParseSchema = v.string();
const InternalRun = ParseSchema['~run'];
const ObjectSchema = v.object({
  active: v.pipe(v.optional(v.string()), v.transform(Boolean)),
});
const LooseObjectSchema = v.looseObject(
  {
    role: v.string('Role must be text'),
  },
  'Unexpected extra properties are allowed',
);
const RecordKeySchema = v.record(v.pipe(v.string(), v.trim()), v.string());
const NormalizedSchema = v.pipe(v.string(), v.trim(), v.trim());
const ParsedValue = v.parse(v.string(), input);
const ParseResult = v.safeParse(ParseSchema, input);
const UnsafeOutput = ParseResult.output.length;
const UnsafeTypeGuardResult = v.is(ObjectSchema, {
  active: 'true',
  extra: true,
});

const InstanceofBuiltinSchema = v.instance(Date);
const EmptyPipeSchema = v.pipe(v.string());

function validateUser(value) {
  const UserSchema = v.object({
    name: v.string(),
  });

  return v.safeParse(UserSchema, value);
}

export {
  PayloadSchema,
  UnknownSchema,
  WrappedSchema,
  MaybeSchema,
  NullableUnionSchema,
  OptionalUnionSchema,
  ParseSchema,
  InternalRun,
  ObjectSchema,
  LooseObjectSchema,
  RecordKeySchema,
  NormalizedSchema,
  ParsedValue,
  ParseResult,
  UnsafeOutput,
  UnsafeTypeGuardResult,
  InstanceofBuiltinSchema,
  EmptyPipeSchema,
  validateUser,
};
