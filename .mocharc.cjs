/**
 * @type {import("mocha").MochaOptions}
 */
const opts = {
    require: ['choma'],
    file: ['./test/hooks.ts'],
    // spec: ['./test/integration/**/*'],
    extensions: ['.ts'],
    recursive: true,
    'node-option': ['loader=ts-node/esm', 'experimental-specifier-resolution=node'],
    'watch-files': ['./test/**/*.ts', './src/**/*.ts'],
};

module.exports = opts;
