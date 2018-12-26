const tests = [
    {
        name: 'false',
        input: false,
        output: false
    },
    {
        name: 'true',
        input: true,
        output: true
    },
    {
        name: 'number',
        input: 5,
        output: 5
    },
    {
        name: 'null',
        input: null,
        output: null
    },
    {
        name: 'array',
        input: [1, 2, 3],
        output: [1, 2, 3]
    },
    {
        name: 'object',
        input: { a: 1, b: 2, c: 3},
        output: { a: 1, b: 2, c: 3}
    },
    {
        name: 'delinquent object',
        input: { '@m': 5 },
        output: { '@m': { d: { '@m': 5 } } }
    },
    {
        name: 'basic custom type',
        typeof: (i, superTypeof) => i === 'foo' ? 'foo' : superTypeof(i),
        types: {
            foo: {
                describe: f => 'this is a foo'
            }
        },
        input: 'foo',
        output: { '@m': { t: 'foo', d: 'this is a foo' } }
    },
    {
        name: 'basic custom type object nested',
        typeof: (i, superTypeof) => i === 'foo' ? 'foo' : superTypeof(i),
        types: {
            foo: {
                describe: f => 'this is a foo'
            }
        },
        input: {
            bar: 'foo',
            bazz: 'plugh'
        },
        output: {
            bar: { '@m': { t: 'foo', d: 'this is a foo' } },
            bazz: 'plugh'
        }
    },
    {
        name: 'basic custom type array nested',
        typeof: (i, superTypeof) => i === 'foo' ? 'foo' : superTypeof(i),
        types: {
            foo: {
                describe: f => 'this is a foo'
            }
        },
        input: ['foo', 'plugh'],
        output: [{ '@m': { t: 'foo', d: 'this is a foo' } }, 'plugh']
    },
    {
        name: 'object-described custom type',
        typeof: (i, superTypeof) => {
            let result;
            
            if (i === 'foo') {
                result = 'foo';
            }
            else if (i === 'bar') {
                result = 'bar';
            }
            else {
                result = superTypeof(i);
            }
            
            return result;
        },
        types: {
            foo: {
                describe: f => 'this is a foo'
            },
            bar: {
                describe: b => ({
                    foo: 'foo',
                    waldo: 'plugh'
                })
            }
        },
        input: 'bar',
        output: {
            '@m': {
                t: 'bar',
                d: {
                    foo: { '@m': { t: 'foo', d: 'this is a foo' } },
                    waldo: 'plugh'
                }
            }
        }
    },
    {
        name: 'array-described custom type',
        typeof: (i, superTypeof) => {
            let result;
            
            if (i === 'foo') {
                result = 'foo';
            }
            else if (i === 'bar') {
                result = 'bar';
            }
            else {
                result = superTypeof(i);
            }
            
            return result;
        },
        types: {
            foo: {
                describe: f => 'this is a foo'
            },
            bar: {
                describe: b => ['foo', 'plugh']
            }
        },
        input: 'bar',
        output: {
            '@m': {
                t: 'bar',
                d: [{ '@m': { t: 'foo', d: 'this is a foo' } }, 'plugh']
            }
        }
    },
    {
        name: 'custom-type-described custom type',
        typeof: (i, superTypeof) => {
            let result;
            
            if (i === 'foo') {
                result = 'foo';
            }
            else if (i === 'bar') {
                result = 'bar';
            }
            else {
                result = superTypeof(i);
            }
            
            return result;
        },
        types: {
            foo: {
                describe: f => 'this is a foo'
            },
            bar: {
                describe: b => 'foo'
            }
        },
        input: 'bar',
        output: {
            '@m': {
                t: 'bar',
                d: {
                    '@m': {
                        t: 'foo',
                        d: 'this is a foo'
                    }
                }
            }
        }
    },
    {
        name: 'type with no definition generates error',
        typeof: (i, superTypeof) => i === 'foo' ? 'foo' : superTypeof(i),
        input: 'foo',
        errorMessageContains: 'definition'
    }
];

const sejrFactory = require('../index');

module.exports = {
    cases: tests,
    runner: (test, skip) => {
        let result;
    
        if (typeof onlyRun !== 'undefined' && 
                onlyRun.indexOf(test.name) === -1) {
            skip();
        }
        else {
            const options = {
                types: test.types || {}
            };
            if (test.typeof) {
                options.typeof = test.typeof;
            }
            
            result = sejrFactory({ options: options }).describe(test.input);
        }
        
        return result;
    }
};
