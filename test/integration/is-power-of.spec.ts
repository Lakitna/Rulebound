import { expect } from 'chai';
import { Rulebook } from '../../src/rulebook';
import rule, { RuleParameters } from './is-power-of';

const ruleName = 'is-power-of';

describe(`Rule: ${ruleName}`, function () {
    beforeEach(async function (this: any) {
        this.book = new Rulebook<RuleParameters>({
            rules: {
                [ruleName]: {
                    required: 'must',
                },
            },
        });
        await rule(this.book);
        this.rule = this.book.filter(ruleName).rules[0];
    });

    it('has the root default config', function () {
        const book = new Rulebook<RuleParameters>();
        rule(book);

        expect(book.rules[0].config()).to.deep.equal({
            required: 'must',
        });
    });

    it('is kept when the number is a power of', async function () {
        await this.book.enforce(this.rule.name, { number: 4, power: 2 });
        await this.book.enforce(this.rule.name, { number: 9, power: 2 });
        await this.book.enforce(this.rule.name, { number: 27, power: 3 });
    });

    it('is broken when the number is not a power of', async function () {
        await expect(
            this.book.enforce(this.rule.name, { number: 3, power: 1.9 })
        ).to.be.rejectedWith('3 is not a power of 1.9');
    });
});
