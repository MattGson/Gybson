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

Optimized for super fast lazy loading, using batching and caching, it's perfect for GraphQL apps.

Gybson is built on top of trusted open-source projects:

-   [Knex](https://github.com/knex/knex)
-   [DataLoader](https://github.com/graphql/dataloader)

Gybson works with MySQL and PostgreSQL databases.

## Why Gybson?

Gybson was created to make working with relational databases in Typescript as productive as possible.

Just run `gybson generate` and you have a fully type-safe database client created for your exact schema.

### Knex

Gybson is built on top of the very popular SQL query builder [Knex](https://github.com/knex/knex).

GybsonClient wraps a Knex client instance so it is very easy to integrate into apps already using Knex.

---

## Key features

### IDE Auto-completion

You can maximise developer efficiency with auto-completion in any IDE.

![Image of demo](https://github.com/MattGson/Gybson/blob/master/demo.gif?raw=true)

### Type-safe

Gybson comes with automated type safety out of the box so you know exactly what data goes in and out of your database. Clean, usable types are generated directly from your database schema.

### Auto-generated

Unlike most ORMs you don't have to define complex types and relations in code. You can get started using Gybson in 5 minutes and work with plain JavaScript objects.

### GraphQL optimized

Gybson uses [dataloader](https://github.com/graphql/dataloader) under the hood to batch and cache (de-dupe) database requests to minimise round trips.

---

## A simple example

If your schema is defined as

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT;
    username: VARCHAR NOT NULL;
    password: VARCHAR NOT NULL;
    last_logon: Date;
)
```

You can query:

```typescript
const id = await gybson.user.insert({
    values: {
        username: 'name',
        password: 'secret',
        last_logon: new Date(),
    },
});

const user = await gybson.user.loadOne({
    where: {
        id,
    },
});

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
