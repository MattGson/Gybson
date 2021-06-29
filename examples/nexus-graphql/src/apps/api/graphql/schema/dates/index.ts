import { GraphQLDate, GraphQLDateTime, GraphQLTime } from 'graphql-iso-date';
import { arg, asNexusMethod, core } from 'nexus';

export const Date = asNexusMethod(GraphQLDate, 'date');
export const DateTime = asNexusMethod(GraphQLDateTime, 'datetime');
export const Time = asNexusMethod(GraphQLTime, 'time');
export const dateTimeArg = (opts: core.NexusArgConfig<'DateTime'>) =>
    arg({ ...opts, type: 'DateTime' });
