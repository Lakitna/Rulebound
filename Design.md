# Rules

One or multiple points of failure with documentation and some logic baked in.

- Testable (yes, you can test your tests)
- Maintainable
- Flexible
- Unopinionated?

<!-- TODO: Describe test pattern -->

## API

### Adstracted

```javascript
lawbook
    .add(name: string, defaultConfig: object)
    .describe(description: string)
    .define((...input: any) => {
        return true // will call reward
        return new Promise((resolve) => {resolve(true)}) // will call reward
        // Note that this also means that an async define function will work

        // Every other return (including `undefined`) will call punish. Some examples:
        return false
        return
        return 'Some message'

        throw new Error() // will call punish
        throw new AnyTypeOfError() // will call punish
        expect(true).to.be.false; // will call punish
    })
    .punishment((input: any[], error: Error) => {
        throw new Error() // throw or log error according to config
        throw new AnyTypeOfError() // throw or log error according to config
        this.throw() // throw or log error according to config
    })
    .reward((input: any[]) => {
        throw new Error() // throw or log error according to config
        throw new AnyTypeOfError() // throw or log error according to config
        this.throw() // throw or log error according to config
    });

lawbook.enforce(namePattern: globString, ...input: any[]);
```

### Event style

Do we want this? It's basically an alias for what we have now but it implies events. Of events you can have multiple of a type. For example: Two functions `on('fail')`.

```javascript
lawbook
    .add(name: string, defaultConfig: object)
    .describe(description: string)
    .define((...input: any) => {
    })
    .on('pass', (input: any[], error: Error) => {
    })
    .on('fail', (input: any[]) => {
    });

lawbook.enforce(namePattern: globString, ...input: any[]);
```
