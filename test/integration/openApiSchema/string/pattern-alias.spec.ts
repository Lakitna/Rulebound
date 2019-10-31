import { expect } from 'chai';
import { Lawbook } from '../../../../src/lawbook';
import law from './pattern';
import alias from './pattern-alias';

const lawName = 'openapi-schema/string/pattern-alias';

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
        await alias(this.book);
        this.alias = this.book.filter(lawName).laws[0];
    });

    it('has a default config', function() {
        const book = new Lawbook();
        law(book);

        expect(book.laws[0].config).to.deep.equal({
            required: 'must',
            flags: 'g',
        });
    });

    it('passes when there is no pattern in the schema', async function() {
        await this.book.enforce(this.alias.name, 'value', {
            pattern: undefined,
        });
    });

    it('passes when the string matches the pattern', async function() {
        await this.book.enforce(this.alias.name, 'ABC', {
            pattern: '[A-Z]{3}',
        });
    });

    it('throws when the string does not match the pattern', async function() {
        await expect(this.book.enforce(this.alias.name, 'abc', {
            pattern: '[A-Z]{3}',
        })).to.be.rejectedWith(`'abc' does not match pattern /[A-Z]{3}/g`);
    });

    // TODO: Pass config of alias to target law
    // eslint-disable-next-line mocha/no-setup-in-describe
    describe.skip('Option: flags = i', function() {
        beforeEach(async function(this: any) {
            this.book = new Lawbook({
                laws: {
                    [lawName]: {
                        required: 'must',
                        flags: 'i',
                    },
                },
            });
            await law(this.book);
            await alias(this.book);
            this.alias = this.book.filter(lawName).laws[0];
        });

        it('passes when the string matches case insensitive', async function() {
            await this.book.enforce(this.alias.name, 'abc', {
                pattern: '[A-Z]{3}',
            })
        });

        it('throws when the string does not match case insensitive', async function() {
            await expect(this.book.enforce(this.alias.name, 'ab1', {
                pattern: '[A-Z]{3}',
            })).to.be.rejectedWith(`'ab1' does not match pattern /[A-Z]{3}/i`)
        });
    });
});
