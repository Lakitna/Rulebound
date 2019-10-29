module.exports = (lawbook) => {
    return lawbook
        .add('openApiSchema/integer/format/int32')
        .describe(`
            Expect the input to be a signed 32-bits integer.
        `)
        .define(function(num, schema) {
            return -2147483648 <= num && num <= 2147483647;
        })
        .punishment(function(inputs, err) {
            this.throw(`'${inputs[0]}' is not signed 32-bit`);
        });
};
