# Lawful

A flexible framework for rule-based testing.

- [Lawful](#lawful)
  - [Why](#why)
  - [Getting started](#getting-started)
  - [Writing laws](#writing-laws)
    - [Name _{string}_](#name-string)
    - [Configuration _{object}_](#configuration-object)
    - [Description _{string}_](#description-string)
    - [Alias _{string}_](#alias-string)
    - [Definition _{function}_](#definition-function)
      - [Definition function arguments](#definition-function-arguments)
      - [Breaking a law](#breaking-a-law)
      - [Upholding the law](#upholding-the-law)
    - [Punishment _{function}_](#punishment-function)
      - [Punishment function arguments](#punishment-function-arguments)
    - [Reward _{function}_](#reward-function)
      - [Reward function arguments](#reward-function-arguments)
  - [Testing laws](#testing-laws)
  - [Contributing](#contributing)
  - [Testing Lawful](#testing-lawful)

## Why

Rule-based testing is awesome! It forces you to look at problems from a different angle while promoting reuse and testability of your test code.

I’ve made this package because I could not find a suitable, existing framework written for rule-based testing.

## Getting started

First, add Lawful to your project

```shell
npm install lawful --save-dev
```

Lawful is written in Typescript and therefore supports both Javascript and Typescript.

```javascript
// Require syntax
const { Lawbook } = require('lawful');

const lawbook = new Lawbook();
```

```javascript
// Import syntax
import { Lawbook } from 'lawful';

const lawbook = new Lawbook();
```

Now add and execute your first law.

```javascript
import { Lawbook } from 'lawful';

const lawbook = new Lawbook();

lawbook.add('is-divisible')
    .define((number, factor) => {
        return (number % factor) === 0;
    });

await lawbook.enforce('is-divisible', 21, 7);
```

## Writing laws

Laws will typically be made as part of a lawbook. A law consists of the following:

### Name _{string}_

```typescript
lawbook.add('string/max-length');
```

A law name...

- MUST be a unique identifier without any whitespace.
- SHOULD be a human-readable string.
- SHOULD use `/` and `-` as separators but MAY also use `_`, `@`, and `|`.
- SHOULD be kebab-cased.

### Configuration _{object}_

```typescript
lawbook.add('string/max-length', {
    maximum: 12,
});
```

A law MAY have a law-specific configuration. The default law-specific configuration can be defined as above. The user can overwrite this configuration via the Lawful configuration file.

The parsed configuration can be accessed with `this.config` in the definition, punishment, and reward callback functions.

The precedence of configuration is as below where the bottom of the list overwrites the top.

- The default configuration for every law
- The default configuration as specified when defining the law
- User configuration for one or more laws (using glob pattern)
- User configuration for the specific law

### Description _{string}_

```typescript
law.describe(`
    This is a description. Any IDE formatting whitespace is stripped.
`);
```

A description SHOULD be added to the law so humans know what the purpose of that law is. Putting some effort in this will make things a lot simpler for someone who has not written the law.

### Alias _{string}_

```typescript
law.alias('some-law-name');
```

A law MAY have an alias. This is defined by providing the name of another law like above.

A law with alias defined SHOULD NOT have any definitions as these will be ignored. When enforcing the definitions, punishments, and rewards of the target law will be used after which the punishments and rewards of the law will be executed.

This allows you to use the same law in different namespaces.

### Definition _{function}_

```typescript
// Semantic syntax
law.define(function(inputValue) {
    return true;
});
```

```typescript
// Event based syntax
law.on('enforce', function(inputValue) {
    return true;
});
```

A law MUST have a definition. It's the part that is used to enforce it. A law MAY have multiple definitions.

A law can be defined with two distinct syntaxes (as above). There is no technical difference between these syntaxes.

#### Definition function arguments

When `enforce` is called the given arguments will be passed to the definition.

```typescript
lawbook.add('some-law')
    .define(function(a, b) {
        console.log(a); // => 'someValue'
        console.log(b); // => 123
    })
    .enforce('some-law', 'someValue', 123);
```

#### Breaking a law

A law is considered broken when the definition does one of the following:

- Throw an error.
- Return anything other than the boolean `true`.

#### Upholding the law

A law is considered upheld when the definition returns the boolean `true`.

### Punishment _{function}_

```typescript
law.punishment(function(input, result) {
    throw new Error('Something bad happened');
});
```

```typescript
law.on('fail', function(input, result) {
    throw new Error('Something bad happened');
});
```

A law MAY have one or more punishments. When a law is broken the defined punishments are automatically executed. When no punishment is provided the default punishment will be used.

Punishment can be defined with two distinct syntaxes (as above). There is no technical difference between these syntaxes.

#### Punishment function arguments

The following arguments are passed to the callback function:

| name    | type    | description    |
|---------|---------|----------------|
| `input` | `any[]` | An array of the arguments passed to the `enforce` function |
| `result` | `any[] | Error` | An array containing the results of all `define` functions **or** a thrown error |

### Reward _{function}_

```typescript
law.reward(function(input, result) {
    console.log('Yay, the law is upheld!');
});
```

```typescript
law.on('pass', function(input, result) {
    console.log('Yay, the law is upheld!');
});
```

A law MAY have one or more rewards. When a law is upheld the defined rewards are automatically executed. When no reward is provided nothing will happen.

Punishment can be defined with two distinct syntaxes (as above). There is no technical difference between these syntaxes.

#### Reward function arguments

The following arguments are passed to the callback function:

| name    | type    | description    |
|---------|---------|----------------|
| `input` | `any[]` | An array of the arguments passed to the `enforce` function |

## Testing laws

Since laws are self-contained pieces of code you can easily test them and the logic within. Doing this will take little execution time, as they're essentially unit tests, but will increase the quality of your tests tremendously.

The easiest way to show you how to test laws is with an example. The easiest way to do that is to [link to the integration tests of this package](./test/integration). All the `*.spec.ts` files in the linked folder are testing their corresponding law. In this repository, Mocha is used as the test runner and Chai as the assertion framework but the patterns transfer well to other test runners.

A few things to keep in mind when testing laws:

- Make sure a broken law always results in an error. It would be a shame to have a law punish but the test framework not failing the test. The easiest way to do this is to set `required: 'must'`.
- Test custom config and things related to it.
- Enforcing is async. Don't forget to `await`.

## Contributing

Contributors are always welcome! I don't care if you are a beginner or an expert, all help is welcome.

## Testing Lawful

First, clone the repository and install the dependencies. Then run the test script:

```plain
npm test
```

Sometimes things are just that simple.
