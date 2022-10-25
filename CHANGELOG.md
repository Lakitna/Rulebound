# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
