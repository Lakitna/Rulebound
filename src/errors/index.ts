/* istanbul ignore file */

export { ConfigError } from './config-error';
export { RuleError } from './rule-error';
export { RulebookError } from './rulebook-error';

/**
 * Limit unwieldly stack traces, but only do so if it's not limited
 * more rigorously by another package.
 */
if (Error.stackTraceLimit > 25) {
    Error.stackTraceLimit = 25;
}
