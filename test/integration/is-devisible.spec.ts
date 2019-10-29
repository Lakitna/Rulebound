import { expect } from 'chai';
import { Lawbook } from '../../src/lawbook';
import law from './is-devisible';

describe(`Law: is-devisible`, function() {
    beforeEach(function(this: any) {
        this.book = new Lawbook({
            laws: {
                'is-devisible': {
                    required: 'must',
                },
            },
        });
        law(this.book);
    });

    it('has a default config', function() {
        const book = new Lawbook();
        law(book);

        expect(book.laws[0].config).to.deep.equal({
            required: 'should',
            foo: 'bar',
        });
    });

    it('is kept when the number is cleanly devisible to an integer', async function() {
        await this.book.enforce('*', 4, 2);
        await this.book.enforce('*', 9, 3);
        await this.book.enforce('*', 68452, 2);
    });

    it('is broken when the number is cleanly devisible to a fraction', async function() {
        await expect(this.book.enforce('*', 3, 2))
            .to.be.rejectedWith('3 is not devisible by 2');
    });

    it('is broken when the number is not cleanly devisible', async function() {
        await expect(this.book.enforce('*', 3, 1.9))
            .to.be.rejectedWith('3 is not devisible by 1.9');
    });
});
