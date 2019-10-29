import { isUndefined } from 'lodash';
import { Lawbook } from '../../../../src/lawbook';

export default (lawbook: Lawbook) => {
    return lawbook
        .add('openApiSchema/string/pattern', {
            flags: 'g',
        })
        .describe(`
            "The pattern keyword lets you define a regular expression template for the string value. Only the values that match this template will be accepted."

            https://swagger.io/docs/specification/data-models/data-types/#pattern
        `)
        .define(async function(string, schema) {
            if (isUndefined(schema.pattern)) {
                return true;
            }

            if (!new RegExp(schema.pattern, this.config.flags).test(string)) {
                throw new Error(`'${string}' does not match pattern `
                    + `/${schema.pattern}/${this.config.flags}`);
            }

            return true;
        });
};
