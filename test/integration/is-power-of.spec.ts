import { expect } from 'chai';
import { Lawbook } from '../../src/lawbook';
import law from './is-power-of';

const lawName = 'is-power-of';

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

    it('has the root default config', function() {
        const book = new Lawbook();
        law(book);

        expect(book.laws[0].config).to.deep.equal({
            required: 'must',
        });
    });

    it('is kept when the number is a power of', async function() {
        await this.book.enforce(this.law.name, 4, 2);
        await this.book.enforce(this.law.name, 9, 2);
        await this.book.enforce(this.law.name, 27, 3);
    });

    it('is broken when the number is not a power of', async function() {
        await expect(this.book.enforce(this.law.name, 3, 1.9))
            .to.be.rejectedWith('3 is not a power of 1.9');
    });
});
