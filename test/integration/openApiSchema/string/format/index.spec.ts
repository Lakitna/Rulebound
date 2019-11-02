import { expect } from 'chai';
import { Lawbook } from '../../../../../src/lawbook';
import law from '.';

const lawName = 'openapi-schema/string/format';

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

    it('has a default config', async function() {
        const book = new Lawbook();
        await law(book);

        expect(book.laws[0].config).to.deep.equal({
            required: 'should',
            allowUnkown: false,
        });
    });

    it('passes when the schema has no format', async function() {
        await this.book.enforce(this.law.name, 'foo', {
            format: undefined,
        });
    });

    it('enforces through a sub-law when the schema has a known format', async function() {
        await expect(this.book.enforce(this.law.name, 'foo', {
            format: 'date',
        }))
            .to.be.rejectedWith(`'foo' is not a valid date`);
    });

    it('fails when the schema has an unkown format', async function() {
        await expect(this.book.enforce(this.law.name, 'foo', {
            format: 'veryUnexpectedFormat',
        }))
            .to.be.rejectedWith(`Unkown format 'veryUnexpectedFormat'.`);
    });

    describe('Option: allowUnkown: true', function() {
        beforeEach(async function(this: any) {
            this.book = new Lawbook({
                laws: {
                    [lawName]: {
                        required: 'must',
                        allowUnkown: true,
                    },
                },
            });
            await law(this.book);
            this.law = this.book.filter(lawName).laws[0];
        });

        it('passes when the schema has an unkown format', async function() {
            await this.book.enforce(this.law.name, 'foo', {
                format: 'veryUnexpectedFormat',
            });
        });
    });
});
