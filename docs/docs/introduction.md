---
id: introduction
title: Intro
hide_title: true
sidebar_label: Introduction
---

![Image of logo](https://github.com/MattGson/Gybson/blob/master/logo-small.png?raw=true)

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

Gybson is a type-safe, auto-generated Node.js query client (light-weight ORM) for working with SQL databases in Typescript.

Gybson is optimized for super fast lazy loading, using batching and caching, which makes it perfect for GraphQL apps.

Gybson is built on top of trusted open-source projects:
 - [Knex](https://github.com/knex/knex)
 - [DataLoader](https://github.com/graphql/dataloader)
 
Gybson is designed to work with MySQL and PostgreSQL databases.

:::note

PostgreSQL support is currently in progress!

:::

## Why Gybson?

Gybson was created to make working with relational databases in Typescript as productive as possible.

The core principle of Gybson is **Make the easiest thing to do, the right thing to do**. 

Just run `gybson generate` and you have a fully type-safe database client created for your exact schema. 

**Ex.** "I want to get a user with the email abc@testemail.com"

In gybson:

```typescript
const user: users = await gybson.Users.oneByEmail({ email: 'abc@testemail.com' });
```
This method:
 - Is the first option in `IDE auto-completion` when typing "gybson.Users.emai..."
 - Makes sure the `email` argument passed is a `string` type.
 - Performs the query on an `indexed column` to maximise speed.
 - `Batches` the query with other queries to reduce round trips to the database.
 - `Caches` the result so it does not need to be refetched elsewhere in a request.
 - Returns a `typed` result with an auto-gen type `users` that can be used elsewhere in the app.

All of this is taken care of so you can focus your effort on your app, not your database.

---

## Key features

### IDE Auto-completion

You can maximise developer efficiency with auto-completion in any IDE.

![Image of demo](https://github.com/MattGson/Gybson/blob/master/demo.gif?raw=true)

### Type-safe

Gybson comes with automated type safety out of the box so you know exactly what data goes in and out of your database. Types are generated directly from your database schema.

### Auto-generated

Unlike most ORMs you don't have to define complex types and relations in code. You can get started using Gybson in 5 minutes and work purely with plain JavaScript objects.

### GraphQL optimized

Gybson uses [dataloader](https://github.com/graphql/dataloader) under the hood to batch and cache (de-dupe) database requests to minimise round trips.

### SQL developer friendly

Gybson uses standard SQL terms where possible and offers a flexible query API including `filtering on relations`.

### Native support for soft-deletes

Managing soft deletes [is hard](https://medium.com/galvanize/soft-deletion-is-actually-pretty-hard-cb434e24825c) but is a vital part of many apps. Gybson has native support for soft-deletes.

## A simple example

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

const user = await gybson.users.oneByUserId({ user_id: id });

console.log(user);
/* 
 {
   user_id: 1;
   username: 'name';
   password: 'secret';
   last_logon: '2020-10-21T09:00:00';
 }
*/
```