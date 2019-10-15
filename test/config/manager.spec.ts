import { expect } from 'chai';
import { lawbookConfigDefault } from '../../src/config/defaults';
import { ConfigManager } from '../../src/config/manager';


describe('The class ConfigManager', function() {
    it('initializes', function() {
        const manager = new ConfigManager();

        expect(manager.config).to.deep.equal(Object.assign(
            lawbookConfigDefault,
            {
                // Fields added by parsing
                _laws: [],
            }
        ));
        expect(manager.full).to.deep.equal(manager.config);
    });

    describe('getters', function() {
        beforeEach(function() {
            this.manager = new ConfigManager(lawbookConfigDefault);
        });

        describe('getter full', function() {
            it('returns the full config', function() {
                expect(this.manager.full).to.deep.equal(lawbookConfigDefault);
            });
        });

        describe('getter laws', function() {
            it('returns the config for all the laws', function() {
                expect(this.manager.laws).to.deep.equal([]);
            });
        });

        describe('getter generic', function() {
            it('returns the config for everything except the laws', function() {
                expect(this.manager.generic).to.deep.equal({
                    verboseness: 'info',
                    severity: {
                        must: 'error',
                        should: 'warn',
                        may: 'info',
                        optional: 'info',
                    },
                });
            });
        });
    });

    describe('set', function() {
        beforeEach(function() {
            this.manager = new ConfigManager(lawbookConfigDefault);
        });

        it('overwrites the config after initialization', function() {
            expect(this.manager.generic.verboseness).to.equal('info');

            this.manager.set({ verboseness: 'error' });

            expect(this.manager.generic.verboseness).to.equal('error');
        });

        it('re-parses the law configs', function() {
            this.manager.set({
                laws: {
                    'foo-bar': { a: 'b' },
                    'foo-*': { b: 'c' },
                },
            });

            expect(this.manager.laws[0].b).to.equal('c');
            expect(this.manager.laws[0]._name).to.equal('foo-*');

            expect(this.manager.laws[1].a).to.equal('b');
            expect(this.manager.laws[1].b).to.equal('c');
            expect(this.manager.laws[1]._name).to.equal('foo-bar');
        });
    });

    describe('get', function() {
        beforeEach(function() {
            const config = lawbookConfigDefault;
            config.laws['bar-*'] = { bar: 2 } as any;
            config.laws['foo-bar'] = { bar: 4 } as any;
            config.laws['foo-bar-*'] = { bar: 8 } as any;
            config.laws['foo-bar-fizz-buzz'] = { bar: 16 } as any;

            this.manager = new ConfigManager(config);
        });

        it('gets the config of a specific law with its own config', function() {
            const config = this.manager.get('foo-bar');
            expect(config.bar).to.equal(4);
            expect(config._name).to.equal('foo-bar');
        });

        it('gets the config of a specific law with a shared config', function() {
            const config = this.manager.get('bar-fizz-buzz');
            expect(config.bar).to.equal(2);
            expect(config._name).to.equal('bar-*');
        });

        it('gets the most specific config available', function() {
            const config = this.manager.get('foo-bar-fizz-buzz');
            expect(config.bar).to.equal(16);
            expect(config._name).to.equal('foo-bar-fizz-buzz');
        });

        it('gets an empty config where there is none available', function() {
            const config = this.manager.get('lorum-ipsum');
            expect(config).to.deep.equal({
                _name: '*',
                _specificity: 0,
            });
        });
    });

    describe('_sortBySpecificity', function() {
        beforeEach(function() {
            this.manager = new ConfigManager();
        });

        it('sorts an array of objects by a delimited key string', function() {
            const unordered = [
                { key: 'somewhat-specific' },
                { key: 'unspecific' },
                { key: 'actually-quite-specific' },
                { key: 'somewhat-specific' },
            ];

            const expectedOrder = [
                'unspecific',
                'somewhat-specific',
                'somewhat-specific',
                'actually-quite-specific',
            ];

            const sorted = this.manager._sortBySpecificity(unordered, 'key');

            sorted.forEach((o: any, i: number) => {
                expect(o.key).to.equal(expectedOrder[i]);
            });
        });
    });

    describe('parse', function() {
        beforeEach(function() {
            this.manager = new ConfigManager();
        });

        it('parses a single law', function() {
            const config = this.manager.parse({
                laws: {
                    foo: { bar: true },
                },
                _laws: [],
            });

            expect(config.laws).to.be.empty;
            expect(config._laws).to.be.lengthOf(1);
            expect(config._laws[0]).to.deep.equal({
                bar: true,
                _name: 'foo',
                _specificity: 1,
            });
        });

        it('cascades law config based on specificity', function() {
            const config = this.manager.parse({
                _laws: [],
                laws: {
                    'foo-*': { bar: true },
                    'foo-bar': { fizz: 12 },
                    'foo-buzz': { buzz: 'lorum' },
                },
            });

            expect(config.laws).to.be.empty;
            expect(config._laws).to.be.lengthOf(3);
            expect(config._laws[0]).to.deep.equal({
                bar: true,
                _name: 'foo-*',
                _specificity: 1,
            });
            expect(config._laws[1]).to.deep.equal({
                bar: true,
                fizz: 12,
                _name: 'foo-bar',
                _specificity: 2,
            });
            expect(config._laws[2]).to.deep.equal({
                bar: true,
                buzz: 'lorum',
                _name: 'foo-buzz',
                _specificity: 2,
            });
        });

        it('updates the config of a single existing law', function() {
            const config = this.manager.parse({
                _laws: [{
                    _name: 'foo',
                    _specificity: 1,
                    existing: 'val',
                    overwritten: false,
                }, {
                    _name: 'foo-bar',
                    _specificity: 2,
                }],
                laws: {
                    foo: { bar: true, overwritten: true },
                },
            });

            expect(config.laws).to.be.empty;
            expect(config._laws).to.be.lengthOf(2);
            expect(config._laws[0]).to.deep.equal({
                _name: 'foo',
                _specificity: 1,
                existing: 'val',
                overwritten: true,
                bar: true,
            });
            expect(config._laws[1]).to.deep.equal({
                _name: 'foo-bar',
                _specificity: 2,
            });
        });

        it('updates the config of a multiple existing laws', function() {
            const config = this.manager.parse({
                _laws: [{
                    _name: 'foo-buzz',
                    _specificity: 2,
                }, {
                    _name: 'foo-bar',
                    _specificity: 2,
                }, {
                    _name: 'fizz',
                    _specificity: 1,
                }],
                laws: {
                    'foo-*': { overwritten: true },
                },
            });

            expect(config.laws).to.be.empty;
            expect(config._laws).to.be.lengthOf(4);
            expect(config._laws[0]).to.deep.equal({
                _name: 'fizz',
                _specificity: 1,
            });
            expect(config._laws[1]).to.deep.equal({
                _name: 'foo-*',
                _specificity: 1,
                overwritten: true,
            });
            expect(config._laws[2]).to.deep.equal({
                _name: 'foo-buzz',
                _specificity: 2,
                overwritten: true,
            });
            expect(config._laws[3]).to.deep.equal({
                _name: 'foo-bar',
                _specificity: 2,
                overwritten: true,
            });
        });
    });
});
