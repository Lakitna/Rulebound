import * as sinon from 'sinon';

import Law from '../src/law';
import { expect } from 'chai';
import Lawbook from '../src/lawbook';
import { log } from '../src/log';

describe('The class Law', function() {
    it('initializes', function() {
        const law = new Law('foo', {} as Lawbook);

        expect(law).to.be.instanceOf(Law);
        expect(law.name).to.equal('foo');
    });

    describe('Config', function() {
        beforeEach(function() {
            this.law = new Law('foo', {} as Lawbook);
        });

        it('initializes with defaults', function() {
            expect(this.law._config).to.deep.equal({
                severity: 'must',
                _throw: 'error',
                _specificity: 0,
            });
        });

        it('sets the config', function() {
            const conf = {
                severity: null,
                foo: 'bar',
            };

            this.law.config = Object.assign({}, conf);

            expect(this.law.config).to.deep.equal(conf);
        });

        it('does not remove existing config when setting other values', function() {
            this.law.config = {
                foo: 'bar',
            };

            this.law.config = {
                fizz: 'buzz',
            };

            expect(this.law.config).to.deep.equal({
                severity: 'must',
                foo: 'bar',
                fizz: 'buzz',
            });
        });
    });

    describe('Definition', function() {
        beforeEach(function() {
            this.law = new Law('foo', {} as Lawbook);
        });

        it('throws an error when called before its set', function() {
            expect(this.law.on.enforce.name).to.equal('undefined');

            expect(this.law.on.enforce.bind(this.law))
                .to.throw('Law is undefined');
        });

        it('sets the defintion', function() {
            function noop() { return; }

            this.law.define(noop);

            expect(this.law.on.enforce.name).to.equal('definition');
        });

        it('returns the law object instance', function() {
            const ret = this.law.define(() => {});
            expect(ret).to.equal(this.law);
        });
    });

    describe('Punishment', function() {
        beforeEach(function() {
            this.law = new Law('foo', {} as Lawbook);
        });

        it('throws when called before its set with input', function() {
            expect(this.law.on.fail.name).to.equal('undefined');

            expect(this.law.on.fail.bind(this.law, 'bar'))
                .to.throw('');
        });

        it('throws when called with error before its set', function() {
            expect(this.law.on.fail.name).to.equal('undefined');

            expect(this.law.on.fail.bind(this.law, 'foo', new Error('foo')))
                .to.throw('foo');
        });

        it('sets the punishment', function() {
            function noop() { return; }

            this.law.punishment(noop);

            expect(this.law.on.fail.name).to.equal('punishment');
        });

        it('returns the law object instance', function() {
            const ret = this.law.punishment(() => {});
            expect(ret).to.equal(this.law);
        });
    });

    describe('Reward', function() {
        beforeEach(function() {
            this.law = new Law('foo', {} as Lawbook);
        });

        it('is a noop when called before its set', function() {
            expect(this.law.on.pass.name).to.equal('undefined');

            expect(this.law.on.pass)
                .to.not.throw();
        });

        it('sets the reward', function() {
            function noop() { return; }

            this.law.reward(noop);

            expect(this.law.on.pass.name).to.equal('reward');
        });

        it('returns the law object instance', function() {
            const ret = this.law.reward(() => {});
            expect(ret).to.equal(this.law);
        });
    });

    describe('Enforce', function() {
        beforeEach(function() {
            this.law = new Law('foo', {} as Lawbook);
        });

        it('does not check the law if the option _throw=null', function() {
            this.law.config = { _throw: null };

            this.law
                .define(() => false)
                .punishment(() => {
                    throw new Error('Enforce should not punish');
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('punishes when the definition returns false', function(done) {
            this.law
                .define(() => false)
                .punishment((input: any[], result: boolean) => {
                    expect(input).to.be.lengthOf(0);
                    expect(result).to.be.false;
                    done();
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('punishes when the definition throws an error', function(done) {
            this.law
                .define(() => {
                    throw new Error();
                })
                .punishment((input: any[], result: Error) => {
                    expect(input).to.be.lengthOf(0);
                    expect(result).to.be.instanceOf(Error);
                    done();
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('punishes when the definition returns an error message', function(done) {
            this.law
                .define(() => 'foo')
                .punishment((input: any[], result: string) => {
                    expect(input).to.be.lengthOf(0);
                    expect(result).to.equal('foo');
                    done();
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('punishes when the definition returns a promise resolving to false', function(done) {
            this.law
                .define(() => {
                    return new Promise((resolve, reject) => {
                        resolve(false);
                    });
                })
                .punishment((input: any[], result: boolean) => {
                    expect(input).to.be.lengthOf(0);
                    expect(result).to.be.false;
                    done();
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('punishes when the definition returns a promise that throws an error', function(done) {
            this.law
                .define(() => {
                    return new Promise((resolve, reject) => {
                        throw new Error();
                    });
                })
                .punishment((input: any[], result: Error) => {
                    expect(input).to.be.lengthOf(0);
                    expect(result).to.be.instanceOf(Error);
                    done();
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('punishes when the definition returns a promise resolving in an error message', function(done) {
            this.law
                .define(() => {
                    return new Promise((resolve, reject) => {
                        resolve('foo');
                    });
                })
                .punishment((input: any[], result: string) => {
                    expect(input).to.be.lengthOf(0);
                    expect(result).to.equal('foo');
                    done();
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                })
                .enforce();
        });

        it('rewards when the definitions returns true', function(done) {
            this.law
                .define(() => true)
                .punishment(() => {
                    throw new Error('Enforce should not punish');
                })
                .reward(() => {
                    done();
                })
                .enforce();
        });

        it('rewards when the definitions returns a promise resolving true', function(done) {
            this.law
                .define(() => {
                    return new Promise((resolve, reject) => {
                        resolve(true);
                    });
                })
                .punishment(() => {
                    throw new Error('Enforce should not punish');
                })
                .reward(() => {
                    done();
                })
                .enforce();
        });

        it('returns a promise containing the law object instance', function() {
            this.law
                .define(() => true)
                .enforce(true)
                .then((ret: Law) => {
                    expect(ret).to.equal(this.law);
                });
        });

        it('rethrows errors thrown by nested laws via the punishment of the parent law', function(done) {
            this.law
                .define(async () => {
                    await new Law('bar', {} as Lawbook)
                        .define(() => false)
                        .enforce();
                })
                .punishment((input: undefined, err: Error) => {
                    throw err;
                })
                .reward(() => {
                    throw new Error('Enforce should not reward');
                });

            this.law.enforce()
                .then(() => {
                    throw new Error('Expected error to be thrown')
                })
                .catch((err: any) => {
                    expect(err.law.name).to.equal('bar');
                    done();
                });
        });
    });

    describe.only('Throw', function() {
        beforeEach(function() {
            this.law = new Law('foo', {} as Lawbook)
                .define(() => false);

            this.log = log.withTag('foo');
        });

        it('throws an error when the option throw=error', function() {
            this.law.config = { _throw: 'error' };

            expect(this.law.throw.bind(this.law, 'bar'))
                .to.throw('bar');
        });

        it('logs an error when the options throw=warn', function(done) {
            // TODO Find out how to test logging

            this.log.mock((typeName: string) => typeName === 'warn' && sinon.mock());
            const logStub = this.log.warn as any;

            this.law.config = { _throw: 'warn' };
            this.law.throw('bar');

            console.log(logStub);
            console.log(logStub.callCount);

            expect(logStub.callCount).to.equal(1);
            expect(logStub.getCall(0).lastArg).to.equal('LawError | MUST | foo: bar');

            logStub.restore();

            // console.log(this.log);
            done();
        });

        it('logs when the options throw=log', function(done) {
            log.mock((typeName: string) => typeName === 'log' && sinon.stub());

            this.law.config = { _throw: 'log' };
            this.law.throw('bar');

            // expect(logStub.callCount).to.equal(1);
            // expect(logStub.getCall(0).lastArg).to.equal('LawError | MUST | foo: bar');

            // logStub.restore();
            done();
        });
    });
});
