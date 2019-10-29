import { Lawbook } from '../../../../src/lawbook';

export default (lawbook: Lawbook) => {
    return lawbook
        .add('openApiSchema/string/not-empty', {
            required: 'should',
        })
        .describe(`
            Since empty strings do not contain any data, it is good practice to omit them.
        `)
        .define(async function(string) {
            if (string.replace(/\s+/g, '') === '') {
                throw new Error(`String is empty. Empty strings should be omitted.`);
            }

            return true;
        });
};
