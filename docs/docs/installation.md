---
id: installation
title: Getting started
sidebar_label: Getting started
---

## Installing Gybson

```
npm i gybson
```

## Generating the client

### About code gen

Gybson generates Typescript code from your database schema.

It does this by running queries against your database to work out the table schema as well as the relations between tables.

:::important

We never recommend running the code gen against your production database. Instead you should run it against a local database with the same schema.

:::

### Configuring code gen

Define a config file `gybson-config.json` in the root directory of your project.
This file is only used for code-gen, not for connecting during run-time.
Change the contents of the file to connect to your data-base.

The `outdir` option specifies where the Typescript files will be output.
This should be inside of your project source so that the files are transpiled as part of your build.

i.e.

```json
{
    "host": "127.0.0.1",
    "port": 3306,
    "user": "root",
    "password": "",
    "database": "users",
    "outdir": "./src/generated"
}
```

Run:

```
gybson generate
```

The above commands will generate the client for `users` database.
The resulting files are stored in `./src/generated`.

## Using the client

### Initialize the connection

Call `Gybson.init` to initialise the client connection.
This creates a knex connection pool under the hood and accepts an object with same [options](http://knexjs.org/#Installation-client) as knex for `MySQL` and `PostgreSQL`.

```typescript
import Gybson from 'gybson';

Gybson.init({
    client: 'mysql',
    connection: {
        database: 'komodo',
        user: 'root',
        password: '',
    },
});
```

### Querying

Import the client from your generated code output directory.
The default export is a function that returns a fresh client instance.

:::tip

We recommend calling this function on a per-request basis for APIs i.e. GraphQL, REST.
This will ensure the cache is clean and no stale data is returned.
See [DataLoader](https://github.com/graphql/dataloader#caching-per-request) for more details

:::

```typescript
import GybsonClient from './src/generated';

const client = GybsonClient();


const user = await client.Users.oneByUserId({ user_id: 4 });

```

You can also import individual table clients like:

```typescript
import { Users } from './src/generated';

const userClient = new Users();


const user = await userClient.oneByUserId({ user_id: 4 });

```

For a full list of query options see [Querying](querying.md)

### Closing the connection

To close the connection pool, simply call:

```typescript
Gybson.close();
```