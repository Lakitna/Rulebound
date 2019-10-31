import { expect } from 'chai';
import { Lawbook } from '../../../../src/lawbook';
import law from './max-length';

const lawName = 'openapi-schema/string/max-length';

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

    it('passes when there is no maxLength in the schema', async function() {
        await this.book.enforce(this.law.name, 'value', {
            maxLength: undefined,
        });
    });

    it('passes when string.length < maxLength', async function() {
        await this.book.enforce(this.law.name, 'value', {
            maxLength: 6,
        });
    });

    it('passes when string.length === maxLength', async function() {
        await this.book.enforce(this.law.name, 'value', {
            maxLength: 5,
        });
    });

    it('throws when string.length > maxLength', async function() {
        await expect(this.book.enforce(this.law.name, 'value', {
            maxLength: 4,
        })).to.be.rejectedWith(`'value' is too long. Expected at most 4 characters but got 5`);
    });
});
