module.exports = (lawbook) => {
    return lawbook
        .add('openApiSchema/array/empty', {
            severity: 'should',
        })
        .describe(`
            Empty arrays do not contain any data. Omit them for the sake of simplicity.
        `)
        .define(async function(arr) {
            if (typeof arr === 'undefined') {
                return true;
            }

            if (arr.length === 0) {
                throw new Error(`Array is empty. Empty arrays should be omitted.`);
            }

            return true;
        });
};
