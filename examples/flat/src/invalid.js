import * as v from 'valibot';

const input = 'value';
const WrappedSchema = v.optional(v.optional(v.string()));
const MaybeSchema = v.optional(v.nullable(v.string()));
const ParseSchema = v.string();
const ObjectSchema = v.object({
  active: v.pipe(v.optional(v.string()), v.transform(Boolean)),
});
const RecordKeySchema = v.record(v.pipe(v.string(), v.trim()), v.string());
const NormalizedSchema = v.pipe(v.string(), v.trim(), v.trim());
const ParsedValue = v.parse(v.string(), input);
const ParseResult = v.safeParse(ParseSchema, input);
const UnsafeOutput = ParseResult.output.length;

const InstanceofBuiltinSchema = v.instance(Date);
const EmptyPipeSchema = v.pipe(v.string());

export {
  WrappedSchema,
  MaybeSchema,
  ParseSchema,
  ObjectSchema,
  RecordKeySchema,
  NormalizedSchema,
  ParsedValue,
  ParseResult,
  UnsafeOutput,
  InstanceofBuiltinSchema,
  EmptyPipeSchema,
};
