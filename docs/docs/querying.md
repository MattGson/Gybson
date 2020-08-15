---
id: querying
title: Query API
sidebar_label: Query API
---


## Loaders

Loaders are methods for each table that perform super fast [batched](https://github.com/graphql/dataloader#batching) and [cached](https://github.com/graphql/dataloader#batching) loads on key columns.
Loader methods are generated for each unique and non-unique key combination.

Loaders are the primary way of loading data from your database using gybson.

### Unique keys

Unique key loaders filter by a unique column (usually the primary key).
These loader methods return a single record or null

> **Unique loaders use the prefix _"one"_**


```typescript
const user = await gybson.Users.oneByUserId({ user_id: 1 });

// Return type: users | null
```

### Non-Unique keys

Non-unique loaders filter on a non-unique key column (usually a foreign key).
These methods return an array of records. These loaders allow an order to be specified.

> **Non-unique loaders use the prefix _"many"_**


```typescript
const posts = await gybson.Posts.manyByUserId({
    user_id: 1,
    orderBy: {
        first_name: 'asc',
    },
});

// Return type: posts[]
```

### Key combinations

Loaders are also generated for unique and non-unique key combinations.

**i.e.** 
```typescript
const posts = await gybson.Posts.manyByTagIdAndTopicId({ tag_id: 1, topic_id: 4 });

// Return type: posts[]
```

## findMany 

`findMany` loads many rows from a table. It provides a very flexible query API whilst maintaining full type safety.
Due to this flexibility, `findMany` does not perform batching or caching.

With `findMany` you can filter by columns and relations.
For all filtering options see [Filtering](where)

-   columns (equals, less than, greater than, startsWith, contains, not equal...)
-   gates (and, or, not)
-   relations (whereExists, whereNotExists, whereEvery)
-   ordering (ascending, descending, multiple-columns)
-   pagination (offset-limit, cursor)

##### A complex example:

Find the first 3 users where:

-   The city is 'NY'
-   The last name does NOT start with 'P',
-   The age is less than 20
-   The favourite Pet is either a 'dog' or a 'cat'
-   They own a dog
-   Order by first_name and last_name ascending.
-   Start from cursor 'John'

```typescript
const users = await gybson.Users.findMany({
    where: {
        city: 'NY',
        NOT: [
            {
                last_name: {
                    startsWith: 'P',
                },
            },
        ],
        age: {
            lt: 20,
        },
        OR: [{ favourite_pet: 'dog' }, { favourite_pet: 'cat' }],
        pets: {
            existsWhere: {
                type: 'dog',
            },
        },
    },
    orderBy: {
        first_name: 'desc',
        last_name: 'desc',
    },
    paginate: {
        limit: 3,
        afterCursor: {
            first_name: 'John',
        },
    },
});

// Return type: user[]
```

## insert

Inserts one or more rows into the database. This will automatically apply DEFAULT values for any
columns that are undefined.

```typescript
const users = await gybson.Users.insert({
    values: [
        {
            first_name: 'John',
            age: 25,
            last_name: 'Doe',
        },
        {
            first_name: 'Jane',
            age: 30,
            last_name: 'Doe',
        },
    ],
});
```

## upsert

Inserts multiple row into the database. If a row already exists with the primary key, the row will be updated.
You can specify which columns you want to update in this case.
You can also specify whether to reinstate (remove soft delete) on a row that has previously been soft-deleted.

```typescript
const users = await gybson.Users.upsert({
    values: [
        {
            first_name: 'John',
            age: 25,
            last_name: 'Doe',
        },
        {
            first_name: 'Jane',
            age: 30,
            last_name: 'Doe',
        },
    ],
    updateColumns: {
        age: true,
    },
    reinstateSoftDeletedRows: true,
});
```

#### update

Update rows that match a `where` filter.
All the `where` options from `findMany` are also available here.

```typescript
await gybson.Users.update({
    values: {
        first_name: 'Joe',
        age: 25,
    },
    where: {
        user_id: {
            not: 5,
        },
    },
});
```

## softDelete

This is a shortcut to soft delete rows rather than using update.
It will set the soft-delete column to true and cause the row to be filtered from future queries.
This allows the same `where` options as `update` and `findMany`.

```typescript
await gybson.Users.softDelete({
    where: {
        user_id: {
            not: 5,
        },
    },
});
```

## delete

This will delete a row permanently.
This allows the same `where` options as `update` and `findMany`.

```typescript
await gybson.Users.delete({
    where: {
        user_id: {
            not: 5,
        },
    },
});
```

## transaction

Use `transaction` to run a set of queries as a single atomic query. This means if any
of the queries fail then none of the changes will be committed. You can include a query in
the transaction by passing in the `transact` argum~~~~ent.

```typescript
import { transaction } from 'gybson';

const newUser = await transaction(async (trx) => {
    const users = await gybson.Users.softDelete({
        transact: trx,
        where: {
            user_id: 1,
        },
    });
    return await gybson.Users.insert({
        transact: trx,
        values: { first_name: 'Steve' },
    });
});
```
