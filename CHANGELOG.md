## [1.2.1](https://github.com/MattGson/Gybson/compare/v1.2.0...v1.2.1) (2021-05-26)


### Bug Fixes

* **types:** small style fix ([74fa21f](https://github.com/MattGson/Gybson/commit/74fa21f143ce0c98fd2df2432fb9317cab9bc13e))

# [1.2.0](https://github.com/MattGson/Gybson/compare/v1.1.0...v1.2.0) (2021-05-17)


### Bug Fixes

* **filters:** fixes relation filters. Now account for cardinality. Also filter soft deletes ([6ef4551](https://github.com/MattGson/Gybson/commit/6ef45516146ef100a3e999dc505119b0c7f36dd5)), closes [#38](https://github.com/MattGson/Gybson/issues/38)
* **soft-delete:** makes soft-delete function consistent with update behvaiour ([a2044ad](https://github.com/MattGson/Gybson/commit/a2044ad42092650e4f2046f97a3d838eaf895c88))


### Features

* **where:** updates where filters for relations to utilise left joins ([7b4fc6c](https://github.com/MattGson/Gybson/commit/7b4fc6ca3cfd74a4a7a22c77967b9be10f4efc94))

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
