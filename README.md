[![Image of logo](https://github.com/MattGson/Gybson/blob/master/logo-small.png?raw=true)](https://mattgson.github.io/Gybson/)

[![npm](https://img.shields.io/npm/v/gybson.svg?style=for-the-badge)](https://www.npmjs.com/package/gybson)
[![GitHub tag](https://img.shields.io/github/tag/MattGson/Gybson.svg?style=for-the-badge)](https://github.com/MattGson/Gybson)
[![TravisCI Build Status](https://img.shields.io/travis/MattGson/Gybson/master?style=for-the-badge)](https://travis-ci.org/github/MattGson/Gybson)
[![Star on GitHub][github-star-badge]][github-star-link]
[![Github last commit][last-commit]][last-commit-link]
[![Pull Requests Welcome][prs-badge]][prs-link]

[github-star-badge]: https://img.shields.io/github/last-commit/MattGson/Gybson.svg?style=for-the-badge&logo=github&logoColor=ffffff
[github-star-link]: https://github.com/MattGson/Gybson/stargazers
[last-commit]: https://img.shields.io/github/stars/MattGson/Gybson.svg?style=for-the-badge&logo=github&logoColor=ffffff
[last-commit-link]: https://github.com/MattGson/Gybson/commits
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge
[prs-link]: https://github.com/MattGson/Gybson

> **Maximise developer productivity when building _GraphQL_ apps in _Typescript!_**


[Gybson](https://mattgson.github.io/Gybson/) is a type-safe, auto-generated Node.js query client (light-weight ORM) for working with SQL databases in Typescript.

Optimized for super fast lazy loading, using batching and caching, which makes it perfect for GraphQL apps.

Gybson is built on top of trusted open-source projects:
 - [Knex](https://github.com/knex/knex)
 - [DataLoader](https://github.com/graphql/dataloader)
 
Works with MySQL and PostgreSQL.

Full docs [here](https://mattgson.github.io/Gybson/)

### Why Gybson?

Gybson was created to make working with relational databases in Typescript as productive as possible.

The core principle of Gybson is **Make the easiest thing to do, the right thing to do**. 

Just run `gybson generate` and you have a full typescript database client created for your exact schema. 

---

### Key features:

#### IDE Auto-completion

You can maximise developer efficiency with auto-completion in any IDE.

![Image of demo](https://github.com/MattGson/Gybson/blob/master/demo.gif?raw=true)

#### Type-safe

Gybson comes with automated type safety out of the box so you know exactly what data goes in and out of your database. Types are generated directly from your database schema.

#### Auto-generated

Unlike most ORMs you don't have to define complex types in code. You can get started using Gybson in 5 minutes and work purely with plain JavaScript objects.

#### GraphQL optimized

Gybson uses [dataloader](https://github.com/graphql/dataloader) under the hood to batch and cache (de-dupe) database requests to minimise round trips.

#### SQL developer friendly

Gybson uses standard SQL terms where possible and offers a flexible query API including `filtering on relations`.

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
        username: 'name',
        password: 'secret',
        last_logon: new Date(),
    },
});

const user = await gybson.users.loadOne({ where: { user_id: id } });

/* 
 {
   user_id: 1;
   username: 'name';
   password: 'secret';
   last_logon: '2020-10-21T09:00:00';
 }
*/
```

### Using with GraphQL

Add a new Gybson instance to your context for each request.

i.e with Apollo

```typescript
import GybsonClient from './generated';

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
        return context.gybson.Users.loadOne({ where: { user_id: args.id } });
    }
}
```

## Prior Art

-   [Knex.JS](http://knexjs.org/) - Gybson is build on top of the Knex query builder.
-   [Schemats](https://github.com/SweetIQ/schemats) - The database introspection code was inspired by Schemats.
-   [Dataloader](https://github.com/graphql/dataloader) - Gybson uses dataloader to perform batching and de-duplication.
-   [Prisma](https://github.com/graphql/dataloader) - The Gybson filtering API was inspired by prisma-client-js.
