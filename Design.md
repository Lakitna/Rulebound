# Rules

One or multiple points of failure with documentation and some logic baked in.

- Testable (yes, you can test your tests)
- Maintainable
- Flexible
- Unopinionated -- Is it?

<!-- TODO: Describe test pattern -->

## API

### Adstracted

```javascript
lawbook
    .add(name: string, defaultConfig: object)
    .describe(description: string)
    .define((...input: any) => {
        return true // will call reward
        return new Promise((resolve) => {resolve(true)}) // will reward
        // Note that this also means that an async define function will work

        // Every other return (including `undefined`) will punish. Some examples:
        return false
        return
        return 'Some message'

        throw new Error() // will punish
        throw new AnyTypeOfError() // will punish
        expect(true).to.be.false; // will punish
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

    // Option A
    .on('fail', (input: any[], error: Error) => {
    })
    .on('pass', (input: any[]) => {
    })

    // Option B
    .onFail((input: any[], error: Error) => {
    })
    .onPass((input: any[]) => {
    })

lawbook.enforce(namePattern: globString, ...input: any[]);
```

### Embedded tests

Do we maybe want to embed tests?

```javascript
lawbook
    .define((...input: any) => {
    })
    .test(function(law) {
        it('should work as intended', function() {
            law.enforce('foo');
        })
    })

    .test('should pass a valid string', [ 'foo' ])

    .test('should pass a valid string', [ 'foo' ],
        function(result) {
            expect(result).to.be.true;
        })

    .test('should throw on a number', [ 123 ],
        function(result) {
            expect(result).to.be.instanceOf(Error);
            expect(result.msg).to.equal(`That's not a string!`);
        })
    ;
```
