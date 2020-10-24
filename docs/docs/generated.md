---
id: codegen
title: About the generated code
sidebar_label: About the generated code
---


### Schema

Gybson generates a schema file `gybson.schema.ts`. 
This file contains a TS representation of your database schema.
The schema is used to generate client code as well as at run time for some
query functionality such as relationship filtering.

### Client

Gybson generates TypeScript code that you can import and use in your project.
There is a client class generated for each table in the database. 
The Gybson() entry point simply wraps an instance of each class.

### Data loaders

Gybson leverages data loaders for batching and de-duplication of requests.
Each loader method in a gybson client class is backed by a dataloader instance. This allows 
for batching on compound keys as well as multi-row loads rather than just
on basic primary keys. Instantiating a new client instance creates new dataloader 
instances with a fresh in memory cache.