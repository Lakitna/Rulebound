module.exports = (lawbook) => {
    return lawbook
        .add('openApiSchema/number/format/float')
        .define(function(num, schema) {
            // Floats can not be asserted reliably in javascript
            return typeof num === 'number';
        });
};
