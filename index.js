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
    let typeofData;        
    let description;
    
    typeofData = options.typeof(data, defaultTypeof);
    
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
/*
function realize(s, options) {
    const typeofS = typeof s;
    
    switch (typeofS) {
        case 'boolean':
        case 'number':
        case 'string': {
            return s;
        }
        case 'object': {
            if (s === null) {
                return s;
            }
            
            let describedType;
            let representation;
            
            if (Array.isArray(s)) {
                describedType = 'array';
                representation = s;
            }
            else if (s['@m']) {
                describedType = s['@m'].t || 'object';
                representation = s['@m'].d;
            }
            else {
                describedType = 'object';
                representation = s;
            }
            
            const copy = describedType === 'array' ?
                    new Array(representation.length) : {};
            
            Object.keys(representation).forEach(k => {
                copy[k] = realize(representation[k], options);
            });
            representation = copy;
            
            switch (describedType) {
                case 'array':
                case 'object': {
                    break;
                }
                default: {
                    const realizer = options.describers[describedType].realize;
                    const superRealize = s => realize(s, options);
                    
                    let subRealizer;
                    switch (typeof representation) {
                        case 'boolean': {
                            
                            return realizer.fromBoolean(
                                    representation, superRealize);
                        }
                        case 'number': {
                            return realizer.fromNumber(
                                    representation, superRealize);
                        }
                        case 'string': {
                            return realizer.fromString(representation, superR
                        }
                    }
                
                    representation = 
                            options.describers[describedType].realize(
                                    representation,
                                    s => realize(s, options));
                }
            }
            
            return representation;
        }
        default: {
            throw new Error('Invalid build argument type: ' + typeofS);
        }
    }
}
*/

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
