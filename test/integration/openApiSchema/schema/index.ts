import { Rulebook } from '../../../../src/rulebook';
import { OasRuleParameters } from '../openapi-schema';

export default async (rulebook: Rulebook<OasRuleParameters>) => {
    const module = await import('./is-kown-type');
    await module.default(rulebook);
};
