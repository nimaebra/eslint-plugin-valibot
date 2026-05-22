import * as v from 'valibot';

const input = 'value';
const PayloadSchema = v.any();
const WrappedSchema = v.optional(v.optional(v.string()));
const MaybeSchema = v.optional(v.nullable(v.string()));
const ParseSchema = v.string();
const ObjectSchema = v.object({
  active: v.pipe(v.optional(v.string()), v.transform(Boolean)),
});
const NormalizedSchema = v.pipe(v.string(), v.trim(), v.trim());
const ParsedValue = v.parse(v.string(), input);
const ParseResult = v.safeParse(ParseSchema, input);
const UnsafeOutput = ParseResult.output.length;

const LazyNonFunctionSchema = v.lazy(v.string());
const InstanceofBuiltinSchema = v.instance(Date);
const EmptyPipeSchema = v.pipe(v.string());
const SchemaAsPipeActionSchema = v.pipe(v.string(), v.number());

function validateUser(value) {
  const UserSchema = v.object({
    name: v.string(),
  });

  return v.safeParse(UserSchema, value);
}

export {
  PayloadSchema,
  WrappedSchema,
  MaybeSchema,
  ParseSchema,
  ObjectSchema,
  NormalizedSchema,
  ParsedValue,
  ParseResult,
  UnsafeOutput,
  LazyNonFunctionSchema,
  InstanceofBuiltinSchema,
  EmptyPipeSchema,
  SchemaAsPipeActionSchema,
  validateUser,
};
