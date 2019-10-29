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
        .define(async function(str, schema) {
            if (typeof schema.pattern === 'undefined') {
                return true;
            }

            if (!new RegExp(schema.pattern, this.config.flags).test(str)) {
                throw new Error(`'${str}' does not match pattern `
                    + `/${schema.pattern}/${this.config.flags}`);
            }

            return true;
        });
};
