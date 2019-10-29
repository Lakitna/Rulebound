const _ = require('lodash');

module.exports = (lawbook) => {
    return lawbook
        .add('openApiSchema/object/empty', {
            severity: 'should',
        })
        .describe(`
            Since empty objects do not contain any data, it is good practice to omit them.
        `)
        .define(async function(obj) {
            if (_.keys(obj).length === 0) {
                throw new Error(`Object is empty. Empty objects should be omitted.`);
            }

            return true;
        });
};
