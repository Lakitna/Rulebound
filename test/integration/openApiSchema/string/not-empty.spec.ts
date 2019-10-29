import { expect } from 'chai';
import { Lawbook } from '../../../../src/lawbook';
import law from './not-empty';

const lawName = 'openApiSchema/string/not-empty';

describe(`Law: ${lawName}`, function() {
    beforeEach(async function(this: any) {
        this.book = new Lawbook({
            laws: {
                [lawName]: {
                    required: 'must',
                },
            },
        });
        await law(this.book);
        this.law = this.book.filter(lawName).laws[0];
    });

    it('passes on valid string', async function() {
        await this.book.enforce(this.law.name, 'foo');
    });

    it('passes a string starting with whitespace', async function() {
        await this.book.enforce(this.law.name, ' foo');
    });

    it('passes a string ending with whitespace', async function() {
        await this.book.enforce(this.law.name, 'foo ');
    });

    it('throws on empty string without whitespace', async function() {
        await expect(this.book.enforce(this.law.name, '')
            ).to.be.rejectedWith(`String is empty. Empty strings should be omitted.`);
    });

    it('throws on empty string with single space', async function() {
        await expect(this.book.enforce(this.law.name, ' ')
            ).to.be.rejectedWith(`String is empty. Empty strings should be omitted.`);
    });

    it('throws on empty string with complex whitespace', async function() {
        await expect(this.book.enforce(this.law.name, '  \t \n  \t\t')
            ).to.be.rejectedWith(`String is empty. Empty strings should be omitted.`);
    });
});
