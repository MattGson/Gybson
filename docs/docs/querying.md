---
id: querying
title: Query API
sidebar_label: Query API
---

## Loaders

Loaders are methods for each table that perform super fast [batched](https://github.com/graphql/dataloader#batching) and [cached](https://github.com/graphql/dataloader#batching) loads on indexed columns.
This is designed to minimise performance issues from the [n+1 problem](https://stackoverflow.com/questions/97197/what-is-the-n1-selects-problem-in-orm-object-relational-mapping).

Loaders are the primary way of retrieving data using Gybson.

### loadOne

`loadOne(...)` returns a single record or null.

`loadOne` filters by a unique key (often primary key).

```typescript
const user = await gybson.user.loadOne({
    where: {
        user_id: 1,
    },
});
// Return type: User | null
```

A compound unique key example:

```typescript
const posts = await gybson.post.loadOne({
    where: {
        tag_id__topic_id: {
            tag_id: 1,
            topic_id: 4,
        },
    },
});

// Return type: post | null
```

### loadMany

`loadMany(...)` returns an array of records.
`loadMany` filters on non-unique key columns (often foreign keys).

```typescript
const posts = await gybson.post.loadMany({
    where: {
        author_id: 1,
    },
});

// Return type: posts[]
```

An order can be specified:

```typescript
const posts = await gybson.post.loadMany({
    where: {
        author_id: 1,
    },
    orderBy: {
        first_name: 'asc',
    },
});

// Return type: posts[]
```

---

## findMany

Similar to `loadMany`, `findMany` loads many rows from a table. The difference is that `findMany` provides a very flexible query API including relation filtering.
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
const users = await gybson.user.findMany({
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
const users = await gybson.user.findMany({
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
const users = await gybson.user.findMany({
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
const users = await gybson.user.findMany({
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

---

## insert

Inserts one or more rows into the database. This will automatically apply _DEFAULT_ values for any
columns that are `undefined`.

Insert returns the id of the first row inserted.

### insert a single row

```typescript
const user_id = await gybson.user.insert({
    values: {
        first_name: 'John',
        age: 25,
        last_name: 'Doe',
    },
});
```

### insert multiple rows

```typescript
const user_id = await gybson.user.insert({
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

You can also choose to skip duplicate rows during a multi-row insert:

```typescript
const user_id = await gybson.user.insert({
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
    skipDuplicates: true,
});
```

---

## upsert

Inserts multiple row into the database. If a row already exists with the same primary key, the row will be updated.

:::tip

Upsert is implemented using native SQL functionality:
ON CONFLICT DO in Postgres
ON DUPLICATE KEY UPDATE in MySQL

Because of this, the databases may behave differently with the same query. For instance, MySQL will upsert on any unique constraint conflict.
PostgreSQL will only conflict on the primary key.

:::

In the case of conflicts, you can specify how you want to update the existing row(s):

### mergeColumns

will overwrite the values on the existing row with the values of the new row for the selected columns:

```typescript
const users = await gybson.user.upsert({
    values: {
        first_name: 'John',
        age: 25,
        last_name: 'Doe',
    },
    mergeColumns: {
        first_name: true,
        age: true,
    },
});
```

Will update only the `first_name` and `age` values if the row already exists.

### update

will update existing rows with the specifed values:

```typescript
const users = await gybson.user.upsert({
    values: {
        id: 12,
        first_name: 'John',
        age: 25,
        last_name: 'Doe',
    },
    update: {
        first_name: 'John 2',
    },
});
```

Will set the users first_name to `John 2` if they already exist.

### Upsert multiple rows

```typescript
const users = await gybson.user.upsert({
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
    mergeColumns: {
        age: true,
    },
});
```

### Upsert with soft-deletes

You can also specify whether to reinstate (remove soft delete) on a row that has previously been soft-deleted:

```typescript
const users = await gybson.user.upsert({
    values: {
        first_name: 'John',
        age: 25,
        last_name: 'Doe',
    },
    mergeColumns: {
        age: true,
    },
    reinstateSoftDelete: true,
});
```

---

## update

Updates all rows that match a filter.

`update` supports all [where](where) filter options.

```typescript
await gybson.user.update({
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

---

## softDelete

A soft-delete allows you to treat a row as deleted while maintaining it for record-keeping or recovery purposes.

By default any tables with a column `deleted` or `deleted_at` support soft deletes.

`softDelete` will set the `deleted` column to true or the current timestamp and cause the row to be filtered from future queries.

`softDelete` supports all [where](where) filter options.

```typescript
await gybson.user.softDelete({
    where: {
        user_id: {
            not: 5,
        },
    },
});
```

---

## delete

`delete` will delete a row permanently.

`delete` supports all [where](where) filter options.

```typescript
await gybson.user.delete({
    where: {
        user_id: {
            not: 5,
        },
    },
});
```

---

## transactions

Use `_transactions` to run a set of queries as a single atomic query. This means if any
of the queries fail then none of the changes will be committed.

You can include a query in the transaction by passing in the `connection` argument.

```typescript
const newUserId = await gybson._transaction(async (connection) => {
    const users = await gybson.user.softDelete({
        connection,
        where: {
            user_id: 1,
        },
    });
    const id = await gybson.user.insert({
        connection,
        values: { first_name: 'Steve' },
    });
    return id;
});
```

---

## Manual connection handling

Most query functions allow an optional `connection` argument. You can pass a MySQL or PostgreSQL connection
and the query will use it instead of the internal Knex connection.

This can be useful for apps with existing connection handling or more complex transaction handling requirements.

Example with MySQL:

```typescript
import mysql from 'promise-mysql';

const connection = mysql.getPoolConnection();

return await gybson.user.insert({
    connection
    values: { first_name: 'Steve' },
});

await connection.close();
```
