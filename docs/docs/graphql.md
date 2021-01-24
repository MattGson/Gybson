---
id: graphql
title: Using with GraphQL
sidebar_label: Using with GraphQL
---

Gybson is highly suited to building GraphQL apps. It uses [DataLoader](https://github.com/graphql/dataloader) under 
the hood to batch and cache database requests. 

This allows for deep GraphQL trees to be resolved without an explosion in database request whilst still
resolving each field independently.

Other solutions such as eager loading from the root of the tree work for simple apps but are massively
limiting in complex data graphs.

See the [DataLoader docs](https://github.com/graphql/dataloader)  for more details on query efficiency in GraphQL.

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
        return context.gybson.Users.loadOne({ where: { user_id: args.id } });
    },
    posts(parent, args, context, info) {
        return context.gybson.Posts.loadMany({ where: { author_id: parent.author_id } });
    },
    comments(parent, args, context, info) {
         return context.gybson.Comments.loadMany({ where: { post_id: parent.post_id } });
    }
}
```

Executing the following query results in just 3 database round-trips
regardless of how many posts or comments are loaded.

```typescript
query {
    user(id: 1) {
        user_id
        name
        posts {
            post_id
            message
            comments {
                comment_id
                message
            }
        }
    }
}
 
```