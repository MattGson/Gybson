import _ from 'lodash';

export const PascalCase = (name: string): string => {
    return _.upperFirst(_.camelCase(name));
};
