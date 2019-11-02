import { expect } from 'chai';
import { Lawbook } from '../../../../../src/lawbook';
import law from './date-time';
import openapiSchemaStringFormatDate from './date';

const lawName = 'openapi-schema/string/format/date-time';

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

        // `openapi-schema/string/format/date` is used to validate the date
        // part of the date-time.
        await openapiSchemaStringFormatDate(this.book);
        this.law = this.book.filter(lawName).laws[0];
    });

    it('passes when the string is a valid date-time with timezone Z', async function() {
        await this.book.enforce(this.law.name, '2017-07-21T11:22:33Z');
    });

    it('passes when the string is a valid date-time with explicit timezone', async function() {
        await this.book.enforce(this.law.name, '2017-07-21T11:22:33+01:00');
    });

    it('fails when the string is a valid date', async function() {
        await expect(this.book.enforce(this.law.name, '2017-07-21'))
            .to.be.rejectedWith('is not valid date-time');
    });

    it('fails when the there is no timezone', async function() {
        await expect(this.book.enforce(this.law.name, '2017-07-21T11:22:33'))
            .to.be.rejectedWith('is not valid date-time');
    });

    it('fails when the date is invalid', async function() {
        await expect(this.book.enforce(this.law.name, '2017-21-07T11:22:33Z'))
            .to.be.rejectedWith('is not valid date-time');
    });

    it('fails when the time is invalid', async function() {
        await expect(this.book.enforce(this.law.name, '2017-07-21T30:22:33Z'))
            .to.be.rejectedWith('is not valid date-time');
    });
});
