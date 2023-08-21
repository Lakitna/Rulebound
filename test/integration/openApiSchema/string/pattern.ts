import { isUndefined } from 'lodash-es';
import { OasRuleParametersString } from '.';
import { Rulebook } from '../../../../src/rulebook';

export default (rulebook: Rulebook<OasRuleParametersString>) => {
    return rulebook
        .add('openapi-schema/string/pattern', {
            flags: 'g',
        })
        .describe(
            `
            "The pattern keyword lets you define a regular expression template for the string value. Only the values that match this template will be accepted."

            https://swagger.io/docs/specification/data-models/data-types/#pattern
        `
        )
        .define(async function ({ string, schema }, config) {
            if (isUndefined(schema.pattern)) {
                return true;
            }

            if (!new RegExp(schema.pattern, config.flags).test(string)) {
                throw new Error(
                    `'${string}' does not match pattern /${schema.pattern}/${config.flags}`
                );
            }

            return true;
        });
};
