module.exports = (lawbook) => {
    return lawbook
        .add('openApiSchema/integer/format/int64')
        .define(function(num, schema) {
            return -9223372036854775808n <= num && num <= 9223372036854775807n;
        })
        .punishment(function(inputs, err) {
            this.throw(`'${inputs[0]}' is not signed 64-bit`);
        });
};