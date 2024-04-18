import { expect } from 'chai';
import { OasRuleParametersString } from '.';
import { Rulebook } from '../../../../src/rulebook';
import rule from './pattern';
import alias from './pattern-alias';

const ruleName = 'openapi-schema/string/pattern-alias';

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
        await alias(this.book);
        this.alias = this.book.filter(ruleName).rules[0];
    });

    it('has a default config', function () {
        const book = new Rulebook<OasRuleParametersString>();
        rule(book);

        expect(book.rules[0].config()).to.deep.equal({
            required: 'must',
            flags: 'g',
        });
    });

    it('passes when there is no pattern in the schema', async function () {
        await this.book.enforce(this.alias.name, {
            string: 'value',
            schema: {
                pattern: undefined,
            },
        });
    });

    it('passes when the string matches the pattern', async function () {
        await this.book.enforce(this.alias.name, {
            string: 'ABC',
            schema: {
                pattern: '[A-Z]{3}',
            },
        });
    });

    it('throws when the string does not match the pattern', async function () {
        await expect(
            this.book.enforce(this.alias.name, {
                string: 'abc',
                schema: {
                    pattern: '[A-Z]{3}',
                },
            })
        ).to.be.rejectedWith(`'abc' does not match pattern /[A-Z]{3}/g`);
    });

    describe('Option: flags = i', function () {
        beforeEach(async function () {
            this.book = new Rulebook({
                rules: {
                    [ruleName]: {
                        required: 'must',
                        flags: 'i',
                    },
                },
            });
            await rule(this.book);
            await alias(this.book);
            this.alias = this.book.filter(ruleName).rules[0];
        });

        it('passes when the string matches case insensitive', async function () {
            await this.book.enforce(this.alias.name, {
                string: 'abc',
                schema: {
                    pattern: '[A-Z]{3}',
                },
            });
        });

        it('throws when the string does not match case insensitive', async function () {
            await expect(
                this.book.enforce(this.alias.name, {
                    string: 'ab1',
                    schema: {
                        pattern: '[A-Z]{3}',
                    },
                })
            ).to.be.rejectedWith(`'ab1' does not match pattern /[A-Z]{3}/i`);
        });

        it('restores the original config of the aliased rule', async function () {
            await expect(
                this.book.enforce(this.alias.name, {
                    string: 'ab1',
                    schema: {
                        pattern: '[A-Z]{3}',
                    },
                })
            ).to.be.rejectedWith(`'ab1' does not match pattern /[A-Z]{3}/i`);

            await expect(
                this.book.enforce(this.alias._alias, {
                    string: 'ab1',
                    schema: {
                        pattern: '[A-Z]{3}',
                    },
                })
            ).to.be.rejectedWith(`'ab1' does not match pattern /[A-Z]{3}/g`);
        });
    });
});
