---
id: querying
title: Query API
sidebar_label: Query API
---

## Loaders

Loaders are methods for each table that perform super fast [batched](https://github.com/graphql/dataloader#batching) and [cached](https://github.com/graphql/dataloader#batching) loads on key columns.
This is designed to minimise performance issues from the [n+1 problem](https://stackoverflow.com/questions/97197/what-is-the-n1-selects-problem-in-orm-object-relational-mapping).

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
Due to this flexibility, `findMany` **does not** perform batching or caching.

:::tip

When building GraphQL APIs, we recommend only using `findMany` near the top of your query tree.
When used deeper in the tree you should be wary of performance issues due to the [n+1](https://stackoverflow.com/questions/97197/what-is-the-n1-selects-problem-in-orm-object-relational-mapping) problem.

:::

### where

The `where` field is used to specify filters on the rows returned.

You can filter by any combination of columns and relations.
For all filtering options see [Filtering](where)

**i.e.** Find all users where age is not 10 **and** they have a pet with the type "dog".

```typescript
const users = await gybson.Users.findMany({
    where: {
        age: {
            not: 10,
        },
        pets: {
            existsWhere: {
                type: 'dog',
            },
        },
    },
});
```

### orderBy

The `orderBy` field is used to specify the order rows should be returned in.

You can specify one or more ordering columns as well as the order direction (ascending, descending)

**i.e.** Find all users ordered by first_name and last_name in descending order, age in ascending order.

```typescript
const users = await gybson.Users.findMany({
    orderBy: {
        first_name: 'desc',
        last_name: 'desc',
        age: 'asc',
    },
});
```

### paginate

The `paginate` field is used to specify a subset of matching rows to return.

Both `offset-limit` and `cursor` pagination is supported.

When using pagination, you should always specify and `orderBy` clause as well.

#### Offset-limit pagination

Returns rows before or after a specific number of rows.

Offset-limit pagination is simpler than cursor pagination but does not work as well for tables that change often.

**i.e.** Find the first 4 users in ascending last_name order after row 300.

```typescript
const users = await gybson.Users.findMany({
    orderBy: {
        last_name: 'asc',
    },
    paginate: {
        limit: 4,
        offset: 300,
    },
});
```


#### Cursor pagination

Returns rows before or after a specific row. You can use any column (or combination) as your cursor.

Cursor pagination is generally better than offset-limit as it still works the number of rows in the table can change.

:::note

When using cursor pagination, you should specify the same columns in orderBy as your cursor. If you don't you may get unexpected result sets.

:::
**i.e.** Find the first 4 users in ascending order with a last_name after 'Jones'.

```typescript
const users = await gybson.Users.findMany({
    orderBy: {
        last_name: 'asc',
    },
    paginate: {
        limit: 4,
        afterCursor: {
            last_name: 'Jones',
        },
    },
});
```



## insert

Inserts one or more rows into the database. This will automatically apply _DEFAULT_ values for any
columns that are undefined.

Insert returns the id of the first row inserted.

### insert a single row

```typescript
const user_id = await gybson.Users.insert({
    values: {
        first_name: 'John',
        age: 25,
        last_name: 'Doe',
     },
});
```

### insert multiple rows


```typescript
const user_id = await gybson.Users.insert({
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

In the case of conflicts, you can specify which columns you want to update.

You can also specify whether to reinstate (remove soft delete) on a row that has previously been soft-deleted.

### Upsert one

```typescript
const users = await gybson.Users.upsert({
    values: {
        first_name: 'John',
        age: 25,
        last_name: 'Doe',
    },
    updateColumns: {
        first_name: true,
        age: true,
    },
});
```

### Upsert many

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

## update

Updates all rows that match a filter.

`update` supports all [where](where) filter options.

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

A soft-delete allows you to treat a row as deleted while maintaining it for record-keeping or recovery purposes.

By default any tables with a column `deleted` or `deleted_at` support soft deletes.

`softDelete` will set the `deleted` column to true or the current timestamp and cause the row to be filtered from future queries.

`softDelete` supports all [where](where) filter options.

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

`delete` will delete a row permanently.

`delete` supports all [where](where) filter options.

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
of the queries fail then none of the changes will be committed. 

You can include a query in the transaction by passing in the `transact` argument.

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

## Manual connection handling

Most query functions allow an optional `connection` argument. You can pass a MySQL or PG connection
and the query will use it instead of the internal connection.

This can be useful for apps with existing connection handling or more complex transaction handling requirements.

Example with `insert` and MySQL:
```typescript
import { insert } from 'gybson';
import mysql from 'promise-mysql';

const poolConn = mysql.getPoolConnection();

return await gybson.Users.insert({
    connection: poolConn,
    values: { first_name: 'Steve' },
});

poolConn.close();

```