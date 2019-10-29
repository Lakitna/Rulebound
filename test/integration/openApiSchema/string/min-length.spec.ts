import { expect } from 'chai';
import { Lawbook } from '../../../../src/lawbook';
import law from './min-length';

const lawName = 'openApiSchema/string/min-length';

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

    it('passes when there is no minLength in the schema', async function() {
        await this.book.enforce(this.law.name, 'value', {
            minLength: undefined,
        });
    });

    it('passes when string.length > minLength', async function() {
        await this.book.enforce(this.law.name, 'value', {
            minLength: 4,
        });
    });

    it('passes when string.length === minLength', async function() {
        await this.book.enforce(this.law.name, 'value', {
            minLength: 5,
        });
    });

    it('throws when string.length < minLength', async function() {
        await expect(this.book.enforce(this.law.name, 'value', {
            minLength: 6,
        })).to.be.rejectedWith(`'value' is too short. Expected at least 6 characters but got 5`);
    });
});
