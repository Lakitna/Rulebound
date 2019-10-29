module.exports = (lawbook) => {
    return lawbook
        .add('openApiSchema/number/format/double')
        .define(function(num, schema) {
            // Doubles can not be asserted reliably in javascript
            return typeof num === 'number';
        });
};
