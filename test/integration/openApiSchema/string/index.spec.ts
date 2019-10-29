import { expect } from 'chai';
import { Lawbook } from '../../../../src/lawbook';
import law from './index';

const lawName = 'openApiSchema/string';

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
        await this.book.enforce(this.law.name, 'fooBar');
    });

    it('fails on null', async function() {
        await expect(this.book.enforce(this.law.name, null))
            .to.be.rejectedWith(`'null' is not a string`);
    });

    it('fails on undefined', async function() {
        await expect(this.book.enforce(this.law.name, undefined))
            .to.be.rejectedWith(`'undefined' is not a string`);
    });

    it('fails on a number', async function() {
        await expect(this.book.enforce(this.law.name, 123))
            .to.be.rejectedWith(`'123' is not a string`);
    });

    it('fails on an array', async function() {
        await expect(this.book.enforce(this.law.name, ['foo']))
            .to.be.rejectedWith(`'[foo]' is not a string`);
    });

    it('fails on an object', async function() {
        await expect(this.book.enforce(this.law.name, {foo:'bar'}))
            .to.be.rejectedWith(`'[object Object]' is not a string`);
    });
});
