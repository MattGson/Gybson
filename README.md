![Image of logo](https://github.com/MattGson/Gybson/blob/master/logo-small.png?raw=true)

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
Gybson uses [dataloader](https://github.com/graphql/dataloader) under the hood to batch and cache (de-dupe) database requests to minimise round trips.

#### Native support for soft-deletes

Managing soft deletes is hard but is a vital part of many apps. Gybson has native support for 
soft-deletes including automatically filtering out deleted rows.


![Image of demo](https://github.com/MattGson/Gybson/blob/master/demo.gif?raw=true)


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

### API

#### Loaders
Loaders are methods for each table that allow super fast batched and de-duped loads on key columns.
Loader methods are generated for each unique and non-unique key combination.

Unique key loaders return a single record or null
```typescript

const user = await gybson.Users.byUserId({ user_id: 1 });

// Return type: user | null

```
Non-Unique key loaders return an array of records. These loaders allow an order to be specified.
```typescript

const user = await gybson.Post.byUserId({ 
    user_id: 1, 
    orderBy: {
        first_name: 'asc'
    } 
});

// Return type: post[]

```
Loaders are generated for unique and non-unique key combinations as well
```typescript

const user = await gybson.Post.byTagIdAndTopicId({ tag_id: 1, topic_id: 4 });

// Return type: post[]
```

#### findMany
`findMany` loads many rows from a table. It provides a flexible query API whilst maintaining full type safety.
Due to this flexibility, `findMany` does not perform batching or caching.

Example: Find all users where:
 - The first name is 'John'
 - The last name does NOT start with 'P',
 - The age is less than 20
 - The favourite Pet is either a 'dog' or a 'cat'
 - Order by first_name and last_name descending.
```typescript

const users = await gybson.Users.findMany({ 
    where: {
        first_name: 'John',
        NOT: [
            { 
                last_name: {
                    startsWith: 'P'
                }
            }
        ],
        last_name: {
            NOT: [
                { startsWith: 'P' }
            ]
        },
        age: {
            lt: 20
        },
        OR: [
            { favourite_pet: 'dog' },
            { favourite_pet: 'cat' }
        ]
    },
    orderBy: {
        first_name: 'desc',
        last_name: 'desc'
    }
});

// Return type: user[]
```


#### insert
Inserts one or more rows into the database. This will automatically apply DEFAULT values for any 
columns that are undefined.

```typescript

const users = await gybson.Users.insert({ 
    values: [
        {
            first_name: 'John',
            age: 25,
            last_name: 'Doe'
        },
        {
            first_name: 'Jane',
            age: 30,
            last_name: 'Doe'
        },
    ]
});
```

#### upsert
Inserts multiple row into the database. If a row already exists with the primary key, the row will be updated.
You can specify which columns you want to update in this case.
You can also specify whether to reinstate (remove soft delete) on a row that has previously been soft-deleted.

```typescript

const users = await gybson.Users.upsert({ 
    values: [
        {
            first_name: 'John',
            age: 25,
            last_name: 'Doe'
        },
        {
            first_name: 'Jane',
            age: 30,
            last_name: 'Doe'
        },
    ],
    updateColumns: {
        age: true
    },
    reinstateSoftDeletedRows: true
});
```

#### update
Update rows that match a `where` filter.
All the `where` options from `findMany` are also available here.


```typescript

const users = await gybson.Users.update({ 
    values: {
        first_name: 'Joe',
        age: 25,
    },
    where: {
        user_id: {
            not: 5
        }
    }
});
```

#### softDelete
This is a shortcut to soft delete rows rather than using update.
It will set the soft-delete column to true and cause the row to be filtered from future queries.
This allows the same `where` options as `update` and `findMany`.

```typescript

const users = await gybson.Users.softDelete({ 
    where: {
        user_id: {
            not: 5
        }
    }
});
```

#### transaction
Use `transaction` to run a set of queries as a single atomic query. This means if any
of the queries fail then none of the changes will be committed. You can include a query in
the transaction by passing in the `connection` argument.

```typescript

import { transaction } from 'gybson';

const newUser = await transaction(async (connection) => {

    const users = await gybson.Users.softDelete({ 
        connection,
        where: {
            user_id: 1
        }
    });
    return await gybson.Users.insert({
        connection,
        values: [
            { first_name: 'Steve' }
        ]
    });

});
```
## Prior Art

- [Knex.JS](http://knexjs.org/) - Gybson is build on top of the Knex query builder.
- [Schemats](https://github.com/SweetIQ/schemats) - The database introspection code was inspired by Schemats.
- [Dataloader](https://github.com/graphql/dataloader) - Gybson uses dataloader to perform batching and de-duplication.