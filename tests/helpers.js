const toString = Object.prototype.toString;
const errorToString = Error.prototype.toString;
const regExpToString = RegExp.prototype.toString;
const symbolToString =
    typeof Symbol !== 'undefined' ? Symbol.prototype.toString : () => '';

const SYMBOL_REGEXP = /^Symbol\((.*)\)(.*)$/;

function printNumber(val) {
    if (val != +val) return 'NaN';
    const isNegativeZero = val === 0 && 1 / val < 0;
    return isNegativeZero ? '-0' : '' + val;
}

function printSimpleValue(val, quoteStrings = false) {
    if (val == null || val === true || val === false) return '' + val;

    const typeOf = typeof val;
    if (typeOf === 'number') return printNumber(val);
    if (typeOf === 'string') return quoteStrings ? `"${val}"` : val;
    if (typeOf === 'function')
        return '[Function ' + (val.name || 'anonymous') + ']';
    if (typeOf === 'symbol')
        return symbolToString.call(val).replace(SYMBOL_REGEXP, 'Symbol($1)');

    const tag = toString.call(val).slice(8, -1);
    if (tag === 'Date')
        return isNaN(val.getTime()) ? '' + val : val.toISOString(val);
    if (tag === 'Error' || val instanceof Error)
        return '[' + errorToString.call(val) + ']';
    if (tag === 'RegExp') return regExpToString.call(val);

    return null;
}

export default function printValue(value, quoteStrings) {
    let result = printSimpleValue(value, quoteStrings);
    if (result !== null) return result;

    return JSON.stringify(
        value,
        function(key, value) {
            let result = printSimpleValue(this[key], quoteStrings);
            if (result !== null) return result;
            return value;
        },
        2,
    );
}

export let validateAll = (inst, {
    valid = [],
    invalid = []
}) => {
    describe('valid:', () => {
        runValidations(valid, true);
    });

    describe('invalid:', () => {
        runValidations(invalid, false);
    });

    function runValidations(arr, isValid) {
        arr.forEach(config => {
            let message = '',
                value = config,
                schema = inst;

            if (Array.isArray(config))[value, schema, message = ''] = config;

            it(`${printValue(value)}${message && `  (${message})`}`, () =>
                schema.isValid(value).should.become(isValid));
        });
    }
};

export let castAndShouldFail = (schema, value) => {
    (() => schema.cast(value)).should.throw(
        TypeError,
        /The value of (.+) could not be cast to a value that satisfies the schema type/gi,
    );
};

export let castAll = (inst, {
    invalid = [],
    valid = []
}) => {
    valid.forEach(([value, result, schema = inst]) => {
        it(`should cast ${printValue(value)} to ${printValue(result)}`, () => {
            expect(schema.cast(value)).to.equal(result);
        });
    });

    invalid.forEach(value => {
        it(`should not cast ${printValue(value)}`, () => {
            castAndShouldFail(inst, value);
        });
    });
};
