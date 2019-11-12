/* istanbul ignore file */

export { RulebookError } from './rulebook-error';
export { RuleError } from './rule-error';
export { ConfigError } from './config-error';

/**
 * Limit unwieldly stack traces, but only do so if it's not limited
 * more rigorously by another package.
 */
if (Error.stackTraceLimit > 25) {
    Error.stackTraceLimit = 25;
}

process.on('unhandledRejection', (error: any) => {
    /**
     * Get rid of the `UnhandledPromiseRejectionWarning` when throwing
     * an error in a promise, because it really should behave like a
     * normal error does.
     *
     * Sadly this will affect all unhandled rejections, not just the ones
     * thrown by rules.
     */
    throw error;
});
