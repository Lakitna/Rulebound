import { Rulebook } from '../../../../src/rulebook';

export default (rulebook: Rulebook) => {
    return rulebook
        .add('openapi-schema/string/pattern-alias')
        .alias('openapi-schema/string/pattern');
};
