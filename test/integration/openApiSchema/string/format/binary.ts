import { Lawbook } from '../../../../../src/lawbook';

export default (lawbook: Lawbook) => {
    return lawbook
        .add('openApiSchema/string/format/binary')
        .describe(`
            "binary data, used to describe files"

            https://swagger.io/docs/specification/data-models/data-types/#format
        `)
        .define(function(str, schema) {
            // TODO: What should be validated here?
            throw Error('Not implemented');
        });
};
