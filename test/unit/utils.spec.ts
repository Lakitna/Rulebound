import { expect } from 'chai';
import { specificity } from '../../src/utils';

describe('Util functions', function() {
    describe('specificity', function() {
        it('determines specificity by the amount of delimiters + 1', function() {
            expect(specificity(''), '').to.equal(1);
            expect(specificity('HelloWorld'), 'HelloWorld').to.equal(1);
            expect(specificity('Hello World'), 'Hello World').to.equal(2);
            expect(specificity(' '), ' ').to.equal(2);
            expect(specificity('--'), '--').to.equal(3);
            expect(specificity('@'), '@').to.equal(2);
            expect(specificity('#'), '#').to.equal(2);
            expect(specificity('$'), '$').to.equal(2);
            expect(specificity('%'), '%').to.equal(2);
            expect(specificity('^'), '^').to.equal(2);
            expect(specificity('&'), '&').to.equal(2);
            expect(specificity('+'), '+').to.equal(2);
            expect(specificity('='), '=').to.equal(2);
            expect(specificity('`'), '`').to.equal(2);
            expect(specificity('~'), '~').to.equal(2);
            expect(specificity('\''), '\'').to.equal(2);
            expect(specificity('"'), '"').to.equal(2);
            expect(specificity('|'), '|').to.equal(2);
            expect(specificity('\\'), '\\').to.equal(2);
            expect(specificity('>'), '>').to.equal(2);
            expect(specificity('<'), '<').to.equal(2);
            expect(specificity('.'), '.').to.equal(2);
            expect(specificity(','), ',').to.equal(2);
            expect(specificity(':'), ':').to.equal(2);
            expect(specificity(';'), ';').to.equal(2);
        });

        it('does not count a delimiter directly followed by a `*` wildcard', function() {
            expect(specificity('foo-*')).to.equal(1);
            expect(specificity('foo-*-bar')).to.equal(2);
        });

        it('counts a delimiter directly followed by a `?` wildcard', function() {
            expect(specificity('foo-?')).to.equal(2);
            expect(specificity('foo-?-bar')).to.equal(3);
        });
    });
});
