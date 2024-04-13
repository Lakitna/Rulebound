# Rulebound

A flexible framework for rule-based testing.

- [Rulebound](#rulebound)
  - [Why](#why)
  - [Getting started](#getting-started)
  - [Writing rules](#writing-rules)
    - [Name _{string}_](#name-string)
    - [Configuration _{object}_](#configuration-object)
    - [Description _{string}_](#description-string)
    - [Alias _{string}_](#alias-string)
    - [Definition _{function}_](#definition-function)
      - [Input value](#input-value)
      - [Breaking a rule](#breaking-a-rule)
      - [Upholding the rule](#upholding-the-rule)
    - [Punishment _{function}_](#punishment-function)
    - [Reward _{function}_](#reward-function)
  - [Testing rules](#testing-rules)
  - [Rule enforce order](#rule-enforce-order)
  - [Contributing](#contributing)
  - [Testing Rulebound](#testing-rulebound)

## Why

Rule-based testing is awesome! It forces you to look at problems from a different angle whil
promoting reuse and testability of your test code.

I’ve made this package because I could not find a suitable, existing framework written for
rule-based testing.

## Getting started

First, add Rulebound to your project

```shell
npm install rulebound
```

Rulebound is written in Typescript and therefore supports both Javascript and Typescript.

```javascript
// Require syntax
const { Rulebook } = require('rulebound');

const rulebook = new Rulebook();
```

```javascript
// Import syntax
import { Rulebook } from 'rulebound';

const rulebook = new Rulebook();
```

You can now add and execute your first rule.

```javascript
import { Rulebook } from 'rulebound';

const rulebook = new Rulebook();

rulebook.add('is-divisible').define(({ number, factor }) => {
  return number % factor === 0;
});

await rulebook.enforce('is-divisible', 21, 7);
await rulebook.enforce('is-divisible', 11, 2); // => throws error
```

## Writing rules

Rules are typically defined as part of a rulebook. A rule consists of the following:

### Name _{string}_

```typescript
rulebook.add('string/max-length');
```

A rule name is a unique identifier that...

- MUST NOT contain any whitespace.
- SHOULD be a human-readable string.
- SHOULD use `/` and `-` as separators but MAY also use `_`, `@`, and `|`.
- SHOULD be kebab-cased.

### Configuration _{object}_

```typescript
rulebook.add('string/max-length', {
  maximum: 12,
});
```

A rule MAY have a rule-specific configuration. The default rule-specific configuration can be
defined as above. The user can overwrite this via the Rulebook config.

The parsed configuration can be accessed as the second argument in the definition, punishment, and
reward callback functions.

The precedence of configuration is as below where the bottom of the list overwrites the top.

- The default configuration for every rule
- The default configuration as specified when defining the rule
- User configuration for one or more rules (using glob pattern)
- User configuration for the specific rule

### Description _{string}_

```typescript
rule.describe(`
    This is a description. Any IDE formatting whitespace is stripped.
`);
```

A description SHOULD be added to the rule so humans know what the purpose of that rule is and what
logic it contains. Putting some effort in this will make things a lot simpler for someone who has
not written the rule.

### Alias _{string}_

```typescript
rule.alias('some-rule-name');
```

A rule MAY have an alias. This is defined by providing the name of another rule like above.

A rule with alias defined SHOULD NOT have any definitions as these will be ignored. When enforcing
the definitions, punishments, and rewards of the target rule will be used after which the
punishments and rewards of the rule with alias will be executed.

This allows you to use the same rule in different namespaces.

### Definition _{function}_

```typescript
// Semantic syntax
rule.define(function (inputValue, ruleConfig) {
  return true;
});
```

```typescript
// Event based syntax
rule.on('enforce', function (inputValue, ruleConfig) {
  return true;
});
```

A rule MUST have a definition. It's the part that is used to enforce it. A rule MAY have multiple
definitions.

A rule can be defined with two distinct syntaxes (as above). There is no technical difference
between them.

#### Input value

When `enforce` is called the given input argument will be passed to the definition.

```typescript
rulebook
  .add('some-rule')
  .define(function (inputValue) {
    console.log(inputValue); // => 'someValue'
  })
  .enforce('some-rule', 'someValue');
```

#### Breaking a rule

A rule is considered broken when the definition does one of the following:

- Throw an error.
- Return anything other than the boolean `true`.

#### Upholding the rule

A rule is considered upheld when the definition returns the boolean `true`.

### Punishment _{function}_

```typescript
rule.punishment(function (inputValue, ruleConfig, result) {
  throw new Error('Something bad happened');
});
```

```typescript
rule.on('fail', function (inputValue, ruleConfig, result) {
  throw new Error('Something bad happened');
});
```

A rule MAY have one or more punishments. When a rule is broken the defined punishments are executed.
When no punishment is provided the default punishment will be used.

Punishments can be defined with two distinct syntaxes (as above). There is no technical difference
between them.

### Reward _{function}_

```typescript
rule.reward(function (inputValue, ruleConfig) {
  console.log('Yay, the rule is upheld!');
});
```

```typescript
rule.on('pass', function (inputValue, ruleConfig) {
  console.log('Yay, the rule is upheld!');
});
```

A rule MAY have one or more rewards. When a rule is upheld the defined rewards are executed. When no
reward is provided nothing will happen.

Rewards can be defined with two distinct syntaxes (as above). There is no technical difference
between them.

## Testing rules

Since rules are self-contained pieces of code you can easily test them and the logic within. Doing
so will take little execution time, as they're essentially unit tests, but will increase the quality
of your rules tremendously.

The easiest way to show you how to test rules is with an example. The easiest way to do that is to
[link to the integration tests of this repository](./test/integration). All the `*.spec.ts` files in
the linked folder are testing their corresponding rule. In this repository, Mocha is used as the
test runner and Chai as the assertion framework but the patterns transfer well to other test
runners.

A few things to keep in mind when testing rules:

- Ensure that a broken rule results in an error. It would be a shame to have a rule punish but the
  test framework not failing the test. The easiest way to do this is to set `required: 'must'` for
  the duration of the test.
- Test the rule-specific configuration and the logic it relates to.
- Enforcing is async. Don't forget to `await`.

## Rule enforce order

When you enforce a Rulebook with `enforceParallel: false` (= default), it will enforce the rules in
a fixed order. The order is from least specific to most specific. Specificity is defined by the rule
name. For details on how specificity is calculated, see
[glob-specificity](https://github.com/Lakitna/glob-specificity).

when you enforce a Rulebook with `enforceParallel: true`, the enforce order is not guaranteed in any
way.

## Contributing

Contributors are always welcome! I don't care if you are a beginner or an expert, all help is
welcome.

## Testing Rulebound

First, clone the repository and install the dependencies. Then run the test script:

```plain
npm test
```

Sometimes things are just that simple.
