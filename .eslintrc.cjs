module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        useJSXTextNode: true,
        project: './tsconfig.json',
        tsconfigRootDir: './',
        extraFileExtensions: [],
    },
    env: {
        node: true,
        mocha: true,
    },
    plugins: [
        '@typescript-eslint',
        'sonarjs',
        'chai-expect',
        'lodash',
        'mocha',
        'unicorn',
        'import',
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/errors',
        'plugin:import/typescript',
        'plugin:import/warnings',
        'plugin:lodash/recommended',
        'plugin:mocha/recommended',
        'plugin:sonarjs/recommended',
        'plugin:unicorn/recommended',
    ],
    rules: {
        'lodash/prefer-lodash-method': 'off',
        'lodash/import-scope': ['error', 'member'],
        'lodash/prefer-constant': 'off',

        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-use-before-define': 'off',

        'unicorn/no-null': 'off',
    },
    overrides: [
        {
            files: ['test/**/*.ts'],
            rules: {
                'sonarjs/no-duplicate-string': 'off',
                'sonarjs/cognitive-complexity': 'off',
                'sonarjs/no-identical-functions': 'off',

                '@typescript-eslint/no-object-literal-type-assertion': 'off',

                'lodash/prefer-noop': 'off',

                'chai-expect/missing-assertion': 'error',
                'chai-expect/no-inner-compare': 'error',
                'chai-expect/terminating-properties': 'error',

                'unicorn/consistent-function-scoping': 'off',
                'unicorn/no-array-for-each': 'off',
                'unicorn/no-array-callback-reference': 'off',
            },
        },
    ],
};
