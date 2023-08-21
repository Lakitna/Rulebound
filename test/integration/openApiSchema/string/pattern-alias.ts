import { OasRuleParametersString } from '.';
import { Rulebook } from '../../../../src/rulebook';

export default (rulebook: Rulebook<OasRuleParametersString>) => {
    return rulebook
        .add('openapi-schema/string/pattern-alias')
        .alias('openapi-schema/string/pattern');
};
