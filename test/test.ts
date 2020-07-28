import Gybson, { LogLevel } from '../build/src/Client';
import by from '../Gen';

// TODO:- Test cases
/*
* - Column with same name as a join table
* - Two foreign keys to the same table
* - Nested relation filters
* - Nested combiner filters
* - Multiple relation filters on the same table i.e. existsWhere and innerJoin
*/

Gybson.init({
    client: 'mysql',
    connection: {
        database: 'komodo',
        user: 'root',
        password: '',
    },
    options: {
        logLevel: LogLevel.debug,
    },
});
const gyb = by();

const main = async () => {
    await gyb.Posts.insert({
        values: [
            {
                author_id: 4,
            },
        ],
    });

    await gyb.Posts.upsert({
        values: [
            {
                post_id: 4,
                author_id: 3,
            },
        ],
        updateColumns: {
            author_id: true
        }
    });

    await gyb.Posts.update({
        values: {
            author_id: 1,
            datetime: new Date(),
        },
        where: {
            post_id: 4
        }
    })

    const post = await gyb.Posts.findMany({
        where: {
            post_id: 4,
            users: {
                innerJoinWhere: {
                    user_id: {
                        not: 5,
                    },
                },
            },
            post_messages: {
                existsWhere: {
                    datetime: {
                        lt: new Date()
                    }
                }
            }
        },
        orderBy: {
            datetime: 'asc',
        },
        paginate: {
            limit: 3,
            afterCursor: {
                post_id: 1,
            },
        },
    });

    const rpe = await gyb.RpeResponses.findMany({
        where: {
            session_members: {
                innerJoinWhere: {
                    exercise_data_points: {
                        existsWhere: {}
                    },
                    sessions: {
                        innerJoinWhere: {
                            session_id: {
                                gt: 3168
                            }
                        }
                    }
                }
            }
        },
        orderBy: {
            session_id: "asc"
        }
    });
    console.log(rpe);
};

main().then(() => {
    console.log('');
});
