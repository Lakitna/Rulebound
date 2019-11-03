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
  - [Contributing](#contributing)
  - [Testing Lawful](#testing-lawful)

## Why

Because rule-based testing is awesome!

// TODO: Details

## Getting started

First add Lawful to your project

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

A law will typically be made through a lawbook. It consists of the following

### Name _{string}_

```typescript
lawbook.add('string/max-length');
```

The name of the law MUST be a unique identifier without any whitespace.

It SHOULD be a human-readable string. Law names SHOULD use `/` and `-` as separators but MAY also use `_`, `@` and `|`. Law names SHOULD be kebab-cased.

### Configuration _{object}_

```typescript
lawbook.add('string/max-length', {
    maximum: 12,
});
```

A law MAY have a law-specific configuration. The default configuration can be defined as above. The user can overwrite this configuration via the Lawful configuration file.

The parsed configuration can be accessed with `this.config` in the definition, punishment, and reward callback functions.

The precedence of configuration is as follows:

- Default configuration as specified when defining the law
- User configuration for one or more laws (using glob pattern) // TODO: add test for this
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

A law MAY have an alias. The provided string MUST be the name of another law. When a law has an alias set it SHOULD NOT have a definition, punishment, or reward. When enforcing the law with alias set the definitions, punishments, and rewards of the aliased law will be used.

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

A law MUST have a definition. It's the part that is used to enforce it. A law MAY have multiple definitions. A law can be defined with two distinct syntaxes (as above). There is no technical difference between these syntaxes.

#### Definition function arguments

When `enforce` is called the values will be passed to the definition.

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

- Throws an error
- NOT return the boolean value `true`

#### Upholding the law

A law is considered uphold when the definition returns the boolean value `true`.

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

A law MAY have a punishment. When a law is broken the defined punishments are automatically executed. When no punishment is provided the default punishment will be used. A punishment MAY have multiple definitions. A punishment can be defined with two distinct syntaxes (as above). There is no technical difference between these syntaxes.

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

A law MAY have a reward. When a law is upheld the defined rewards are automatically executed. When no reward is provided nothing will happen. A reward MAY have multiple definitions. A reward can be defined with two distinct syntaxes (as above). There is no technical difference between these syntaxes.

#### Reward function arguments

The following arguments are passed to the callback function:

| name    | type    | description    |
|---------|---------|----------------|
| `input` | `any[]` | An array of the arguments passed to the `enforce` function |

## Contributing

Contributors are always welcome! I don't care if you are a beginner or an expert, all help is welcome.

## Testing Lawful

First, clone the repository and install the dependencies.

```plain
npm test
```

Sometimes things are just that simple.
