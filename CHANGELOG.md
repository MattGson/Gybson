# [1.1.0](https://github.com/MattGson/Gybson/compare/v1.0.1...v1.1.0) (2021-05-12)


### Features

* **upsert:** upsert strategy support ([53c565d](https://github.com/MattGson/Gybson/commit/53c565d0f8beeb3f2e8a7fc4c2a7932b5be1553e))

## [1.0.1](https://github.com/MattGson/Gybson/compare/v1.0.0...v1.0.1) (2021-05-12)


### Bug Fixes

* **batching:** fixes batching behaviour on ordering, soft-delete filters ([a272948](https://github.com/MattGson/Gybson/commit/a272948c6219bed04197397d03ecec12c6e304ed)), closes [#43](https://github.com/MattGson/Gybson/issues/43) [#44](https://github.com/MattGson/Gybson/issues/44)

# [1.0.0](https://github.com/MattGson/Gybson/compare/v0.8.0...v1.0.0) (2021-05-12)


### Code Refactoring

* **all:** large refactor of project to utilise external introspection library ([722af79](https://github.com/MattGson/Gybson/commit/722af7973ab7ba0e875b2773fb92203af9b7a9fc)), closes [#47](https://github.com/MattGson/Gybson/issues/47)


### Features

* **entry:** changes to a class entrypoint. Significant refactors on structure ([73bf18f](https://github.com/MattGson/Gybson/commit/73bf18f4f3447fa6cfc5878d22348fbb3643bab6))


### BREAKING CHANGES

* **all:** Knex, pg, promise-mysql are now peerDependencies. The configuration API is
changing.
