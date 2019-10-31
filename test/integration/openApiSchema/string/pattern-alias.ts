import { Lawbook } from '../../../../src/lawbook';

export default (lawbook: Lawbook) => {
    return lawbook
        .add('openapi-schema/string/pattern-alias')
        .alias('openapi-schema/string/pattern');
};
