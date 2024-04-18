import { expect } from 'chai';
import rule from '.';
import { OasRuleParametersString } from '..';
import { Rulebook } from '../../../../../src/rulebook';

const ruleName = 'openapi-schema/string/format';

describe(`Rule: ${ruleName}`, function () {
    beforeEach(async function () {
        this.book = new Rulebook<OasRuleParametersString>({
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
        const book = new Rulebook<OasRuleParametersString>();
        await rule(book);

        expect(book.rules[0].config()).to.deep.equal({
            required: 'should',
            allowUnkown: false,
        });
    });

    it('passes when the schema has no format', async function () {
        await this.book.enforce(this.rule.name, {
            json: 'foo',
            schema: {
                format: undefined,
            },
        });
    });

    it('enforces through a sub-rule when the schema has a known format', async function () {
        await expect(
            this.book.enforce(this.rule.name, {
                json: 'foo',
                schema: {
                    format: 'date',
                },
            })
        ).to.be.rejectedWith(`'foo' is not a valid date`);
    });

    it('fails when the schema has an unkown format', async function () {
        await expect(
            this.book.enforce(this.rule.name, {
                json: 'foo',
                schema: {
                    format: 'veryUnexpectedFormat',
                },
            })
        ).to.be.rejectedWith(`Unkown format 'veryUnexpectedFormat'.`);
    });

    describe('Option: allowUnkown: true', function () {
        beforeEach(async function () {
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
            await this.book.enforce(this.rule.name, {
                json: 'foo',
                schema: {
                    format: 'veryUnexpectedFormat',
                },
            });
        });
    });
});
