import { Lawbook } from '../../../../../src/lawbook';

export default (lawbook: Lawbook) => {
    return lawbook
        .add('openApiSchema/string/format/password')
        .describe(`
            "a hint to UIs to mask the input"

            https://swagger.io/docs/specification/data-models/data-types/#format
        `)
        .define(function(str, schema) {
            // "a hint to UIs to mask the input"
            // No validation

            return true;
        });
};
