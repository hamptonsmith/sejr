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
        input: { '@m': { d: { '@m': 5 } } },
        output: { '@m': 5 }
    },
    {
        name: 'from boolean',
        types: {
            foo: {
                realize: {
                    fromBoolean: b => b
                }
            }
        },
        input: { '@m': { t: 'foo', d: true } },
        output: true
    },
    {
        name: 'from number',
        types: {
            foo: {
                realize: {
                    fromNumber: n => n
                }
            }
        },
        input: { '@m': { t: 'foo', d: 5 } },
        output: 5
    },
    {
        name: 'from string',
        types: {
            foo: {
                realize: {
                    fromString: s => s
                }
            }
        },
        input: { '@m': { t: 'foo', d: 'bar' } },
        output: 'bar'
    },
    {
        name: 'from undefined',
        types: {
            foo: {
                realize: {
                    fromUndefined: () => 'bar'
                }
            }
        },
        input: { '@m': { t: 'foo' } },
        output: 'bar'
    },
    {
        name: 'from null',
        types: {
            foo: {
                realize: {
                    fromNull: () => 'bar'
                }
            }
        },
        input: { '@m': { t: 'foo', d: null } },
        output: 'bar'
    },
    {
        name: 'from array',
        types: {
            foo: {
                realize: {
                    fromArray: a => a
                }
            }
        },
        input: { '@m': { t: 'foo', d: [1, 2, 3] } },
        output: [1, 2, 3]
    },
    {
        name: 'from object',
        types: {
            foo: {
                realize: {
                    fromObject: o => o
                }
            }
        },
        input: { '@m': { t: 'foo', d: { foo: 'bar' } } },
        output: { foo: 'bar' }
    },
    {
        name: 'basic custom type',
        types: {
            foo: {
                realize: {
                    fromString: s => {
                        if (s !== 'this is a foo') {
                            throw new Error('Unexpected foo description?');
                        }
                        
                        return 'foo';
                    }
                }
            }
        },
        input: { '@m': { t: 'foo', d: 'this is a foo' } },
        output: 'foo'
    },
    {
        name: 'basic custom type object nested',
        types: {
            foo: {
                realize: {
                    fromString: s => {
                        if (s !== 'this is a foo') {
                            throw new Error('Unexpected foo description?');
                        }
                        
                        return 'foo';
                    }
                }
            }
        },
        input: {
            bar: { '@m': { t: 'foo', d: 'this is a foo' } },
            bazz: 'plugh'
        },
        output: {
            bar: 'foo',
            bazz: 'plugh'
        }
    },
    {
        name: 'basic custom type array nested',
        types: {
            foo: {
                realize: {
                    fromString: s => {
                        if (s !== 'this is a foo') {
                            throw new Error('Unexpected foo description?');
                        }
                        
                        return 'foo';
                    }
                }
            }
        },
        input: [{ '@m': { t: 'foo', d: 'this is a foo' } }, 'plugh'],
        output: ['foo', 'plugh']
    },
    {
        name: 'object-described custom type',
        types: {
            foo: {
                realize: {
                    fromString: s => {
                        if (s !== 'this is a foo') {
                            throw new Error('Unexpected foo description?');
                        }
                        
                        return 'foo';
                    }
                }
            },
            bar: {
                realize: {
                    fromObject: i => {
                        assert.deepEqual(i, { foo: 'foo', waldo: 'plugh' },
                                'Unexpected bar description.');
                        
                        return 'bar';
                    }
                }
            }
        },
        input: {
            '@m': {
                t: 'bar',
                d: {
                    foo: { '@m': { t: 'foo', d: 'this is a foo' } },
                    waldo: 'plugh'
                }
            }
        },
        output: 'bar'
    },
    {
        name: 'array-described custom type',
        types: {
            foo: {
                realize: {
                    fromString: s => {
                        if (s !== 'this is a foo') {
                            throw new Error('Unexpected foo description?');
                        }
                        
                        return 'foo';
                    }
                }
            },
            bar: {
                realize: {
                    fromArray: i => {
                        assert.deepEqual(i, ['foo', 'plugh'],
                                'Unexpected bar description.');
                        
                        return 'bar';
                    }
                }
            }
        },
        input: {
            '@m': {
                t: 'bar',
                d: [{ '@m': { t: 'foo', d: 'this is a foo' } }, 'plugh']
            }
        },
        output: 'bar'
    },
    {
        name: 'custom-type-described custom type',
        types: {
            foo: {
                realize: {
                    fromString: s => {
                        if (s !== 'this is a foo') {
                            throw new Error('Unexpected foo description?');
                        }
                        
                        return 'foo';
                    }
                }
            },
            bar: {
                realize: {
                    fromObject: i => {
                        assert.deepEqual(
                                i, 'foo', 'Unexpected bar description.');
                        
                        return 'bar';
                    }
                }
            }
        },
        input: {
            '@m': {
                t: 'bar',
                d: {
                    '@m': {
                        t: 'foo',
                        d: 'this is a foo'
                    }
                }
            }
        },
        output: 'bar'
    },
    {
        name: 'type with no definition generates error',
        input: { '@m': { t: 'foo' } },
        errorMessageContains: 'definition'
    }
];

const assert = require('assert');
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
            
            result = sejrFactory({ options: options }).realize(test.input);
        }
        
        return result;
    }
};
