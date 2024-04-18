import { Rulebook } from '../../src/rulebook';

export interface RuleParameters {
    number: number;
    factor: number;
}

export default (rulebook: Rulebook<RuleParameters>) => {
    rulebook
        .add('is-devisible', {
            required: 'should',
            foo: 'bar',
        })
        .define(({ number, factor }) => {
            return number % factor === 0;
        })
        .punishment(({ number, factor }) => {
            throw new Error(`${number} is not devisible by ${factor}`);
        });
};
