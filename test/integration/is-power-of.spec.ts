import { expect } from 'chai';
import { Lawbook } from '../../src/lawbook';
import law from './is-power-of';

describe(`Law: is-power-of`, function() {
    beforeEach(function(this: any) {
        this.book = new Lawbook();
        law(this.book);
    });

    it('has the root default config', function() {
        const book = new Lawbook();
        law(book);

        expect(book.laws[0].config).to.deep.equal({
            required: 'must',
        });
    });

    it('is kept when the number is a power of', async function() {
        await this.book.enforce('*', 4, 2);
        await this.book.enforce('*', 9, 2);
        await this.book.enforce('*', 27, 3);
    });

    it('is broken when the number is not a power of', async function() {
        await expect(this.book.enforce('*', 3, 1.9))
            .to.be.rejectedWith('3 is not a power of 1.9');
    });
});
