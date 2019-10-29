module.exports = (lawbook) => {
    return lawbook
        .add('openApiSchema/number/multipleOf', {
            severity: 'must',
        })
        .describe(`
            "Use the \`multipleOf\` keyword to specify that a number must be the multiple of another number"

            "The value of \`multipleOf\` must be a positive number, that is, you cannot use \`multipleOf: -5\`."

            https://swagger.io/docs/specification/data-models/data-types/#multipleOf
        `)
        .define(function(num, schema) {
            if (typeof schema.multipleOf === 'undefined') {
                return true;
            }

            return num > 0 && num % schema.multipleOf === 0;
        })
        .punishment(function(inputs, err) {
            throw new Error(`'${inputs[0]}' is not a multiple of ${inputs[1].multipleOf}`);
        });
};
