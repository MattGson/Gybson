![Image of logo](./logo-small.png)

[![npm](https://img.shields.io/npm/v/gybson.svg)](https://www.npmjs.com/package/gybson)
[![GitHub tag](https://img.shields.io/github/tag/MattGson/Gybson.svg)](https://github.com/MattGson/Gybson)
[![TravisCI Build Status](https://travis-ci.org/SweetIQ/schemats.svg?branch=master)](https://travis-ci.org/SweetIQ/schemats)

Gybson is a type-safe, auto-generated query client for SQL databases (MySQL and PostgreSQL).
Gybson is optimised for super fast lazy loading using batching and caching which makes it perfect for GraphQL apps using Typescript.

### Why Gybson?

#### Type-safe

Gybson comes with full type safety out of the box so you know exactly what data goes in and out of your database.

#### Auto-generated

Gybson auto-generates a client from your database-schema. This means you don't have to defined complex types in code.
You can get started using Gybson in 5 minutes.

#### GraphQL optimized

Most ORMs are built for eager loading. Gybson is optimised for lazy loading meaning you can resolve deep GraphQL queries super-fast.
Gybson uses [dataloader](https://github.com/graphql/dataloader) under the hood to batch and cache (de-dupe) database requests returned data to minimise round trips.

#### Native support for soft-deletes

Managing soft deletes is hard but is a vital part of many apps. Gybson has native support for 
soft-deletes including automatically filtering out deleted rows.

![Image of demo](./demo.gif?raw=true)


### Simple example

If your schema is defined as

```sql
CREATE TABLE users (
    user_id INT AUTO_INCREMENT;
    username: VARCHAR NOT NULL;
    password: VARCHAR NOT NULL;
    last_logon: Date;
)
```

You can query:

```typescript
const id = await gybson.users.insert({
    values: {
        user_id: 300,
        username: 'name',
        password: 'secret',
        last_logon: new Date(),
    },
});

const user = await gybson.users.byUserId({ user_id: 31 });

/* user typed as:

 interface users {
   id: number;
   username: string;
   password: string;
   last_logon: Date | null;
 }

*/
```

## Quick Start

### Installing Gybson

```
npm i gybson --save
```

### Generating the client from your schema

Define a config file `gybson-config.json` to point to your database and output for generated files.

```json
{
    "host": "127.0.0.1",
    "port": 3306,
    "database": "users",
    "outdir": "./generated"
}
```

Run:

```
gybson generate
```

The above commands will generate the client for `users` database.
The resulting files are stored in `./generated`.

### Using with GraphQL

Add a new Gybson instance to your context for each request.

Note: It is important to attach a new instance per request to refresh the cache.

i.e with Apollo

```typescript
import Gybson from 'gybson';
import GybsonClient from './generated';

// initialise the client connection
Gybson.init({
    client: 'mysql',
    connection: {
        database: 'komodo',
        user: 'root',
        password: '',
    },
});

// attach a client instance to the context
new ApolloServer({
    context: async () => {
        return {
            gybson: GybsonClient(),
        };
    },
});
```

Then in your resolvers:

```typescript
// resolve a user query

Query: {
    user(parent, args, context, info) {
        return context.gybson.Users.byUserId({ user_id: args.id });
    }
}
```

## Prior Art

- [Knex.JS](http://knexjs.org/) - Gybson is build on top of the Knex query builder.
- [Schemats](https://github.com/SweetIQ/schemats) - The database introspection code was inspired by Schemats.
- [Dataloader](https://github.com/graphql/dataloader) - Gybson uses dataloader to perform batching and de-duplication.