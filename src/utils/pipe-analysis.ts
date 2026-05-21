import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

import type { ValibotImports } from './collect-valibot-imports';
import { getValibotCallName, isValibotCall } from './is-valibot-call';

export interface PipeActionDescriptor {
  actionIndex: number;
  fingerprint: string;
  name: string;
  node: TSESTree.CallExpression;
}

export function getPipeActionDescriptors(
  pipeCall: TSESTree.CallExpression,
  imports: ValibotImports,
  sourceCode: Readonly<TSESLint.SourceCode>,
): PipeActionDescriptor[] {
  if (
    !isValibotCall(pipeCall, imports, 'pipe') ||
    pipeCall.arguments.length < 2
  ) {
    return [];
  }

  return pipeCall.arguments.flatMap((argument, actionIndex) => {
    if (actionIndex === 0 || argument.type !== 'CallExpression') {
      return [];
    }

    const name = getValibotCallName(argument, imports);

    if (!name) {
      return [];
    }

    return [
      {
        actionIndex,
        fingerprint: sourceCode.getText(argument),
        name,
        node: argument,
      },
    ];
  });
}
