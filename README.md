# Lawful

A lightweight & flexible framework for rule based testing.

## Why

## Getting started

First install Lawful

```shell
npm install lawful --save-dev
```

Lawful is written in Typescript and therefore supports both Javascript and Typescript.

```javascript
// Require syntax
const { Lawbook } = require('lawful');

const lawbook = new Lawbook();
```

```javascript
// Import syntax
import { Lawbook } from 'lawful';

const lawbook = new Lawbook();
```

Now add your first law

```javascript
import { Lawbook } from 'lawful';

const lawbook = new Lawbook();

lawbook.add('is-divisible')
    .define((number, factor) => {
        return (number % factor) === 0;
    });

await lawbook.enforce('is-devisible', 21, 7);
```
