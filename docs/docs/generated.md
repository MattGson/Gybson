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
There is a client class and types generated for each table in the database. 

### Data loaders

Gybson leverages data loaders for batching and de-duplication of requests.
Each Gybson client instance creates new dataloader instances with a fresh in memory cache.