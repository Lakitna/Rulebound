import { expect } from 'chai';
import rule from '.';
import { Rulebook } from '../../../../../src/rulebook';

const ruleName = 'openapi-schema/string/format';

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

    it('has a default config', async function () {
        const book = new Rulebook();
        await rule(book);

        expect(book.rules[0].config).to.deep.equal({
            required: 'should',
            allowUnkown: false,
        });
    });

    it('passes when the schema has no format', async function () {
        await this.book.enforce(this.rule.name, 'foo', {
            format: undefined,
        });
    });

    it('enforces through a sub-rule when the schema has a known format', async function () {
        await expect(
            this.book.enforce(this.rule.name, 'foo', {
                format: 'date',
            })
        ).to.be.rejectedWith(`'foo' is not a valid date`);
    });

    it('fails when the schema has an unkown format', async function () {
        await expect(
            this.book.enforce(this.rule.name, 'foo', {
                format: 'veryUnexpectedFormat',
            })
        ).to.be.rejectedWith(`Unkown format 'veryUnexpectedFormat'.`);
    });

    describe('Option: allowUnkown: true', function () {
        beforeEach(async function (this: any) {
            this.book = new Rulebook({
                rules: {
                    [ruleName]: {
                        required: 'must',
                        allowUnkown: true,
                    },
                },
            });
            await rule(this.book);
            this.rule = this.book.filter(ruleName).rules[0];
        });

        it('passes when the schema has an unkown format', async function () {
            await this.book.enforce(this.rule.name, 'foo', {
                format: 'veryUnexpectedFormat',
            });
        });
    });
});
