#!/usr/bin/env node
/**
 * Patches radix-ui dist files to replace escaped backticks in template literals
 * with string concatenation. The SWC compiler in Next.js 13.5.1 corrupts escaped
 * backticks during server-side bundling, causing SyntaxError in generated chunks.
 */
const fs = require('fs');
const path = require('path');

function patchFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return false;
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;
  for (const [oldStr, newStr] of replacements) {
    if (content.includes(oldStr)) {
      content = content.replace(oldStr, newStr);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`  patched: ${filePath}`);
  }
  return changed;
}

const radixDir = path.join(__dirname, '..', 'node_modules', '@radix-ui');

// 1. react-progress: getInvalidMaxError and getInvalidValueError
const progressReplacements = [
  [
    'function getInvalidMaxError(propValue, componentName) {\n  return `Invalid prop \\`max\\` of value \\`${propValue}\\` supplied to \\`${componentName}\\`. Only numbers greater than 0 are valid max values. Defaulting to \\`${DEFAULT_MAX}\\`.`;\n}',
    'function getInvalidMaxError(propValue, componentName) {\n  return "Invalid prop `max` of value `" + propValue + "` supplied to `" + componentName + "`. Only numbers greater than 0 are valid max values. Defaulting to `" + DEFAULT_MAX + "`.";\n}',
  ],
  [
    'function getInvalidValueError(propValue, componentName) {\n  return `Invalid prop \\`value\\` of value \\`${propValue}\\` supplied to \\`${componentName}\\`. The \\`value\\` prop must be:\n  - a positive number\n  - less than the value passed to \\`max\\` (or ${DEFAULT_MAX} if no \\`max\\` prop is set)\n  - \\`null\\` or \\`undefined\\` if the progress is indeterminate.\n\nDefaulting to \\`null\\`.`;\n}',
    'function getInvalidValueError(propValue, componentName) {\n  return "Invalid prop `value` of value `" + propValue + "` supplied to `" + componentName + "`. The `value` prop must be:\\n  - a positive number\\n  - less than the value passed to `max` (or " + DEFAULT_MAX + " if no `max` prop is set)\\n  - `null` or `undefined` if the progress is indeterminate.\\n\\nDefaulting to `null`.";\n}',
  ],
];

patchFile(path.join(radixDir, 'react-progress', 'dist', 'index.mjs'), progressReplacements);
patchFile(path.join(radixDir, 'react-progress', 'dist', 'index.js'), progressReplacements);

// 2. react-dialog: TitleWarning and DescriptionWarning
const dialogReplacements = [
  [
    '  const MESSAGE = `\\`${titleWarningContext.contentName}\\` requires a \\`${titleWarningContext.titleName}\\` for the component to be accessible for screen reader users.\n\nIf you want to hide the \\`${titleWarningContext.titleName}\\`, you can wrap it with our VisuallyHidden component.\n\nFor more information, see https://radix-ui.com/primitives/docs/components/${titleWarningContext.docsSlug}`;',
    '  const MESSAGE = "`" + titleWarningContext.contentName + "` requires a `" + titleWarningContext.titleName + "` for the component to be accessible for screen reader users.\\n\\nIf you want to hide the `" + titleWarningContext.titleName + "`, you can wrap it with our VisuallyHidden component.\\n\\nFor more information, see https://radix-ui.com/primitives/docs/components/" + titleWarningContext.docsSlug;',
  ],
  [
    '  const MESSAGE = `Warning: Missing \\`Description\\` or \\`aria-describedby={undefined}\\` for {${descriptionWarningContext.contentName}}.`;',
    '  const MESSAGE = "Warning: Missing `Description` or `aria-describedby={undefined}` for {" + descriptionWarningContext.contentName + "}.";',
  ],
];

patchFile(path.join(radixDir, 'react-dialog', 'dist', 'index.mjs'), dialogReplacements);
patchFile(path.join(radixDir, 'react-dialog', 'dist', 'index.js'), dialogReplacements);

// 3. react-context: error messages and __scope computed keys
const contextReplacements = [
  [
    '    throw new Error(`\\`${consumerName}\\` must be used within \\`${rootComponentName}\\`);\n  }\n  return [Provider, useContext2];',
    '    throw new Error("`" + consumerName + "` must be used within `" + rootComponentName + "`");\n  }\n  return [Provider, useContext2];',
  ],
  [
    '      throw new Error(`\\`${consumerName}\\` must be used within \\`${rootComponentName}\\`);',
    '      throw new Error("`" + consumerName + "` must be used within `" + rootComponentName + "`");',
  ],
  [
    '        () => ({ [`__scope${scopeName}`]: { ...scope, [scopeName]: contexts } }),',
    '        () => ({ ["__scope" + scopeName]: { ...scope, [scopeName]: contexts } }),',
  ],
  [
    '      const currentScope = scopeProps[`__scope${scopeName}`];',
    '      const currentScope = scopeProps["__scope" + scopeName];',
  ],
  [
    '      return React.useMemo(() => ({ [`__scope${baseScope.scopeName}`]: nextScopes }), [nextScopes]);',
    '      return React.useMemo(() => ({ ["__scope" + baseScope.scopeName]: nextScopes }), [nextScopes]);',
  ],
];

patchFile(path.join(radixDir, 'react-context', 'dist', 'index.mjs'), contextReplacements);
patchFile(path.join(radixDir, 'react-context', 'dist', 'index.js'), contextReplacements);

console.log('Radix-ui backtick patching complete.');
