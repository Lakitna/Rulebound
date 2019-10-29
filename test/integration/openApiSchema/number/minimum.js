module.exports = (lawbook) => {
    return lawbook
        .add('openApiSchema/number/minimum', {
            severity: 'must',
        })
        .describe(`
            "Use the \`minimum\` and \`maximum\` keywords to specify the range of possible values"

            "To exclude the boundary values, specify \`exclusiveMinimum: true\` and \`exclusiveMaximum: true\`."

            https://swagger.io/docs/specification/data-models/data-types/#range
        `)
        .define(function(num, schema) {
            if (typeof schema.minimum === 'undefined') {
                return true;
            }

            if (schema.exclusiveMinimum === true) {
                if (num <= schema.minimum) {
                    throw new Error(`${num} is below or equal to the minimum allowed value of ${schema.minimum}`);
                }
            }
            else {
                if (num < schema.minimum) {
                    throw new Error(`${num} is below the minimum allowed value of ${schema.minimum}`)
                }
            }

            return true;
        });
};
