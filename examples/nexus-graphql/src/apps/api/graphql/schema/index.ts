import * as MutationSchema from './mutation.schema';
import * as AccountsSchema from './mutation.schema';
import * as Dates from './dates/index';
import {schemaConfig} from './schema.config';

import {makeSchema, objectType} from 'nexus';


const Query = objectType({
    name: 'Query',
    definition(_t): void {},
});
const Mutation = objectType({
    name: 'Mutation',
    definition(_t): void {},
});

export default makeSchema({
    types:  [Query, Mutation, Dates, MutationSchema, AccountsSchema],
    ...schemaConfig,
});
