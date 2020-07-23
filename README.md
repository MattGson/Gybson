# Gybson

[![npm](https://img.shields.io/npm/v/schemats.svg)](https://www.npmjs.com/package/schemats)
[![GitHub tag](https://img.shields.io/github/tag/SweetIQ/schemats.svg)](https://github.com/SweetIQ/schemats)
[![TravisCI Build Status](https://travis-ci.org/SweetIQ/schemats.svg?branch=master)](https://travis-ci.org/SweetIQ/schemats)
[![Coverage Status](https://coveralls.io/repos/github/SweetIQ/schemats/badge.svg?branch=coverage)](https://coveralls.io/github/SweetIQ/schemats?branch=coverage)

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
Loads are batched and cached to minimise round trips to the database and reduce joins.

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
// this insert is type checked against the db schema
const id = await gybson.users.insert({
    values: {
        user_id: 300,
        username: 'name',
        password: 'secret',
        last_logon: new Date(),
    },
});

// load methods are generated for all keys fields
const user = await gybson.users.byUserId(300);

// user typed as
interface users {
    id: number;
    username: string;
    password: string;
    last_logon: Date | null;
}
```

## Quick Start

### Installing Gybson

```
npm i gybson
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

i.e with Apollo

```typescript
new ApolloServer({
    context: async () => {
        return {
            gybson: Gybson(),
        };
    },
});
```

Then in your resolvers:

```typescript
// resolve a user query

Query: {
    user(parent, args, context, info) {
        return context.gybson.Users.byUserId(args.id);
    }
}
```

#### Resolving a nested query example:

```graphql
{
    me {
        name
        friends(first: 5) {
            name
            bestFriend {
                name
            }
        }
    }
}
```

If we just naively query for each object then we could execute potentially 12 database requests:

```sql
/* Get me and my friends list */
SELECT * FROM users WHERE user_id = ME;
SELECT * FROM friends WHERE from_id = ME;

/* Need to resolve each of the five friends */
SELECT * FROM users WHERE user_id = FRIEND1;
SELECT * FROM users WHERE user_id = FRIEND2;
SELECT * FROM users WHERE user_id = FRIEND3;
SELECT * FROM users WHERE user_id = FRIEND4;
SELECT * FROM users WHERE user_id = FRIEND5;

/* Need to get the best friend for each friend */
SELECT * FROM users WHERE best_friend_id = FRIEND1.bestfriend;
SELECT * FROM users WHERE best_friend_id = FRIEND2.bestfriend;
SELECT * FROM users WHERE best_friend_id = FRIEND3.bestfriend;
SELECT * FROM users WHERE best_friend_id = FRIEND4.bestfriend;
SELECT * FROM users WHERE best_friend_id = FRIEND5.bestfriend;

```

Gybson uses [dataloader](https://github.com/graphql/dataloader) under the hood to batch database requests and cache returned data.
Executing the same GraphQL query with Gybson can be done like:

```typescript

// Note this is pseudo code approximating graphql resolvers

(me) => gybson.Users.byUserId(me.id);

(friends) => {
    const friends_list = await gybson.Friends.byFromId(me.id);
    return friends_list.map((row) => gybson.Users.byUserId(row.toId));
};

(best_friend) => gybson.Users.byUserId(user.best_friend_id);
```

This results in the following SQL:

```SQL
SELECT * FROM users WHERE user_id IN (ME);
SELECT * FROM friends WHERE from_id IN (ME);

SELECT * FROM users WHERE user_id IN (FRIEND1, FRIEND2, FRIEND3, FRIEND4, FRIEND5);
SELECT * FROM users WHERE user_id IN (FRIEND1.best_friend_id, FRIEND2.best_friend_id, ...);
```

We've cut down the number of queries to just 4. This effect amplifies greatly as the depth of the query tree increases.

With generated type definition for our database schema, we can write code with autocompletion and static type checks.

<p align="center">
<img align="center" src="https://github.com/SweetIQ/schemats/raw/master/demo.gif" width="100%" alt="demo 1"/>
</p>
<p align="center">
<img align="center" src="https://github.com/SweetIQ/schemats/raw/master/demo2.gif" width="100%" alt="demo 2"/>
</p>