import { expect } from 'chai';
import { OasRuleParametersString } from '.';
import { Rulebook } from '../../../../src/rulebook';
import rule from './enum';

const ruleName = 'openapi-schema/string/enum';

describe(`Rule: ${ruleName}`, function () {
    beforeEach(async function (this: any) {
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

    it('passes when there is no enum in the schema', async function () {
        await this.book.enforce(this.rule.name, {
            string: 'value',
            schema: {
                enum: undefined,
            },
        });
    });

    it('throws when enum in the schema is not an array', async function () {
        await expect(
            this.book.enforce(this.rule.name, {
                string: 'value',
                schema: {
                    enum: 'foo',
                },
            })
        ).to.be.rejectedWith('Enum must be an array');
    });

    it('throws when values in the enum are of different types', async function () {
        await expect(
            this.book.enforce(this.rule.name, {
                string: 'value',
                schema: {
                    enum: ['foo', 123],
                },
            })
        ).to.be.rejectedWith('All values in an enum must be of the same type');
    });

    it('throws when the string is not included in the enum', async function () {
        await expect(
            this.book.enforce(this.rule.name, {
                string: 'value',
                schema: {
                    enum: ['foo', 'bar'],
                },
            })
        ).to.be.rejectedWith(`Unexpected value 'value'. Expected one of ['foo', 'bar']`);
    });

    it('passes when the string is one of multiple values included in the enum', async function () {
        this.book.enforce(this.rule.name, {
            string: 'value',
            schema: {
                enum: ['foo', 'bar', 'value'],
            },
        });
    });

    it('passes when the string is the only value included in the enum', async function () {
        this.book.enforce(this.rule.name, {
            string: 'value',
            schema: {
                enum: ['value'],
            },
        });
    });
});
