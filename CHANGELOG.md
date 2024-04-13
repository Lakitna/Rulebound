# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2.0.0

## Breaking changes

- Dropped support for Rulebound config file.

  It was an overreach on Rulebound's part. You can still set the config when creating a Rulebook,
  but it will no longer auto-discover the config from a file. If you don't want to get rid of your
  config file, it's quite easy to create this functionality for yourself with
  [Cosmiconfig](https://www.npmjs.com/package/cosmiconfig)

- Changed the way specificity is calculated.

  This means that the enforced order of rules might be different. The new approach is a lot more
  complete, courtesy of [glob-specificity](https://www.npmjs.com/package/glob-specificity)

- Rule errors no longer contain the rule that threw it.

  This used to cause massive walls of text in the console. The error still retains some data in the
  rule: rule name, severity, and description. There is also no longer styling on the stack trace,
  you can do this yourself if you need it, but it's no longer part of Rulebound.

- Rules enforce no longer takes multiple arguments.

  If you need multiple values, use an object containing everything you need. This simplifies
  Rulebound and makes the various event handlers more consistent. Finally, it gives us a better way
  of passing the rule config to the event handler functions. The rule config is now passed as the
  second argument.

## Additions

- Rules can now be enforced in parallel Or, asynchronously to be more correct. Enable with:
  `new Rulebook({ enforceParallel: true })`
- Rules can be cloned: `rule.clone()`
- Rules now take an `enable` event If the event handler returns anything that is not `true`, the
  rule is skipped.
- Rulebook is now an iterator, allowing you to loop over rules.
- Rulebook now allows you to filter and return an array of rules.

## Fixes

- Fixes #19: Aliased rules are now enforced with proper config
- Fixes #30: Document sorting by specificity

## 1.2.0

### Changed

- Exporting more types for use with Typescript
- Rule descriptions reflow in a Markdown fashion to allow for more flexibility when writing
  descriptions.
- Upgraded so many dependencies

## 1.1.0

### Changed

- Moved sorting of rules in rulebook from `enforce()` to `add()`. Because of this `forEach()` will
  now be in sorted order.

## 1.0.0

### Added

- README.md and CHANGELOG.md #8
- Configuration file for user config #11
- Event pattern for defining define, punish, and reward #6
- Initial development

### Miscelanious

- Added intergration tests #15
