import pkg from './package.json' assert { type: 'json' };
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import cleanup from 'rollup-plugin-cleanup';
import del from 'rollup-plugin-delete';
import externals from 'rollup-plugin-node-externals';

/**
 * @type {import('rollup').RollupOptions[]}
 */
export default [
    {
        input: './src/index.ts',
        output: [
            {
                file: pkg.main,
                format: 'cjs',
                exports: 'named',
            },
            { file: pkg.module, format: 'module' },
        ],
        plugins: [
            // Delete contents of target folder
            del({
                targets: pkg.files,
            }),

            // Compile source (typescript) to javascript
            typescript({
                tsconfig: './tsconfig.json',
            }),

            // Remove things like comments and whitespace
            cleanup({
                extensions: ['.ts', '.js'],
            }),

            /**
             * Mark all dependencies and node defaults as external to prevent
             * Rollup from including them in the bundle. We'll let the package
             * manager take care of dependency resolution and stuff so we don't
             * have to download the exact same code multiple times, once in
             * this bundle and also as a dependency of another package.
             */
            externals(),
        ],
    },
    {
        input: './src/index.ts',
        output: [{ file: pkg.types, format: 'es' }],
        plugins: [
            // Generate types (.d.ts)
            dts(),
        ],
    },
];
