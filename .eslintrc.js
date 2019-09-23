module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaFeatures: {
            jsx: true
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
        'plugin:unicorn/recommended',
        'plugin:sonarjs/recommended',
        'plugin:lodash/recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
    ],
    rules: {
        'lodash/prefer-lodash-method': 'off',
        'lodash/import-scope': ['error', 'member'],

        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
    },
    overrides: [
        {
            "files": ["test/**/*.ts"],
            "rules": {
                'sonarjs/no-duplicate-string': 'off',
                'sonarjs/cognitive-complexity': 'off',
                'sonarjs/no-identical-functions': 'off',

                '@typescript-eslint/no-object-literal-type-assertion': 'off',

                'lodash/prefer-noop': 'off',
                'lodash/prefer-constant': 'off',

                'unicorn/consistent-function-scoping': 'off',

                'chai-expect/missing-assertion': 'error',
                'chai-expect/no-inner-compare': 'error',
                'chai-expect/terminating-properties': 'error',

                'mocha/handle-done-callback': 'error',
                'mocha/max-top-level-suites': ['error', {limit: 1}],
                'mocha/no-exclusive-tests': 'warn',
                'mocha/no-global-tests': 'error',
                'mocha/no-hooks': 'off',
                'mocha/no-hooks-for-single-case': 'warn',
                'mocha/no-identical-title': 'error',
                'mocha/no-mocha-arrows': 'error',
                'mocha/no-nested-tests': 'error',
                'mocha/no-pending-tests': 'warn',
                'mocha/no-return-and-callback': 'error',
                'mocha/no-setup-in-describe': 'error',
                'mocha/no-sibling-hooks': 'error',
                'mocha/no-skipped-tests': 'warn',
                'mocha/no-synchronous-tests': 'off',
                'mocha/no-top-level-hooks': 'error',
                'mocha/prefer-arrow-callback': 'off',
                'mocha/valid-suite-description': 'off',
                'mocha/valid-test-description': 'off',
                'mocha/no-async-describe': 'error',
            },
        },
    ],
};
