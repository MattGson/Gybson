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

### Data loaders

Gybson leverages data loaders for batching and de-duplication of requests.
Each loader method in gybson is backed by a dataloader instance. This allows 
for batching on compound keys as well as multi-row loads rather than just
on basic primary keys.