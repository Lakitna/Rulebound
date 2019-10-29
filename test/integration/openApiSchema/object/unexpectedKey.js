const _ = require('lodash');

module.exports = (lawbook) => {
    return lawbook
        .add('openApiSchema/object/unexpected-key')
        .describe(`
            Only keys that are defined in the schema are allowed.
        `)
        .define(async function(obj, schema) {
            const expectedKeys = _.keys(schema.properties);
            const actualKeys = _.keys(obj);

            actualKeys.forEach((actual) => {
                if (!expectedKeys.includes(actual)) {
                    throw new Error(`Found unexpected key '${actual}'.`);
                }
            })

            return true;
        });
};
