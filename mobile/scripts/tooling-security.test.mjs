import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

// Resolve from the actual Expo CLI, so a second, patched lint-only copy cannot
// accidentally make the security regression pass.
const require = createRequire(import.meta.url);
const expoRequire = createRequire(require.resolve('expo/package.json'));
const cliRequire = createRequire(expoRequire.resolve('@expo/cli/package.json'));
const { z } = cliRequire('zod');
const { PluginSchema, DevToolsPluginOutputSchema } = cliRequire('./build/src/start/server/DevToolsPlugin.schema.js');
const { createMCPDevToolsExtensionSchema } = cliRequire('./build/src/start/server/createMCPDevToolsExtensionSchema.js');

test('installed React satisfies React DOM peer metadata so npm can resolve the security update', () => {
  const react = require('react/package.json');
  const reactDOM = require('react-dom/package.json');
  // Semver is a declared dependency of this exact CLI, not an undeclared
  // project dependency or an assumed root-level npm hoist.
  const { satisfies } = cliRequire('semver');
  assert.equal(satisfies(react.version, reactDOM.peerDependencies.react), true,
    `React ${react.version} does not satisfy React DOM ${reactDOM.version} peer ${reactDOM.peerDependencies.react}`);
});

test('CLI Zod rejects oversized bounded arrays before validating elements', () => {
  // GHSA-mrhx-c7xc-m3w5: a small input proves the size gate without an OOM test.
  let parsedElements = 0;
  const schema = z.array(z.string().refine(() => { parsedElements += 1; return true; })).max(2);
  const result = schema.safeParse(['a', 'b', 'c']);
  assert.equal(result.success, false);
  assert.equal(parsedElements, 0);
  assert.equal(result.error.issues.length, 1);
  assert.equal(result.error.issues[0].code, 'too_big');
});

const plugin = {
  packageName: 'security-fixture',
  packageRoot: '/tmp/security-fixture',
  bannerTitle: true,
  cliExtensions: {
    description: 'Tooling compatibility fixture',
    entryPoint: 'commands.js',
    commands: [{
      name: 'inspect', title: 'Inspect fixture', environments: ['cli', 'mcp'],
      parameters: [
        { name: 'label', type: 'text', description: 'Label' },
        { name: 'limit', type: 'number' },
        { name: 'confirmed', type: 'confirm' },
      ],
    }],
  },
};

test('actual CLI plugin schema preserves valid descriptors and rejects malformed commands', () => {
  const result = PluginSchema.safeParse(plugin);
  assert.equal(result.success, true);
  assert.deepEqual(result.data, plugin);
  assert.equal(Object.isFrozen(result.data.cliExtensions.commands[0].environments), true);
  for (const commands of [[], [{ name: 'inspect', title: 'Inspect', environments: ['untrusted'] }]]) {
    const invalid = PluginSchema.safeParse({ ...plugin, cliExtensions: { ...plugin.cliExtensions, commands } });
    assert.equal(invalid.success, false);
    assert.equal(typeof invalid.error.message, 'string');
    assert.ok(invalid.error.issues.every(issue => typeof issue.message === 'string'));
  }
});

test('actual CLI output schema accepts supported output and rejects malformed media', () => {
  const lines = [
    { type: 'text', text: 'Ready', level: 'info' },
    { type: 'image', url: 'https://example.com/image.png', text: 'Fixture' },
    { type: 'audio', url: 'https://example.com/audio.mp3' },
  ];
  assert.deepEqual(DevToolsPluginOutputSchema.parse(lines), lines);
  for (const invalid of [[{ type: 'audio', url: 'invalid URL' }], [{ type: 'text', text: 'Ready', level: 'debug' }]]) {
    const result = DevToolsPluginOutputSchema.safeParse(invalid);
    assert.equal(result.success, false);
    assert.ok(result.error.issues.map(issue => issue.message).join(', ').length > 0);
  }
});

test('actual CLI generated MCP input keeps command enums, parameter types and strict fields', () => {
  const schema = createMCPDevToolsExtensionSchema(plugin);
  const input = { command: 'inspect', label: 'Fixture', limit: 2, confirmed: true };
  assert.deepEqual(schema.parse(input), input);
  assert.deepEqual(schema.parse({ command: 'inspect' }), { command: 'inspect' });
  for (const invalid of [
    { command: 'unknown' }, { command: 'inspect', limit: '2' },
    { command: 'inspect', confirmed: 'yes' }, { command: 'inspect', extra: true },
  ]) assert.equal(schema.safeParse(invalid).success, false);
  assert.throws(() => createMCPDevToolsExtensionSchema({ ...plugin, cliExtensions: undefined }), /no commands defined/);
});
