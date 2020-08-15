---
id: where
title: Filtering
sidebar_label: Filtering
---

Gybson has a comprehensive type-safe filtering API so that you can access the exact data you need.

## Supported filters

### Conditions

Rows can be filtered by a range of conditions. The conditions are slightly different depending on the column type.
The supported conditions are:

-   `equals` - The column equals the value (the default)
-   `not` - The column does not equal the value
-   `in` - The column is in a list of values
-   `notIn` - The column is not in a list of values
-   `lt` - The column is less than the value
-   `lte` - The column is less or equal to the value
-   `gt` - The column is greater than the value
-   `gte` - The column is greater than or equal to the value

String type columns only
-   `contains` - The column is contains the substring
-   `startsWith` - The column is starts with the substring 
-   `endsWith` - The column ends with the substring 

**e.g.** All users named 'Steve' who are more than 20 years old

```typescript
await gybson.Users.findMany({
    where: {
        first_name: 'Steve',
        age: {
            gt: 20
        }       
    },
});
```

### Gates (combiners)

Clauses can be joined using AND, OR and NOT

-   `AND` - All conditions are true (the default)
-   `OR` - At least one condition is true
-   `NOT` - None of the conditions are true

**e.g.** All users named 'Steve' who are 20 or 30 years old

```typescript
await gybson.Users.findMany({
    where: {
        first_name: 'Steve',
        OR: [
            {
                age: 20,
            },
            {
                age: 30,
            },
        ],
    },
});
```

### Relation filters

Related tables can be filtered by

-   `existsWhere` - there is a least one related row that matches the condition
-   `notExistsWhere` - there is a no related row that matches the condition
-   `whereEvery` - every related row matches the condition

**e.g.** All users who have a post with a rating above 4

```typescript
await gybson.Users.findMany({
    where: {
        posts: {
            existsWhere: {
                rating: {
                    gt: 4,
                },
            },
        },
    },
});
```

### Complex filtering example with findMany

Find the first 3 users where:

-   The city is 'NY'
-   The last name does NOT start with 'P',
-   The age is less than 20
-   The favourite Pet is either a 'dog' or a 'cat'
-   Every pet they own is a dog
-   Every dog they own has a bone

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
        OR: [
            {
                favourite_pet: 'dog',
            },
            {
                favourite_pet: 'cat',
            },
        ],
        pets: {
            whereEvery: {
                type: 'dog',
                toys: {
                    existsWhere: {
                        name: 'bone',
                    },
                },
            },
        },
    },
});

// Return type: user[]
```

## Generated types

Types are generated to match the filtering options available.

### Example schema

```sql
CREATE TABLE users (
  user_id int(10) unsigned NOT NULL AUTO_INCREMENT,
  best_friend_id int(10) unsigned DEFAULT NULL,
  email varchar(400) NOT NULL,
  name varchar(200) DEFAULT NULL,
  password varchar(200) NOT NULL,
  subscription_level enum('BRONZE','SILVER','GOLD') DEFAULT NULL,
  PRIMARY KEY (user_id),
  UNIQUE KEY users_email_unique (email),
  KEY users_best_friend_id_foreign (best_friend_id),
  CONSTRAINT users_best_friend_id_foreign FOREIGN KEY (best_friend_id) REFERENCES users (user_id)
)

CREATE TABLE posts (
  post_id int(10) unsigned NOT NULL AUTO_INCREMENT,
  author_id int(10) unsigned NOT NULL,
  message varchar(4000) NOT NULL,
  created datetime DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN DEFAULT false,
  PRIMARY KEY (post_id),
  KEY posts_author_id_foreign (author_id),
  CONSTRAINT posts_author_id_foreign FOREIGN KEY (author_id) REFERENCES users (user_id),
)

```

### Types

The following types are generated for the given schema

```typescript
export interface usersRelationFilter {
    existsWhere?: usersWhere;
    notExistsWhere?: usersWhere;
    whereEvery?: usersWhere;
}

export interface usersWhere {
    user_id?: number | NumberWhere;
    best_friend_id?: number | NumberWhereNullable | null;
    email?: string | StringWhere;
    name?: string | StringWhereNullable | null;
    password?: string | StringWhere;
    subscription_level?: users_subscription_level | null;

    AND?: Enumerable<usersWhere>;
    OR?: Enumerable<usersWhere>;
    NOT?: Enumerable<usersWhere>;

    best_friend?: usersRelationFilter | null;
    author_posts?: postsRelationFilter | null;
}

export interface postsRelationFilter {
    existsWhere?: postsWhere;
    notExistsWhere?: postsWhere;
    whereEvery?: postsWhere;
}

export interface postsWhere {
    post_id?: number | NumberWhere;
    author_id?: number | NumberWhere;
    message?: string | StringWhere;
    created?: Date | DateWhereNullable | null;
    deleted?: boolean | BooleanWhereNullable | null;

    AND?: Enumerable<postsWhere>;
    OR?: Enumerable<postsWhere>;
    NOT?: Enumerable<postsWhere>;

    author?: usersRelationFilter | null;
}
```


## Prior art

The gybson filtering API was inspired by [Prisma](https://github.com/prisma/prisma-client-js). See [comparisons]() for an in depth comparison.