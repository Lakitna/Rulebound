import { Rulebook } from '../../src/rulebook';

export default (rulebook: Rulebook) => {
    rulebook
        .add('is-devisible', {
            required: 'should',
            foo: 'bar',
        })
        .define((number, factor) => {
            return number % factor === 0;
        })
        .punishment((input) => {
            throw new Error(`${input[0]} is not devisible by ${input[1]}`);
        });
};
