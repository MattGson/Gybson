# Contributing

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

Steps to contribute:

-   Make your changes on a fork
-   Commit using [Commitizen](https://github.com/commitizen/cz-cli)
-   Run the tests
-   Submit pull a request

Our project runs tests automatically on pull requests via CI

### Running tests locally

```bash

# start dbs
npm run docker:start

# mysql
npm run migrate:mysql
npm run introspect:mysql
npm run test:myql

# pg
npm run migrate:pg
npm run introspect:pg
npm run test:pg

npm run docker:stop

```
