import { createRule } from '../utils/create-rule';
import {
  collectValibotImports,
  createEmptyValibotImports,
  hasValibotImports,
} from '../utils/collect-valibot-imports';
import { getValibotCallName } from '../utils/is-valibot-call';

const OBJECT_SCHEMA_TYPES = ['object', 'looseObject', 'strictObject'] as const;
const DEFAULT_ALLOWED_OBJECT_SCHEMA_TYPES = ['object', 'strictObject'] as const;

type ObjectSchemaType = (typeof OBJECT_SCHEMA_TYPES)[number];
type Options = [
  {
    allow?: ObjectSchemaType[];
  },
];
type MessageIds = 'disallowedObjectSchemaType';

export const noLooseObject = createRule<Options, MessageIds>({
  name: 'no-loose-object',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow disallowed Valibot object schema constructors such as looseObject().',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allow: {
            type: 'array',
            items: {
              type: 'string',
              enum: [...OBJECT_SCHEMA_TYPES],
            },
            uniqueItems: true,
            minItems: 1,
          },
        },
      },
    ],
    messages: {
      disallowedObjectSchemaType:
        'Avoid Valibot {{disallowedType}}() here. Allowed object schema constructors: {{allowedTypes}}.',
    },
  },
  defaultOptions: [
    {
      allow: [...DEFAULT_ALLOWED_OBJECT_SCHEMA_TYPES],
    },
  ],
  create(context, [options]) {
    let imports = createEmptyValibotImports();
    const allowedTypes = new Set<ObjectSchemaType>(
      options.allow ?? DEFAULT_ALLOWED_OBJECT_SCHEMA_TYPES,
    );

    return {
      Program(node) {
        imports = collectValibotImports(node);
      },
      CallExpression(node) {
        if (!hasValibotImports(imports)) {
          return;
        }

        const callName = getValibotCallName(node, imports);

        if (!isObjectSchemaType(callName) || allowedTypes.has(callName)) {
          return;
        }

        context.report({
          node,
          messageId: 'disallowedObjectSchemaType',
          data: {
            disallowedType: callName,
            allowedTypes: formatAllowedTypes(options.allow),
          },
        });
      },
    };
  },
});

function isObjectSchemaType(value: string | null): value is ObjectSchemaType {
  return (
    value !== null && OBJECT_SCHEMA_TYPES.includes(value as ObjectSchemaType)
  );
}

function formatAllowedTypes(allow: ObjectSchemaType[] | undefined): string {
  const allowedTypes = allow ?? [...DEFAULT_ALLOWED_OBJECT_SCHEMA_TYPES];

  return allowedTypes.map((type) => `${type}()`).join(', ');
}
