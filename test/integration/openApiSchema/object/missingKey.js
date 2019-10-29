const _ = require('lodash');

module.exports = (lawbook) => {
    return lawbook
        .add('openApiSchema/object/missing-key', {
            requireAllKeys: false,
        })
        .describe(`
            Keys that are marked 'required' must always be present in the json.
        `)
        .define(async function(obj, schema) {
            const actualKeys = _.keys(obj);
            let requiredKeys = [];
            if (this.config.requireAllKeys) {
                requiredKeys = _.keys(schema.properties);
            }
            else if (schema.required && schema.required.length) {
                requiredKeys = schema.required;
            }

            requiredKeys.forEach((required) => {
                if (!actualKeys.includes(required)) {
                    throw new Error(`Missing required key '${required}'.`);
                }
            });

            return true;
        })
        .punishment(function(input, err) {
            this.description += `\n\nAll keys are required. You can disable this `
                + `behaviour with the configuration 'requireAllKeys: false'.`;

            throw err;
        });
};
