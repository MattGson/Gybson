---
id: graphql
title: Using with GraphQL
sidebar_label: Using with GraphQL
---

Gybson is highly suited to building GraphQL apps. It uses [DataLoader](https://github.com/graphql/dataloader) under 
the hood to batch and cache database requests. 

This allows for deep GraphQL trees to be resolved without an explosion in database requests.
In general, gybson will execute one database request for each different resolver function that is executed.

See the DataLoader docs for more details on query efficiency in GraphQL.

## Apollo example

Add a gybson instance to the context.

:::important

Make sure to add a new client instance to the context on every request.
This will ensure the cache is clean and no stale data is returned.
See [DataLoader](https://github.com/graphql/dataloader#caching-per-request) for more details

:::

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
        return context.gybson.Users.oneByUserId({ user_id: args.id });
    }
}
```