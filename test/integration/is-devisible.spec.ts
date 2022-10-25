import { expect } from 'chai';
import { Rulebook } from '../../src/index';
import rule from './is-devisible';

const ruleName = 'is-devisible';

describe(`Rule: ${ruleName}`, function () {
    beforeEach(async function (this: any) {
        this.book = new Rulebook({
            rules: {
                [ruleName]: {
                    required: 'must',
                },
            },
        });
        await rule(this.book);
        this.rule = this.book.filter(ruleName).rules[0];
    });

    it('has a default config', function () {
        const book = new Rulebook();
        rule(book);

        expect(book.rules[0].config).to.deep.equal({
            required: 'should',
            foo: 'bar',
        });
    });

    it('is kept when the number is cleanly devisible to an integer', async function () {
        await this.book.enforce(this.rule.name, 4, 2);
        await this.book.enforce(this.rule.name, 9, 3);
        await this.book.enforce(this.rule.name, 68_452, 2);
    });

    it('is broken when the number is cleanly devisible to a fraction', async function () {
        await expect(this.book.enforce(this.rule.name, 3, 2)).to.be.rejectedWith(
            '3 is not devisible by 2'
        );
    });

    it('is broken when the number is not cleanly devisible', async function () {
        await expect(this.book.enforce(this.rule.name, 3, 1.9)).to.be.rejectedWith(
            '3 is not devisible by 1.9'
        );
    });
});
