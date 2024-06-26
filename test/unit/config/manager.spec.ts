import { expect } from 'chai';
import { GlobSpecificity, globSpecificity } from 'glob-specificity';
import { cloneDeep } from 'lodash-es';
import { ruleConfigDefault, rulebookConfigDefault } from '../../../src/config/defaults';
import { ConfigManager } from '../../../src/config/manager';

describe('The class ConfigManager', function () {
    it('initializes', function () {
        const manager = new ConfigManager();

        expect(manager.config).to.deep.equal(
            Object.assign({}, rulebookConfigDefault, {
                // Fields added by parsing
                _rules: [],
            })
        );
        expect(manager.full).to.deep.equal(rulebookConfigDefault);
    });

    describe('getters', function () {
        beforeEach(function () {
            this.manager = new ConfigManager(rulebookConfigDefault);
        });

        describe('getter full', function () {
            it('returns the full config', function () {
                expect(this.manager.full).to.deep.equal(rulebookConfigDefault);
            });
        });

        describe('getter rules', function () {
            it('returns the config for all the rules', function () {
                expect(this.manager.rules).to.deep.equal([]);
            });
        });

        describe('getter generic', function () {
            it('returns the config for everything except the rules', function () {
                expect(this.manager.generic).to.deep.equal({
                    verboseness: 'info',
                    enforceParallel: false,
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

    describe('set', function () {
        beforeEach(function () {
            this.manager = new ConfigManager(rulebookConfigDefault);
        });

        it('overwrites the config after initialization', function () {
            expect(this.manager.generic.verboseness).to.equal('info');

            this.manager.set({ verboseness: 'error' });

            expect(this.manager.generic.verboseness).to.equal('error');
        });

        it('re-parses the rule configs', function () {
            this.manager.set({
                rules: {
                    'foo-bar': { a: 'b' },
                    'foo-*': { b: 'c' },
                },
            });

            expect(this.manager.rules[0].b).to.equal('c');
            expect(this.manager.rules[0]._name).to.equal('foo-*');

            expect(this.manager.rules[1].a).to.equal('b');
            expect(this.manager.rules[1].b).to.equal('c');
            expect(this.manager.rules[1]._name).to.equal('foo-bar');
        });
    });

    describe('get', function () {
        beforeEach(function () {
            const config = cloneDeep(rulebookConfigDefault);
            config.rules['bar-*'] = { bar: 2 } as any;
            config.rules['foo-bar'] = { bar: 4 } as any;
            config.rules['foo-bar-*'] = { bar: 8, foo: true } as any;
            config.rules['foo-bar-fizz-buzz'] = { bar: 16 } as any;

            this.manager = new ConfigManager(config);
        });

        it('gets the config of a specific rule with its own config', function () {
            const config = this.manager.get('foo-bar');
            expect(config.bar).to.equal(4);
            expect(config._name).to.equal('foo-bar');
        });

        it('gets the config of a specific rule with a shared config', function () {
            const config = this.manager.get('bar-fizz-buzz');
            expect(config.bar).to.equal(2);
            expect(config._name).to.equal('bar-*');
        });

        it('gets the most specific config available', function () {
            const config = this.manager.get('foo-bar-fizz-buzz');
            expect(config.bar).to.equal(16);
            expect(config.foo).to.equal(true);
            expect(config._name).to.equal('foo-bar-fizz-buzz');
        });

        it("gets the most specific config available when there's no exact match", function () {
            const config = this.manager.get('foo-bar-fizz');
            expect(config.bar).to.equal(8);
            expect(config.foo).to.equal(true);
            expect(config._name).to.equal('foo-bar-*');
        });

        it('gets the default config where there is none available', function () {
            const config = this.manager.get('lorum-ipsum');
            expect(config).to.deep.equal(ruleConfigDefault);
        });
    });

    describe('_sortBySpecificity', function () {
        beforeEach(function () {
            this.manager = new ConfigManager();
        });

        it('sorts an array of objects by a delimited key string', function () {
            const unordered = [
                'somewhat/specific',
                'unspecific',
                'actually/quite/specific',
                'somewhat/specific',
            ].map((glob) => {
                return {
                    _name: glob,
                    _specificity: globSpecificity(glob),
                };
            });

            const expectedOrder = [
                'unspecific',
                'somewhat/specific',
                'somewhat/specific',
                'actually/quite/specific',
            ];

            const sorted = this.manager._sortBySpecificity(unordered);

            sorted.forEach((object: any, index: number) => {
                expect(object._name).to.equal(expectedOrder[index]);
            });
        });
    });

    describe('parse', function () {
        beforeEach(function () {
            this.manager = new ConfigManager();
        });

        it('parses a single rule', function () {
            const config = this.manager.parse({
                rules: {
                    foo: { bar: true },
                },
                _rules: [],
            });

            expect(config.rules).to.be.empty;
            expect(config._rules).to.be.lengthOf(1);
            expect(config._rules[0]).to.deep.equal({
                bar: true,
                _name: 'foo',
                _specificity: new GlobSpecificity(2, 0, 0, 0, 0),
            });
        });

        it('cascades rule config based on specificity', function () {
            const config = this.manager.parse({
                _rules: [],
                rules: {
                    'foo-*': { bar: true },
                    'foo-bar': { fizz: 12 },
                    'foo-buzz': { buzz: 'lorum' },
                },
            });

            expect(config.rules).to.be.empty;
            expect(config._rules).to.be.lengthOf(3);
            expect(config._rules[0]).to.deep.equal({
                bar: true,
                _name: 'foo-*',
                _specificity: new GlobSpecificity(2, -1, 0, 0, 0),
            });
            expect(config._rules[1]).to.deep.equal({
                bar: true,
                fizz: 12,
                _name: 'foo-bar',
                _specificity: new GlobSpecificity(2, 0, 0, 0, 0),
            });
            expect(config._rules[2]).to.deep.equal({
                bar: true,
                buzz: 'lorum',
                _name: 'foo-buzz',
                _specificity: new GlobSpecificity(2, 0, 0, 0, 0),
            });
        });

        it('updates the config of a single existing rule', function () {
            const config = this.manager.parse({
                _rules: [
                    {
                        _name: 'foo',
                        _specificity: new GlobSpecificity(2, 0, 0, 0, 0),
                        existing: 'val',
                        overwritten: false,
                    },
                    {
                        _name: 'foo-bar',
                        _specificity: new GlobSpecificity(2, 0, 0, 0, 0),
                    },
                ],
                rules: {
                    foo: { bar: true, overwritten: true },
                },
            });

            expect(config.rules).to.be.empty;
            expect(config._rules).to.be.lengthOf(2);
            expect(config._rules[0]).to.deep.equal({
                _name: 'foo',
                _specificity: new GlobSpecificity(2, 0, 0, 0, 0),
                existing: 'val',
                overwritten: true,
                bar: true,
            });
            expect(config._rules[1]).to.deep.equal({
                _name: 'foo-bar',
                _specificity: new GlobSpecificity(2, 0, 0, 0, 0),
            });
        });

        it('updates the config of a multiple existing rules', function () {
            const config = this.manager.parse({
                _rules: [
                    {
                        _name: 'foo-buzz',
                        _specificity: new GlobSpecificity(2, 0, 0, 0, 0),
                    },
                    {
                        _name: 'foo-bar',
                        _specificity: new GlobSpecificity(2, 0, 0, 0, 0),
                    },
                    {
                        _name: 'fizz',
                        _specificity: new GlobSpecificity(2, 0, 0, 0, 0),
                    },
                ],
                rules: {
                    'foo-*': { overwritten: true },
                },
            });

            expect(config.rules).to.be.empty;
            expect(config._rules).to.be.lengthOf(4);
            expect(config._rules[0]).to.deep.equal({
                _name: 'foo-*',
                _specificity: new GlobSpecificity(2, -1, 0, 0, 0),
                overwritten: true,
            });
            expect(config._rules[1]).to.deep.equal({
                _name: 'fizz',
                _specificity: new GlobSpecificity(2, 0, 0, 0, 0),
            });
            expect(config._rules[2]).to.deep.equal({
                _name: 'foo-bar',
                _specificity: new GlobSpecificity(2, 0, 0, 0, 0),
                overwritten: true,
            });
            expect(config._rules[3]).to.deep.equal({
                _name: 'foo-buzz',
                _specificity: new GlobSpecificity(2, 0, 0, 0, 0),
                overwritten: true,
            });
        });
    });
});
