module.exports = (lawbook) => {
    return lawbook
        .add('openApiSchema/number/maximum', {
            severity: 'must',
        })
        .describe(`
            "Use the [...] \`maximum\` keywords to specify the range of possible values"

            "To exclude the boundary values, specify [...] \`exclusiveMaximum: true\`."

            https://swagger.io/docs/specification/data-models/data-types/#range
        `)
        .on('enforce', (num, schema) => {
            if (typeof schema.maximum === 'undefined') {
                return true;
            }

            if (schema.exclusiveMaximum === true) {
                if (num >= schema.maximum) {
                    throw new Error(`${num} is above or equal to the maximum allowed value of ${schema.maximum}`);
                }
            }
            else {
                if (num > schema.maximum) {
                    throw new Error(`${num} is above the maximum allowed value of ${schema.maximum}`)
                }
            }
            return true;
        });
};
