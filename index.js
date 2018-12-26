'use strict';

const clone = require('clone');

module.exports = (input) => {
    const options = clone(input.options || {});
    options.typeof = options.typeof || ((i, superTypeof) => superTypeof(i));
    options.types = options.types || {};
    
    Object.entries({
        string: {
            describe: s => s,
            realize: {
                fromString: s => s
            }
        },
        number: {
            describe: n => n,
            realize: {
                fromNumber: n => n
            }
        },
        boolean: {
            describe: b => b,
            realize: {
                fromBoolean: b => b
            }
        },
        array: {
            describe: a => a,
            realize: {
                fromArray: a => a
            }
        },
        object: {
            describe: o => o,
            realize: {
                fromNull: n => n,
                fromObject: o => o
            }
        }
    }).forEach(([typeName, definition]) => {
        if (options.types[typeName]) {
            throw new Error(`May not redefine built-in type "${typeName}".`);
        }
        
        options.types[typeName] = definition;
    });

    return {
        describe: d => describe(d, options),
        realize: s => realize(s, options)
    };
};

function describe(data, options) {
    let description;
    
    const typeofData = options.typeof(data, defaultTypeof);
    
    const typeDef = options.types[typeofData];
    if (!typeDef) {
        throw new Error(`No type definition provided for type: ${typeofData}.`);
    }
    
    description = typeDef.describe(data);
    
    const typeofDescription = options.typeof(description, defaultTypeof);

    switch (typeofDescription) {
        case 'boolean':
        case 'number':
        case 'string': {
            if (typeof description !== typeofDescription) {
                throw new Error(`Custom typer reported type ` +
                        `"${typeofDescription}", but value ` +
                        `"${description}" has type ` +
                        `"${typeof description}".`);
            }
            break;
        }
        case 'object': {
            if (description !== null) {
                if (typeof description !== 'object') {
                    throw new Error(`Custom typer reported type ` +
                            `"object", but value "${description}" has ` +
                            `type "${typeof description}".`);
                }
            
                const copy = {};
                Object.keys(description).forEach(k => {
                    copy[k] = describe(description[k], options);
                });
                description = copy;
            }
            break;
        }
        case 'array': {
            if (!Array.isArray(description)) {
                throw new Error(`Custom typer reported type "array", but ` +
                        `Array.isArray() does not accept value ` +
                        `"${description}" of type ` +
                        `"${typeof description}".`);
            }
        
            const copy = new Array(description.length);
            for (let i = 0; i < description.length; i++) {
                copy[i] = describe(description[i], options);
            }
            description = copy;
            break;
        }
        default: {
            description = describe(description, options);
            break;
        }
    }
    
    let result;
    let primitiveTypeofDescription = typeof description;
    switch (primitiveTypeofDescription) {
        case 'boolean':
        case 'number':
        case 'string': {
            if (primitiveTypeofDescription === typeofData) {
                result = description;
            }
            else {
                result = { '@m': { t: typeofData, d: description }};
            }
            break;
        }
        case 'object': {
            if (typeofData === 'object') {
                if (description === null) {
                    result = null;
                }
                else {
                    let descriptionKeys = Object.keys(description);
                    if (descriptionKeys.length === 1
                            && descriptionKeys[0] === '@m') {
                        result = { '@m': { d: description }};
                    }
                    else {
                        result = description;
                    }
                }
            }
            else if (typeofData === 'array') {
                result = description;
            }
            else {
                result = { '@m': { t: typeofData, d: description }};
            }
            break;
        }
        default: {
            throw new Error(`Description must be a JSON-representable value, ` +
                    `but got value "${description}" of type `+
                    `"${primitiveTypeofDescription}".`);
        }
    }
    
    return result;
}

function realize(description, options) {
    const typeofDescription = typeof description;
    let result;
    
    switch (typeofDescription) {
        case 'boolean':
        case 'number':
        case 'string': {
            result = description;
            break;
        }
        case 'object': {
            if (description === null) {
                result = null;
            }
            else if (Array.isArray(description)) {
                result = new Array(description.length);
                for (let i = 0; i < description.length; i++) {
                    result[i] = realize(description[i], options);
                }
            }
            else {
                const descriptionKeys = Object.keys(description);
                if (descriptionKeys.length === 1 &&
                        descriptionKeys[0] === '@m') {
                    const escapedDescription = description['@m'];
                    const describedType = escapedDescription.t || 'object';
                    const typeDef = options.types[describedType];
                    
                    if (!typeDef) {
                        throw new Error(`No type definition provided for ` +
                                `type: "${describedType}".`);
                    }
                    
                    const realizers = typeDef.realize;
                    
                    const nestedDescription = escapedDescription.d;
                    const primitiveTypeofDesc = typeof nestedDescription;
                    switch (primitiveTypeofDesc) {
                        case 'boolean': {
                            result = realizers.fromBoolean(nestedDescription);
                            break;
                        }
                        case 'number': {
                            result = realizers.fromNumber(nestedDescription);
                            break;
                        }
                        case 'string': {
                            result = realizers.fromString(nestedDescription);
                            break;
                        }
                        case 'undefined': {
                            result = realizers.fromUndefined();
                            break;
                        }
                        case 'object': {
                            let realizedNestedDescription;
                            if (describedType === 'object') {
                                realizedNestedDescription = realizeObject(
                                        nestedDescription, options);
                            }
                            else {
                                realizedNestedDescription =
                                        realize(nestedDescription, options);
                            }
                        
                            if (realizedNestedDescription === null) {
                                result = realizers.fromNull(null);
                            }
                            else if (Array.isArray(nestedDescription)) {
                                result = realizers.fromArray(
                                        realizedNestedDescription);
                            }
                            else {
                                result = realizers.fromObject(
                                        realizedNestedDescription);
                            }
                            break;
                        }
                        default: {
                            throw new Error(`Description nested in meta node ` +
                                    `must be absent or a JSON-compatible ` +
                                    `type, but found value ` +
                                    `"${nestedDescription}" of type ` +
                                    `"${primitiveTypeofDesc}".`);
                        }
                    }
                }
                else {
                    result = realizeObject(description, options);
                }
            }
            break;
        }
    }
    
    return result;
}

function realizeObject(input, options) {
    if (typeof input !== 'object') {
        throw new Error();
    }
    
    let result;
    if (input === null) {
        result = null;
    }
    else {
        result = {};
        Object.keys(input).forEach(key => {
            result[key] = realize(input[key], options);
        });
    }
    
    return result;
}

function defaultTypeof(d) {
    const typeofD = typeof d;
    
    let result;
    if (typeofD === 'object') {
        if (Array.isArray(d)) {
            result = 'array';
        }
        else {
            result = 'object';
        }
    }
    else {
        result = typeofD;
    }
    
    return result;
}
