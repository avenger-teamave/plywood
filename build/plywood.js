var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ImmutableClass = require("immutable-class");
var q = require("q");
var Q = q;
var chronoshift = require("chronoshift");
var Chronoshift = chronoshift;
var dummyObject = {};
var objectHasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwnProperty(obj, key) {
    return objectHasOwnProperty.call(obj, key);
}
function repeat(str, times) {
    return new Array(times + 1).join(str);
}
function arraysEqual(a, b) {
    if (a === b)
        return true;
    var length = a.length;
    if (length !== b.length)
        return false;
    for (var i = 0; i < length; i++) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
}
function dictEqual(dictA, dictB) {
    if (dictA === dictB)
        return true;
    if (!dictA !== !dictB)
        return false;
    var keys = Object.keys(dictA);
    if (keys.length !== Object.keys(dictB).length)
        return false;
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
        var key = keys_1[_i];
        if (dictA[key] !== dictB[key])
            return false;
    }
    return true;
}
var expressionParser;
var plyqlParser;
var Plywood;
(function (Plywood) {
    Plywood.version = '0.10.30';
    Plywood.isInstanceOf = ImmutableClass.isInstanceOf;
    Plywood.isImmutableClass = ImmutableClass.isImmutableClass;
    Plywood.generalEqual = ImmutableClass.generalEqual;
    Plywood.immutableEqual = ImmutableClass.immutableEqual;
    Plywood.immutableArraysEqual = ImmutableClass.immutableArraysEqual;
    Plywood.immutableLookupsEqual = ImmutableClass.immutableLookupsEqual;
    Plywood.Timezone = Chronoshift.Timezone;
    Plywood.Duration = Chronoshift.Duration;
    Plywood.WallTime = Chronoshift.WallTime;
    Plywood.parseISODate = Chronoshift.parseISODate;
    Plywood.defaultParserTimezone = Plywood.Timezone.UTC;
    function safeAdd(num, delta) {
        var stringDelta = String(delta);
        var dotIndex = stringDelta.indexOf(".");
        if (dotIndex === -1 || stringDelta.length === 18) {
            return num + delta;
        }
        else {
            var scale = Math.pow(10, stringDelta.length - dotIndex - 1);
            return (num * scale + delta * scale) / scale;
        }
    }
    Plywood.safeAdd = safeAdd;
    function continuousFloorExpression(variable, floorFn, size, offset) {
        var expr = variable;
        if (offset !== 0) {
            expr = expr + " - " + offset;
        }
        if (offset !== 0 && size !== 1) {
            expr = "(" + expr + ")";
        }
        if (size !== 1) {
            expr = expr + " / " + size;
        }
        expr = floorFn + "(" + expr + ")";
        if (size !== 1) {
            expr = expr + " * " + size;
        }
        if (offset !== 0) {
            expr = expr + " + " + offset;
        }
        return expr;
    }
    Plywood.continuousFloorExpression = continuousFloorExpression;
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var SQLDialect = (function () {
        function SQLDialect() {
        }
        SQLDialect.prototype.constantGroupBy = function () {
            return "GROUP BY ''";
        };
        SQLDialect.prototype.escapeName = function (name) {
            name = name.replace(/"/g, '""');
            return '"' + name + '"';
        };
        SQLDialect.prototype.escapeLiteral = function (name) {
            name = name.replace(/'/g, "''");
            return "'" + name + "'";
        };
        SQLDialect.prototype.booleanToSQL = function (bool) {
            return ('' + bool).toUpperCase();
        };
        SQLDialect.prototype.numberOrTimeToSQL = function (x) {
            if (x === null)
                return 'NULL';
            if (x.toISOString) {
                return this.timeToSQL(x);
            }
            else {
                return this.numberToSQL(x);
            }
        };
        SQLDialect.prototype.numberToSQL = function (num) {
            if (num === null)
                return 'NULL';
            return '' + num;
        };
        SQLDialect.prototype.dateToSQLDateString = function (date) {
            return date.toISOString()
                .replace('T', ' ')
                .replace('Z', '')
                .replace(/\.000$/, '')
                .replace(/ 00:00:00$/, '');
        };
        SQLDialect.prototype.timeToSQL = function (date) {
            throw new Error('must implement');
        };
        SQLDialect.prototype.aggregateFilterIfNeeded = function (inputSQL, expressionSQL, zeroSQL) {
            if (zeroSQL === void 0) { zeroSQL = '0'; }
            var whereIndex = inputSQL.indexOf(' WHERE ');
            if (whereIndex === -1)
                return expressionSQL;
            var filterSQL = inputSQL.substr(whereIndex + 7);
            return this.conditionalExpression(filterSQL, expressionSQL, zeroSQL);
        };
        SQLDialect.prototype.conditionalExpression = function (condition, thenPart, elsePart) {
            return "IF(" + condition + "," + thenPart + "," + elsePart + ")";
        };
        SQLDialect.prototype.concatExpression = function (a, b) {
            throw new Error('must implement');
        };
        SQLDialect.prototype.containsExpression = function (a, b) {
            throw new Error('must implement');
        };
        SQLDialect.prototype.isNotDistinctFromExpression = function (a, b) {
            if (a === 'NULL')
                return b + " IS NULL";
            if (b === 'NULL')
                return a + " IS NULL";
            return "(" + a + " IS NOT DISTINCT FROM " + b + ")";
        };
        SQLDialect.prototype.regexpExpression = function (expression, regexp) {
            throw new Error('must implement');
        };
        SQLDialect.prototype.inExpression = function (operand, start, end, bounds) {
            if (start === end && bounds === '[]')
                return operand + "=" + start;
            var startSQL = null;
            if (start !== 'NULL') {
                startSQL = start + (bounds[0] === '[' ? '<=' : '<') + operand;
            }
            var endSQL = null;
            if (end !== 'NULL') {
                endSQL = operand + (bounds[1] === ']' ? '<=' : '<') + end;
            }
            if (startSQL) {
                return endSQL ? "(" + startSQL + " AND " + endSQL + ")" : startSQL;
            }
            else {
                return endSQL ? endSQL : 'TRUE';
            }
        };
        SQLDialect.prototype.timeFloorExpression = function (operand, duration, timezone) {
            throw new Error('Dialect must implement timeFloorExpression');
        };
        SQLDialect.prototype.timeBucketExpression = function (operand, duration, timezone) {
            throw new Error('Dialect must implement timeBucketExpression');
        };
        SQLDialect.prototype.timePartExpression = function (operand, part, timezone) {
            throw new Error('Dialect must implement timePartExpression');
        };
        SQLDialect.prototype.timeShiftExpression = function (operand, duration, timezone) {
            throw new Error('Dialect must implement timeShiftExpression');
        };
        SQLDialect.prototype.extractExpression = function (operand, regexp) {
            throw new Error('Dialect must implement extractExpression');
        };
        return SQLDialect;
    }());
    Plywood.SQLDialect = SQLDialect;
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var MySQLDialect = (function (_super) {
        __extends(MySQLDialect, _super);
        function MySQLDialect() {
            _super.call(this);
        }
        MySQLDialect.prototype.escapeName = function (name) {
            name = name.replace(/`/g, '``');
            return '`' + name + '`';
        };
        MySQLDialect.prototype.escapeLiteral = function (name) {
            return JSON.stringify(name);
        };
        MySQLDialect.prototype.timeToSQL = function (date) {
            if (!date)
                return 'NULL';
            return "TIMESTAMP('" + this.dateToSQLDateString(date) + "')";
        };
        MySQLDialect.prototype.concatExpression = function (a, b) {
            return "CONCAT(" + a + "," + b + ")";
        };
        MySQLDialect.prototype.containsExpression = function (a, b) {
            return "LOCATE(" + a + "," + b + ")>0";
        };
        MySQLDialect.prototype.isNotDistinctFromExpression = function (a, b) {
            return "(" + a + "<=>" + b + ")";
        };
        MySQLDialect.prototype.regexpExpression = function (expression, regexp) {
            return "(" + expression + " REGEXP '" + regexp + "')";
        };
        MySQLDialect.prototype.utcToWalltime = function (operand, timezone) {
            if (timezone.isUTC())
                return operand;
            return "CONVERT_TZ(" + operand + ",'+0:00','" + timezone + "')";
        };
        MySQLDialect.prototype.walltimeToUTC = function (operand, timezone) {
            if (timezone.isUTC())
                return operand;
            return "CONVERT_TZ(" + operand + ",'" + timezone + "','+0:00')";
        };
        MySQLDialect.prototype.timeFloorExpression = function (operand, duration, timezone) {
            var bucketFormat = MySQLDialect.TIME_BUCKETING[duration.toString()];
            if (!bucketFormat)
                throw new Error("unsupported duration '" + duration + "'");
            return this.walltimeToUTC("DATE_FORMAT(" + this.utcToWalltime(operand, timezone) + ",'" + bucketFormat + "')", timezone);
        };
        MySQLDialect.prototype.timeBucketExpression = function (operand, duration, timezone) {
            return this.timeFloorExpression(operand, duration, timezone);
        };
        MySQLDialect.prototype.timePartExpression = function (operand, part, timezone) {
            var timePartFunction = MySQLDialect.TIME_PART_TO_FUNCTION[part];
            if (!timePartFunction)
                throw new Error("unsupported part " + part + " in MySQL dialect");
            return timePartFunction.replace(/\$\$/g, this.utcToWalltime(operand, timezone));
        };
        MySQLDialect.prototype.timeShiftExpression = function (operand, duration, timezone) {
            var sqlFn = "DATE_ADD(";
            var spans = duration.valueOf();
            if (spans.week) {
                return sqlFn + operand + ", INTERVAL " + String(spans.week) + ' WEEK)';
            }
            if (spans.year || spans.month) {
                var expr = String(spans.year || 0) + "-" + String(spans.month || 0);
                operand = sqlFn + operand + ", INTERVAL '" + expr + "' YEAR_MONTH)";
            }
            if (spans.day || spans.hour || spans.minute || spans.second) {
                var expr = String(spans.day || 0) + " " + [spans.hour || 0, spans.minute || 0, spans.second || 0].join(':');
                operand = sqlFn + operand + ", INTERVAL '" + expr + "' DAY_SECOND)";
            }
            return operand;
        };
        MySQLDialect.prototype.extractExpression = function (operand, regexp) {
            throw new Error('MySQL must implement extractExpression (https://github.com/mysqludf/lib_mysqludf_preg)');
        };
        MySQLDialect.TIME_BUCKETING = {
            "PT1S": "%Y-%m-%d %H:%i:%SZ",
            "PT1M": "%Y-%m-%d %H:%i:00Z",
            "PT1H": "%Y-%m-%d %H:00:00Z",
            "P1D": "%Y-%m-%d 00:00:00Z",
            "P1M": "%Y-%m-01 00:00:00Z",
            "P1Y": "%Y-01-01 00:00:00Z"
        };
        MySQLDialect.TIME_PART_TO_FUNCTION = {
            SECOND_OF_MINUTE: 'SECOND($$)',
            SECOND_OF_HOUR: '(MINUTE($$)*60+SECOND($$))',
            SECOND_OF_DAY: '((HOUR($$)*60+MINUTE($$))*60+SECOND($$))',
            SECOND_OF_WEEK: '(((WEEKDAY($$)*24)+HOUR($$)*60+MINUTE($$))*60+SECOND($$))',
            SECOND_OF_MONTH: '((((DAYOFMONTH($$)-1)*24)+HOUR($$)*60+MINUTE($$))*60+SECOND($$))',
            SECOND_OF_YEAR: '((((DAYOFYEAR($$)-1)*24)+HOUR($$)*60+MINUTE($$))*60+SECOND($$))',
            MINUTE_OF_HOUR: 'MINUTE($$)',
            MINUTE_OF_DAY: 'HOUR($$)*60+MINUTE($$)',
            MINUTE_OF_WEEK: '(WEEKDAY($$)*24)+HOUR($$)*60+MINUTE($$)',
            MINUTE_OF_MONTH: '((DAYOFMONTH($$)-1)*24)+HOUR($$)*60+MINUTE($$)',
            MINUTE_OF_YEAR: '((DAYOFYEAR($$)-1)*24)+HOUR($$)*60+MINUTE($$)',
            HOUR_OF_DAY: 'HOUR($$)',
            HOUR_OF_WEEK: '(WEEKDAY($$)*24+HOUR($$))',
            HOUR_OF_MONTH: '((DAYOFMONTH($$)-1)*24+HOUR($$))',
            HOUR_OF_YEAR: '((DAYOFYEAR($$)-1)*24+HOUR($$))',
            DAY_OF_WEEK: '(WEEKDAY($$)+1)',
            DAY_OF_MONTH: 'DAYOFMONTH($$)',
            DAY_OF_YEAR: 'DAYOFYEAR($$)',
            WEEK_OF_MONTH: null,
            WEEK_OF_YEAR: 'WEEK($$)',
            MONTH_OF_YEAR: 'MONTH($$)',
            YEAR: 'YEAR($$)'
        };
        return MySQLDialect;
    }(Plywood.SQLDialect));
    Plywood.MySQLDialect = MySQLDialect;
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var PostgresDialect = (function (_super) {
        __extends(PostgresDialect, _super);
        function PostgresDialect() {
            _super.call(this);
        }
        PostgresDialect.prototype.constantGroupBy = function () {
            return "GROUP BY ''=''";
        };
        PostgresDialect.prototype.timeToSQL = function (date) {
            if (!date)
                return 'NULL';
            return "TIMESTAMP '" + this.dateToSQLDateString(date) + "'";
        };
        PostgresDialect.prototype.conditionalExpression = function (condition, thenPart, elsePart) {
            return "(CASE WHEN " + condition + " THEN " + thenPart + " ELSE " + elsePart + " END)";
        };
        PostgresDialect.prototype.concatExpression = function (a, b) {
            return "(" + a + "||" + b + ")";
        };
        PostgresDialect.prototype.containsExpression = function (a, b) {
            return "POSITION(" + a + " IN " + b + ")>0";
        };
        PostgresDialect.prototype.regexpExpression = function (expression, regexp) {
            return "(" + expression + " ~ '" + regexp + "')";
        };
        PostgresDialect.prototype.utcToWalltime = function (operand, timezone) {
            if (timezone.isUTC())
                return operand;
            return "(" + operand + " AT TIME ZONE 'UTC' AT TIME ZONE '" + timezone + "')";
        };
        PostgresDialect.prototype.walltimeToUTC = function (operand, timezone) {
            if (timezone.isUTC())
                return operand;
            return "(" + operand + " AT TIME ZONE '" + timezone + "' AT TIME ZONE 'UTC')";
        };
        PostgresDialect.prototype.timeFloorExpression = function (operand, duration, timezone) {
            var bucketFormat = PostgresDialect.TIME_BUCKETING[duration.toString()];
            if (!bucketFormat)
                throw new Error("unsupported duration '" + duration + "'");
            return this.walltimeToUTC("DATE_TRUNC('" + bucketFormat + "'," + this.utcToWalltime(operand, timezone) + ")", timezone);
        };
        PostgresDialect.prototype.timeBucketExpression = function (operand, duration, timezone) {
            return this.timeFloorExpression(operand, duration, timezone);
        };
        PostgresDialect.prototype.timePartExpression = function (operand, part, timezone) {
            var timePartFunction = PostgresDialect.TIME_PART_TO_FUNCTION[part];
            if (!timePartFunction)
                throw new Error("unsupported part " + part + " in MySQL dialect");
            return timePartFunction.replace(/\$\$/g, this.utcToWalltime(operand, timezone));
        };
        PostgresDialect.prototype.timeShiftExpression = function (operand, duration, timezone) {
            var sqlFn = "DATE_ADD(";
            var spans = duration.valueOf();
            if (spans.week) {
                return sqlFn + operand + ", INTERVAL " + String(spans.week) + ' WEEK)';
            }
            if (spans.year || spans.month) {
                var expr = String(spans.year || 0) + "-" + String(spans.month || 0);
                operand = sqlFn + operand + ", INTERVAL '" + expr + "' YEAR_MONTH)";
            }
            if (spans.day || spans.hour || spans.minute || spans.second) {
                var expr = String(spans.day || 0) + " " + [spans.hour || 0, spans.minute || 0, spans.second || 0].join(':');
                operand = sqlFn + operand + ", INTERVAL '" + expr + "' DAY_SECOND)";
            }
            return operand;
        };
        PostgresDialect.prototype.extractExpression = function (operand, regexp) {
            return "(SELECT (REGEXP_MATCHES(" + operand + ", '" + regexp + "'))[1])";
        };
        PostgresDialect.TIME_BUCKETING = {
            "PT1S": "second",
            "PT1M": "minute",
            "PT1H": "hour",
            "P1D": "day",
            "P1W": "week",
            "P1M": "month",
            "P3M": "quarter",
            "P1Y": "year"
        };
        PostgresDialect.TIME_PART_TO_FUNCTION = {
            SECOND_OF_MINUTE: "DATE_PART('second',$$)",
            SECOND_OF_HOUR: "(DATE_PART('minute',$$)*60+DATE_PART('second',$$))",
            SECOND_OF_DAY: "((DATE_PART('hour',$$)*60+DATE_PART('minute',$$))*60+DATE_PART('second',$$))",
            SECOND_OF_WEEK: "((((CAST((DATE_PART('dow',$$)+6) AS int)%7)*24)+DATE_PART('hour',$$)*60+DATE_PART('minute',$$))*60+DATE_PART('second',$$))",
            SECOND_OF_MONTH: "((((DATE_PART('day',$$)-1)*24)+DATE_PART('hour',$$)*60+DATE_PART('minute',$$))*60+DATE_PART('second',$$))",
            SECOND_OF_YEAR: "((((DATE_PART('doy',$$)-1)*24)+DATE_PART('hour',$$)*60+DATE_PART('minute',$$))*60+DATE_PART('second',$$))",
            MINUTE_OF_HOUR: "DATE_PART('minute',$$)",
            MINUTE_OF_DAY: "DATE_PART('hour',$$)*60+DATE_PART('minute',$$)",
            MINUTE_OF_WEEK: "((CAST((DATE_PART('dow',$$)+6) AS int)%7)*24)+DATE_PART('hour',$$)*60+DATE_PART('minute',$$)",
            MINUTE_OF_MONTH: "((DATE_PART('day',$$)-1)*24)+DATE_PART('hour',$$)*60+DATE_PART('minute',$$)",
            MINUTE_OF_YEAR: "((DATE_PART('doy',$$)-1)*24)+DATE_PART('hour',$$)*60+DATE_PART('minute',$$)",
            HOUR_OF_DAY: "DATE_PART('hour',$$)",
            HOUR_OF_WEEK: "((CAST((DATE_PART('dow',$$)+6) AS int)%7)*24+DATE_PART('hour',$$))",
            HOUR_OF_MONTH: "((DATE_PART('day',$$)-1)*24+DATE_PART('hour',$$))",
            HOUR_OF_YEAR: "((DATE_PART('doy',$$)-1)*24+DATE_PART('hour',$$))",
            DAY_OF_WEEK: "(CAST((DATE_PART('dow',$$)+6) AS int)%7)+1",
            DAY_OF_MONTH: "DATE_PART('day',$$)",
            DAY_OF_YEAR: "DATE_PART('doy',$$)",
            WEEK_OF_MONTH: null,
            WEEK_OF_YEAR: "DATE_PART('week',$$)",
            MONTH_OF_YEAR: "DATE_PART('month',$$)",
            YEAR: "DATE_PART('year',$$)"
        };
        return PostgresDialect;
    }(Plywood.SQLDialect));
    Plywood.PostgresDialect = PostgresDialect;
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    function isDate(dt) {
        return !!(dt && dt.toISOString);
    }
    Plywood.isDate = isDate;
    function getValueType(value) {
        var typeofValue = typeof value;
        if (typeofValue === 'object') {
            if (value === null) {
                return 'NULL';
            }
            else if (isDate(value)) {
                return 'TIME';
            }
            else if (hasOwnProperty(value, 'start') && hasOwnProperty(value, 'end')) {
                if (isDate(value.start) || isDate(value.end))
                    return 'TIME_RANGE';
                if (typeof value.start === 'number' || typeof value.end === 'number')
                    return 'NUMBER_RANGE';
                throw new Error("unrecognizable range");
            }
            else {
                var ctrType = value.constructor.type;
                if (!ctrType) {
                    if (Plywood.Expression.isExpression(value)) {
                        throw new Error("expression used as datum value " + value);
                    }
                    else {
                        throw new Error("can not have an object without a type: " + JSON.stringify(value));
                    }
                }
                if (ctrType === 'SET')
                    ctrType += '/' + value.setType;
                return ctrType;
            }
        }
        else {
            if (typeofValue !== 'boolean' && typeofValue !== 'number' && typeofValue !== 'string') {
                throw new TypeError('unsupported JS type ' + typeofValue);
            }
            return typeofValue.toUpperCase();
        }
    }
    Plywood.getValueType = getValueType;
    function getFullType(value) {
        var myType = getValueType(value);
        return myType === 'DATASET' ? value.getFullType() : { type: myType };
    }
    Plywood.getFullType = getFullType;
    function getFullTypeFromDatum(datum) {
        var datasetType = {};
        for (var k in datum) {
            if (!hasOwnProperty(datum, k))
                continue;
            datasetType[k] = getFullType(datum[k]);
        }
        return {
            type: 'DATASET',
            datasetType: datasetType
        };
    }
    Plywood.getFullTypeFromDatum = getFullTypeFromDatum;
    function valueFromJS(v, typeOverride) {
        if (typeOverride === void 0) { typeOverride = null; }
        if (v == null) {
            return null;
        }
        else if (Array.isArray(v)) {
            if (v.length && typeof v[0] !== 'object') {
                return Plywood.Set.fromJS(v);
            }
            else {
                return Plywood.Dataset.fromJS(v);
            }
        }
        else if (typeof v === 'object') {
            switch (typeOverride || v.type) {
                case 'NUMBER':
                    var n = Number(v.value);
                    if (isNaN(n))
                        throw new Error("bad number value '" + v.value + "'");
                    return n;
                case 'NUMBER_RANGE':
                    return Plywood.NumberRange.fromJS(v);
                case 'TIME':
                    return typeOverride ? v : new Date(v.value);
                case 'TIME_RANGE':
                    return Plywood.TimeRange.fromJS(v);
                case 'SET':
                    return Plywood.Set.fromJS(v);
                default:
                    if (v.toISOString) {
                        return v;
                    }
                    else {
                        throw new Error('can not have an object without a `type` as a datum value');
                    }
            }
        }
        else if (typeof v === 'string' && typeOverride === 'TIME') {
            return new Date(v);
        }
        return v;
    }
    Plywood.valueFromJS = valueFromJS;
    function valueToJS(v) {
        if (v == null) {
            return null;
        }
        else {
            var typeofV = typeof v;
            if (typeofV === 'object') {
                if (v.toISOString) {
                    return v;
                }
                else {
                    return v.toJS();
                }
            }
            else if (typeofV === 'number' && !isFinite(v)) {
                return String(v);
            }
        }
        return v;
    }
    Plywood.valueToJS = valueToJS;
    function valueToJSInlineType(v) {
        if (v == null) {
            return null;
        }
        else {
            var typeofV = typeof v;
            if (typeofV === 'object') {
                if (v.toISOString) {
                    return { type: 'TIME', value: v };
                }
                else {
                    var js = v.toJS();
                    if (!Array.isArray(js)) {
                        js.type = v.constructor.type;
                    }
                    return js;
                }
            }
            else if (typeofV === 'number' && !isFinite(v)) {
                return { type: 'NUMBER', value: String(v) };
            }
        }
        return v;
    }
    Plywood.valueToJSInlineType = valueToJSInlineType;
    function datumHasExternal(datum) {
        for (var name in datum) {
            var value = datum[name];
            if (value instanceof Plywood.External)
                return true;
            if (value instanceof Plywood.Dataset && value.hasExternal())
                return true;
        }
        return false;
    }
    Plywood.datumHasExternal = datumHasExternal;
    function introspectDatum(datum) {
        var promises = [];
        var newDatum = Object.create(null);
        Object.keys(datum)
            .forEach(function (name) {
            var v = datum[name];
            if (v instanceof Plywood.External && v.needsIntrospect()) {
                promises.push(v.introspect().then(function (introspectedExternal) {
                    newDatum[name] = introspectedExternal;
                }));
            }
            else {
                newDatum[name] = v;
            }
        });
        return Q.all(promises).then(function () { return newDatum; });
    }
    Plywood.introspectDatum = introspectDatum;
    function isSetType(type) {
        return type && type.indexOf('SET/') === 0;
    }
    Plywood.isSetType = isSetType;
    function wrapSetType(type) {
        return isSetType(type) ? type : ('SET/' + type);
    }
    Plywood.wrapSetType = wrapSetType;
    function unwrapSetType(type) {
        if (!type)
            return null;
        return isSetType(type) ? type.substr(4) : type;
    }
    Plywood.unwrapSetType = unwrapSetType;
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    function isInteger(n) {
        return !isNaN(n) && n % 1 === 0;
    }
    function isPositiveInteger(n) {
        return isInteger(n) && 0 < n;
    }
    var check;
    var AttributeInfo = (function () {
        function AttributeInfo(parameters) {
            if (parameters.special)
                this.special = parameters.special;
            if (typeof parameters.name !== "string") {
                throw new Error("name must be a string");
            }
            this.name = parameters.name;
            if (hasOwnProperty(parameters, 'type') && !Plywood.RefExpression.validType(parameters.type)) {
                throw new Error("invalid type: " + parameters.type);
            }
            this.type = parameters.type;
            this.datasetType = parameters.datasetType;
            this.unsplitable = Boolean(parameters.unsplitable);
            this.makerAction = parameters.makerAction;
        }
        AttributeInfo.isAttributeInfo = function (candidate) {
            return Plywood.isInstanceOf(candidate, AttributeInfo);
        };
        AttributeInfo.jsToValue = function (parameters) {
            var value = {
                special: parameters.special,
                name: parameters.name
            };
            if (parameters.type)
                value.type = parameters.type;
            if (parameters.datasetType)
                value.datasetType = parameters.datasetType;
            if (parameters.unsplitable)
                value.unsplitable = true;
            if (parameters.makerAction)
                value.makerAction = Plywood.Action.fromJS(parameters.makerAction);
            return value;
        };
        AttributeInfo.register = function (ex) {
            var op = ex.name.replace('AttributeInfo', '').replace(/^\w/, function (s) { return s.toLowerCase(); });
            AttributeInfo.classMap[op] = ex;
        };
        AttributeInfo.fromJS = function (parameters) {
            if (typeof parameters !== "object") {
                throw new Error("unrecognizable attributeMeta");
            }
            if (!hasOwnProperty(parameters, 'special')) {
                return new AttributeInfo(AttributeInfo.jsToValue(parameters));
            }
            var Class = AttributeInfo.classMap[parameters.special];
            if (!Class) {
                throw new Error("unsupported special attributeInfo '" + parameters.special + "'");
            }
            return Class.fromJS(parameters);
        };
        AttributeInfo.fromJSs = function (attributeJSs) {
            if (!Array.isArray(attributeJSs)) {
                if (attributeJSs && typeof attributeJSs === 'object') {
                    var newAttributeJSs = [];
                    for (var attributeName in attributeJSs) {
                        if (!hasOwnProperty(attributeJSs, attributeName))
                            continue;
                        var attributeJS = attributeJSs[attributeName];
                        attributeJS['name'] = attributeName;
                        newAttributeJSs.push(attributeJS);
                    }
                    console.warn('attributes now needs to be passed as an array like so: ' + JSON.stringify(newAttributeJSs, null, 2));
                    attributeJSs = newAttributeJSs;
                }
                else {
                    throw new TypeError("invalid attributeJSs");
                }
            }
            return attributeJSs.map(function (attributeJS) { return AttributeInfo.fromJS(attributeJS); });
        };
        AttributeInfo.toJSs = function (attributes) {
            return attributes.map(function (attribute) { return attribute.toJS(); });
        };
        AttributeInfo.override = function (attributes, attributeOverrides) {
            return Plywood.helper.overridesByName(attributes, attributeOverrides);
        };
        AttributeInfo.prototype._ensureSpecial = function (special) {
            if (!this.special) {
                this.special = special;
                return;
            }
            if (this.special !== special) {
                throw new TypeError("incorrect attributeInfo special '" + this.special + "' (needs to be: '" + special + "')");
            }
        };
        AttributeInfo.prototype._ensureType = function (myType) {
            if (!this.type) {
                this.type = myType;
                return;
            }
            if (this.type !== myType) {
                throw new TypeError("incorrect attributeInfo type '" + this.type + "' (needs to be: '" + myType + "')");
            }
        };
        AttributeInfo.prototype.toString = function () {
            var special = this.special ? "[" + this.special + "]" : '';
            return this.name + "::" + this.type + special;
        };
        AttributeInfo.prototype.valueOf = function () {
            var value = {
                name: this.name,
                type: this.type,
                unsplitable: this.unsplitable
            };
            if (this.special)
                value.special = this.special;
            if (this.datasetType)
                value.datasetType = this.datasetType;
            if (this.makerAction)
                value.makerAction = this.makerAction;
            return value;
        };
        AttributeInfo.prototype.toJS = function () {
            var js = {
                name: this.name,
                type: this.type
            };
            if (this.unsplitable)
                js.unsplitable = true;
            if (this.special)
                js.special = this.special;
            if (this.datasetType)
                js.datasetType = this.datasetType;
            if (this.makerAction)
                js.makerAction = this.makerAction.toJS();
            return js;
        };
        AttributeInfo.prototype.toJSON = function () {
            return this.toJS();
        };
        AttributeInfo.prototype.equals = function (other) {
            return AttributeInfo.isAttributeInfo(other) &&
                this.special === other.special &&
                this.name === other.name &&
                this.type === other.type &&
                Boolean(this.makerAction) === Boolean(other.makerAction) &&
                (!this.makerAction || this.makerAction.equals(other.makerAction));
        };
        AttributeInfo.prototype.serialize = function (value) {
            return value;
        };
        AttributeInfo.classMap = {};
        return AttributeInfo;
    }());
    Plywood.AttributeInfo = AttributeInfo;
    check = AttributeInfo;
    var RangeAttributeInfo = (function (_super) {
        __extends(RangeAttributeInfo, _super);
        function RangeAttributeInfo(parameters) {
            _super.call(this, parameters);
            this.separator = parameters.separator || ';';
            this.rangeSize = parameters.rangeSize;
            this.digitsBeforeDecimal = parameters.digitsBeforeDecimal;
            this.digitsAfterDecimal = parameters.digitsAfterDecimal;
            this._ensureSpecial("range");
            this._ensureType('NUMBER_RANGE');
            if (!(typeof this.separator === "string" && this.separator.length)) {
                throw new TypeError("`separator` must be a non-empty string");
            }
            if (typeof this.rangeSize !== "number") {
                throw new TypeError("`rangeSize` must be a number");
            }
            if (this.rangeSize > 1) {
                if (!isInteger(this.rangeSize)) {
                    throw new Error("`rangeSize` greater than 1 must be an integer");
                }
            }
            else {
                if (!isInteger(1 / this.rangeSize)) {
                    throw new Error("`rangeSize` less than 1 must divide 1");
                }
            }
            if (this.digitsBeforeDecimal != null) {
                if (!isPositiveInteger(this.digitsBeforeDecimal)) {
                    throw new Error("`digitsBeforeDecimal` must be a positive integer");
                }
            }
            else {
                this.digitsBeforeDecimal = null;
            }
            if (this.digitsAfterDecimal != null) {
                if (!isPositiveInteger(this.digitsAfterDecimal)) {
                    throw new Error("`digitsAfterDecimal` must be a positive integer");
                }
                var digitsInSize = (String(this.rangeSize).split(".")[1] || "").length;
                if (this.digitsAfterDecimal < digitsInSize) {
                    throw new Error("`digitsAfterDecimal` must be at least " + digitsInSize + " to accommodate for a `rangeSize` of " + this.rangeSize);
                }
            }
            else {
                this.digitsAfterDecimal = null;
            }
        }
        RangeAttributeInfo.fromJS = function (parameters) {
            var value = AttributeInfo.jsToValue(parameters);
            value.separator = parameters.separator;
            value.rangeSize = parameters.rangeSize;
            value.digitsBeforeDecimal = parameters.digitsBeforeDecimal;
            value.digitsAfterDecimal = parameters.digitsAfterDecimal;
            return new RangeAttributeInfo(value);
        };
        RangeAttributeInfo.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.separator = this.separator;
            value.rangeSize = this.rangeSize;
            if (this.digitsBeforeDecimal !== null)
                value.digitsBeforeDecimal = this.digitsBeforeDecimal;
            if (this.digitsAfterDecimal !== null)
                value.digitsAfterDecimal = this.digitsAfterDecimal;
            return value;
        };
        RangeAttributeInfo.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.separator = this.separator;
            js.rangeSize = this.rangeSize;
            if (this.digitsBeforeDecimal !== null)
                js.digitsBeforeDecimal = this.digitsBeforeDecimal;
            if (this.digitsAfterDecimal !== null)
                js.digitsAfterDecimal = this.digitsAfterDecimal;
            return js;
        };
        RangeAttributeInfo.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.separator === other.separator &&
                this.rangeSize === other.rangeSize &&
                this.digitsBeforeDecimal === other.digitsBeforeDecimal &&
                this.digitsAfterDecimal === other.digitsAfterDecimal;
        };
        RangeAttributeInfo.prototype._serializeNumber = function (value) {
            if (value === null)
                return "";
            var valueStr = String(value);
            if (this.digitsBeforeDecimal === null && this.digitsAfterDecimal === null) {
                return valueStr;
            }
            var valueStrSplit = valueStr.split(".");
            var before = valueStrSplit[0];
            var after = valueStrSplit[1];
            if (this.digitsBeforeDecimal) {
                before = repeat("0", this.digitsBeforeDecimal - before.length) + before;
            }
            if (this.digitsAfterDecimal) {
                after || (after = "");
                after += repeat("0", this.digitsAfterDecimal - after.length);
            }
            valueStr = before;
            if (after)
                valueStr += "." + after;
            return valueStr;
        };
        RangeAttributeInfo.prototype.serialize = function (range) {
            if (!(Array.isArray(range) && range.length === 2))
                return null;
            return this._serializeNumber(range[0]) + this.separator + this._serializeNumber(range[1]);
        };
        RangeAttributeInfo.prototype.getMatchingRegExpString = function () {
            var separatorRegExp = this.separator.replace(/[.$^{[(|)*+?\\]/g, function (c) { return "\\" + c; });
            var beforeRegExp = this.digitsBeforeDecimal ? "-?\\d{" + this.digitsBeforeDecimal + "}" : "(?:-?[1-9]\\d*|0)";
            var afterRegExp = this.digitsAfterDecimal ? "\\.\\d{" + this.digitsAfterDecimal + "}" : "(?:\\.\\d*[1-9])?";
            var numberRegExp = beforeRegExp + afterRegExp;
            return "/^(" + numberRegExp + ")" + separatorRegExp + "(" + numberRegExp + ")$/";
        };
        return RangeAttributeInfo;
    }(AttributeInfo));
    Plywood.RangeAttributeInfo = RangeAttributeInfo;
    AttributeInfo.register(RangeAttributeInfo);
    var UniqueAttributeInfo = (function (_super) {
        __extends(UniqueAttributeInfo, _super);
        function UniqueAttributeInfo(parameters) {
            _super.call(this, parameters);
            this._ensureSpecial("unique");
            this._ensureType('STRING');
        }
        UniqueAttributeInfo.fromJS = function (parameters) {
            return new UniqueAttributeInfo(AttributeInfo.jsToValue(parameters));
        };
        UniqueAttributeInfo.prototype.serialize = function (value) {
            throw new Error("can not serialize an approximate unique value");
        };
        return UniqueAttributeInfo;
    }(AttributeInfo));
    Plywood.UniqueAttributeInfo = UniqueAttributeInfo;
    AttributeInfo.register(UniqueAttributeInfo);
    var ThetaAttributeInfo = (function (_super) {
        __extends(ThetaAttributeInfo, _super);
        function ThetaAttributeInfo(parameters) {
            _super.call(this, parameters);
            this._ensureSpecial("theta");
            this._ensureType('STRING');
        }
        ThetaAttributeInfo.fromJS = function (parameters) {
            return new ThetaAttributeInfo(AttributeInfo.jsToValue(parameters));
        };
        ThetaAttributeInfo.prototype.serialize = function (value) {
            throw new Error("can not serialize a theta value");
        };
        return ThetaAttributeInfo;
    }(AttributeInfo));
    Plywood.ThetaAttributeInfo = ThetaAttributeInfo;
    AttributeInfo.register(ThetaAttributeInfo);
    var HistogramAttributeInfo = (function (_super) {
        __extends(HistogramAttributeInfo, _super);
        function HistogramAttributeInfo(parameters) {
            _super.call(this, parameters);
            this._ensureSpecial("histogram");
            this._ensureType('NUMBER');
        }
        HistogramAttributeInfo.fromJS = function (parameters) {
            return new HistogramAttributeInfo(AttributeInfo.jsToValue(parameters));
        };
        HistogramAttributeInfo.prototype.serialize = function (value) {
            throw new Error("can not serialize a histogram value");
        };
        return HistogramAttributeInfo;
    }(AttributeInfo));
    Plywood.HistogramAttributeInfo = HistogramAttributeInfo;
    AttributeInfo.register(HistogramAttributeInfo);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var BOUNDS_REG_EXP = /^[\[(][\])]$/;
    var Range = (function () {
        function Range(start, end, bounds) {
            if (bounds) {
                if (!BOUNDS_REG_EXP.test(bounds)) {
                    throw new Error("invalid bounds " + bounds);
                }
            }
            else {
                bounds = Range.DEFAULT_BOUNDS;
            }
            if (start !== null && end !== null && this._endpointEqual(start, end)) {
                if (bounds !== '[]') {
                    start = end = this._zeroEndpoint();
                }
                if (bounds === '(]' || bounds === '()')
                    this.bounds = '[)';
            }
            else {
                if (start !== null && end !== null && end < start) {
                    throw new Error('must have start <= end');
                }
                if (start === null && bounds[0] === '[') {
                    bounds = '(' + bounds[1];
                }
                if (end === null && bounds[1] === ']') {
                    bounds = bounds[0] + ')';
                }
            }
            this.start = start;
            this.end = end;
            this.bounds = bounds;
        }
        Range.isRange = function (candidate) {
            return Plywood.isInstanceOf(candidate, Range);
        };
        Range.fromJS = function (parameters) {
            if (typeof parameters.start === 'number' || typeof parameters.end === 'number') {
                return Plywood.NumberRange.fromJS(parameters);
            }
            else {
                return Plywood.TimeRange.fromJS(parameters);
            }
        };
        Range.prototype._zeroEndpoint = function () {
            return 0;
        };
        Range.prototype._endpointEqual = function (a, b) {
            return a === b;
        };
        Range.prototype._endpointToString = function (a) {
            return String(a);
        };
        Range.prototype._equalsHelper = function (other) {
            return Boolean(other) &&
                this.bounds === other.bounds &&
                this._endpointEqual(this.start, other.start) &&
                this._endpointEqual(this.end, other.end);
        };
        Range.prototype.toString = function () {
            var bounds = this.bounds;
            return bounds[0] + this._endpointToString(this.start) + ',' + this._endpointToString(this.end) + bounds[1];
        };
        Range.prototype.compare = function (other) {
            var myStart = this.start;
            var otherStart = other.start;
            return myStart < otherStart ? -1 : (otherStart < myStart ? 1 : 0);
        };
        Range.prototype.openStart = function () {
            return this.bounds[0] === '(';
        };
        Range.prototype.openEnd = function () {
            return this.bounds[1] === ')';
        };
        Range.prototype.empty = function () {
            return this._endpointEqual(this.start, this.end) && this.bounds === '[)';
        };
        Range.prototype.degenerate = function () {
            return this._endpointEqual(this.start, this.end) && this.bounds === '[]';
        };
        Range.prototype.contains = function (val) {
            if (val === null)
                return false;
            var start = this.start;
            var end = this.end;
            var bounds = this.bounds;
            if (bounds[0] === '[') {
                if (val < start)
                    return false;
            }
            else {
                if (start !== null && val <= start)
                    return false;
            }
            if (bounds[1] === ']') {
                if (end < val)
                    return false;
            }
            else {
                if (end !== null && end <= val)
                    return false;
            }
            return true;
        };
        Range.prototype.intersects = function (other) {
            return this.contains(other.start) || this.contains(other.end)
                || other.contains(this.start) || other.contains(this.end)
                || this._equalsHelper(other);
        };
        Range.prototype.adjacent = function (other) {
            return (this._endpointEqual(this.end, other.start) && this.openEnd() !== other.openStart())
                || (this._endpointEqual(this.start, other.end) && this.openStart() !== other.openEnd());
        };
        Range.prototype.mergeable = function (other) {
            return this.intersects(other) || this.adjacent(other);
        };
        Range.prototype.union = function (other) {
            if (!this.mergeable(other))
                return null;
            return this.extend(other);
        };
        Range.prototype.extent = function () {
            return this;
        };
        Range.prototype.extend = function (other) {
            var thisStart = this.start;
            var thisEnd = this.end;
            var otherStart = other.start;
            var otherEnd = other.end;
            var start;
            var startBound;
            if (thisStart === null || otherStart === null) {
                start = null;
                startBound = '(';
            }
            else if (thisStart < otherStart) {
                start = thisStart;
                startBound = this.bounds[0];
            }
            else {
                start = otherStart;
                startBound = other.bounds[0];
            }
            var end;
            var endBound;
            if (thisEnd === null || otherEnd === null) {
                end = null;
                endBound = ')';
            }
            else if (thisEnd < otherEnd) {
                end = otherEnd;
                endBound = other.bounds[1];
            }
            else {
                end = thisEnd;
                endBound = this.bounds[1];
            }
            return new this.constructor({ start: start, end: end, bounds: startBound + endBound });
        };
        Range.prototype.intersect = function (other) {
            if (!this.mergeable(other))
                return null;
            var thisStart = this.start;
            var thisEnd = this.end;
            var otherStart = other.start;
            var otherEnd = other.end;
            var start;
            var startBound;
            if (thisStart === null || otherStart === null) {
                if (otherStart === null) {
                    start = thisStart;
                    startBound = this.bounds[0];
                }
                else {
                    start = otherStart;
                    startBound = other.bounds[0];
                }
            }
            else if (otherStart < thisStart) {
                start = thisStart;
                startBound = this.bounds[0];
            }
            else {
                start = otherStart;
                startBound = other.bounds[0];
            }
            var end;
            var endBound;
            if (thisEnd === null || otherEnd === null) {
                if (thisEnd == null) {
                    end = otherEnd;
                    endBound = other.bounds[1];
                }
                else {
                    end = thisEnd;
                    endBound = this.bounds[1];
                }
            }
            else if (otherEnd < thisEnd) {
                end = otherEnd;
                endBound = other.bounds[1];
            }
            else {
                end = thisEnd;
                endBound = this.bounds[1];
            }
            return new this.constructor({ start: start, end: end, bounds: startBound + endBound });
        };
        Range.DEFAULT_BOUNDS = '[)';
        return Range;
    }());
    Plywood.Range = Range;
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    function finiteOrNull(n) {
        return (isNaN(n) || isFinite(n)) ? n : null;
    }
    var check;
    var NumberRange = (function (_super) {
        __extends(NumberRange, _super);
        function NumberRange(parameters) {
            if (isNaN(parameters.start))
                throw new TypeError('`start` must be a number');
            if (isNaN(parameters.end))
                throw new TypeError('`end` must be a number');
            _super.call(this, parameters.start, parameters.end, parameters.bounds);
        }
        NumberRange.isNumberRange = function (candidate) {
            return Plywood.isInstanceOf(candidate, NumberRange);
        };
        NumberRange.numberBucket = function (num, size, offset) {
            var start = Math.floor((num - offset) / size) * size + offset;
            return new NumberRange({
                start: start,
                end: start + size,
                bounds: Plywood.Range.DEFAULT_BOUNDS
            });
        };
        NumberRange.fromNumber = function (n) {
            return new NumberRange({ start: n, end: n, bounds: '[]' });
        };
        NumberRange.fromJS = function (parameters) {
            if (typeof parameters !== "object") {
                throw new Error("unrecognizable numberRange");
            }
            var start = parameters.start;
            var end = parameters.end;
            return new NumberRange({
                start: start === null ? null : finiteOrNull(Number(start)),
                end: end === null ? null : finiteOrNull(Number(end)),
                bounds: parameters.bounds
            });
        };
        NumberRange.prototype.valueOf = function () {
            return {
                start: this.start,
                end: this.end,
                bounds: this.bounds
            };
        };
        NumberRange.prototype.toJS = function () {
            var js = {
                start: this.start,
                end: this.end
            };
            if (this.bounds !== Plywood.Range.DEFAULT_BOUNDS)
                js.bounds = this.bounds;
            return js;
        };
        NumberRange.prototype.toJSON = function () {
            return this.toJS();
        };
        NumberRange.prototype.equals = function (other) {
            return NumberRange.isNumberRange(other) && this._equalsHelper(other);
        };
        NumberRange.prototype.midpoint = function () {
            return (this.start + this.end) / 2;
        };
        NumberRange.type = 'NUMBER_RANGE';
        return NumberRange;
    }(Plywood.Range));
    Plywood.NumberRange = NumberRange;
    check = NumberRange;
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    function dateString(date) {
        return date.toISOString();
    }
    function arrayFromJS(xs, setType) {
        return xs.map(function (x) { return Plywood.valueFromJS(x, setType); });
    }
    function unifyElements(elements) {
        var newElements = Object.create(null);
        for (var _i = 0, elements_1 = elements; _i < elements_1.length; _i++) {
            var accumulator = elements_1[_i];
            var newElementsKeys = Object.keys(newElements);
            for (var _a = 0, newElementsKeys_1 = newElementsKeys; _a < newElementsKeys_1.length; _a++) {
                var newElementsKey = newElementsKeys_1[_a];
                var newElement = newElements[newElementsKey];
                var unionElement = accumulator.union(newElement);
                if (unionElement) {
                    accumulator = unionElement;
                    delete newElements[newElementsKey];
                }
            }
            newElements[accumulator.toString()] = accumulator;
        }
        return Object.keys(newElements).map(function (k) { return newElements[k]; });
    }
    function intersectElements(elements1, elements2) {
        var newElements = [];
        for (var _i = 0, elements1_1 = elements1; _i < elements1_1.length; _i++) {
            var element1 = elements1_1[_i];
            for (var _a = 0, elements2_1 = elements2; _a < elements2_1.length; _a++) {
                var element2 = elements2_1[_a];
                var intersect = element1.intersect(element2);
                if (intersect)
                    newElements.push(intersect);
            }
        }
        return newElements;
    }
    var typeUpgrades = {
        'NUMBER': 'NUMBER_RANGE',
        'TIME': 'TIME_RANGE'
    };
    var check;
    var Set = (function () {
        function Set(parameters) {
            var setType = parameters.setType;
            this.setType = setType;
            var keyFn = setType === 'TIME' ? dateString : String;
            this.keyFn = keyFn;
            var elements = parameters.elements;
            var newElements = null;
            var hash = Object.create(null);
            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];
                var key = keyFn(element);
                if (hash[key]) {
                    if (!newElements)
                        newElements = elements.slice(0, i);
                }
                else {
                    hash[key] = element;
                    if (newElements)
                        newElements.push(element);
                }
            }
            if (newElements) {
                elements = newElements;
            }
            if (setType === 'NUMBER_RANGE' || setType === 'TIME_RANGE') {
                elements = unifyElements(elements);
            }
            this.elements = elements;
            this.hash = hash;
        }
        Set.isSet = function (candidate) {
            return Plywood.isInstanceOf(candidate, Set);
        };
        Set.convertToSet = function (thing) {
            var thingType = Plywood.getValueType(thing);
            if (Plywood.isSetType(thingType))
                return thing;
            return Set.fromJS({ setType: thingType, elements: [thing] });
        };
        Set.generalUnion = function (a, b) {
            var aSet = Set.convertToSet(a);
            var bSet = Set.convertToSet(b);
            var aSetType = aSet.setType;
            var bSetType = bSet.setType;
            if (typeUpgrades[aSetType] === bSetType) {
                aSet = aSet.upgradeType();
            }
            else if (typeUpgrades[bSetType] === aSetType) {
                bSet = bSet.upgradeType();
            }
            else if (aSetType !== bSetType) {
                return null;
            }
            return aSet.union(bSet).simplify();
        };
        Set.generalIntersect = function (a, b) {
            var aSet = Set.convertToSet(a);
            var bSet = Set.convertToSet(b);
            var aSetType = aSet.setType;
            var bSetType = bSet.setType;
            if (typeUpgrades[aSetType] === bSetType) {
                aSet = aSet.upgradeType();
            }
            else if (typeUpgrades[bSetType] === aSetType) {
                bSet = bSet.upgradeType();
            }
            else if (aSetType !== bSetType) {
                return null;
            }
            return aSet.intersect(bSet).simplify();
        };
        Set.fromJS = function (parameters) {
            if (Array.isArray(parameters)) {
                parameters = { elements: parameters };
            }
            if (typeof parameters !== "object") {
                throw new Error("unrecognizable set");
            }
            var setType = parameters.setType;
            var elements = parameters.elements;
            if (!setType) {
                setType = Plywood.getValueType(elements.length ? elements[0] : null);
            }
            return new Set({
                setType: setType,
                elements: arrayFromJS(elements, setType)
            });
        };
        Set.prototype.valueOf = function () {
            return {
                setType: this.setType,
                elements: this.elements
            };
        };
        Set.prototype.toJS = function () {
            return {
                setType: this.setType,
                elements: this.elements.map(Plywood.valueToJS)
            };
        };
        Set.prototype.toJSON = function () {
            return this.toJS();
        };
        Set.prototype.toString = function () {
            if (this.setType === "NULL")
                return "null";
            return "" + this.elements.map(String).join(", ");
        };
        Set.prototype.equals = function (other) {
            return Set.isSet(other) &&
                this.setType === other.setType &&
                this.elements.length === other.elements.length &&
                this.elements.slice().sort().join('') === other.elements.slice().sort().join('');
        };
        Set.prototype.size = function () {
            return this.elements.length;
        };
        Set.prototype.empty = function () {
            return this.elements.length === 0;
        };
        Set.prototype.simplify = function () {
            var simpleSet = this.downgradeType();
            var simpleSetElements = simpleSet.elements;
            return simpleSetElements.length === 1 ? simpleSetElements[0] : simpleSet;
        };
        Set.prototype.getType = function () {
            return 'SET/' + this.setType;
        };
        Set.prototype.upgradeType = function () {
            if (this.setType === 'NUMBER') {
                return Set.fromJS({
                    setType: 'NUMBER_RANGE',
                    elements: this.elements.map(Plywood.NumberRange.fromNumber)
                });
            }
            else if (this.setType === 'TIME') {
                return Set.fromJS({
                    setType: 'TIME_RANGE',
                    elements: this.elements.map(Plywood.TimeRange.fromTime)
                });
            }
            else {
                return this;
            }
        };
        Set.prototype.downgradeType = function () {
            if (this.setType === 'NUMBER_RANGE' || this.setType === 'TIME_RANGE') {
                var elements = this.elements;
                var simpleElements = [];
                for (var _i = 0, elements_2 = elements; _i < elements_2.length; _i++) {
                    var element = elements_2[_i];
                    if (element.degenerate()) {
                        simpleElements.push(element.start);
                    }
                    else {
                        return this;
                    }
                }
                return Set.fromJS(simpleElements);
            }
            else {
                return this;
            }
        };
        Set.prototype.extent = function () {
            var setType = this.setType;
            if (hasOwnProperty(typeUpgrades, setType)) {
                return this.upgradeType().extent();
            }
            if (setType !== 'NUMBER_RANGE' && setType !== 'TIME_RANGE')
                return null;
            var elements = this.elements;
            var extent = elements[0] || null;
            for (var i = 1; i < elements.length; i++) {
                extent = extent.extend(elements[i]);
            }
            return extent;
        };
        Set.prototype.union = function (other) {
            if (this.empty())
                return other;
            if (other.empty())
                return this;
            if (this.setType !== other.setType) {
                throw new TypeError("can not union sets of different types");
            }
            var newElements = this.elements.slice();
            var otherElements = other.elements;
            for (var _i = 0, otherElements_1 = otherElements; _i < otherElements_1.length; _i++) {
                var el = otherElements_1[_i];
                if (this.contains(el))
                    continue;
                newElements.push(el);
            }
            return new Set({
                setType: this.setType,
                elements: newElements
            });
        };
        Set.prototype.intersect = function (other) {
            if (this.empty() || other.empty())
                return Set.EMPTY;
            var setType = this.setType;
            if (this.setType !== other.setType) {
                throw new TypeError("can not intersect sets of different types");
            }
            var thisElements = this.elements;
            var newElements;
            if (setType === 'NUMBER_RANGE' || setType === 'TIME_RANGE') {
                var otherElements = other.elements;
                newElements = intersectElements(thisElements, otherElements);
            }
            else {
                newElements = [];
                for (var _i = 0, thisElements_1 = thisElements; _i < thisElements_1.length; _i++) {
                    var el = thisElements_1[_i];
                    if (!other.contains(el))
                        continue;
                    newElements.push(el);
                }
            }
            return new Set({
                setType: this.setType,
                elements: newElements
            });
        };
        Set.prototype.overlap = function (other) {
            if (this.empty() || other.empty())
                return false;
            if (this.setType !== other.setType) {
                throw new TypeError("can determine overlap sets of different types");
            }
            var thisElements = this.elements;
            for (var _i = 0, thisElements_2 = thisElements; _i < thisElements_2.length; _i++) {
                var el = thisElements_2[_i];
                if (!other.contains(el))
                    continue;
                return true;
            }
            return false;
        };
        Set.prototype.contains = function (value) {
            var setType = this.setType;
            if ((setType === 'NUMBER_RANGE' && typeof value === 'number')
                || (setType === 'TIME_RANGE' && Plywood.isDate(value))) {
                return this.containsWithin(value);
            }
            return hasOwnProperty(this.hash, this.keyFn(value));
        };
        Set.prototype.containsWithin = function (value) {
            var elements = this.elements;
            for (var k in elements) {
                if (!hasOwnProperty(elements, k))
                    continue;
                if (elements[k].contains(value))
                    return true;
            }
            return false;
        };
        Set.prototype.add = function (value) {
            var setType = this.setType;
            var valueType = Plywood.getValueType(value);
            if (setType === 'NULL')
                setType = valueType;
            if (valueType !== 'NULL' && setType !== valueType)
                throw new Error('value type must match');
            if (this.contains(value))
                return this;
            return new Set({
                setType: setType,
                elements: this.elements.concat([value])
            });
        };
        Set.prototype.remove = function (value) {
            if (!this.contains(value))
                return this;
            var keyFn = this.keyFn;
            var key = keyFn(value);
            return new Set({
                setType: this.setType,
                elements: this.elements.filter(function (element) { return keyFn(element) !== key; })
            });
        };
        Set.prototype.toggle = function (value) {
            return this.contains(value) ? this.remove(value) : this.add(value);
        };
        Set.type = 'SET';
        return Set;
    }());
    Plywood.Set = Set;
    check = Set;
    Set.EMPTY = Set.fromJS([]);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    function toDate(date, name) {
        if (date === null)
            return null;
        if (typeof date === "undefined")
            throw new TypeError("timeRange must have a " + name);
        if (typeof date === 'string' || typeof date === 'number')
            date = Plywood.parseISODate(date, Plywood.defaultParserTimezone);
        if (!date.getDay)
            throw new TypeError("timeRange must have a " + name + " that is a Date");
        return date;
    }
    var START_OF_TIME = "1000";
    var END_OF_TIME = "3000";
    function dateToIntervalPart(date) {
        return date.toISOString()
            .replace('.000Z', 'Z')
            .replace(':00Z', 'Z')
            .replace(':00Z', 'Z');
    }
    var check;
    var TimeRange = (function (_super) {
        __extends(TimeRange, _super);
        function TimeRange(parameters) {
            _super.call(this, parameters.start, parameters.end, parameters.bounds);
        }
        TimeRange.isTimeRange = function (candidate) {
            return Plywood.isInstanceOf(candidate, TimeRange);
        };
        TimeRange.intervalFromDate = function (date) {
            return dateToIntervalPart(date) + '/' + dateToIntervalPart(new Date(date.valueOf() + 1));
        };
        TimeRange.timeBucket = function (date, duration, timezone) {
            if (!date)
                return null;
            var start = duration.floor(date, timezone);
            return new TimeRange({
                start: start,
                end: duration.shift(start, timezone, 1),
                bounds: Plywood.Range.DEFAULT_BOUNDS
            });
        };
        TimeRange.fromTime = function (t) {
            return new TimeRange({ start: t, end: t, bounds: '[]' });
        };
        TimeRange.fromJS = function (parameters) {
            if (typeof parameters !== "object") {
                throw new Error("unrecognizable timeRange");
            }
            return new TimeRange({
                start: toDate(parameters.start, 'start'),
                end: toDate(parameters.end, 'end'),
                bounds: parameters.bounds
            });
        };
        TimeRange.prototype._zeroEndpoint = function () {
            return new Date(0);
        };
        TimeRange.prototype._endpointEqual = function (a, b) {
            if (a === null) {
                return b === null;
            }
            else {
                return b !== null && a.valueOf() === b.valueOf();
            }
        };
        TimeRange.prototype._endpointToString = function (a) {
            if (!a)
                return 'null';
            return a.toISOString();
        };
        TimeRange.prototype.valueOf = function () {
            return {
                start: this.start,
                end: this.end,
                bounds: this.bounds
            };
        };
        TimeRange.prototype.toJS = function () {
            var js = {
                start: this.start,
                end: this.end
            };
            if (this.bounds !== Plywood.Range.DEFAULT_BOUNDS)
                js.bounds = this.bounds;
            return js;
        };
        TimeRange.prototype.toJSON = function () {
            return this.toJS();
        };
        TimeRange.prototype.equals = function (other) {
            return TimeRange.isTimeRange(other) && this._equalsHelper(other);
        };
        TimeRange.prototype.toInterval = function () {
            var _a = this, start = _a.start, end = _a.end, bounds = _a.bounds;
            var interval = [START_OF_TIME, END_OF_TIME];
            if (start) {
                if (bounds[0] === '(')
                    start = new Date(start.valueOf() + 1);
                interval[0] = dateToIntervalPart(start);
            }
            if (end) {
                if (bounds[1] === ']')
                    end = new Date(end.valueOf() + 1);
                interval[1] = dateToIntervalPart(end);
            }
            return interval.join("/");
        };
        TimeRange.prototype.midpoint = function () {
            return new Date((this.start.valueOf() + this.end.valueOf()) / 2);
        };
        TimeRange.prototype.isAligned = function (duration, timezone) {
            var _a = this, start = _a.start, end = _a.end;
            return (!start || duration.isAligned(start, timezone)) && (!end || duration.isAligned(end, timezone));
        };
        TimeRange.type = 'TIME_RANGE';
        return TimeRange;
    }(Plywood.Range));
    Plywood.TimeRange = TimeRange;
    check = TimeRange;
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    function foldContext(d, c) {
        var newContext = Object.create(c);
        for (var k in d) {
            newContext[k] = d[k];
        }
        return newContext;
    }
    Plywood.foldContext = foldContext;
    var directionFns = {
        ascending: function (a, b) {
            if (a == null) {
                return b == null ? 0 : -1;
            }
            else {
                if (a.compare)
                    return a.compare(b);
                if (b == null)
                    return 1;
            }
            return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
        },
        descending: function (a, b) {
            if (b == null) {
                return a == null ? 0 : -1;
            }
            else {
                if (b.compare)
                    return b.compare(a);
                if (a == null)
                    return 1;
            }
            return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
        }
    };
    function typePreference(type) {
        switch (type) {
            case 'TIME': return 0;
            case 'STRING': return 1;
            case 'DATASET': return 5;
            default: return 2;
        }
    }
    function uniqueColumns(columns) {
        var seen = {};
        var uniqueColumns = [];
        for (var _i = 0, columns_1 = columns; _i < columns_1.length; _i++) {
            var column = columns_1[_i];
            if (!seen[column.name]) {
                uniqueColumns.push(column);
                seen[column.name] = true;
            }
        }
        return uniqueColumns;
    }
    function flattenColumns(nestedColumns, prefixColumns) {
        var flatColumns = [];
        var i = 0;
        var prefixString = '';
        while (i < nestedColumns.length) {
            var nestedColumn = nestedColumns[i];
            if (nestedColumn.type === 'DATASET') {
                nestedColumns = nestedColumn.columns;
                if (prefixColumns)
                    prefixString += nestedColumn.name + '.';
                i = 0;
            }
            else {
                flatColumns.push({
                    name: prefixString + nestedColumn.name,
                    type: nestedColumn.type
                });
                i++;
            }
        }
        return uniqueColumns(flatColumns);
    }
    function removeLineBreaks(v) {
        return v.replace(/(?:\r\n|\r|\n)/g, ' ');
    }
    var escapeFnCSV = function (v) {
        v = removeLineBreaks(v);
        if (v.indexOf('"') === -1 && v.indexOf(",") === -1)
            return v;
        return "\"" + v.replace(/"/g, '""') + "\"";
    };
    var escapeFnTSV = function (v) {
        return removeLineBreaks(v).replace(/\t/g, "").replace(/"/g, '""');
    };
    var typeOrder = {
        'NULL': 0,
        'TIME': 1,
        'TIME_RANGE': 2,
        'SET/TIME': 3,
        'SET/TIME_RANGE': 4,
        'STRING': 5,
        'SET/STRING': 6,
        'BOOLEAN': 7,
        'NUMBER': 8,
        'NUMBER_RANGE': 9,
        'SET/NUMBER': 10,
        'SET/NUMBER_RANGE': 11,
        'DATASET': 12
    };
    var defaultFormatter = {
        'NULL': function (v) { return 'NULL'; },
        'TIME': function (v) { return v.toISOString(); },
        'TIME_RANGE': function (v) { return '' + v; },
        'SET/TIME': function (v) { return '' + v; },
        'SET/TIME_RANGE': function (v) { return '' + v; },
        'STRING': function (v) { return '' + v; },
        'SET/STRING': function (v) { return '' + v; },
        'BOOLEAN': function (v) { return '' + v; },
        'NUMBER': function (v) { return '' + v; },
        'NUMBER_RANGE': function (v) { return '' + v; },
        'SET/NUMBER': function (v) { return '' + v; },
        'SET/NUMBER_RANGE': function (v) { return '' + v; },
        'DATASET': function (v) { return 'DATASET'; }
    };
    function isBoolean(b) {
        return b === true || b === false;
    }
    function isNumber(n) {
        return n !== null && !isNaN(Number(n));
    }
    function isString(str) {
        return typeof str === "string";
    }
    function getAttributeInfo(name, attributeValue) {
        if (attributeValue == null)
            return null;
        if (Plywood.isDate(attributeValue)) {
            return new Plywood.AttributeInfo({ name: name, type: 'TIME' });
        }
        else if (isBoolean(attributeValue)) {
            return new Plywood.AttributeInfo({ name: name, type: 'BOOLEAN' });
        }
        else if (isNumber(attributeValue)) {
            return new Plywood.AttributeInfo({ name: name, type: 'NUMBER' });
        }
        else if (isString(attributeValue)) {
            return new Plywood.AttributeInfo({ name: name, type: 'STRING' });
        }
        else if (Plywood.NumberRange.isNumberRange(attributeValue)) {
            return new Plywood.AttributeInfo({ name: name, type: 'NUMBER_RANGE' });
        }
        else if (Plywood.TimeRange.isTimeRange(attributeValue)) {
            return new Plywood.AttributeInfo({ name: name, type: 'TIME_RANGE' });
        }
        else if (Plywood.Set.isSet(attributeValue)) {
            return new Plywood.AttributeInfo({ name: name, type: attributeValue.getType() });
        }
        else if (Dataset.isDataset(attributeValue)) {
            return new Plywood.AttributeInfo({ name: name, type: 'DATASET', datasetType: attributeValue.getFullType().datasetType });
        }
        else {
            throw new Error("Could not introspect");
        }
    }
    function datumFromJS(js) {
        if (typeof js !== 'object')
            throw new TypeError("datum must be an object");
        var datum = Object.create(null);
        for (var k in js) {
            if (!hasOwnProperty(js, k))
                continue;
            datum[k] = Plywood.valueFromJS(js[k]);
        }
        return datum;
    }
    function datumToJS(datum) {
        var js = {};
        for (var k in datum) {
            var v = datum[k];
            if (v && v.suppress)
                continue;
            js[k] = Plywood.valueToJSInlineType(v);
        }
        return js;
    }
    function joinDatums(datumA, datumB) {
        var newDatum = Object.create(null);
        for (var k in datumA) {
            newDatum[k] = datumA[k];
        }
        for (var k in datumB) {
            newDatum[k] = datumB[k];
        }
        return newDatum;
    }
    function copy(obj) {
        var newObj = {};
        var k;
        for (k in obj) {
            if (hasOwnProperty(obj, k))
                newObj[k] = obj[k];
        }
        return newObj;
    }
    var check;
    var Dataset = (function () {
        function Dataset(parameters) {
            this.attributes = null;
            this.keys = null;
            if (parameters.suppress === true)
                this.suppress = true;
            if (parameters.keys) {
                this.keys = parameters.keys;
            }
            var data = parameters.data;
            if (!Array.isArray(data)) {
                throw new TypeError("must have a `data` array");
            }
            this.data = data;
            var attributes = parameters.attributes;
            if (!attributes)
                attributes = Dataset.getAttributesFromData(data);
            var attributeOverrides = parameters.attributeOverrides;
            if (attributeOverrides) {
                attributes = Plywood.AttributeInfo.override(attributes, attributeOverrides);
            }
            this.attributes = attributes;
        }
        Dataset.isDataset = function (candidate) {
            return Plywood.isInstanceOf(candidate, Dataset);
        };
        Dataset.getAttributesFromData = function (data) {
            if (!data.length)
                return [];
            var attributeNamesToIntrospect = Object.keys(data[0]);
            var attributes = [];
            for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                var datum = data_1[_i];
                var attributeNamesStillToIntrospect = [];
                for (var _a = 0, attributeNamesToIntrospect_1 = attributeNamesToIntrospect; _a < attributeNamesToIntrospect_1.length; _a++) {
                    var attributeNameToIntrospect = attributeNamesToIntrospect_1[_a];
                    var attributeInfo = getAttributeInfo(attributeNameToIntrospect, datum[attributeNameToIntrospect]);
                    if (attributeInfo) {
                        attributes.push(attributeInfo);
                    }
                    else {
                        attributeNamesStillToIntrospect.push(attributeNameToIntrospect);
                    }
                }
                attributeNamesToIntrospect = attributeNamesStillToIntrospect;
                if (!attributeNamesToIntrospect.length)
                    break;
            }
            for (var _b = 0, attributeNamesToIntrospect_2 = attributeNamesToIntrospect; _b < attributeNamesToIntrospect_2.length; _b++) {
                var attributeName = attributeNamesToIntrospect_2[_b];
                attributes.push(new Plywood.AttributeInfo({ name: attributeName, type: 'STRING' }));
            }
            attributes.sort(function (a, b) {
                var typeDiff = typeOrder[a.type] - typeOrder[b.type];
                if (typeDiff)
                    return typeDiff;
                return a.name.localeCompare(b.name);
            });
            return attributes;
        };
        Dataset.fromJS = function (parameters) {
            if (Array.isArray(parameters)) {
                parameters = { data: parameters };
            }
            if (!Array.isArray(parameters.data)) {
                throw new Error('must have data');
            }
            var value = {};
            if (hasOwnProperty(parameters, 'attributes')) {
                value.attributes = Plywood.AttributeInfo.fromJSs(parameters.attributes);
            }
            else if (hasOwnProperty(parameters, 'attributeOverrides')) {
                value.attributeOverrides = Plywood.AttributeInfo.fromJSs(parameters.attributeOverrides);
            }
            value.keys = parameters.keys;
            value.data = parameters.data.map(datumFromJS);
            return new Dataset(value);
        };
        Dataset.prototype.valueOf = function () {
            var value = {};
            if (this.suppress)
                value.suppress = true;
            if (this.attributes)
                value.attributes = this.attributes;
            if (this.keys)
                value.keys = this.keys;
            value.data = this.data;
            return value;
        };
        Dataset.prototype.toJS = function () {
            return this.data.map(datumToJS);
        };
        Dataset.prototype.toString = function () {
            return "Dataset(" + this.data.length + ")";
        };
        Dataset.prototype.toJSON = function () {
            return this.toJS();
        };
        Dataset.prototype.equals = function (other) {
            return Dataset.isDataset(other) &&
                this.data.length === other.data.length;
        };
        Dataset.prototype.hide = function () {
            var value = this.valueOf();
            value.suppress = true;
            return new Dataset(value);
        };
        Dataset.prototype.basis = function () {
            var data = this.data;
            return data.length === 1 && Object.keys(data[0]).length === 0;
        };
        Dataset.prototype.hasExternal = function () {
            if (!this.data.length)
                return false;
            return Plywood.datumHasExternal(this.data[0]);
        };
        Dataset.prototype.getFullType = function () {
            var attributes = this.attributes;
            if (!attributes)
                throw new Error("dataset has not been introspected");
            var myDatasetType = {};
            for (var _i = 0, attributes_1 = attributes; _i < attributes_1.length; _i++) {
                var attribute = attributes_1[_i];
                var attrName = attribute.name;
                if (attribute.type === 'DATASET') {
                    myDatasetType[attrName] = {
                        type: 'DATASET',
                        datasetType: attribute.datasetType
                    };
                }
                else {
                    myDatasetType[attrName] = {
                        type: attribute.type
                    };
                }
            }
            return {
                type: 'DATASET',
                datasetType: myDatasetType
            };
        };
        Dataset.prototype.select = function (attrs) {
            var attributes = this.attributes;
            var newAttributes = [];
            var attrLookup = Object.create(null);
            for (var _i = 0, attrs_1 = attrs; _i < attrs_1.length; _i++) {
                var attr = attrs_1[_i];
                attrLookup[attr] = true;
                var existingAttribute = Plywood.helper.findByName(attributes, attr);
                if (existingAttribute)
                    newAttributes.push(existingAttribute);
            }
            var data = this.data;
            var n = data.length;
            var newData = new Array(n);
            for (var i = 0; i < n; i++) {
                var datum = data[i];
                var newDatum = Object.create(null);
                for (var key in datum) {
                    if (attrLookup[key]) {
                        newDatum[key] = datum[key];
                    }
                }
                newData[i] = newDatum;
            }
            var value = this.valueOf();
            value.attributes = newAttributes;
            value.data = newData;
            return new Dataset(value);
        };
        Dataset.prototype.apply = function (name, exFn, type, context) {
            var data = this.data;
            var n = data.length;
            var newData = new Array(n);
            for (var i = 0; i < n; i++) {
                var datum = data[i];
                var newDatum = Object.create(null);
                for (var key in datum)
                    newDatum[key] = datum[key];
                newDatum[name] = exFn(datum, context, i);
                newData[i] = newDatum;
            }
            var datasetType = null;
            if (type === 'DATASET' && newData[0] && newData[0][name]) {
                datasetType = newData[0][name].getFullType().datasetType;
            }
            var value = this.valueOf();
            value.attributes = Plywood.helper.overrideByName(value.attributes, new Plywood.AttributeInfo({ name: name, type: type, datasetType: datasetType }));
            value.data = newData;
            return new Dataset(value);
        };
        Dataset.prototype.applyPromise = function (name, exFn, type, context) {
            var _this = this;
            var value = this.valueOf();
            var promises = value.data.map(function (datum) { return exFn(datum, context); });
            return Q.all(promises).then(function (values) {
                return _this.apply(name, (function (d, c, i) { return values[i]; }), type, context);
            });
        };
        Dataset.prototype.filter = function (exFn, context) {
            var value = this.valueOf();
            value.data = value.data.filter(function (datum) { return exFn(datum, context); });
            return new Dataset(value);
        };
        Dataset.prototype.sort = function (exFn, direction, context) {
            var value = this.valueOf();
            var directionFn = directionFns[direction];
            value.data = this.data.sort(function (a, b) {
                return directionFn(exFn(a, context), exFn(b, context));
            });
            return new Dataset(value);
        };
        Dataset.prototype.limit = function (limit) {
            var data = this.data;
            if (data.length <= limit)
                return this;
            var value = this.valueOf();
            value.data = data.slice(0, limit);
            return new Dataset(value);
        };
        Dataset.prototype.count = function () {
            return this.data.length;
        };
        Dataset.prototype.sum = function (exFn, context) {
            var data = this.data;
            var sum = 0;
            for (var _i = 0, data_2 = data; _i < data_2.length; _i++) {
                var datum = data_2[_i];
                sum += exFn(datum, context);
            }
            return sum;
        };
        Dataset.prototype.average = function (exFn, context) {
            var count = this.count();
            return count ? (this.sum(exFn, context) / count) : null;
        };
        Dataset.prototype.min = function (exFn, context) {
            var data = this.data;
            var min = Infinity;
            for (var _i = 0, data_3 = data; _i < data_3.length; _i++) {
                var datum = data_3[_i];
                var v = exFn(datum, context);
                if (v < min)
                    min = v;
            }
            return min;
        };
        Dataset.prototype.max = function (exFn, context) {
            var data = this.data;
            var max = -Infinity;
            for (var _i = 0, data_4 = data; _i < data_4.length; _i++) {
                var datum = data_4[_i];
                var v = exFn(datum, context);
                if (max < v)
                    max = v;
            }
            return max;
        };
        Dataset.prototype.countDistinct = function (exFn, context) {
            var data = this.data;
            var seen = Object.create(null);
            var count = 0;
            for (var _i = 0, data_5 = data; _i < data_5.length; _i++) {
                var datum = data_5[_i];
                var v = exFn(datum, context);
                if (!seen[v]) {
                    seen[v] = 1;
                    ++count;
                }
            }
            return count;
        };
        Dataset.prototype.quantile = function (exFn, quantile, context) {
            var data = this.data;
            var vs = [];
            for (var _i = 0, data_6 = data; _i < data_6.length; _i++) {
                var datum = data_6[_i];
                var v = exFn(datum, context);
                if (v != null)
                    vs.push(v);
            }
            vs.sort(function (a, b) { return a - b; });
            var n = vs.length;
            if (quantile === 0)
                return vs[0];
            if (quantile === 1)
                return vs[n - 1];
            var rank = n * quantile - 1;
            if (rank === Math.floor(rank)) {
                return (vs[rank] + vs[rank + 1]) / 2;
            }
            else {
                return vs[Math.ceil(rank)];
            }
        };
        Dataset.prototype.split = function (splitFns, datasetName, context) {
            var _a = this, data = _a.data, attributes = _a.attributes;
            var keys = Object.keys(splitFns);
            var numberOfKeys = keys.length;
            var splitFnList = keys.map(function (k) { return splitFns[k]; });
            var splits = {};
            var datumGroups = {};
            var finalData = [];
            var finalDataset = [];
            function addDatum(datum, valueList) {
                var key = valueList.join(';_PLYw00d_;');
                if (hasOwnProperty(datumGroups, key)) {
                    datumGroups[key].push(datum);
                }
                else {
                    var newDatum = Object.create(null);
                    for (var i = 0; i < numberOfKeys; i++) {
                        newDatum[keys[i]] = valueList[i];
                    }
                    finalDataset.push(datumGroups[key] = [datum]);
                    splits[key] = newDatum;
                    finalData.push(newDatum);
                }
            }
            for (var _i = 0, data_7 = data; _i < data_7.length; _i++) {
                var datum = data_7[_i];
                var valueList = splitFnList.map(function (splitFn) { return splitFn(datum, context); });
                if (Plywood.Set.isSet(valueList[0])) {
                    if (valueList.length > 1)
                        throw new Error('multi-dimensional set split is not implemented');
                    var elements = valueList[0].elements;
                    for (var _b = 0, elements_3 = elements; _b < elements_3.length; _b++) {
                        var element = elements_3[_b];
                        addDatum(datum, [element]);
                    }
                }
                else {
                    addDatum(datum, valueList);
                }
            }
            for (var i = 0; i < finalData.length; i++) {
                finalData[i][datasetName] = new Dataset({
                    suppress: true,
                    attributes: attributes,
                    data: finalDataset[i]
                });
            }
            return new Dataset({
                keys: keys,
                data: finalData
            });
        };
        Dataset.prototype.introspect = function () {
            console.error('introspection is always done, `.introspect()` method never needs to be called');
        };
        Dataset.prototype.getExternals = function () {
            if (this.data.length === 0)
                return [];
            var datum = this.data[0];
            var externals = [];
            Object.keys(datum).forEach(function (applyName) {
                var applyValue = datum[applyName];
                if (applyValue instanceof Dataset) {
                    externals.push.apply(externals, applyValue.getExternals());
                }
            });
            return Plywood.External.deduplicateExternals(externals);
        };
        Dataset.prototype.join = function (other) {
            if (!other)
                return this;
            var thisKey = this.keys[0];
            if (!thisKey)
                throw new Error('join lhs must have a key (be a product of a split)');
            var otherKey = other.keys[0];
            if (!otherKey)
                throw new Error('join rhs must have a key (be a product of a split)');
            var thisData = this.data;
            var otherData = other.data;
            var k;
            var mapping = Object.create(null);
            for (var i = 0; i < thisData.length; i++) {
                var datum = thisData[i];
                k = String(thisKey ? datum[thisKey] : i);
                mapping[k] = [datum];
            }
            for (var i = 0; i < otherData.length; i++) {
                var datum = otherData[i];
                k = String(otherKey ? datum[otherKey] : i);
                if (!mapping[k])
                    mapping[k] = [];
                mapping[k].push(datum);
            }
            var newData = [];
            for (var j in mapping) {
                var datums = mapping[j];
                if (datums.length === 1) {
                    newData.push(datums[0]);
                }
                else {
                    newData.push(joinDatums(datums[0], datums[1]));
                }
            }
            return new Dataset({ data: newData });
        };
        Dataset.prototype.findDatumByAttribute = function (attribute, value) {
            return Plywood.helper.find(this.data, function (d) { return Plywood.generalEqual(d[attribute], value); });
        };
        Dataset.prototype.getNestedColumns = function () {
            var nestedColumns = [];
            var attributes = this.attributes;
            var subDatasetAdded = false;
            for (var _i = 0, attributes_2 = attributes; _i < attributes_2.length; _i++) {
                var attribute = attributes_2[_i];
                var column = {
                    name: attribute.name,
                    type: attribute.type
                };
                if (attribute.type === 'DATASET') {
                    var subDataset = this.data[0][attribute.name];
                    if (!subDatasetAdded && Dataset.isDataset(subDataset)) {
                        subDatasetAdded = true;
                        column.columns = subDataset.getNestedColumns();
                        nestedColumns.push(column);
                    }
                }
                else {
                    nestedColumns.push(column);
                }
            }
            return nestedColumns;
        };
        Dataset.prototype.getColumns = function (options) {
            if (options === void 0) { options = {}; }
            var prefixColumns = options.prefixColumns;
            return flattenColumns(this.getNestedColumns(), prefixColumns);
        };
        Dataset.prototype._flattenHelper = function (nestedColumns, prefix, order, nestingName, parentName, nesting, context, flat) {
            var nestedColumnsLength = nestedColumns.length;
            if (!nestedColumnsLength)
                return;
            var data = this.data;
            var datasetColumn = nestedColumns.filter(function (nestedColumn) { return nestedColumn.type === 'DATASET'; })[0];
            for (var _i = 0, data_8 = data; _i < data_8.length; _i++) {
                var datum = data_8[_i];
                var flatDatum = context ? copy(context) : {};
                if (nestingName)
                    flatDatum[nestingName] = nesting;
                if (parentName)
                    flatDatum[parentName] = context;
                for (var _a = 0, nestedColumns_1 = nestedColumns; _a < nestedColumns_1.length; _a++) {
                    var flattenedColumn = nestedColumns_1[_a];
                    if (flattenedColumn.type === 'DATASET')
                        continue;
                    var flatName = (prefix !== null ? prefix : '') + flattenedColumn.name;
                    flatDatum[flatName] = datum[flattenedColumn.name];
                }
                if (datasetColumn) {
                    var nextPrefix = null;
                    if (prefix !== null)
                        nextPrefix = prefix + datasetColumn.name + '.';
                    if (order === 'preorder')
                        flat.push(flatDatum);
                    datum[datasetColumn.name]._flattenHelper(datasetColumn.columns, nextPrefix, order, nestingName, parentName, nesting + 1, flatDatum, flat);
                    if (order === 'postorder')
                        flat.push(flatDatum);
                }
                if (!datasetColumn)
                    flat.push(flatDatum);
            }
        };
        Dataset.prototype.flatten = function (options) {
            if (options === void 0) { options = {}; }
            var prefixColumns = options.prefixColumns;
            var order = options.order;
            var nestingName = options.nestingName;
            var parentName = options.parentName;
            var nestedColumns = this.getNestedColumns();
            var flatData = [];
            if (nestedColumns.length) {
                this._flattenHelper(nestedColumns, (prefixColumns ? '' : null), order, nestingName, parentName, 0, null, flatData);
            }
            return flatData;
        };
        Dataset.prototype.toTabular = function (tabulatorOptions) {
            var formatter = tabulatorOptions.formatter || {};
            var finalizer = tabulatorOptions.finalizer;
            var data = this.flatten(tabulatorOptions);
            var columns = this.getColumns(tabulatorOptions);
            var lines = [];
            lines.push(columns.map(function (c) { return c.name; }).join(tabulatorOptions.separator || ','));
            for (var i = 0; i < data.length; i++) {
                var datum = data[i];
                lines.push(columns.map(function (c) {
                    var value = datum[c.name];
                    var formatted = String((formatter[c.type] || defaultFormatter[c.type])(value));
                    var finalized = formatted && finalizer ? finalizer(formatted) : formatted;
                    return finalized;
                }).join(tabulatorOptions.separator || ','));
            }
            var lineBreak = tabulatorOptions.lineBreak || '\n';
            return lines.join(lineBreak) + (tabulatorOptions.finalLineBreak === 'include' && lines.length > 0 ? lineBreak : '');
        };
        Dataset.prototype.toCSV = function (tabulatorOptions) {
            if (tabulatorOptions === void 0) { tabulatorOptions = {}; }
            tabulatorOptions.finalizer = escapeFnCSV;
            tabulatorOptions.separator = tabulatorOptions.separator || ',';
            tabulatorOptions.lineBreak = tabulatorOptions.lineBreak || '\r\n';
            tabulatorOptions.finalLineBreak = tabulatorOptions.finalLineBreak || 'suppress';
            return this.toTabular(tabulatorOptions);
        };
        Dataset.prototype.toTSV = function (tabulatorOptions) {
            if (tabulatorOptions === void 0) { tabulatorOptions = {}; }
            tabulatorOptions.finalizer = escapeFnTSV;
            tabulatorOptions.separator = tabulatorOptions.separator || '\t';
            tabulatorOptions.lineBreak = tabulatorOptions.lineBreak || '\r\n';
            tabulatorOptions.finalLineBreak = tabulatorOptions.finalLineBreak || 'suppress';
            return this.toTabular(tabulatorOptions);
        };
        Dataset.type = 'DATASET';
        return Dataset;
    }());
    Plywood.Dataset = Dataset;
    check = Dataset;
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    function nullMap(xs, fn) {
        if (!xs)
            return null;
        var res = [];
        for (var _i = 0, xs_1 = xs; _i < xs_1.length; _i++) {
            var x = xs_1[_i];
            var y = fn(x);
            if (y)
                res.push(y);
        }
        return res.length ? res : null;
    }
    function filterToAnds(filter) {
        if (filter.equals(Plywood.Expression.TRUE))
            return [];
        return filter.getExpressionPattern('and') || [filter];
    }
    function filterDiff(strongerFilter, weakerFilter) {
        var strongerFilterAnds = filterToAnds(strongerFilter);
        var weakerFilterAnds = filterToAnds(weakerFilter);
        if (weakerFilterAnds.length > strongerFilterAnds.length)
            return null;
        for (var i = 0; i < weakerFilterAnds.length; i++) {
            if (!(weakerFilterAnds[i].equals(strongerFilterAnds[i])))
                return null;
        }
        return Plywood.Expression.and(strongerFilterAnds.slice(weakerFilterAnds.length));
    }
    function getCommonFilter(filter1, filter2) {
        var filter1Ands = filterToAnds(filter1);
        var filter2Ands = filterToAnds(filter2);
        var minLength = Math.min(filter1Ands.length, filter2Ands.length);
        var commonExpressions = [];
        for (var i = 0; i < minLength; i++) {
            if (!filter1Ands[i].equals(filter2Ands[i]))
                break;
            commonExpressions.push(filter1Ands[i]);
        }
        return Plywood.Expression.and(commonExpressions);
    }
    function mergeDerivedAttributes(derivedAttributes1, derivedAttributes2) {
        var derivedAttributes = Object.create(null);
        for (var k in derivedAttributes1) {
            derivedAttributes[k] = derivedAttributes1[k];
        }
        for (var k in derivedAttributes2) {
            if (hasOwnProperty(derivedAttributes, k) && !derivedAttributes[k].equals(derivedAttributes2[k])) {
                throw new Error("can not currently redefine conflicting " + k);
            }
            derivedAttributes[k] = derivedAttributes2[k];
        }
        return derivedAttributes;
    }
    function getSampleValue(valueType, ex) {
        switch (valueType) {
            case 'BOOLEAN':
                return true;
            case 'NUMBER':
                return 4;
            case 'NUMBER_RANGE':
                var numberBucketAction;
                if (ex instanceof Plywood.ChainExpression && (numberBucketAction = ex.getSingleAction('numberBucket'))) {
                    return new Plywood.NumberRange({
                        start: numberBucketAction.offset,
                        end: numberBucketAction.offset + numberBucketAction.size
                    });
                }
                else {
                    return new Plywood.NumberRange({ start: 0, end: 1 });
                }
            case 'TIME':
                return new Date('2015-03-14T00:00:00');
            case 'TIME_RANGE':
                var timeBucketAction;
                if (ex instanceof Plywood.ChainExpression && (timeBucketAction = ex.getSingleAction('timeBucket'))) {
                    var timezone = timeBucketAction.timezone || Plywood.Timezone.UTC;
                    var start = timeBucketAction.duration.floor(new Date('2015-03-14T00:00:00'), timezone);
                    return new Plywood.TimeRange({
                        start: start,
                        end: timeBucketAction.duration.shift(start, timezone, 1)
                    });
                }
                else {
                    return new Plywood.TimeRange({ start: new Date('2015-03-14T00:00:00'), end: new Date('2015-03-15T00:00:00') });
                }
            case 'STRING':
                if (ex instanceof Plywood.RefExpression) {
                    return 'some_' + ex.name;
                }
                else {
                    return 'something';
                }
            case 'SET/STRING':
                if (ex instanceof Plywood.RefExpression) {
                    return Plywood.Set.fromJS([ex.name + '1']);
                }
                else {
                    return Plywood.Set.fromJS(['something']);
                }
            default:
                throw new Error("unsupported simulation on: " + valueType);
        }
    }
    function immutableAdd(obj, key, value) {
        var newObj = Object.create(null);
        for (var k in obj)
            newObj[k] = obj[k];
        newObj[key] = value;
        return newObj;
    }
    function findApplyByExpression(applies, expression) {
        for (var _i = 0, applies_1 = applies; _i < applies_1.length; _i++) {
            var apply = applies_1[_i];
            if (apply.expression.equals(expression))
                return apply;
        }
        return null;
    }
    var External = (function () {
        function External(parameters, dummy) {
            if (dummy === void 0) { dummy = null; }
            this.attributes = null;
            this.attributeOverrides = null;
            this.rawAttributes = null;
            if (dummy !== dummyObject) {
                throw new TypeError("can not call `new External` directly use External.fromJS instead");
            }
            this.engine = parameters.engine;
            var version = null;
            if (parameters.version) {
                version = External.extractVersion(parameters.version);
                if (!version)
                    throw new Error("invalid version " + parameters.version);
            }
            this.version = version;
            this.suppress = Boolean(parameters.suppress);
            this.rollup = Boolean(parameters.rollup);
            if (parameters.attributes) {
                this.attributes = parameters.attributes;
            }
            if (parameters.attributeOverrides) {
                this.attributeOverrides = parameters.attributeOverrides;
            }
            this.derivedAttributes = parameters.derivedAttributes || {};
            if (parameters.delegates) {
                this.delegates = parameters.delegates;
            }
            this.concealBuckets = parameters.concealBuckets;
            this.rawAttributes = parameters.rawAttributes;
            this.requester = parameters.requester;
            this.mode = parameters.mode || 'raw';
            this.filter = parameters.filter || Plywood.Expression.TRUE;
            switch (this.mode) {
                case 'raw':
                    this.select = parameters.select;
                    this.sort = parameters.sort;
                    this.limit = parameters.limit;
                    break;
                case 'value':
                    this.valueExpression = parameters.valueExpression;
                    break;
                case 'total':
                    this.applies = parameters.applies || [];
                    break;
                case 'split':
                    this.dataName = parameters.dataName;
                    this.split = parameters.split;
                    if (!this.split)
                        throw new Error('must have split action in split mode');
                    this.applies = parameters.applies || [];
                    this.sort = parameters.sort;
                    this.limit = parameters.limit;
                    this.havingFilter = parameters.havingFilter || Plywood.Expression.TRUE;
                    break;
            }
        }
        External.isExternal = function (candidate) {
            return Plywood.isInstanceOf(candidate, External);
        };
        External.extractVersion = function (v) {
            if (!v)
                return null;
            var m = v.match(/^\d+\.\d+\.\d+(?:-\w+)?/);
            return m ? m[0] : null;
        };
        External.versionLessThan = function (va, vb) {
            var pa = va.split('-')[0].split('.');
            var pb = vb.split('-')[0].split('.');
            if (pa[0] !== pb[0])
                return pa[0] < pb[0];
            if (pa[1] !== pb[1])
                return pa[1] < pb[1];
            return pa[2] < pb[2];
        };
        External.deduplicateExternals = function (externals) {
            if (externals.length < 2)
                return externals;
            var uniqueExternals = [externals[0]];
            function addToUniqueExternals(external) {
                for (var _i = 0, uniqueExternals_1 = uniqueExternals; _i < uniqueExternals_1.length; _i++) {
                    var uniqueExternal = uniqueExternals_1[_i];
                    if (uniqueExternal.equalBase(external))
                        return;
                }
                uniqueExternals.push(external);
            }
            for (var i = 1; i < externals.length; i++)
                addToUniqueExternals(externals[i]);
            return uniqueExternals;
        };
        External.makeZeroDatum = function (applies) {
            var newDatum = Object.create(null);
            for (var _i = 0, applies_2 = applies; _i < applies_2.length; _i++) {
                var apply = applies_2[_i];
                var applyName = apply.name;
                if (applyName[0] === '_')
                    continue;
                newDatum[applyName] = 0;
            }
            return newDatum;
        };
        External.normalizeAndAddApply = function (attributesAndApplies, apply) {
            var attributes = attributesAndApplies.attributes, applies = attributesAndApplies.applies;
            var expressions = Object.create(null);
            for (var _i = 0, applies_3 = applies; _i < applies_3.length; _i++) {
                var existingApply = applies_3[_i];
                expressions[existingApply.name] = existingApply.expression;
            }
            apply = apply.changeExpression(apply.expression.resolveWithExpressions(expressions, 'leave').simplify());
            return {
                attributes: Plywood.helper.overrideByName(attributes, new Plywood.AttributeInfo({ name: apply.name, type: apply.expression.type })),
                applies: Plywood.helper.overrideByName(applies, apply)
            };
        };
        External.segregationAggregateApplies = function (applies) {
            var aggregateApplies = [];
            var postAggregateApplies = [];
            var nameIndex = 0;
            var appliesToSegregate = [];
            for (var _i = 0, applies_4 = applies; _i < applies_4.length; _i++) {
                var apply = applies_4[_i];
                var applyExpression = apply.expression;
                if (applyExpression instanceof Plywood.ChainExpression) {
                    var actions = applyExpression.actions;
                    if (actions[actions.length - 1].isAggregate()) {
                        aggregateApplies.push(apply);
                        continue;
                    }
                }
                appliesToSegregate.push(apply);
            }
            for (var _a = 0, appliesToSegregate_1 = appliesToSegregate; _a < appliesToSegregate_1.length; _a++) {
                var apply = appliesToSegregate_1[_a];
                var newExpression = apply.expression.substituteAction(function (action) {
                    return action.isAggregate();
                }, function (preEx, action) {
                    var aggregateChain = preEx.performAction(action);
                    var existingApply = findApplyByExpression(aggregateApplies, aggregateChain);
                    if (existingApply) {
                        return Plywood.$(existingApply.name, existingApply.expression.type);
                    }
                    else {
                        var name = '!T_' + (nameIndex++);
                        aggregateApplies.push(new Plywood.ApplyAction({
                            action: 'apply',
                            name: name,
                            expression: aggregateChain
                        }));
                        return Plywood.$(name, aggregateChain.type);
                    }
                });
                postAggregateApplies.push(apply.changeExpression(newExpression));
            }
            return {
                aggregateApplies: aggregateApplies,
                postAggregateApplies: postAggregateApplies
            };
        };
        External.getCommonFilterFromExternals = function (externals) {
            if (!externals.length)
                throw new Error('must have externals');
            var commonFilter = externals[0].filter;
            for (var i = 1; i < externals.length; i++) {
                commonFilter = getCommonFilter(commonFilter, externals[i].filter);
            }
            return commonFilter;
        };
        External.getMergedDerivedAttributesFromExternals = function (externals) {
            if (!externals.length)
                throw new Error('must have externals');
            var derivedAttributes = externals[0].derivedAttributes;
            for (var i = 1; i < externals.length; i++) {
                derivedAttributes = mergeDerivedAttributes(derivedAttributes, externals[i].derivedAttributes);
            }
            return derivedAttributes;
        };
        External.getSimpleInflater = function (splitExpression, label) {
            switch (splitExpression.type) {
                case 'BOOLEAN': return External.booleanInflaterFactory(label);
                case 'NUMBER': return External.numberInflaterFactory(label);
                case 'TIME': return External.timeInflaterFactory(label);
                default: return null;
            }
        };
        External.booleanInflaterFactory = function (label) {
            return function (d) {
                var v = '' + d[label];
                switch (v) {
                    case 'null':
                        d[label] = null;
                        break;
                    case '0':
                    case 'false':
                        d[label] = false;
                        break;
                    case '1':
                    case 'true':
                        d[label] = true;
                        break;
                    default:
                        throw new Error("got strange result from boolean: " + v);
                }
            };
        };
        External.timeRangeInflaterFactory = function (label, duration, timezone) {
            return function (d) {
                var v = d[label];
                if ('' + v === "null") {
                    d[label] = null;
                    return;
                }
                var start = new Date(v);
                d[label] = new Plywood.TimeRange({ start: start, end: duration.shift(start, timezone) });
            };
        };
        External.numberRangeInflaterFactory = function (label, rangeSize) {
            return function (d) {
                var v = d[label];
                if ('' + v === "null") {
                    d[label] = null;
                    return;
                }
                var start = Number(v);
                d[label] = new Plywood.NumberRange({
                    start: start,
                    end: Plywood.safeAdd(start, rangeSize)
                });
            };
        };
        External.numberInflaterFactory = function (label) {
            return function (d) {
                var v = d[label];
                if ('' + v === "null") {
                    d[label] = null;
                    return;
                }
                d[label] = Number(v);
            };
        };
        External.timeInflaterFactory = function (label) {
            return function (d) {
                var v = d[label];
                if ('' + v === "null") {
                    d[label] = null;
                    return;
                }
                d[label] = new Date(v);
            };
        };
        External.setStringInflaterFactory = function (label) {
            return function (d) {
                var v = d[label];
                if ('' + v === "null") {
                    d[label] = null;
                    return;
                }
                if (typeof v === 'string')
                    v = [v];
                d[label] = Plywood.Set.fromJS({
                    setType: 'STRING',
                    elements: v
                });
            };
        };
        External.jsToValue = function (parameters, requester) {
            var value = {
                engine: parameters.engine,
                version: parameters.version,
                suppress: true,
                rollup: parameters.rollup,
                concealBuckets: Boolean(parameters.concealBuckets),
                requester: requester
            };
            if (parameters.attributes) {
                value.attributes = Plywood.AttributeInfo.fromJSs(parameters.attributes);
            }
            if (parameters.attributeOverrides) {
                value.attributeOverrides = Plywood.AttributeInfo.fromJSs(parameters.attributeOverrides);
            }
            if (parameters.derivedAttributes) {
                value.derivedAttributes = Plywood.helper.expressionLookupFromJS(parameters.derivedAttributes);
            }
            value.filter = parameters.filter ? Plywood.Expression.fromJS(parameters.filter) : Plywood.Expression.TRUE;
            return value;
        };
        External.register = function (ex, id) {
            if (id === void 0) { id = null; }
            if (!id)
                id = ex.name.replace('External', '').replace(/^\w/, function (s) { return s.toLowerCase(); });
            External.classMap[id] = ex;
        };
        External.fromJS = function (parameters, requester) {
            if (requester === void 0) { requester = null; }
            if (!hasOwnProperty(parameters, "engine")) {
                throw new Error("external `engine` must be defined");
            }
            var engine = parameters.engine;
            if (typeof engine !== "string") {
                throw new Error("dataset must be a string");
            }
            var ClassFn = External.classMap[engine];
            if (!ClassFn) {
                throw new Error("unsupported engine '" + engine + "'");
            }
            if (!requester && hasOwnProperty(parameters, 'requester')) {
                console.warn("'requester' parameter should be passed as context (2nd argument)");
                requester = parameters.requester;
            }
            return ClassFn.fromJS(parameters, requester);
        };
        External.fromValue = function (parameters) {
            var engine = parameters.engine;
            var ClassFn = External.classMap[engine];
            if (!ClassFn)
                throw new Error("unsupported engine '" + engine + "'");
            return (new ClassFn(parameters));
        };
        External.prototype._ensureEngine = function (engine) {
            if (!this.engine) {
                this.engine = engine;
                return;
            }
            if (this.engine !== engine) {
                throw new TypeError("incorrect engine '" + this.engine + "' (needs to be: '" + engine + "')");
            }
        };
        External.prototype._ensureMinVersion = function (minVersion) {
            if (this.version && External.versionLessThan(this.version, minVersion)) {
                throw new Error("only " + this.engine + " versions >= " + minVersion + " are supported");
            }
        };
        External.prototype.valueOf = function () {
            var value = {
                engine: this.engine,
                version: this.version,
                rollup: this.rollup,
                mode: this.mode
            };
            if (this.suppress)
                value.suppress = this.suppress;
            if (this.attributes)
                value.attributes = this.attributes;
            if (this.attributeOverrides)
                value.attributeOverrides = this.attributeOverrides;
            if (Plywood.helper.nonEmptyLookup(this.derivedAttributes))
                value.derivedAttributes = this.derivedAttributes;
            if (this.delegates)
                value.delegates = this.delegates;
            value.concealBuckets = this.concealBuckets;
            if (this.rawAttributes) {
                value.rawAttributes = this.rawAttributes;
            }
            if (this.requester) {
                value.requester = this.requester;
            }
            if (this.dataName) {
                value.dataName = this.dataName;
            }
            value.filter = this.filter;
            if (this.valueExpression) {
                value.valueExpression = this.valueExpression;
            }
            if (this.select) {
                value.select = this.select;
            }
            if (this.split) {
                value.split = this.split;
            }
            if (this.applies) {
                value.applies = this.applies;
            }
            if (this.sort) {
                value.sort = this.sort;
            }
            if (this.limit) {
                value.limit = this.limit;
            }
            if (this.havingFilter) {
                value.havingFilter = this.havingFilter;
            }
            return value;
        };
        External.prototype.toJS = function () {
            var js = {
                engine: this.engine
            };
            if (this.version)
                js.version = this.version;
            if (this.rollup)
                js.rollup = true;
            if (this.attributes)
                js.attributes = Plywood.AttributeInfo.toJSs(this.attributes);
            if (this.attributeOverrides)
                js.attributeOverrides = Plywood.AttributeInfo.toJSs(this.attributeOverrides);
            if (Plywood.helper.nonEmptyLookup(this.derivedAttributes))
                js.derivedAttributes = Plywood.helper.expressionLookupToJS(this.derivedAttributes);
            if (this.concealBuckets)
                js.concealBuckets = true;
            if (this.rawAttributes)
                js.rawAttributes = Plywood.AttributeInfo.toJSs(this.rawAttributes);
            if (!this.filter.equals(Plywood.Expression.TRUE)) {
                js.filter = this.filter.toJS();
            }
            return js;
        };
        External.prototype.toJSON = function () {
            return this.toJS();
        };
        External.prototype.toString = function () {
            switch (this.mode) {
                case 'raw':
                    return "ExternalRaw(" + this.filter + ")";
                case 'value':
                    return "ExternalValue(" + this.valueExpression + ")";
                case 'total':
                    return "ExternalTotal(" + this.applies.length + ")";
                case 'split':
                    return "ExternalSplit(" + this.split + ", " + this.applies.length + ")";
                default:
                    throw new Error("unknown mode: " + this.mode);
            }
        };
        External.prototype.equals = function (other) {
            return this.equalBase(other) &&
                Plywood.immutableLookupsEqual(this.derivedAttributes, other.derivedAttributes) &&
                Plywood.immutableArraysEqual(this.delegates, other.delegates) &&
                this.concealBuckets === other.concealBuckets;
        };
        External.prototype.equalBase = function (other) {
            return External.isExternal(other) &&
                this.engine === other.engine &&
                this.version === other.version &&
                this.rollup === other.rollup &&
                this.mode === other.mode &&
                this.filter.equals(other.filter);
        };
        External.prototype.attachRequester = function (requester) {
            var value = this.valueOf();
            value.requester = requester;
            return External.fromValue(value);
        };
        External.prototype.versionBefore = function (neededVersion) {
            var version = this.version;
            return version && External.versionLessThan(version, neededVersion);
        };
        External.prototype.getAttributesInfo = function (attributeName) {
            var attributes = this.rawAttributes || this.attributes;
            return Plywood.helper.findByName(attributes, attributeName);
        };
        External.prototype.updateAttribute = function (newAttribute) {
            if (!this.attributes)
                return this;
            var value = this.valueOf();
            value.attributes = Plywood.AttributeInfo.override(value.attributes, [newAttribute]);
            return External.fromValue(value);
        };
        External.prototype.show = function () {
            var value = this.valueOf();
            value.suppress = false;
            return External.fromValue(value);
        };
        External.prototype.hasAttribute = function (name) {
            var _a = this, attributes = _a.attributes, rawAttributes = _a.rawAttributes, derivedAttributes = _a.derivedAttributes;
            if (Plywood.helper.find(rawAttributes || attributes, function (a) { return a.name === name; }))
                return true;
            return hasOwnProperty(derivedAttributes, name);
        };
        External.prototype.expressionDefined = function (ex) {
            return ex.definedInTypeContext(this.getFullType());
        };
        External.prototype.bucketsConcealed = function (ex) {
            var _this = this;
            return ex.every(function (ex, index, depth, nestDiff) {
                if (nestDiff)
                    return true;
                if (ex instanceof Plywood.RefExpression) {
                    var refAttributeInfo = _this.getAttributesInfo(ex.name);
                    if (refAttributeInfo && refAttributeInfo.makerAction) {
                        return refAttributeInfo.makerAction.alignsWith([]);
                    }
                }
                else if (ex instanceof Plywood.ChainExpression) {
                    var refExpression = ex.expression;
                    if (refExpression instanceof Plywood.RefExpression) {
                        var ref = refExpression.name;
                        var refAttributeInfo = _this.getAttributesInfo(ref);
                        if (refAttributeInfo && refAttributeInfo.makerAction) {
                            return refAttributeInfo.makerAction.alignsWith(ex.actions);
                        }
                    }
                }
                return null;
            });
        };
        External.prototype.canHandleFilter = function (ex) {
            throw new Error("must implement canHandleFilter");
        };
        External.prototype.canHandleTotal = function () {
            throw new Error("must implement canHandleTotal");
        };
        External.prototype.canHandleSplit = function (ex) {
            throw new Error("must implement canHandleSplit");
        };
        External.prototype.canHandleApply = function (ex) {
            throw new Error("must implement canHandleApply");
        };
        External.prototype.canHandleSort = function (sortAction) {
            throw new Error("must implement canHandleSort");
        };
        External.prototype.canHandleLimit = function (limitAction) {
            throw new Error("must implement canHandleLimit");
        };
        External.prototype.canHandleHavingFilter = function (ex) {
            throw new Error("must implement canHandleHavingFilter");
        };
        External.prototype.addDelegate = function (delegate) {
            var value = this.valueOf();
            if (!value.delegates)
                value.delegates = [];
            value.delegates = value.delegates.concat(delegate);
            return External.fromValue(value);
        };
        External.prototype.getBase = function () {
            var value = this.valueOf();
            value.suppress = true;
            value.mode = 'raw';
            value.dataName = null;
            if (this.mode !== 'raw')
                value.attributes = value.rawAttributes;
            value.rawAttributes = null;
            value.filter = null;
            value.applies = [];
            value.split = null;
            value.sort = null;
            value.limit = null;
            value.delegates = nullMap(value.delegates, function (e) { return e.getBase(); });
            return External.fromValue(value);
        };
        External.prototype.getRaw = function () {
            if (this.mode === 'raw')
                return this;
            var value = this.valueOf();
            value.suppress = true;
            value.mode = 'raw';
            value.dataName = null;
            if (this.mode !== 'raw')
                value.attributes = value.rawAttributes;
            value.rawAttributes = null;
            value.applies = [];
            value.split = null;
            value.sort = null;
            value.limit = null;
            value.delegates = nullMap(value.delegates, function (e) { return e.getRaw(); });
            return External.fromValue(value);
        };
        External.prototype.makeTotal = function (applies) {
            if (this.mode !== 'raw')
                return null;
            if (!this.canHandleTotal())
                return null;
            if (!applies.length)
                throw new Error('must have applies');
            var externals = [];
            for (var _i = 0, applies_5 = applies; _i < applies_5.length; _i++) {
                var apply = applies_5[_i];
                var applyExpression = apply.expression;
                if (applyExpression instanceof Plywood.ExternalExpression) {
                    externals.push(applyExpression.external);
                }
            }
            var commonFilter = External.getCommonFilterFromExternals(externals);
            var value = this.valueOf();
            value.mode = 'total';
            value.suppress = false;
            value.rawAttributes = value.attributes;
            value.derivedAttributes = External.getMergedDerivedAttributesFromExternals(externals);
            value.filter = commonFilter;
            value.attributes = [];
            value.applies = [];
            value.delegates = nullMap(value.delegates, function (e) { return e.makeTotal(applies); });
            var totalExternal = External.fromValue(value);
            for (var _a = 0, applies_6 = applies; _a < applies_6.length; _a++) {
                var apply = applies_6[_a];
                totalExternal = totalExternal._addApplyAction(apply);
                if (!totalExternal)
                    return null;
            }
            return totalExternal;
        };
        External.prototype.addAction = function (action) {
            if (action instanceof Plywood.FilterAction) {
                return this._addFilterAction(action);
            }
            if (action instanceof Plywood.SelectAction) {
                return this._addSelectAction(action);
            }
            if (action instanceof Plywood.SplitAction) {
                return this._addSplitAction(action);
            }
            if (action instanceof Plywood.ApplyAction) {
                return this._addApplyAction(action);
            }
            if (action instanceof Plywood.SortAction) {
                return this._addSortAction(action);
            }
            if (action instanceof Plywood.LimitAction) {
                return this._addLimitAction(action);
            }
            if (action.isAggregate()) {
                return this._addAggregateAction(action);
            }
            return this._addPostAggregateAction(action);
        };
        External.prototype._addFilterAction = function (action) {
            return this.addFilter(action.expression);
        };
        External.prototype.addFilter = function (expression) {
            if (!expression.resolved())
                return null;
            if (!this.expressionDefined(expression))
                return null;
            var value = this.valueOf();
            switch (this.mode) {
                case 'raw':
                    if (this.concealBuckets && !this.bucketsConcealed(expression))
                        return null;
                    if (!this.canHandleFilter(expression))
                        return null;
                    if (value.filter.equals(Plywood.Expression.TRUE)) {
                        value.filter = expression;
                    }
                    else {
                        value.filter = value.filter.and(expression);
                    }
                    break;
                case 'split':
                    if (!this.canHandleHavingFilter(expression))
                        return null;
                    value.havingFilter = value.havingFilter.and(expression).simplify();
                    break;
                default:
                    return null;
            }
            value.delegates = nullMap(value.delegates, function (e) { return e.addFilter(expression); });
            return External.fromValue(value);
        };
        External.prototype._addSelectAction = function (selectAction) {
            if (this.mode !== 'raw')
                return null;
            var datasetType = this.getFullType().datasetType;
            var attributes = selectAction.attributes;
            for (var _i = 0, attributes_3 = attributes; _i < attributes_3.length; _i++) {
                var attribute = attributes_3[_i];
                if (!datasetType[attribute])
                    return null;
            }
            var value = this.valueOf();
            value.suppress = false;
            value.select = selectAction;
            value.delegates = nullMap(value.delegates, function (e) { return e._addSelectAction(selectAction); });
            return External.fromValue(value);
        };
        External.prototype._addSplitAction = function (splitAction) {
            if (this.mode !== 'raw')
                return null;
            var splitKeys = splitAction.keys;
            for (var _i = 0, splitKeys_1 = splitKeys; _i < splitKeys_1.length; _i++) {
                var splitKey = splitKeys_1[_i];
                var splitExpression = splitAction.splits[splitKey];
                if (!this.expressionDefined(splitExpression))
                    return null;
                if (this.concealBuckets && !this.bucketsConcealed(splitExpression))
                    return null;
                if (!this.canHandleSplit(splitExpression))
                    return null;
            }
            var value = this.valueOf();
            value.suppress = false;
            value.mode = 'split';
            value.dataName = splitAction.dataName;
            value.split = splitAction;
            value.rawAttributes = value.attributes;
            value.attributes = splitAction.mapSplits(function (name, expression) { return new Plywood.AttributeInfo({ name: name, type: expression.type }); });
            value.delegates = nullMap(value.delegates, function (e) { return e._addSplitAction(splitAction); });
            return External.fromValue(value);
        };
        External.prototype._addApplyAction = function (action) {
            var expression = action.expression;
            if (expression.type === 'DATASET')
                return null;
            if (!expression.contained())
                return null;
            if (!this.expressionDefined(expression))
                return null;
            if (!this.canHandleApply(action.expression))
                return null;
            if (this.mode === 'raw') {
                var value = this.valueOf();
                value.derivedAttributes = immutableAdd(value.derivedAttributes, action.name, action.expression);
            }
            else {
                if (this.split && this.split.hasKey(action.name))
                    return null;
                var actionExpression = action.expression;
                if (actionExpression instanceof Plywood.ExternalExpression) {
                    action = action.changeExpression(actionExpression.external.valueExpressionWithinFilter(this.filter));
                }
                var value = this.valueOf();
                var added = External.normalizeAndAddApply(value, action);
                value.applies = added.applies;
                value.attributes = added.attributes;
            }
            value.delegates = nullMap(value.delegates, function (e) { return e._addApplyAction(action); });
            return External.fromValue(value);
        };
        External.prototype._addSortAction = function (action) {
            if (this.limit)
                return null;
            if (!this.canHandleSort(action))
                return null;
            var value = this.valueOf();
            value.sort = action;
            value.delegates = nullMap(value.delegates, function (e) { return e._addSortAction(action); });
            return External.fromValue(value);
        };
        External.prototype._addLimitAction = function (action) {
            if (!this.canHandleLimit(action))
                return null;
            var value = this.valueOf();
            value.suppress = false;
            if (!value.limit || action.limit < value.limit.limit) {
                value.limit = action;
            }
            value.delegates = nullMap(value.delegates, function (e) { return e._addLimitAction(action); });
            return External.fromValue(value);
        };
        External.prototype._addAggregateAction = function (action) {
            if (this.mode !== 'raw' || this.limit)
                return null;
            var actionExpression = action.expression;
            if (actionExpression && !this.expressionDefined(actionExpression))
                return null;
            var value = this.valueOf();
            value.mode = 'value';
            value.suppress = false;
            value.valueExpression = Plywood.$(External.SEGMENT_NAME, 'DATASET').performAction(action);
            value.rawAttributes = value.attributes;
            value.attributes = null;
            value.delegates = nullMap(value.delegates, function (e) { return e._addAggregateAction(action); });
            return External.fromValue(value);
        };
        External.prototype._addPostAggregateAction = function (action) {
            if (this.mode !== 'value')
                throw new Error('must be in value mode to call addPostAggregateAction');
            var actionExpression = action.expression;
            var commonFilter = this.filter;
            var newValueExpression;
            if (actionExpression instanceof Plywood.ExternalExpression) {
                var otherExternal = actionExpression.external;
                if (!this.getBase().equals(otherExternal.getBase()))
                    return null;
                var commonFilter = getCommonFilter(commonFilter, otherExternal.filter);
                var newAction = action.changeExpression(otherExternal.valueExpressionWithinFilter(commonFilter));
                newValueExpression = this.valueExpressionWithinFilter(commonFilter).performAction(newAction);
            }
            else if (!actionExpression || !actionExpression.hasExternal()) {
                newValueExpression = this.valueExpression.performAction(action);
            }
            else {
                return null;
            }
            var value = this.valueOf();
            value.valueExpression = newValueExpression;
            value.filter = commonFilter;
            value.delegates = nullMap(value.delegates, function (e) { return e._addPostAggregateAction(action); });
            return External.fromValue(value);
        };
        External.prototype.prePack = function (prefix, myAction) {
            if (this.mode !== 'value')
                throw new Error('must be in value mode to call prePack');
            var value = this.valueOf();
            value.valueExpression = prefix.performAction(myAction.changeExpression(value.valueExpression));
            value.delegates = nullMap(value.delegates, function (e) { return e.prePack(prefix, myAction); });
            return External.fromValue(value);
        };
        External.prototype.valueExpressionWithinFilter = function (withinFilter) {
            if (this.mode !== 'value')
                return null;
            var extraFilter = filterDiff(this.filter, withinFilter);
            if (!extraFilter)
                throw new Error('not within the segment');
            var ex = this.valueExpression;
            if (!extraFilter.equals(Plywood.Expression.TRUE)) {
                ex = ex.substitute(function (ex) {
                    if (ex instanceof Plywood.RefExpression && ex.type === 'DATASET' && ex.name === External.SEGMENT_NAME) {
                        return ex.filter(extraFilter);
                    }
                    return null;
                });
            }
            return ex;
        };
        External.prototype.toValueApply = function () {
            if (this.mode !== 'value')
                return null;
            return new Plywood.ApplyAction({
                name: External.VALUE_NAME,
                expression: this.valueExpression
            });
        };
        External.prototype.sortOnLabel = function () {
            var sort = this.sort;
            if (!sort)
                return false;
            var sortOn = sort.expression.name;
            if (!this.split || !this.split.hasKey(sortOn))
                return false;
            var applies = this.applies;
            for (var _i = 0, applies_7 = applies; _i < applies_7.length; _i++) {
                var apply = applies_7[_i];
                if (apply.name === sortOn)
                    return false;
            }
            return true;
        };
        External.prototype.inlineDerivedAttributes = function (expression) {
            var derivedAttributes = this.derivedAttributes;
            return expression.substitute(function (refEx) {
                if (refEx instanceof Plywood.RefExpression) {
                    var refName = refEx.name;
                    return hasOwnProperty(derivedAttributes, refName) ? derivedAttributes[refName] : null;
                }
                else {
                    return null;
                }
            });
        };
        External.prototype.inlineDerivedAttributesInAggregate = function (expression) {
            var _this = this;
            var derivedAttributes = this.derivedAttributes;
            return expression.substituteAction(function (action) {
                if (!action.isAggregate())
                    return false;
                return action.getFreeReferences().some(function (ref) { return hasOwnProperty(derivedAttributes, ref); });
            }, function (preEx, action) {
                return preEx.performAction(action.changeExpression(_this.inlineDerivedAttributes(action.expression)));
            });
        };
        External.prototype.switchToRollupCount = function (expression) {
            var _this = this;
            if (!this.rollup)
                return expression;
            var countRef = null;
            return expression.substituteAction(function (action) {
                return action.action === 'count';
            }, function (preEx) {
                if (!countRef)
                    countRef = Plywood.$(_this.getRollupCountName(), 'NUMBER');
                return preEx.sum(countRef);
            });
        };
        External.prototype.getRollupCountName = function () {
            var rawAttributes = this.rawAttributes;
            for (var _i = 0, rawAttributes_1 = rawAttributes; _i < rawAttributes_1.length; _i++) {
                var attribute = rawAttributes_1[_i];
                var makerAction = attribute.makerAction;
                if (makerAction && makerAction.action === 'count')
                    return attribute.name;
            }
            throw new Error("could not find rollup count");
        };
        External.prototype.getQuerySplit = function () {
            var _this = this;
            return this.split.transformExpressions(function (ex) {
                return _this.inlineDerivedAttributes(ex);
            });
        };
        External.prototype.getQueryFilter = function () {
            return this.inlineDerivedAttributes(this.filter).simplify();
        };
        External.prototype.getSelectedAttributes = function () {
            var _a = this, select = _a.select, attributes = _a.attributes, derivedAttributes = _a.derivedAttributes;
            attributes = attributes.slice();
            for (var k in derivedAttributes) {
                attributes.push(new Plywood.AttributeInfo({ name: k, type: derivedAttributes[k].type }));
            }
            if (!select)
                return attributes;
            var selectAttributes = select.attributes;
            return attributes.filter(function (a) { return selectAttributes.indexOf(a.name) !== -1; });
        };
        External.prototype.addNextExternal = function (dataset) {
            var _this = this;
            var _a = this, mode = _a.mode, dataName = _a.dataName, split = _a.split;
            if (mode !== 'split')
                throw new Error('must be in split mode to addNextExternal');
            return dataset.apply(dataName, function (d) {
                return _this.getRaw().addFilter(split.filterFromDatum(d));
            }, 'DATASET', null);
        };
        External.prototype.getDelegate = function () {
            var _a = this, mode = _a.mode, delegates = _a.delegates;
            if (!delegates || !delegates.length || mode === 'raw')
                return null;
            return delegates[0];
        };
        External.prototype.simulateValue = function (lastNode, simulatedQueries, externalForNext) {
            if (externalForNext === void 0) { externalForNext = null; }
            var mode = this.mode;
            if (!externalForNext)
                externalForNext = this;
            var delegate = this.getDelegate();
            if (delegate) {
                return delegate.simulateValue(lastNode, simulatedQueries, externalForNext);
            }
            simulatedQueries.push(this.getQueryAndPostProcess().query);
            if (mode === 'value') {
                var valueExpression = this.valueExpression;
                return getSampleValue(valueExpression.type, valueExpression);
            }
            var datum = {};
            if (mode === 'raw') {
                var attributes = this.attributes;
                for (var _i = 0, attributes_4 = attributes; _i < attributes_4.length; _i++) {
                    var attribute = attributes_4[_i];
                    datum[attribute.name] = getSampleValue(attribute.type, null);
                }
            }
            else {
                if (mode === 'split') {
                    this.split.mapSplits(function (name, expression) {
                        datum[name] = getSampleValue(Plywood.unwrapSetType(expression.type), expression);
                    });
                }
                var applies = this.applies;
                for (var _a = 0, applies_8 = applies; _a < applies_8.length; _a++) {
                    var apply = applies_8[_a];
                    datum[apply.name] = getSampleValue(apply.expression.type, apply.expression);
                }
            }
            var dataset = new Plywood.Dataset({ data: [datum] });
            if (!lastNode && mode === 'split')
                dataset = externalForNext.addNextExternal(dataset);
            return dataset;
        };
        External.prototype.getQueryAndPostProcess = function () {
            throw new Error("can not call getQueryAndPostProcess directly");
        };
        External.prototype.queryValue = function (lastNode, externalForNext, req) {
            if (externalForNext === void 0) { externalForNext = null; }
            var _a = this, mode = _a.mode, requester = _a.requester;
            if (!externalForNext)
                externalForNext = this;
            var delegate = this.getDelegate();
            if (delegate) {
                return delegate.queryValue(lastNode, externalForNext, req);
            }
            if (!requester) {
                return Q.reject(new Error('must have a requester to make queries'));
            }
            try {
                var queryAndPostProcess = this.getQueryAndPostProcess();
            }
            catch (e) {
                return Q.reject(e);
            }
            var query = queryAndPostProcess.query, postProcess = queryAndPostProcess.postProcess, next = queryAndPostProcess.next;
            if (!query || typeof postProcess !== 'function') {
                return Q.reject(new Error('no query or postProcess'));
            }
            var finalResult;
            if (next) {
                var results = [];
                finalResult = Plywood.helper.promiseWhile(function () { return query; }, function () {
                    return requester({ query: query, req: req })
                        .then(function (result) {
                        results.push(result);
                        query = next(query, result);
                    });
                })
                    .then(function () {
                    return queryAndPostProcess.postProcess(results);
                });
            }
            else {
                finalResult = requester({ query: query, req: req })
                    .then(queryAndPostProcess.postProcess);
            }
            if (!lastNode && mode === 'split') {
                finalResult = finalResult.then(externalForNext.addNextExternal.bind(externalForNext));
            }
            return finalResult;
        };
        External.prototype.needsIntrospect = function () {
            return !this.attributes;
        };
        External.prototype.getIntrospectAttributes = function () {
            throw new Error("can not call getIntrospectAttributes directly");
        };
        External.prototype.introspect = function () {
            var _this = this;
            if (!this.requester) {
                return Q.reject(new Error('must have a requester to introspect'));
            }
            return this.getIntrospectAttributes()
                .then(function (_a) {
                var version = _a.version, attributes = _a.attributes;
                var value = _this.valueOf();
                if (value.attributeOverrides) {
                    attributes = Plywood.AttributeInfo.override(attributes, value.attributeOverrides);
                }
                if (value.attributes) {
                    attributes = Plywood.AttributeInfo.override(value.attributes, attributes);
                }
                if (version)
                    value.version = version;
                value.attributes = attributes;
                return External.fromValue(value);
            });
        };
        External.prototype.getRawDatasetType = function () {
            var _a = this, attributes = _a.attributes, rawAttributes = _a.rawAttributes, derivedAttributes = _a.derivedAttributes;
            if (!attributes)
                throw new Error("dataset has not been introspected");
            if (!rawAttributes)
                rawAttributes = attributes;
            var myDatasetType = {};
            for (var _i = 0, rawAttributes_2 = rawAttributes; _i < rawAttributes_2.length; _i++) {
                var rawAttribute = rawAttributes_2[_i];
                var attrName = rawAttribute.name;
                myDatasetType[attrName] = {
                    type: rawAttribute.type
                };
            }
            for (var name in derivedAttributes) {
                myDatasetType[name] = {
                    type: derivedAttributes[name].type
                };
            }
            return myDatasetType;
        };
        External.prototype.getFullType = function () {
            var _a = this, mode = _a.mode, attributes = _a.attributes;
            if (mode === 'value')
                throw new Error('not supported for value mode yet');
            var myDatasetType = this.getRawDatasetType();
            if (mode !== 'raw') {
                var splitDatasetType = {};
                splitDatasetType[this.dataName || External.SEGMENT_NAME] = {
                    type: 'DATASET',
                    datasetType: myDatasetType,
                    remote: true
                };
                for (var _i = 0, attributes_5 = attributes; _i < attributes_5.length; _i++) {
                    var attribute = attributes_5[_i];
                    var attrName = attribute.name;
                    splitDatasetType[attrName] = {
                        type: attribute.type
                    };
                }
                myDatasetType = splitDatasetType;
            }
            return {
                type: 'DATASET',
                datasetType: myDatasetType,
                remote: true
            };
        };
        External.type = 'EXTERNAL';
        External.SEGMENT_NAME = '__SEGMENT__';
        External.VALUE_NAME = '__VALUE__';
        External.classMap = {};
        return External;
    }());
    Plywood.External = External;
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var DUMMY_NAME = '!DUMMY';
    var DEFAULT_TIME_ATTRIBUTE = '__time';
    var AGGREGATE_TO_DRUID = {
        count: "count",
        sum: "doubleSum",
        min: "doubleMin",
        max: "doubleMax"
    };
    var AGGREGATE_TO_FUNCTION = {
        sum: function (a, b) { return (a + "+" + b); },
        min: function (a, b) { return ("Math.min(" + a + "," + b + ")"); },
        max: function (a, b) { return ("Math.max(" + a + "," + b + ")"); }
    };
    var AGGREGATE_TO_ZERO = {
        sum: "0",
        min: "Infinity",
        max: "-Infinity"
    };
    function expressionNeedsAlphaNumericSort(ex) {
        var type = ex.type;
        return (type === 'NUMBER' || type === 'NUMBER_RANGE');
    }
    function customAggregationsEqual(customA, customB) {
        return JSON.stringify(customA) === JSON.stringify(customB);
    }
    function cleanDatumInPlace(datum) {
        for (var k in datum) {
            if (k[0] === '!')
                delete datum[k];
        }
    }
    function correctTimeBoundaryResult(result) {
        return Array.isArray(result) && result.length === 1 && typeof result[0].result === 'object';
    }
    function correctTimeseriesResult(result) {
        return Array.isArray(result) && (result.length === 0 || typeof result[0].result === 'object');
    }
    function correctTopNResult(result) {
        return Array.isArray(result) && (result.length === 0 || Array.isArray(result[0].result));
    }
    function correctGroupByResult(result) {
        return Array.isArray(result) && (result.length === 0 || typeof result[0].event === 'object');
    }
    function correctSelectResult(result) {
        return Array.isArray(result) && (result.length === 0 || typeof result[0].result === 'object');
    }
    function timeBoundaryPostProcessFactory(applies) {
        return function (res) {
            if (!correctTimeBoundaryResult(res)) {
                var err = new Error("unexpected result from Druid (timeBoundary)");
                err.result = res;
                throw err;
            }
            var result = res[0].result;
            var datum = {};
            for (var _i = 0, applies_9 = applies; _i < applies_9.length; _i++) {
                var apply = applies_9[_i];
                var name_1 = apply.name;
                var aggregate = apply.expression.actions[0].action;
                if (typeof result === 'string') {
                    datum[name_1] = new Date(result);
                }
                else {
                    if (aggregate === 'max') {
                        datum[name_1] = new Date((result['maxIngestedEventTime'] || result['maxTime']));
                    }
                    else {
                        datum[name_1] = new Date((result['minTime']));
                    }
                }
            }
            return new Plywood.Dataset({ data: [datum] });
        };
    }
    function valuePostProcess(res) {
        if (!correctTimeseriesResult(res)) {
            var err = new Error("unexpected result from Druid (all / value)");
            err.result = res;
            throw err;
        }
        if (!res.length) {
            return 0;
        }
        return res[0].result[Plywood.External.VALUE_NAME];
    }
    function totalPostProcessFactory(applies) {
        return function (res) {
            if (!correctTimeseriesResult(res)) {
                var err = new Error("unexpected result from Druid (all)");
                err.result = res;
                throw err;
            }
            if (!res.length) {
                return new Plywood.Dataset({ data: [Plywood.External.makeZeroDatum(applies)] });
            }
            var datum = res[0].result;
            cleanDatumInPlace(datum);
            return new Plywood.Dataset({ data: [datum] });
        };
    }
    function wrapFunctionTryCatch(lines) {
        return 'function(s){try{\n' + lines.filter(Boolean).join('\n') + '\n}catch(e){return null;}}';
    }
    function timeseriesNormalizerFactory(timestampLabel) {
        if (timestampLabel === void 0) { timestampLabel = null; }
        return function (res) {
            if (!correctTimeseriesResult(res)) {
                var err = new Error("unexpected result from Druid (timeseries)");
                err.result = res;
                throw err;
            }
            return res.map(function (r) {
                var datum = r.result;
                cleanDatumInPlace(datum);
                if (timestampLabel)
                    datum[timestampLabel] = r.timestamp;
                return datum;
            });
        };
    }
    function topNNormalizer(res) {
        if (!correctTopNResult(res)) {
            var err = new Error("unexpected result from Druid (topN)");
            err.result = res;
            throw err;
        }
        var data = res.length ? res[0].result : [];
        for (var _i = 0, data_9 = data; _i < data_9.length; _i++) {
            var d = data_9[_i];
            cleanDatumInPlace(d);
        }
        return data;
    }
    function groupByNormalizerFactory(timestampLabel) {
        if (timestampLabel === void 0) { timestampLabel = null; }
        return function (res) {
            if (!correctGroupByResult(res)) {
                var err = new Error("unexpected result from Druid (groupBy)");
                err.result = res;
                throw err;
            }
            return res.map(function (r) {
                var datum = r.event;
                cleanDatumInPlace(datum);
                if (timestampLabel)
                    datum[timestampLabel] = r.timestamp;
                return datum;
            });
        };
    }
    function selectNormalizerFactory(timestampLabel) {
        return function (results) {
            var data = [];
            for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                var result = results_1[_i];
                if (!correctSelectResult(result)) {
                    var err = new Error("unexpected result from Druid (select)");
                    err.result = result;
                    throw err;
                }
                if (result.length === 0)
                    continue;
                var events = result[0].result.events;
                for (var _a = 0, events_1 = events; _a < events_1.length; _a++) {
                    var event = events_1[_a];
                    var datum = event.event;
                    if (timestampLabel != null) {
                        datum[timestampLabel] = datum['timestamp'];
                    }
                    delete datum['timestamp'];
                    cleanDatumInPlace(datum);
                    data.push(datum);
                }
            }
            return data;
        };
    }
    function postProcessFactory(normalizer, inflaters, attributes) {
        return function (res) {
            var data = normalizer(res);
            var n = data.length;
            for (var _i = 0, inflaters_1 = inflaters; _i < inflaters_1.length; _i++) {
                var inflater = inflaters_1[_i];
                for (var i = 0; i < n; i++) {
                    inflater(data[i], i, data);
                }
            }
            return new Plywood.Dataset({ data: data, attributes: attributes });
        };
    }
    function selectNextFactory(limit, descending) {
        var resultsSoFar = 0;
        return function (prevQuery, prevResult) {
            if (!correctSelectResult(prevResult)) {
                var err = new Error("unexpected result from Druid (select / partial)");
                err.result = prevResult;
                throw err;
            }
            if (prevResult.length === 0)
                return null;
            var _a = prevResult[0].result, pagingIdentifiers = _a.pagingIdentifiers, events = _a.events;
            if (events.length < prevQuery.pagingSpec.threshold)
                return null;
            resultsSoFar += events.length;
            if (resultsSoFar >= limit)
                return null;
            var pagingIdentifiers = DruidExternal.movePagingIdentifiers(pagingIdentifiers, descending ? -1 : 1);
            prevQuery.pagingSpec.pagingIdentifiers = pagingIdentifiers;
            prevQuery.pagingSpec.threshold = Math.min(limit - resultsSoFar, DruidExternal.SELECT_MAX_LIMIT);
            return prevQuery;
        };
    }
    function generateMakerAction(aggregation) {
        if (!aggregation)
            return null;
        var type = aggregation.type, fieldName = aggregation.fieldName;
        if (type === 'longSum' && fieldName === 'count') {
            return new Plywood.CountAction({});
        }
        if (!fieldName) {
            var fieldNames = aggregation.fieldNames;
            if (!Array.isArray(fieldNames) || fieldNames.length !== 1)
                return null;
            fieldName = fieldNames[0];
        }
        var expression = Plywood.$(fieldName);
        switch (type) {
            case "count":
                return new Plywood.CountAction({});
            case "doubleSum":
            case "longSum":
                return new Plywood.SumAction({ expression: expression });
            case "javascript":
                var fnAggregate = aggregation.fnAggregate, fnCombine = aggregation.fnCombine;
                if (fnAggregate !== fnCombine || fnCombine.indexOf('+') === -1)
                    return null;
                return new Plywood.SumAction({ expression: expression });
            case "doubleMin":
            case "longMin":
                return new Plywood.MinAction({ expression: expression });
            case "doubleMax":
            case "longMax":
                return new Plywood.MaxAction({ expression: expression });
            default:
                return null;
        }
    }
    function segmentMetadataPostProcessFactory(timeAttribute) {
        return function (res) {
            var res0 = res[0];
            if (!res0 || !res0.columns)
                throw new Error('malformed segmentMetadata response');
            var columns = res0.columns;
            var aggregators = res0.aggregators || {};
            var foundTime = false;
            var attributes = [];
            for (var name in columns) {
                if (!hasOwnProperty(columns, name))
                    continue;
                var columnData = columns[name];
                if (columnData.errorMessage || columnData.size < 0)
                    continue;
                if (name === '__time') {
                    attributes.push(new Plywood.AttributeInfo({ name: timeAttribute, type: 'TIME' }));
                    foundTime = true;
                }
                else {
                    if (name === timeAttribute)
                        continue;
                    switch (columnData.type) {
                        case 'FLOAT':
                        case 'LONG':
                            attributes.push(new Plywood.AttributeInfo({
                                name: name,
                                type: 'NUMBER',
                                unsplitable: true,
                                makerAction: generateMakerAction(aggregators[name])
                            }));
                            break;
                        case 'STRING':
                            attributes.push(new Plywood.AttributeInfo({
                                name: name,
                                type: columnData.hasMultipleValues ? 'SET/STRING' : 'STRING'
                            }));
                            break;
                        case 'hyperUnique':
                            attributes.push(new Plywood.UniqueAttributeInfo({ name: name }));
                            break;
                        case 'approximateHistogram':
                            attributes.push(new Plywood.HistogramAttributeInfo({ name: name }));
                            break;
                        case 'thetaSketch':
                            attributes.push(new Plywood.ThetaAttributeInfo({ name: name }));
                            break;
                    }
                }
            }
            if (!foundTime)
                throw new Error('no valid __time in segmentMetadata response');
            return attributes;
        };
    }
    function introspectPostProcessFactory(timeAttribute) {
        return function (res) {
            if (!Array.isArray(res.dimensions) || !Array.isArray(res.metrics)) {
                throw new Error('malformed GET introspect response');
            }
            var attributes = [
                new Plywood.AttributeInfo({ name: timeAttribute, type: 'TIME' })
            ];
            res.dimensions.forEach(function (dimension) {
                if (dimension === timeAttribute)
                    return;
                attributes.push(new Plywood.AttributeInfo({ name: dimension, type: 'STRING' }));
            });
            res.metrics.forEach(function (metric) {
                if (metric === timeAttribute)
                    return;
                attributes.push(new Plywood.AttributeInfo({ name: metric, type: 'NUMBER', unsplitable: true }));
            });
            return attributes;
        };
    }
    var DruidExternal = (function (_super) {
        __extends(DruidExternal, _super);
        function DruidExternal(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureEngine("druid");
            this._ensureMinVersion("0.8.0");
            this.dataSource = parameters.dataSource;
            this.timeAttribute = parameters.timeAttribute || DEFAULT_TIME_ATTRIBUTE;
            this.customAggregations = parameters.customAggregations;
            this.allowEternity = parameters.allowEternity;
            this.allowSelectQueries = parameters.allowSelectQueries;
            var introspectionStrategy = parameters.introspectionStrategy || DruidExternal.DEFAULT_INTROSPECTION_STRATEGY;
            if (DruidExternal.VALID_INTROSPECTION_STRATEGIES.indexOf(introspectionStrategy) === -1) {
                throw new Error("invalid introspectionStrategy '" + introspectionStrategy + "'");
            }
            this.introspectionStrategy = introspectionStrategy;
            this.exactResultsOnly = parameters.exactResultsOnly;
            this.context = parameters.context;
        }
        DruidExternal.fromJS = function (parameters, requester) {
            if (typeof parameters.druidVersion === 'string') {
                parameters.version = parameters.druidVersion;
                console.warn("'druidVersion' parameter is deprecated, use 'version: " + parameters.version + "' instead");
            }
            var value = Plywood.External.jsToValue(parameters, requester);
            value.dataSource = parameters.dataSource;
            value.timeAttribute = parameters.timeAttribute;
            value.customAggregations = parameters.customAggregations || {};
            value.allowEternity = Boolean(parameters.allowEternity);
            value.allowSelectQueries = Boolean(parameters.allowSelectQueries);
            value.introspectionStrategy = parameters.introspectionStrategy;
            value.exactResultsOnly = Boolean(parameters.exactResultsOnly);
            value.context = parameters.context;
            return new DruidExternal(value);
        };
        DruidExternal.getSourceList = function (requester) {
            return requester({ query: { queryType: 'sourceList' } })
                .then(function (sources) {
                if (!Array.isArray(sources))
                    throw new Error('invalid sources response');
                return sources.sort();
            });
        };
        DruidExternal.getVersion = function (requester) {
            return requester({
                query: {
                    queryType: 'status'
                }
            })
                .then((function (res) { return Plywood.External.extractVersion(res.version); }), function () { return null; });
        };
        DruidExternal.movePagingIdentifiers = function (pagingIdentifiers, increment) {
            var newPagingIdentifiers = {};
            for (var key in pagingIdentifiers) {
                if (!hasOwnProperty(pagingIdentifiers, key))
                    continue;
                newPagingIdentifiers[key] = pagingIdentifiers[key] + increment;
            }
            return newPagingIdentifiers;
        };
        DruidExternal.timePartToExtraction = function (part, timezone) {
            var format = DruidExternal.TIME_PART_TO_FORMAT[part];
            if (format) {
                return {
                    "format": format,
                    "locale": "en-US",
                    "timeZone": timezone.toString(),
                    "type": "timeFormat"
                };
            }
            else {
                var expr = DruidExternal.TIME_PART_TO_EXPR[part];
                if (!expr)
                    throw new Error("can not part on " + part);
                return {
                    type: 'javascript',
                    'function': wrapFunctionTryCatch([
                        'var d = new org.joda.time.DateTime(s);',
                        timezone.isUTC() ? null : "d = d.withZone(org.joda.time.DateTimeZone.forID(" + JSON.stringify(timezone) + "));",
                        ("d = " + expr + ";"),
                        'return d;'
                    ])
                };
            }
        };
        DruidExternal.timeFloorToExtraction = function (duration, timezone) {
            var singleSpan = duration.getSingleSpan();
            var spanValue = duration.getSingleSpanValue();
            if (spanValue === 1 && DruidExternal.SPAN_TO_FLOOR_FORMAT[singleSpan]) {
                return {
                    "format": DruidExternal.SPAN_TO_FLOOR_FORMAT[singleSpan],
                    "locale": "en-US",
                    "timeZone": timezone.toString(),
                    "type": "timeFormat"
                };
            }
            else {
                var prop = DruidExternal.SPAN_TO_PROPERTY[singleSpan];
                if (!prop)
                    throw new Error("can not floor on " + duration);
                return {
                    type: 'javascript',
                    'function': wrapFunctionTryCatch([
                        'var d = new org.joda.time.DateTime(s);',
                        timezone.isUTC() ? null : "d = d.withZone(org.joda.time.DateTimeZone.forID(" + JSON.stringify(timezone) + "));",
                        ("d = d." + prop + "().roundFloorCopy();"),
                        ("d = d." + prop + "().setCopy(Math.floor(d." + prop + "().get() / " + spanValue + ") * " + spanValue + ");"),
                        'return d;'
                    ])
                };
            }
        };
        DruidExternal.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.dataSource = this.dataSource;
            value.timeAttribute = this.timeAttribute;
            value.customAggregations = this.customAggregations;
            value.allowEternity = this.allowEternity;
            value.allowSelectQueries = this.allowSelectQueries;
            value.introspectionStrategy = this.introspectionStrategy;
            value.exactResultsOnly = this.exactResultsOnly;
            value.context = this.context;
            return value;
        };
        DruidExternal.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.dataSource = this.dataSource;
            if (this.timeAttribute !== DEFAULT_TIME_ATTRIBUTE)
                js.timeAttribute = this.timeAttribute;
            if (Plywood.helper.nonEmptyLookup(this.customAggregations))
                js.customAggregations = this.customAggregations;
            if (this.allowEternity)
                js.allowEternity = true;
            if (this.allowSelectQueries)
                js.allowSelectQueries = true;
            if (this.introspectionStrategy !== DruidExternal.DEFAULT_INTROSPECTION_STRATEGY)
                js.introspectionStrategy = this.introspectionStrategy;
            if (this.exactResultsOnly)
                js.exactResultsOnly = true;
            if (this.context)
                js.context = this.context;
            return js;
        };
        DruidExternal.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                String(this.dataSource) === String(other.dataSource) &&
                this.timeAttribute === other.timeAttribute &&
                customAggregationsEqual(this.customAggregations, other.customAggregations) &&
                this.allowEternity === other.allowEternity &&
                this.allowSelectQueries === other.allowSelectQueries &&
                this.introspectionStrategy === other.introspectionStrategy &&
                this.exactResultsOnly === other.exactResultsOnly &&
                dictEqual(this.context, other.context);
        };
        DruidExternal.prototype.getSingleReferenceAttributeInfo = function (ex) {
            var freeReferences = ex.getFreeReferences();
            if (freeReferences.length !== 1)
                throw new Error("can not translate multi reference expression " + ex + " to Druid");
            var referenceName = freeReferences[0];
            return this.getAttributesInfo(referenceName);
        };
        DruidExternal.prototype.canHandleFilter = function (ex) {
            return true;
        };
        DruidExternal.prototype.canHandleTotal = function () {
            return true;
        };
        DruidExternal.prototype.canHandleSplit = function (ex) {
            return true;
        };
        DruidExternal.prototype.canHandleApply = function (ex) {
            return true;
        };
        DruidExternal.prototype.canHandleSort = function (sortAction) {
            if (this.isTimeseries()) {
                if (sortAction.direction !== 'ascending')
                    return false;
                return sortAction.refName() === this.split.firstSplitName();
            }
            else if (this.mode === 'raw') {
                if (sortAction.refName() !== this.timeAttribute)
                    return false;
                if (this.versionBefore('0.9.0'))
                    return sortAction.direction === 'ascending';
                return true;
            }
            else {
                return true;
            }
        };
        DruidExternal.prototype.canHandleLimit = function (limitAction) {
            return !this.isTimeseries();
        };
        DruidExternal.prototype.canHandleHavingFilter = function (ex) {
            return !this.limit;
        };
        DruidExternal.prototype.isTimeseries = function () {
            var split = this.split;
            if (!split || split.isMultiSplit())
                return false;
            var splitExpression = split.firstSplitExpression();
            if (this.isTimeRef(splitExpression))
                return true;
            if (splitExpression instanceof Plywood.ChainExpression) {
                var actions = splitExpression.actions;
                if (actions.length !== 1)
                    return false;
                var action = actions[0].action;
                return action === 'timeBucket' || action === 'timeFloor';
            }
            return false;
        };
        DruidExternal.prototype.getDruidDataSource = function () {
            var dataSource = this.dataSource;
            if (Array.isArray(dataSource)) {
                return {
                    type: "union",
                    dataSources: dataSource
                };
            }
            else {
                return dataSource;
            }
        };
        DruidExternal.prototype.makeJavaScriptFilter = function (ex) {
            var attributeInfo = this.getSingleReferenceAttributeInfo(ex);
            return {
                type: "javascript",
                dimension: attributeInfo.name,
                "function": ex.getJSFn('d')
            };
        };
        DruidExternal.prototype.makeExtractionFilter = function (ex) {
            var attributeInfo = this.getSingleReferenceAttributeInfo(ex);
            var extractionFn = this.expressionToExtractionFn(ex);
            return {
                type: "extraction",
                dimension: attributeInfo.name,
                extractionFn: extractionFn,
                value: "true"
            };
        };
        DruidExternal.prototype.makeSelectorFilter = function (ex, value) {
            var attributeInfo = this.getSingleReferenceAttributeInfo(ex);
            if (attributeInfo.unsplitable) {
                throw new Error("can not convert " + ex + " = " + value + " to filter because it references an un-filterable metric '" + attributeInfo.name + "' which is most likely rolled up.");
            }
            var extractionFn = this.expressionToExtractionFn(ex);
            var dimensionName = attributeInfo.name === this.timeAttribute ? '__time' : attributeInfo.name;
            if (Plywood.Range.isRange(value))
                value = value.start;
            var druidFilter = {
                type: "selector",
                dimension: dimensionName,
                value: attributeInfo.serialize(value)
            };
            if (extractionFn) {
                druidFilter.type = "extraction";
                druidFilter.extractionFn = extractionFn;
                if (this.versionBefore('0.9.0') && druidFilter.value === null)
                    druidFilter.value = '';
            }
            return druidFilter;
        };
        DruidExternal.prototype.makeInFilter = function (ex, valueSet) {
            var _this = this;
            var attributeInfo = this.getSingleReferenceAttributeInfo(ex);
            var extractionFn = this.expressionToExtractionFn(ex);
            var elements = valueSet.elements;
            if (elements.length < 2 || extractionFn || this.versionBefore('0.9.0')) {
                var fields = elements.map(function (value) {
                    return _this.makeSelectorFilter(ex, value);
                });
                return fields.length === 1 ? fields[0] : { type: "or", fields: fields };
            }
            return {
                type: 'in',
                dimension: attributeInfo.name,
                values: elements.map(function (value) { return attributeInfo.serialize(value); })
            };
        };
        DruidExternal.prototype.makeBoundFilter = function (ex, range) {
            var r0 = range.start;
            var r1 = range.end;
            var bounds = range.bounds;
            if (this.versionBefore('0.9.0') || r0 < 0 || r1 < 0) {
                return this.makeJavaScriptFilter(ex.in(range));
            }
            var attributeInfo = this.getSingleReferenceAttributeInfo(ex);
            var boundFilter = {
                type: "bound",
                dimension: attributeInfo.name
            };
            if (Plywood.NumberRange.isNumberRange(range)) {
                boundFilter.alphaNumeric = true;
            }
            if (r0 != null) {
                boundFilter.lower = Plywood.isDate(r0) ? r0.toISOString() : r0;
                if (bounds[0] === '(')
                    boundFilter.lowerStrict = true;
            }
            if (r1 != null) {
                boundFilter.upper = Plywood.isDate(r1) ? r1.toISOString() : r1;
                if (bounds[1] === ')')
                    boundFilter.upperStrict = true;
            }
            return boundFilter;
        };
        DruidExternal.prototype.makeRegexFilter = function (ex, regex) {
            var attributeInfo = this.getSingleReferenceAttributeInfo(ex);
            var extractionFn = this.expressionToExtractionFn(ex);
            if (extractionFn) {
                return this.makeExtractionFilter(ex.match(regex));
            }
            return {
                type: "regex",
                dimension: attributeInfo.name,
                pattern: regex
            };
        };
        DruidExternal.prototype.makeContainsFilter = function (lhs, rhs, compare) {
            if (rhs instanceof Plywood.LiteralExpression) {
                var attributeInfo = this.getSingleReferenceAttributeInfo(lhs);
                var extractionFn = this.expressionToExtractionFn(lhs);
                if (extractionFn) {
                    return this.makeExtractionFilter(lhs.contains(rhs, compare));
                }
                if (compare === Plywood.ContainsAction.IGNORE_CASE) {
                    return {
                        type: "search",
                        dimension: attributeInfo.name,
                        query: {
                            type: "insensitive_contains",
                            value: rhs.value
                        }
                    };
                }
                else {
                    return this.makeJavaScriptFilter(lhs.contains(rhs, compare));
                }
            }
            else {
                return this.makeJavaScriptFilter(lhs.contains(rhs, compare));
            }
        };
        DruidExternal.prototype.timelessFilterToDruid = function (filter, aggregatorFilter) {
            var _this = this;
            if (filter.type !== 'BOOLEAN')
                throw new Error("must be a BOOLEAN filter");
            if (filter instanceof Plywood.RefExpression) {
                filter = filter.is(true);
            }
            if (filter instanceof Plywood.LiteralExpression) {
                if (filter.value === true) {
                    return null;
                }
                else {
                    throw new Error("should never get here");
                }
            }
            else if (filter instanceof Plywood.ChainExpression) {
                var pattern;
                if (pattern = filter.getExpressionPattern('and')) {
                    return {
                        type: 'and',
                        fields: pattern.map(function (p) { return _this.timelessFilterToDruid(p, aggregatorFilter); })
                    };
                }
                if (pattern = filter.getExpressionPattern('or')) {
                    return {
                        type: 'or',
                        fields: pattern.map(function (p) { return _this.timelessFilterToDruid(p, aggregatorFilter); })
                    };
                }
                var filterAction = filter.lastAction();
                var rhs = filterAction.expression;
                var lhs = filter.popAction();
                if (filterAction instanceof Plywood.NotAction) {
                    return {
                        type: 'not',
                        field: this.timelessFilterToDruid(lhs, aggregatorFilter)
                    };
                }
                if (lhs instanceof Plywood.LiteralExpression) {
                    if (filterAction.action !== 'in')
                        throw new Error("can not convert " + filter + " to Druid filter");
                    return this.makeSelectorFilter(rhs, lhs.value);
                }
                if (filterAction instanceof Plywood.IsAction) {
                    if (rhs instanceof Plywood.LiteralExpression) {
                        return this.makeSelectorFilter(lhs, rhs.value);
                    }
                    else {
                        throw new Error("can not convert " + filter + " to Druid filter");
                    }
                }
                var freeReferences = filter.getFreeReferences();
                if (freeReferences.length !== 1)
                    throw new Error("can not convert multi reference filter " + filter + " to Druid filter");
                var referenceName = freeReferences[0];
                var attributeInfo = this.getAttributesInfo(referenceName);
                if (attributeInfo.unsplitable) {
                    throw new Error("can not convert " + filter + " to filter because it references an un-filterable metric '" + referenceName + "' which is most likely rolled up.");
                }
                if (filterAction instanceof Plywood.InAction || filterAction instanceof Plywood.OverlapAction) {
                    if (rhs instanceof Plywood.LiteralExpression) {
                        var rhsType = rhs.type;
                        if (rhsType === 'SET/STRING' || rhsType === 'SET/NUMBER' || rhsType === 'SET/NULL') {
                            return this.makeInFilter(lhs, rhs.value);
                        }
                        else if (rhsType === 'NUMBER_RANGE' || rhsType === 'TIME_RANGE') {
                            return this.makeBoundFilter(lhs, rhs.value);
                        }
                        else if (rhsType === 'SET/NUMBER_RANGE' || rhsType === 'SET/TIME_RANGE') {
                            var elements = rhs.value.elements;
                            var fields = elements.map(function (range) {
                                return _this.makeBoundFilter(lhs, range);
                            });
                            return fields.length === 1 ? fields[0] : { type: "or", fields: fields };
                        }
                        else {
                            throw new Error("not supported IN rhs type " + rhsType);
                        }
                    }
                    else {
                        throw new Error("can not convert " + filter + " to Druid filter");
                    }
                }
                if (aggregatorFilter) {
                    if (this.versionBefore('0.8.2'))
                        throw new Error("can not express aggregate filter " + filter + " in druid < 0.8.2");
                    return this.makeExtractionFilter(filter);
                }
                if (filterAction instanceof Plywood.MatchAction) {
                    return this.makeRegexFilter(lhs, filterAction.regexp);
                }
                if (filterAction instanceof Plywood.ContainsAction) {
                    return this.makeContainsFilter(lhs, rhs, filterAction.compare);
                }
            }
            throw new Error("could not convert filter " + filter + " to Druid filter");
        };
        DruidExternal.prototype.timeFilterToIntervals = function (filter) {
            if (filter.type !== 'BOOLEAN')
                throw new Error("must be a BOOLEAN filter");
            if (filter instanceof Plywood.LiteralExpression) {
                if (!filter.value)
                    return DruidExternal.FALSE_INTERVAL;
                if (!this.allowEternity)
                    throw new Error('must filter on time unless the allowEternity flag is set');
                return DruidExternal.TRUE_INTERVAL;
            }
            else if (filter instanceof Plywood.ChainExpression) {
                var lhs = filter.expression;
                var actions = filter.actions;
                if (actions.length !== 1)
                    throw new Error("can not convert " + filter + " to Druid interval");
                var filterAction = actions[0];
                var rhs = filterAction.expression;
                if (filterAction instanceof Plywood.IsAction) {
                    if (lhs instanceof Plywood.RefExpression && rhs instanceof Plywood.LiteralExpression) {
                        return Plywood.TimeRange.intervalFromDate(rhs.value);
                    }
                    else {
                        throw new Error("can not convert " + filter + " to Druid interval");
                    }
                }
                else if (filterAction instanceof Plywood.InAction) {
                    if (lhs instanceof Plywood.RefExpression && rhs instanceof Plywood.LiteralExpression) {
                        var timeRanges;
                        var rhsType = rhs.type;
                        if (rhsType === 'SET/TIME_RANGE') {
                            timeRanges = rhs.value.elements;
                        }
                        else if (rhsType === 'TIME_RANGE') {
                            timeRanges = [rhs.value];
                        }
                        else {
                            throw new Error("not supported " + rhsType + " for time filtering");
                        }
                        var intervals = timeRanges.map(function (timeRange) { return timeRange.toInterval(); });
                        return intervals.length === 1 ? intervals[0] : intervals;
                    }
                    else {
                        throw new Error("can not convert " + filter + " to Druid interval");
                    }
                }
                else {
                    throw new Error("can not convert " + filter + " to Druid interval");
                }
            }
            else {
                throw new Error("can not convert " + filter + " to Druid interval");
            }
        };
        DruidExternal.prototype.filterToDruid = function (filter) {
            if (filter.type !== 'BOOLEAN')
                throw new Error("must be a BOOLEAN filter");
            if (filter.equals(Plywood.Expression.FALSE)) {
                return {
                    intervals: DruidExternal.FALSE_INTERVAL,
                    filter: null
                };
            }
            else {
                var timeAttribute_1 = this.timeAttribute;
                var _a = filter.extractFromAnd(function (ex) {
                    if (ex instanceof Plywood.ChainExpression) {
                        var op = ex.expression;
                        var actions = ex.actions;
                        if (op instanceof Plywood.RefExpression) {
                            if (!(op.name === timeAttribute_1 && actions.length === 1))
                                return false;
                            var action = actions[0].action;
                            return action === 'is' || action === 'in';
                        }
                    }
                    return false;
                }), extract = _a.extract, rest = _a.rest;
                return {
                    intervals: this.timeFilterToIntervals(extract),
                    filter: this.timelessFilterToDruid(rest, false)
                };
            }
        };
        DruidExternal.prototype.isTimeRef = function (ex) {
            return ex instanceof Plywood.RefExpression && ex.name === this.timeAttribute;
        };
        DruidExternal.prototype.splitExpressionToGranularityInflater = function (splitExpression, label) {
            if (this.isTimeRef(splitExpression)) {
                return {
                    granularity: 'none',
                    inflater: Plywood.External.timeInflaterFactory(label)
                };
            }
            else if (splitExpression instanceof Plywood.ChainExpression) {
                var splitActions = splitExpression.actions;
                if (this.isTimeRef(splitExpression.expression) && splitActions.length === 1) {
                    var action = splitActions[0];
                    if (action instanceof Plywood.TimeBucketAction || action instanceof Plywood.TimeFloorAction) {
                        var duration = action.duration;
                        var timezone = action.getTimezone();
                        return {
                            granularity: {
                                type: "period",
                                period: duration.toString(),
                                timeZone: timezone.toString()
                            },
                            inflater: action.action === 'timeBucket' ?
                                Plywood.External.timeRangeInflaterFactory(label, duration, timezone) :
                                Plywood.External.timeInflaterFactory(label)
                        };
                    }
                }
            }
            return null;
        };
        DruidExternal.prototype.expressionToExtractionFn = function (expression) {
            var extractionFns = [];
            this._expressionToExtractionFns(expression, extractionFns);
            switch (extractionFns.length) {
                case 0: return null;
                case 1: return extractionFns[0];
                default:
                    if (extractionFns.every(function (extractionFn) { return extractionFn.type === 'javascript'; })) {
                        return this.expressionToJavaScriptExtractionFn(expression);
                    }
                    if (this.versionBefore('0.9.0')) {
                        try {
                            return this.expressionToJavaScriptExtractionFn(expression);
                        }
                        catch (e) {
                            throw new Error("can not convert " + expression + " to filter in Druid < 0.9.0");
                        }
                    }
                    return { type: 'cascade', extractionFns: extractionFns };
            }
        };
        DruidExternal.prototype._expressionToExtractionFns = function (expression, extractionFns) {
            var freeReferences = expression.getFreeReferences();
            if (freeReferences.length !== 1) {
                throw new Error("must have 1 reference (has " + freeReferences.length + "): " + expression);
            }
            if (expression instanceof Plywood.RefExpression) {
                this._processRefExtractionFn(expression, extractionFns);
                return;
            }
            if (expression instanceof Plywood.ChainExpression) {
                var lead = expression.expression;
                var actions = expression.actions;
                var i = 0;
                var curAction = actions[0];
                var concatPrefix = [];
                if (curAction.action === 'concat') {
                    concatPrefix.push(lead);
                    while (curAction && curAction.action === 'concat') {
                        concatPrefix.push(curAction.expression);
                        curAction = actions[++i];
                    }
                    this._processConcatExtractionFn(concatPrefix, extractionFns);
                }
                else if (lead.type === 'NUMBER' && (expression.type === 'NUMBER' || expression.type === 'NUMBER_RANGE')) {
                    extractionFns.push(this.expressionToJavaScriptExtractionFn(expression));
                    return;
                }
                else if (!lead.isOp('ref')) {
                    throw new Error("can not convert complex: " + lead);
                }
                while (curAction) {
                    var nextAction = actions[i + 1];
                    var extractionFn;
                    if (nextAction instanceof Plywood.FallbackAction) {
                        extractionFn = this.actionToExtractionFn(curAction, nextAction);
                        i++;
                    }
                    else {
                        extractionFn = this.actionToExtractionFn(curAction, null);
                    }
                    extractionFns.push(extractionFn);
                    curAction = actions[++i];
                }
            }
        };
        DruidExternal.prototype._processRefExtractionFn = function (ref, extractionFns) {
            var attributeInfo = this.getAttributesInfo(ref.name);
            if (attributeInfo instanceof Plywood.RangeAttributeInfo) {
                extractionFns.push(this.getRangeBucketingExtractionFn(attributeInfo, null));
                return;
            }
            if (ref.type === 'BOOLEAN') {
                extractionFns.push({
                    type: "lookup",
                    lookup: {
                        type: "map",
                        map: {
                            "0": "false",
                            "1": "true",
                            "false": "false",
                            "true": "true"
                        }
                    }
                });
                return;
            }
        };
        DruidExternal.prototype.actionToExtractionFn = function (action, fallbackAction) {
            if (action.action === 'extract' || action.action === 'lookup') {
                var retainMissingValue = false;
                var replaceMissingValueWith = null;
                if (fallbackAction) {
                    var fallbackExpression = fallbackAction.expression;
                    if (fallbackExpression.isOp("ref")) {
                        retainMissingValue = true;
                    }
                    else if (fallbackExpression.isOp("literal")) {
                        replaceMissingValueWith = fallbackExpression.getLiteralValue();
                    }
                    else {
                        throw new Error("unsupported fallback expression: " + fallbackExpression);
                    }
                }
                if (action instanceof Plywood.ExtractAction) {
                    if (this.versionBefore('0.9.0') && (retainMissingValue === false || replaceMissingValueWith !== null)) {
                        return this.actionToJavaScriptExtractionFn(action);
                    }
                    var regexExtractionFn = {
                        type: "regex",
                        expr: action.regexp
                    };
                    if (!retainMissingValue) {
                        regexExtractionFn.replaceMissingValue = true;
                    }
                    if (replaceMissingValueWith !== null) {
                        regexExtractionFn.replaceMissingValueWith = replaceMissingValueWith;
                    }
                    return regexExtractionFn;
                }
                if (action instanceof Plywood.LookupAction) {
                    var lookupExtractionFn = {
                        type: "lookup",
                        lookup: {
                            type: "namespace",
                            "namespace": action.lookup
                        }
                    };
                    if (retainMissingValue) {
                        lookupExtractionFn.retainMissingValue = true;
                    }
                    if (replaceMissingValueWith !== null) {
                        lookupExtractionFn.replaceMissingValueWith = replaceMissingValueWith;
                    }
                    return lookupExtractionFn;
                }
            }
            if (fallbackAction) {
                throw new Error("unsupported fallback after " + action.action + " action");
            }
            if (action.getOutputType(null) === 'BOOLEAN') {
                return this.actionToJavaScriptExtractionFn(action);
            }
            if (action instanceof Plywood.SubstrAction) {
                if (this.versionBefore('0.9.0'))
                    return this.actionToJavaScriptExtractionFn(action);
                return {
                    type: "substring",
                    index: action.position,
                    length: action.length
                };
            }
            if (action instanceof Plywood.TimeBucketAction || action instanceof Plywood.TimeFloorAction) {
                return DruidExternal.timeFloorToExtraction(action.duration, action.getTimezone());
            }
            if (action instanceof Plywood.TimePartAction) {
                return DruidExternal.timePartToExtraction(action.part, action.getTimezone());
            }
            if (action instanceof Plywood.NumberBucketAction) {
                return this.actionToJavaScriptExtractionFn(action);
            }
            if (action instanceof Plywood.AbsoluteAction || action instanceof Plywood.PowerAction) {
                return this.actionToJavaScriptExtractionFn(action);
            }
            if (action instanceof Plywood.FallbackAction && action.expression.isOp('literal')) {
                return {
                    type: "lookup",
                    retainMissingValue: true,
                    lookup: {
                        type: "map",
                        map: {
                            "": action.getLiteralValue()
                        }
                    }
                };
            }
            throw new Error("can not covert " + action + " to extractionFn");
        };
        DruidExternal.prototype._processConcatExtractionFn = function (pattern, extractionFns) {
            var _this = this;
            if (this.versionBefore('0.9.1')) {
                extractionFns.push({
                    type: "javascript",
                    'function': Plywood.Expression.concat(pattern).getJSFn('d'),
                    injective: true
                });
                return;
            }
            var format = pattern.map(function (ex) {
                if (ex instanceof Plywood.LiteralExpression) {
                    return ex.value.replace(/%/g, '\\%');
                }
                if (!ex.isOp('ref')) {
                    _this._expressionToExtractionFns(ex, extractionFns);
                }
                return '%s';
            }).join('');
            extractionFns.push({
                type: 'stringFormat',
                format: format,
                nullHandling: 'returnNull'
            });
        };
        DruidExternal.prototype.actionToJavaScriptExtractionFn = function (action) {
            return this.expressionToJavaScriptExtractionFn(Plywood.$('x').performAction(action));
        };
        DruidExternal.prototype.expressionToJavaScriptExtractionFn = function (ex) {
            return {
                type: "javascript",
                'function': ex.getJSFn('d')
            };
        };
        DruidExternal.prototype.getRangeBucketingExtractionFn = function (attributeInfo, numberBucket) {
            var regExp = attributeInfo.getMatchingRegExpString();
            if (numberBucket && numberBucket.offset === 0 && numberBucket.size === attributeInfo.rangeSize)
                numberBucket = null;
            var bucketing = '';
            if (numberBucket) {
                bucketing = 's=' + Plywood.continuousFloorExpression('s', 'Math.floor', numberBucket.size, numberBucket.offset) + ';';
            }
            return {
                type: "javascript",
                'function': "function(d) {\nvar m = d.match(" + regExp + ");\nif(!m) return 'null';\nvar s = +m[1];\nif(!(Math.abs(+m[2] - s - " + attributeInfo.rangeSize + ") < 1e-6)) return 'null'; " + bucketing + "\nvar parts = String(Math.abs(s)).split('.');\nparts[0] = ('000000000' + parts[0]).substr(-10);\nreturn (start < 0 ?'-':'') + parts.join('.');\n}"
            };
        };
        DruidExternal.prototype.expressionToDimensionInflater = function (expression, label) {
            var freeReferences = expression.getFreeReferences();
            if (freeReferences.length !== 1) {
                throw new Error("must have 1 reference (has " + freeReferences.length + "): " + expression);
            }
            var referenceName = freeReferences[0];
            var attributeInfo = this.getAttributesInfo(referenceName);
            if (attributeInfo.unsplitable) {
                throw new Error("can not convert " + expression + " to split because it references an un-splitable metric '" + referenceName + "' which is most likely rolled up.");
            }
            var extractionFn = this.expressionToExtractionFn(expression);
            var simpleInflater = Plywood.External.getSimpleInflater(expression, label);
            var dimension = {
                type: "default",
                dimension: referenceName === this.timeAttribute ? '__time' : referenceName,
                outputName: label
            };
            if (extractionFn) {
                dimension.type = "extraction";
                dimension.extractionFn = extractionFn;
            }
            if (expression instanceof Plywood.RefExpression) {
                if (attributeInfo instanceof Plywood.RangeAttributeInfo) {
                    return {
                        dimension: dimension,
                        inflater: Plywood.External.numberRangeInflaterFactory(label, attributeInfo.rangeSize)
                    };
                }
                return {
                    dimension: dimension,
                    inflater: simpleInflater
                };
            }
            if (expression instanceof Plywood.ChainExpression) {
                var splitAction = expression.lastAction();
                if (splitAction instanceof Plywood.TimeBucketAction) {
                    return {
                        dimension: dimension,
                        inflater: Plywood.External.timeRangeInflaterFactory(label, splitAction.duration, splitAction.getTimezone())
                    };
                }
                if (splitAction instanceof Plywood.TimePartAction) {
                    return {
                        dimension: dimension,
                        inflater: simpleInflater
                    };
                }
                if (splitAction instanceof Plywood.NumberBucketAction) {
                    if (attributeInfo.type === 'NUMBER') {
                        return {
                            dimension: dimension,
                            inflater: Plywood.External.numberRangeInflaterFactory(label, splitAction.size)
                        };
                    }
                    if (attributeInfo instanceof Plywood.RangeAttributeInfo) {
                        return {
                            dimension: dimension,
                            inflater: Plywood.External.numberRangeInflaterFactory(label, splitAction.size)
                        };
                    }
                }
            }
            var effectiveType = Plywood.unwrapSetType(expression.type);
            if (simpleInflater || effectiveType === 'STRING') {
                return {
                    dimension: dimension,
                    inflater: simpleInflater
                };
            }
            throw new Error("could not convert " + expression + " to a Druid dimension");
        };
        DruidExternal.prototype.splitToDruid = function (split) {
            var _this = this;
            if (split.isMultiSplit()) {
                var timestampLabel = null;
                var granularity = null;
                var dimensions = [];
                var inflaters = [];
                split.mapSplits(function (name, expression) {
                    if (!granularity && !_this.limit && !_this.sort) {
                        var granularityInflater = _this.splitExpressionToGranularityInflater(expression, name);
                        if (granularityInflater) {
                            timestampLabel = name;
                            granularity = granularityInflater.granularity;
                            inflaters.push(granularityInflater.inflater);
                            return;
                        }
                    }
                    var _a = _this.expressionToDimensionInflater(expression, name), dimension = _a.dimension, inflater = _a.inflater;
                    dimensions.push(dimension);
                    if (inflater) {
                        inflaters.push(inflater);
                    }
                });
                return {
                    queryType: 'groupBy',
                    dimensions: dimensions,
                    timestampLabel: timestampLabel,
                    granularity: granularity || 'all',
                    postProcess: postProcessFactory(groupByNormalizerFactory(timestampLabel), inflaters, null)
                };
            }
            var splitExpression = split.firstSplitExpression();
            var label = split.firstSplitName();
            var granularityInflater = this.splitExpressionToGranularityInflater(splitExpression, label);
            if (granularityInflater) {
                return {
                    queryType: 'timeseries',
                    granularity: granularityInflater.granularity,
                    postProcess: postProcessFactory(timeseriesNormalizerFactory(label), [granularityInflater.inflater], null)
                };
            }
            var dimensionInflater = this.expressionToDimensionInflater(splitExpression, label);
            var inflaters = [dimensionInflater.inflater].filter(Boolean);
            if (this.havingFilter.equals(Plywood.Expression.TRUE) &&
                (this.limit || split.maxBucketNumber() < 1000) &&
                !this.exactResultsOnly) {
                return {
                    queryType: 'topN',
                    dimension: dimensionInflater.dimension,
                    granularity: 'all',
                    postProcess: postProcessFactory(topNNormalizer, inflaters, null)
                };
            }
            return {
                queryType: 'groupBy',
                dimensions: [dimensionInflater.dimension],
                granularity: 'all',
                postProcess: postProcessFactory(groupByNormalizerFactory(), inflaters, null)
            };
        };
        DruidExternal.prototype.getAccessTypeForAggregation = function (aggregationType) {
            if (aggregationType === 'hyperUnique' || aggregationType === 'cardinality')
                return 'hyperUniqueCardinality';
            var customAggregations = this.customAggregations;
            for (var customName in customAggregations) {
                if (!hasOwnProperty(customAggregations, customName))
                    continue;
                var customAggregation = customAggregations[customName];
                if (customAggregation.aggregation.type === aggregationType) {
                    return customAggregation.accessType || 'fieldAccess';
                }
            }
            return 'fieldAccess';
        };
        DruidExternal.prototype.getAccessType = function (aggregations, aggregationName) {
            for (var _i = 0, aggregations_1 = aggregations; _i < aggregations_1.length; _i++) {
                var aggregation = aggregations_1[_i];
                if (aggregation.name === aggregationName) {
                    var aggregationType = aggregation.type;
                    if (aggregationType === 'filtered')
                        aggregationType = aggregation.aggregator.type;
                    return this.getAccessTypeForAggregation(aggregationType);
                }
            }
            return 'fieldAccess';
        };
        DruidExternal.prototype.expressionToPostAggregation = function (ex, aggregations, postAggregations) {
            var _this = this;
            if (ex instanceof Plywood.RefExpression) {
                var refName = ex.name;
                return {
                    type: this.getAccessType(aggregations, refName),
                    fieldName: refName
                };
            }
            else if (ex instanceof Plywood.LiteralExpression) {
                if (ex.type !== 'NUMBER')
                    throw new Error("must be a NUMBER type");
                return {
                    type: 'constant',
                    value: ex.value
                };
            }
            else if (ex instanceof Plywood.ChainExpression) {
                var lastAction = ex.lastAction();
                if (lastAction instanceof Plywood.AbsoluteAction || lastAction instanceof Plywood.PowerAction || lastAction instanceof Plywood.FallbackAction) {
                    var fieldNameRefs = ex.getFreeReferences();
                    var fieldNames = fieldNameRefs.map(function (fieldNameRef) {
                        var accessType = _this.getAccessType(aggregations, fieldNameRef);
                        if (accessType === 'fieldAccess')
                            return fieldNameRef;
                        var fieldNameRefTemp = '!F_' + fieldNameRef;
                        postAggregations.push({
                            name: fieldNameRefTemp,
                            type: accessType,
                            fieldName: fieldNameRef
                        });
                        return fieldNameRefTemp;
                    });
                    return {
                        type: 'javascript',
                        fieldNames: fieldNames,
                        'function': "function(" + fieldNameRefs.map(Plywood.RefExpression.toSimpleName) + ") { return " + ex.getJS(null) + "; }"
                    };
                }
                var pattern;
                if (pattern = ex.getExpressionPattern('add')) {
                    return {
                        type: 'arithmetic',
                        fn: '+',
                        fields: pattern.map(function (e) { return _this.expressionToPostAggregation(e, aggregations, postAggregations); })
                    };
                }
                if (pattern = ex.getExpressionPattern('subtract')) {
                    return {
                        type: 'arithmetic',
                        fn: '-',
                        fields: pattern.map(function (e) { return _this.expressionToPostAggregation(e, aggregations, postAggregations); })
                    };
                }
                if (pattern = ex.getExpressionPattern('multiply')) {
                    return {
                        type: 'arithmetic',
                        fn: '*',
                        fields: pattern.map(function (e) { return _this.expressionToPostAggregation(e, aggregations, postAggregations); })
                    };
                }
                if (pattern = ex.getExpressionPattern('divide')) {
                    return {
                        type: 'arithmetic',
                        fn: '/',
                        fields: pattern.map(function (e) { return _this.expressionToPostAggregation(e, aggregations, postAggregations); })
                    };
                }
                throw new Error("can not convert chain to post agg: " + ex);
            }
            else {
                throw new Error("can not convert expression to post agg: " + ex);
            }
        };
        DruidExternal.prototype.applyToPostAggregation = function (action, aggregations, postAggregations) {
            var postAgg = this.expressionToPostAggregation(action.expression, aggregations, postAggregations);
            postAgg.name = action.name;
            postAggregations.push(postAgg);
        };
        DruidExternal.prototype.makeNativeAggregateFilter = function (filterExpression, aggregator) {
            return {
                type: "filtered",
                name: aggregator.name,
                filter: this.timelessFilterToDruid(filterExpression, true),
                aggregator: aggregator
            };
        };
        DruidExternal.prototype.makeStandardAggregation = function (name, aggregateAction) {
            var fn = aggregateAction.action;
            var aggregateExpression = aggregateAction.expression;
            var aggregation = {
                name: name,
                type: AGGREGATE_TO_DRUID[fn]
            };
            if (fn !== 'count') {
                if (aggregateExpression instanceof Plywood.RefExpression) {
                    var refName = aggregateExpression.name;
                    var attributeInfo = this.getAttributesInfo(refName);
                    if (attributeInfo.unsplitable) {
                        aggregation.fieldName = refName;
                    }
                    else {
                        return this.makeJavaScriptAggregation(name, aggregateAction);
                    }
                }
                else {
                    return this.makeJavaScriptAggregation(name, aggregateAction);
                }
            }
            return aggregation;
        };
        DruidExternal.prototype.makeCountDistinctAggregation = function (name, action, postAggregations) {
            if (this.exactResultsOnly) {
                throw new Error("approximate query not allowed");
            }
            var attribute = action.expression;
            if (attribute instanceof Plywood.RefExpression) {
                var attributeName = attribute.name;
            }
            else {
                throw new Error("can not compute countDistinct on derived attribute: " + attribute);
            }
            var attributeInfo = this.getAttributesInfo(attributeName);
            if (attributeInfo instanceof Plywood.UniqueAttributeInfo) {
                return {
                    name: name,
                    type: "hyperUnique",
                    fieldName: attributeName
                };
            }
            else if (attributeInfo instanceof Plywood.ThetaAttributeInfo) {
                var tempName = '!Theta_' + name;
                postAggregations.push({
                    type: "thetaSketchEstimate",
                    name: name,
                    field: { type: 'fieldAccess', fieldName: tempName }
                });
                return {
                    name: tempName,
                    type: "thetaSketch",
                    fieldName: attributeName
                };
            }
            else {
                return {
                    name: name,
                    type: "cardinality",
                    fieldNames: [attributeName],
                    byRow: true
                };
            }
        };
        DruidExternal.prototype.makeCustomAggregation = function (name, action) {
            var customAggregationName = action.custom;
            var customAggregation = this.customAggregations[customAggregationName];
            if (!customAggregation)
                throw new Error("could not find '" + customAggregationName + "'");
            var aggregationObj = customAggregation.aggregation;
            if (typeof aggregationObj.type !== 'string')
                throw new Error("must have type in custom aggregation '" + customAggregationName + "'");
            try {
                aggregationObj = JSON.parse(JSON.stringify(aggregationObj));
            }
            catch (e) {
                throw new Error("must have JSON custom aggregation '" + customAggregationName + "'");
            }
            aggregationObj.name = name;
            return aggregationObj;
        };
        DruidExternal.prototype.makeQuantileAggregation = function (name, action, postAggregations) {
            if (this.exactResultsOnly) {
                throw new Error("approximate query not allowed");
            }
            var attribute = action.expression;
            if (attribute instanceof Plywood.RefExpression) {
                var attributeName = attribute.name;
            }
            else {
                throw new Error("can not compute countDistinct on derived attribute: " + attribute);
            }
            var histogramAggregationName = "!H_" + name;
            var aggregation = {
                name: histogramAggregationName,
                type: "approxHistogramFold",
                fieldName: attributeName
            };
            postAggregations.push({
                name: name,
                type: "quantile",
                fieldName: histogramAggregationName,
                probability: action.quantile
            });
            return aggregation;
        };
        DruidExternal.prototype.makeJavaScriptAggregation = function (name, aggregateAction) {
            var aggregateActionType = aggregateAction.action;
            var aggregateExpression = aggregateAction.expression;
            var aggregateFunction = AGGREGATE_TO_FUNCTION[aggregateActionType];
            if (!aggregateFunction)
                throw new Error("Can not convert " + aggregateActionType + " to JS");
            var zero = AGGREGATE_TO_ZERO[aggregateActionType];
            var fieldNames = aggregateExpression.getFreeReferences();
            return {
                name: name,
                type: "javascript",
                fieldNames: fieldNames,
                fnAggregate: "function(_c," + fieldNames + ") { return " + aggregateFunction('_c', aggregateExpression.getJS(null)) + "; }",
                fnCombine: "function(a,b) { return " + aggregateFunction('a', 'b') + "; }",
                fnReset: "function() { return " + zero + "; }"
            };
        };
        DruidExternal.prototype.applyToAggregation = function (action, aggregations, postAggregations) {
            var applyExpression = action.expression;
            if (applyExpression.op !== 'chain')
                throw new Error("can not convert apply: " + applyExpression);
            var actions = applyExpression.actions;
            var filterExpression = null;
            var aggregateAction = null;
            if (actions.length === 1) {
                aggregateAction = actions[0];
            }
            else if (actions.length === 2) {
                var filterAction = actions[0];
                if (filterAction instanceof Plywood.FilterAction) {
                    filterExpression = filterAction.expression;
                }
                else {
                    throw new Error("first action not a filter in: " + applyExpression);
                }
                aggregateAction = actions[1];
            }
            else {
                throw new Error("can not convert strange apply: " + applyExpression);
            }
            var aggregation;
            switch (aggregateAction.action) {
                case "count":
                case "sum":
                case "min":
                case "max":
                    aggregation = this.makeStandardAggregation(action.name, aggregateAction);
                    break;
                case "countDistinct":
                    aggregation = this.makeCountDistinctAggregation(action.name, aggregateAction, postAggregations);
                    break;
                case "quantile":
                    aggregation = this.makeQuantileAggregation(action.name, aggregateAction, postAggregations);
                    break;
                case "custom":
                    aggregation = this.makeCustomAggregation(action.name, aggregateAction);
                    break;
                default:
                    throw new Error("unsupported aggregate action " + aggregateAction.action);
            }
            if (filterExpression) {
                aggregation = this.makeNativeAggregateFilter(filterExpression, aggregation);
            }
            aggregations.push(aggregation);
        };
        DruidExternal.prototype.getAggregationsAndPostAggregations = function (applies) {
            var _this = this;
            var _a = Plywood.External.segregationAggregateApplies(applies.map(function (apply) {
                var expression = apply.expression;
                expression = _this.switchToRollupCount(_this.inlineDerivedAttributesInAggregate(expression).decomposeAverage()).distribute();
                return apply.changeExpression(expression);
            })), aggregateApplies = _a.aggregateApplies, postAggregateApplies = _a.postAggregateApplies;
            var aggregations = [];
            var postAggregations = [];
            for (var _i = 0, aggregateApplies_1 = aggregateApplies; _i < aggregateApplies_1.length; _i++) {
                var aggregateApply = aggregateApplies_1[_i];
                this.applyToAggregation(aggregateApply, aggregations, postAggregations);
            }
            for (var _b = 0, postAggregateApplies_1 = postAggregateApplies; _b < postAggregateApplies_1.length; _b++) {
                var postAggregateApply = postAggregateApplies_1[_b];
                this.applyToPostAggregation(postAggregateApply, aggregations, postAggregations);
            }
            return {
                aggregations: aggregations,
                postAggregations: postAggregations
            };
        };
        DruidExternal.prototype.makeHavingComparison = function (agg, op, value) {
            switch (op) {
                case '<':
                    return { type: "lessThan", aggregation: agg, value: value };
                case '>':
                    return { type: "greaterThan", aggregation: agg, value: value };
                case '<=':
                    return { type: 'not', havingSpec: { type: "greaterThan", aggregation: agg, value: value } };
                case '>=':
                    return { type: 'not', havingSpec: { type: "lessThan", aggregation: agg, value: value } };
                default:
                    throw new Error("unknown op: " + op);
            }
        };
        DruidExternal.prototype.inToHavingFilter = function (agg, range) {
            var havingSpecs = [];
            if (range.start !== null) {
                havingSpecs.push(this.makeHavingComparison(agg, (range.bounds[0] === '[' ? '>=' : '>'), range.start));
            }
            if (range.end !== null) {
                havingSpecs.push(this.makeHavingComparison(agg, (range.bounds[1] === ']' ? '<=' : '<'), range.end));
            }
            return havingSpecs.length === 1 ? havingSpecs[0] : { type: 'and', havingSpecs: havingSpecs };
        };
        DruidExternal.prototype.havingFilterToDruid = function (filter) {
            var _this = this;
            if (filter instanceof Plywood.LiteralExpression) {
                if (filter.value === true) {
                    return null;
                }
                else {
                    throw new Error("should never get here");
                }
            }
            else if (filter instanceof Plywood.ChainExpression) {
                var pattern;
                if (pattern = filter.getExpressionPattern('and')) {
                    return {
                        type: 'and',
                        havingSpecs: pattern.map(this.havingFilterToDruid, this)
                    };
                }
                if (pattern = filter.getExpressionPattern('or')) {
                    return {
                        type: 'or',
                        havingSpecs: pattern.map(this.havingFilterToDruid, this)
                    };
                }
                if (filter.lastAction() instanceof Plywood.NotAction) {
                    return this.havingFilterToDruid(filter.popAction());
                }
                var lhs = filter.expression;
                var actions = filter.actions;
                if (actions.length !== 1)
                    throw new Error("can not convert " + filter + " to Druid interval");
                var filterAction = actions[0];
                var rhs = filterAction.expression;
                if (filterAction instanceof Plywood.IsAction) {
                    if (lhs instanceof Plywood.RefExpression && rhs instanceof Plywood.LiteralExpression) {
                        return {
                            type: "equalTo",
                            aggregation: lhs.name,
                            value: rhs.value
                        };
                    }
                    else {
                        throw new Error("can not convert " + filter + " to Druid filter");
                    }
                }
                else if (filterAction instanceof Plywood.InAction) {
                    if (lhs instanceof Plywood.RefExpression && rhs instanceof Plywood.LiteralExpression) {
                        var rhsType = rhs.type;
                        if (rhsType === 'SET/STRING') {
                            return {
                                type: "or",
                                havingSpecs: rhs.value.elements.map(function (value) {
                                    return {
                                        type: "equalTo",
                                        aggregation: lhs.name,
                                        value: value
                                    };
                                })
                            };
                        }
                        else if (rhsType === 'SET/NUMBER_RANGE') {
                            return {
                                type: "or",
                                havingSpecs: rhs.value.elements.map(function (value) {
                                    return _this.inToHavingFilter(lhs.name, value);
                                }, this)
                            };
                        }
                        else if (rhsType === 'NUMBER_RANGE') {
                            return this.inToHavingFilter(lhs.name, rhs.value);
                        }
                        else if (rhsType === 'TIME_RANGE') {
                            throw new Error("can not compute having filter on time");
                        }
                        else {
                            throw new Error("not supported " + rhsType);
                        }
                    }
                    else {
                        throw new Error("can not convert " + filter + " to Druid having filter");
                    }
                }
            }
            throw new Error("could not convert filter " + filter + " to Druid filter");
        };
        DruidExternal.prototype.isMinMaxTimeApply = function (apply) {
            var applyExpression = apply.expression;
            if (applyExpression instanceof Plywood.ChainExpression) {
                var actions = applyExpression.actions;
                if (actions.length !== 1)
                    return false;
                var minMaxAction = actions[0];
                return (minMaxAction.action === "min" || minMaxAction.action === "max") &&
                    this.isTimeRef(minMaxAction.expression);
            }
            else {
                return false;
            }
        };
        DruidExternal.prototype.getTimeBoundaryQueryAndPostProcess = function () {
            var _a = this, applies = _a.applies, context = _a.context;
            var druidQuery = {
                queryType: "timeBoundary",
                dataSource: this.getDruidDataSource()
            };
            if (context) {
                druidQuery.context = context;
            }
            if (applies.length === 1) {
                var loneApplyExpression = applies[0].expression;
                druidQuery.bound = loneApplyExpression.actions[0].action + "Time";
            }
            return {
                query: druidQuery,
                postProcess: timeBoundaryPostProcessFactory(applies)
            };
        };
        DruidExternal.prototype.getQueryAndPostProcess = function () {
            var _this = this;
            var _a = this, mode = _a.mode, applies = _a.applies, sort = _a.sort, limit = _a.limit, context = _a.context;
            if (applies && applies.length && applies.every(this.isMinMaxTimeApply, this)) {
                return this.getTimeBoundaryQueryAndPostProcess();
            }
            var druidQuery = {
                queryType: 'timeseries',
                dataSource: this.getDruidDataSource(),
                intervals: null,
                granularity: 'all'
            };
            if (context) {
                druidQuery.context = Plywood.helper.shallowCopy(context);
            }
            var filterAndIntervals = this.filterToDruid(this.getQueryFilter());
            druidQuery.intervals = filterAndIntervals.intervals;
            if (filterAndIntervals.filter) {
                druidQuery.filter = filterAndIntervals.filter;
            }
            switch (mode) {
                case 'raw':
                    if (!this.allowSelectQueries) {
                        throw new Error("to issues 'select' queries allowSelectQueries flag must be set");
                    }
                    var selectDimensions = [];
                    var selectMetrics = [];
                    var inflaters = [];
                    var timeAttribute = this.timeAttribute;
                    var derivedAttributes = this.derivedAttributes;
                    var selectedTimeAttribute = null;
                    var selectedAttributes = this.getSelectedAttributes();
                    selectedAttributes.forEach(function (attribute) {
                        var name = attribute.name, type = attribute.type, unsplitable = attribute.unsplitable;
                        if (name === timeAttribute) {
                            selectedTimeAttribute = name;
                        }
                        else {
                            if (unsplitable) {
                                selectMetrics.push(name);
                            }
                            else {
                                var derivedAttribute = derivedAttributes[name];
                                if (derivedAttribute) {
                                    if (_this.versionBefore('0.9.1') && !/^0\.9\.0-iap/.test(_this.version)) {
                                        throw new Error("can not have derived attributes in Druid select in " + _this.version + ", upgrade to 0.9.1 or 0.9.0-iap");
                                    }
                                    var dimensionInflater = _this.expressionToDimensionInflater(derivedAttribute, name);
                                    selectDimensions.push(dimensionInflater.dimension);
                                    if (dimensionInflater.inflater)
                                        inflaters.push(dimensionInflater.inflater);
                                    return;
                                }
                                else {
                                    selectDimensions.push(name);
                                }
                            }
                        }
                        switch (type) {
                            case 'BOOLEAN':
                                inflaters.push(Plywood.External.booleanInflaterFactory(name));
                                break;
                            case 'NUMBER':
                                inflaters.push(Plywood.External.numberInflaterFactory(name));
                                break;
                            case 'TIME':
                                inflaters.push(Plywood.External.timeInflaterFactory(name));
                                break;
                            case 'SET/STRING':
                                inflaters.push(Plywood.External.setStringInflaterFactory(name));
                                break;
                        }
                    });
                    if (!selectDimensions.length)
                        selectDimensions.push(DUMMY_NAME);
                    if (!selectMetrics.length)
                        selectMetrics.push(DUMMY_NAME);
                    var resultLimit = limit ? limit.limit : Infinity;
                    druidQuery.queryType = 'select';
                    druidQuery.dimensions = selectDimensions;
                    druidQuery.metrics = selectMetrics;
                    druidQuery.pagingSpec = {
                        "pagingIdentifiers": {},
                        "threshold": Math.min(resultLimit, DruidExternal.SELECT_INIT_LIMIT)
                    };
                    var descending = sort && sort.direction === 'descending';
                    if (descending) {
                        druidQuery.descending = true;
                    }
                    return {
                        query: druidQuery,
                        postProcess: postProcessFactory(selectNormalizerFactory(selectedTimeAttribute), inflaters, selectedAttributes),
                        next: selectNextFactory(resultLimit, descending)
                    };
                case 'value':
                    var aggregationsAndPostAggregations = this.getAggregationsAndPostAggregations([this.toValueApply()]);
                    if (aggregationsAndPostAggregations.aggregations.length) {
                        druidQuery.aggregations = aggregationsAndPostAggregations.aggregations;
                    }
                    if (aggregationsAndPostAggregations.postAggregations.length) {
                        druidQuery.postAggregations = aggregationsAndPostAggregations.postAggregations;
                    }
                    return {
                        query: druidQuery,
                        postProcess: valuePostProcess
                    };
                case 'total':
                    var aggregationsAndPostAggregations = this.getAggregationsAndPostAggregations(this.applies);
                    if (aggregationsAndPostAggregations.aggregations.length) {
                        druidQuery.aggregations = aggregationsAndPostAggregations.aggregations;
                    }
                    if (aggregationsAndPostAggregations.postAggregations.length) {
                        druidQuery.postAggregations = aggregationsAndPostAggregations.postAggregations;
                    }
                    return {
                        query: druidQuery,
                        postProcess: totalPostProcessFactory(applies)
                    };
                case 'split':
                    var split = this.getQuerySplit();
                    var splitSpec = this.splitToDruid(split);
                    druidQuery.queryType = splitSpec.queryType;
                    druidQuery.granularity = splitSpec.granularity;
                    if (splitSpec.dimension)
                        druidQuery.dimension = splitSpec.dimension;
                    if (splitSpec.dimensions)
                        druidQuery.dimensions = splitSpec.dimensions;
                    var postProcess = splitSpec.postProcess;
                    var aggregationsAndPostAggregations = this.getAggregationsAndPostAggregations(applies);
                    if (aggregationsAndPostAggregations.aggregations.length) {
                        druidQuery.aggregations = aggregationsAndPostAggregations.aggregations;
                    }
                    else {
                        druidQuery.aggregations = [{ name: DUMMY_NAME, type: "count" }];
                    }
                    if (aggregationsAndPostAggregations.postAggregations.length) {
                        druidQuery.postAggregations = aggregationsAndPostAggregations.postAggregations;
                    }
                    switch (druidQuery.queryType) {
                        case 'timeseries':
                            if (sort && (sort.direction !== 'ascending' || !split.hasKey(sort.refName()))) {
                                throw new Error('can not sort within timeseries query');
                            }
                            if (limit) {
                                throw new Error('can not limit within timeseries query');
                            }
                            if (!druidQuery.context || !hasOwnProperty(druidQuery.context, 'skipEmptyBuckets')) {
                                druidQuery.context = druidQuery.context || {};
                                druidQuery.context.skipEmptyBuckets = "true";
                            }
                            break;
                        case 'topN':
                            var metric;
                            if (sort) {
                                var inverted;
                                if (this.sortOnLabel()) {
                                    if (expressionNeedsAlphaNumericSort(split.firstSplitExpression())) {
                                        metric = { type: 'alphaNumeric' };
                                    }
                                    else {
                                        metric = { type: 'lexicographic' };
                                    }
                                    inverted = sort.direction === 'descending';
                                }
                                else {
                                    metric = sort.refName();
                                    inverted = sort.direction === 'ascending';
                                }
                                if (inverted) {
                                    metric = { type: "inverted", metric: metric };
                                }
                            }
                            else {
                                metric = { type: 'lexicographic' };
                            }
                            druidQuery.metric = metric;
                            druidQuery.threshold = limit ? limit.limit : 1000;
                            break;
                        case 'groupBy':
                            var orderByColumn = null;
                            if (sort) {
                                var col = sort.refName();
                                orderByColumn = {
                                    dimension: col,
                                    direction: sort.direction
                                };
                                if (this.sortOnLabel()) {
                                    if (expressionNeedsAlphaNumericSort(split.splits[col])) {
                                        orderByColumn.dimensionOrder = 'alphaNumeric';
                                    }
                                }
                            }
                            else {
                                var timestampLabel = splitSpec.timestampLabel;
                                var splitKeys = split.keys.filter(function (k) { return k !== timestampLabel; });
                                if (!splitKeys.length)
                                    throw new Error('could not find order by column for group by');
                                var splitKey = splitKeys[0];
                                var keyExpression = split.splits[splitKey];
                                orderByColumn = {
                                    dimension: splitKey
                                };
                                if (expressionNeedsAlphaNumericSort(keyExpression)) {
                                    orderByColumn.dimensionOrder = 'alphaNumeric';
                                }
                            }
                            druidQuery.limitSpec = {
                                type: "default",
                                columns: [orderByColumn || split.firstSplitName()]
                            };
                            if (limit) {
                                druidQuery.limitSpec.limit = limit.limit;
                            }
                            if (!this.havingFilter.equals(Plywood.Expression.TRUE)) {
                                druidQuery.having = this.havingFilterToDruid(this.havingFilter);
                            }
                            break;
                    }
                    return {
                        query: druidQuery,
                        postProcess: postProcess
                    };
                default:
                    throw new Error("can not get query for: " + this.mode);
            }
        };
        DruidExternal.prototype.getIntrospectAttributesWithSegmentMetadata = function (withAggregators) {
            var _this = this;
            var _a = this, requester = _a.requester, timeAttribute = _a.timeAttribute;
            var query = {
                queryType: 'segmentMetadata',
                dataSource: this.getDruidDataSource(),
                merge: true,
                analysisTypes: []
            };
            if (withAggregators) {
                query.analysisTypes.push("aggregators");
                query.lenientAggregatorMerge = true;
            }
            var resultPromise = requester({ query: query }).then(segmentMetadataPostProcessFactory(timeAttribute));
            if (withAggregators) {
                resultPromise = resultPromise.catch(function (err) {
                    if (err.message.indexOf('Can not construct instance of io.druid.query.metadata.metadata.SegmentMetadataQuery$AnalysisType') === -1) {
                        throw err;
                    }
                    return _this.getIntrospectAttributesWithSegmentMetadata(false);
                });
            }
            return resultPromise;
        };
        DruidExternal.prototype.getIntrospectAttributesWithGet = function () {
            var _a = this, requester = _a.requester, timeAttribute = _a.timeAttribute;
            return requester({
                query: {
                    queryType: 'introspect',
                    dataSource: this.getDruidDataSource()
                }
            })
                .then(introspectPostProcessFactory(timeAttribute));
        };
        DruidExternal.prototype.getIntrospectAttributes = function () {
            var _this = this;
            var versionPromise = this.version ? Q(this.version) : DruidExternal.getVersion(this.requester);
            return versionPromise.then(function (version) {
                var withAggregators = version && !Plywood.External.versionLessThan(version, '0.9.0');
                var attributePromise;
                switch (_this.introspectionStrategy) {
                    case 'segment-metadata-fallback':
                        attributePromise = _this.getIntrospectAttributesWithSegmentMetadata(withAggregators)
                            .catch(function (err) {
                            if (err.message.indexOf("querySegmentSpec can't be null") === -1)
                                throw err;
                            return _this.getIntrospectAttributesWithGet();
                        });
                        break;
                    case 'segment-metadata-only':
                        attributePromise = _this.getIntrospectAttributesWithSegmentMetadata(withAggregators);
                        break;
                    case 'datasource-get':
                        attributePromise = _this.getIntrospectAttributesWithGet();
                        break;
                    default:
                        throw new Error('invalid introspectionStrategy');
                }
                return attributePromise.then(function (attributes) {
                    return {
                        version: version,
                        attributes: attributes
                    };
                });
            });
        };
        DruidExternal.type = 'DATASET';
        DruidExternal.TRUE_INTERVAL = "1000/3000";
        DruidExternal.FALSE_INTERVAL = "1000/1001";
        DruidExternal.VALID_INTROSPECTION_STRATEGIES = ['segment-metadata-fallback', 'segment-metadata-only', 'datasource-get'];
        DruidExternal.DEFAULT_INTROSPECTION_STRATEGY = 'segment-metadata-fallback';
        DruidExternal.SELECT_INIT_LIMIT = 50;
        DruidExternal.SELECT_MAX_LIMIT = 10000;
        DruidExternal.TIME_PART_TO_FORMAT = {
            SECOND_OF_MINUTE: "s",
            MINUTE_OF_HOUR: "m",
            HOUR_OF_DAY: "H",
            DAY_OF_WEEK: "e",
            DAY_OF_MONTH: "d",
            DAY_OF_YEAR: "D",
            WEEK_OF_YEAR: "w",
            MONTH_OF_YEAR: "M",
            YEAR: "Y"
        };
        DruidExternal.TIME_PART_TO_EXPR = {
            SECOND_OF_MINUTE: "d.getSecondOfMinute()",
            SECOND_OF_HOUR: "d.getSecondOfHour()",
            SECOND_OF_DAY: "d.getSecondOfDay()",
            SECOND_OF_WEEK: "d.getDayOfWeek()*86400 + d.getSecondOfMinute()",
            SECOND_OF_MONTH: "d.getDayOfMonth()*86400 + d.getSecondOfHour()",
            SECOND_OF_YEAR: "d.getDayOfYear()*86400 + d.getSecondOfDay()",
            MINUTE_OF_HOUR: "d.getMinuteOfHour()",
            MINUTE_OF_DAY: "d.getMinuteOfDay()",
            MINUTE_OF_WEEK: "d.getDayOfWeek()*1440 + d.getMinuteOfDay()",
            MINUTE_OF_MONTH: "d.getDayOfMonth()*1440 + d.getMinuteOfDay()",
            MINUTE_OF_YEAR: "d.getDayOfYear()*1440 + d.getMinuteOfDay()",
            HOUR_OF_DAY: "d.getHourOfDay()",
            HOUR_OF_WEEK: "d.getDayOfWeek()*24 + d.getHourOfDay()",
            HOUR_OF_MONTH: "d.getDayOfMonth()*24 + d.getHourOfDay()",
            HOUR_OF_YEAR: "d.getDayOfYear()*24 + d.getHourOfDay()",
            DAY_OF_WEEK: "d.getDayOfWeek()",
            DAY_OF_MONTH: "d.getDayOfMonth()",
            DAY_OF_YEAR: "d.getDayOfYear()",
            WEEK_OF_YEAR: "d.getWeekOfWeekyear()",
            MONTH_OF_YEAR: "d.getMonthOfYear()",
            YEAR: "d.getYearOfEra()"
        };
        DruidExternal.SPAN_TO_FLOOR_FORMAT = {
            second: "yyyy-MM-dd'T'HH:mm:ss'Z",
            minute: "yyyy-MM-dd'T'HH:mm'Z",
            hour: "yyyy-MM-dd'T'HH':00Z",
            day: "yyyy-MM-dd'Z",
            month: "yyyy-MM'-01Z",
            year: "yyyy'-01-01Z"
        };
        DruidExternal.SPAN_TO_PROPERTY = {
            second: 'secondOfMinute',
            minute: 'minuteOfHour',
            hour: 'hourOfDay',
            day: 'dayOfMonth',
            week: 'weekOfWeekyear',
            month: 'monthOfYear',
            year: 'yearOfEra'
        };
        return DruidExternal;
    }(Plywood.External));
    Plywood.DruidExternal = DruidExternal;
    Plywood.External.register(DruidExternal);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    function correctResult(result) {
        return Array.isArray(result) && (result.length === 0 || typeof result[0] === 'object');
    }
    function getSplitInflaters(split) {
        return split.mapSplits(function (label, splitExpression) {
            var simpleInflater = Plywood.External.getSimpleInflater(splitExpression, label);
            if (simpleInflater)
                return simpleInflater;
            if (splitExpression instanceof Plywood.ChainExpression) {
                var lastAction = splitExpression.lastAction();
                if (lastAction instanceof Plywood.TimeBucketAction) {
                    return Plywood.External.timeRangeInflaterFactory(label, lastAction.duration, lastAction.getTimezone());
                }
                if (lastAction instanceof Plywood.NumberBucketAction) {
                    return Plywood.External.numberRangeInflaterFactory(label, lastAction.size);
                }
            }
            return;
        });
    }
    function valuePostProcess(data) {
        if (!correctResult(data)) {
            var err = new Error("unexpected result (value)");
            err.result = data;
            throw err;
        }
        return data.length ? data[0][Plywood.External.VALUE_NAME] : 0;
    }
    function postProcessFactory(inflaters, zeroTotalApplies) {
        return function (data) {
            if (!correctResult(data)) {
                var err = new Error("unexpected result");
                err.result = data;
                throw err;
            }
            var n = data.length;
            for (var _i = 0, inflaters_2 = inflaters; _i < inflaters_2.length; _i++) {
                var inflater = inflaters_2[_i];
                for (var i = 0; i < n; i++) {
                    inflater(data[i], i, data);
                }
            }
            if (n === 0 && zeroTotalApplies) {
                data = [Plywood.External.makeZeroDatum(zeroTotalApplies)];
            }
            return new Plywood.Dataset({ data: data });
        };
    }
    var SQLExternal = (function (_super) {
        __extends(SQLExternal, _super);
        function SQLExternal(parameters, dialect) {
            _super.call(this, parameters, dummyObject);
            this.table = parameters.table;
            this.dialect = dialect;
        }
        SQLExternal.jsToValue = function (parameters, requester) {
            var value = Plywood.External.jsToValue(parameters, requester);
            value.table = parameters.table;
            return value;
        };
        SQLExternal.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.table = this.table;
            return value;
        };
        SQLExternal.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.table = this.table;
            return js;
        };
        SQLExternal.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.table === other.table;
        };
        SQLExternal.prototype.canHandleFilter = function (ex) {
            return true;
        };
        SQLExternal.prototype.canHandleTotal = function () {
            return true;
        };
        SQLExternal.prototype.canHandleSplit = function (ex) {
            return true;
        };
        SQLExternal.prototype.canHandleApply = function (ex) {
            return true;
        };
        SQLExternal.prototype.canHandleSort = function (sortAction) {
            return true;
        };
        SQLExternal.prototype.canHandleLimit = function (limitAction) {
            return true;
        };
        SQLExternal.prototype.canHandleHavingFilter = function (ex) {
            return true;
        };
        SQLExternal.prototype.getQueryAndPostProcess = function () {
            var _a = this, table = _a.table, mode = _a.mode, applies = _a.applies, sort = _a.sort, limit = _a.limit, derivedAttributes = _a.derivedAttributes, dialect = _a.dialect;
            var query = ['SELECT'];
            var postProcess = null;
            var inflaters = [];
            var zeroTotalApplies = null;
            var from = "FROM " + this.dialect.escapeName(table);
            var filter = this.getQueryFilter();
            if (!filter.equals(Plywood.Expression.TRUE)) {
                from += '\nWHERE ' + filter.getSQL(dialect);
            }
            switch (mode) {
                case 'raw':
                    var selectedAttributes = this.getSelectedAttributes();
                    selectedAttributes.forEach(function (attribute) {
                        if (attribute.type === 'BOOLEAN') {
                            inflaters.push(Plywood.External.booleanInflaterFactory(attribute.name));
                        }
                    });
                    query.push(selectedAttributes.map(function (a) {
                        var name = a.name;
                        if (derivedAttributes[name]) {
                            return new Plywood.ApplyAction({ name: name, expression: derivedAttributes[name] }).getSQL('', dialect);
                        }
                        else {
                            return dialect.escapeName(name);
                        }
                    }).join(', '), from);
                    if (sort) {
                        query.push(sort.getSQL('', dialect));
                    }
                    if (limit) {
                        query.push(limit.getSQL('', dialect));
                    }
                    break;
                case 'value':
                    query.push(this.toValueApply().getSQL('', dialect), from, dialect.constantGroupBy());
                    postProcess = valuePostProcess;
                    break;
                case 'total':
                    zeroTotalApplies = applies;
                    query.push(applies.map(function (apply) { return apply.getSQL('', dialect); }).join(',\n'), from, dialect.constantGroupBy());
                    break;
                case 'split':
                    var split = this.getQuerySplit();
                    query.push(split.getSelectSQL(dialect)
                        .concat(applies.map(function (apply) { return apply.getSQL('', dialect); }))
                        .join(',\n'), from, split.getShortGroupBySQL());
                    if (!(this.havingFilter.equals(Plywood.Expression.TRUE))) {
                        query.push('HAVING ' + this.havingFilter.getSQL(dialect));
                    }
                    if (sort) {
                        query.push(sort.getSQL('', dialect));
                    }
                    if (limit) {
                        query.push(limit.getSQL('', dialect));
                    }
                    inflaters = getSplitInflaters(split);
                    break;
                default:
                    throw new Error("can not get query for mode: " + mode);
            }
            return {
                query: query.join('\n'),
                postProcess: postProcess || postProcessFactory(inflaters, zeroTotalApplies)
            };
        };
        SQLExternal.prototype.getIntrospectAttributes = function () {
            throw new Error('implement me');
        };
        SQLExternal.type = 'DATASET';
        return SQLExternal;
    }(Plywood.External));
    Plywood.SQLExternal = SQLExternal;
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    function postProcessIntrospect(columns) {
        var attributes = columns.map(function (column) {
            var name = column.Field;
            var sqlType = column.Type.toLowerCase();
            if (sqlType === "datetime" || sqlType === "timestamp") {
                return new Plywood.AttributeInfo({ name: name, type: 'TIME' });
            }
            else if (sqlType.indexOf("varchar(") === 0 || sqlType.indexOf("blob") === 0) {
                return new Plywood.AttributeInfo({ name: name, type: 'STRING' });
            }
            else if (sqlType.indexOf("int(") === 0 || sqlType.indexOf("bigint(") === 0) {
                return new Plywood.AttributeInfo({ name: name, type: 'NUMBER' });
            }
            else if (sqlType.indexOf("decimal(") === 0 || sqlType.indexOf("float") === 0 || sqlType.indexOf("double") === 0) {
                return new Plywood.AttributeInfo({ name: name, type: 'NUMBER' });
            }
            else if (sqlType.indexOf("tinyint(1)") === 0) {
                return new Plywood.AttributeInfo({ name: name, type: 'BOOLEAN' });
            }
            return null;
        }).filter(Boolean);
        return {
            version: null,
            attributes: attributes
        };
    }
    var MySQLExternal = (function (_super) {
        __extends(MySQLExternal, _super);
        function MySQLExternal(parameters) {
            _super.call(this, parameters, new Plywood.MySQLDialect());
            this._ensureEngine("mysql");
        }
        MySQLExternal.fromJS = function (parameters, requester) {
            var value = Plywood.SQLExternal.jsToValue(parameters, requester);
            return new MySQLExternal(value);
        };
        MySQLExternal.getSourceList = function (requester) {
            return requester({ query: "SHOW TABLES" })
                .then(function (sources) {
                if (!Array.isArray(sources))
                    throw new Error('invalid sources response');
                if (!sources.length)
                    return sources;
                var key = Object.keys(sources[0])[0];
                if (!key)
                    throw new Error('invalid sources response (no key)');
                return sources.map(function (s) { return s[key]; }).sort();
            });
        };
        MySQLExternal.prototype.getIntrospectAttributes = function () {
            return this.requester({ query: "DESCRIBE " + this.dialect.escapeName(this.table) }).then(postProcessIntrospect);
        };
        MySQLExternal.type = 'DATASET';
        return MySQLExternal;
    }(Plywood.SQLExternal));
    Plywood.MySQLExternal = MySQLExternal;
    Plywood.External.register(MySQLExternal, 'mysql');
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    function postProcessIntrospect(columns) {
        var attributes = columns.map(function (column) {
            var name = column.name;
            var sqlType = column.sqlType.toLowerCase();
            if (sqlType.indexOf('timestamp') !== -1) {
                return new Plywood.AttributeInfo({ name: name, type: 'TIME' });
            }
            else if (sqlType === 'character varying') {
                return new Plywood.AttributeInfo({ name: name, type: 'STRING' });
            }
            else if (sqlType === 'integer' || sqlType === 'bigint') {
                return new Plywood.AttributeInfo({ name: name, type: 'NUMBER' });
            }
            else if (sqlType === "double precision" || sqlType === "float") {
                return new Plywood.AttributeInfo({ name: name, type: 'NUMBER' });
            }
            else if (sqlType === 'boolean') {
                return new Plywood.AttributeInfo({ name: name, type: 'BOOLEAN' });
            }
            return null;
        }).filter(Boolean);
        return {
            version: null,
            attributes: attributes
        };
    }
    var PostgresExternal = (function (_super) {
        __extends(PostgresExternal, _super);
        function PostgresExternal(parameters) {
            _super.call(this, parameters, new Plywood.PostgresDialect());
            this._ensureEngine("postgres");
        }
        PostgresExternal.fromJS = function (parameters, requester) {
            var value = Plywood.SQLExternal.jsToValue(parameters, requester);
            return new PostgresExternal(value);
        };
        PostgresExternal.getSourceList = function (requester) {
            return requester({
                query: "SELECT table_name AS \"tab\" FROM INFORMATION_SCHEMA.TABLES WHERE table_type = 'BASE TABLE' AND table_schema = 'public'"
            })
                .then(function (sources) {
                if (!Array.isArray(sources))
                    throw new Error('invalid sources response');
                if (!sources.length)
                    return sources;
                return sources.map(function (s) { return s['tab']; }).sort();
            });
        };
        PostgresExternal.prototype.getIntrospectAttributes = function () {
            return this.requester({
                query: "SELECT \"column_name\" AS \"name\", \"data_type\" AS \"sqlType\" FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = " + this.dialect.escapeLiteral(this.table)
            }).then(postProcessIntrospect);
        };
        PostgresExternal.type = 'DATASET';
        return PostgresExternal;
    }(Plywood.SQLExternal));
    Plywood.PostgresExternal = PostgresExternal;
    Plywood.External.register(PostgresExternal, 'postgres');
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    function getDataName(ex) {
        if (ex instanceof Plywood.RefExpression) {
            return ex.name;
        }
        else if (ex instanceof Plywood.ChainExpression) {
            return getDataName(ex.expression);
        }
        else {
            return null;
        }
    }
    function getValue(param) {
        if (param instanceof Plywood.LiteralExpression)
            return param.value;
        return param;
    }
    function getString(param) {
        if (typeof param === 'string')
            return param;
        if (param instanceof Plywood.LiteralExpression && param.type === 'STRING') {
            return param.value;
        }
        if (param instanceof Plywood.RefExpression && param.nest === 0) {
            return param.name;
        }
        throw new Error('could not extract a string out of ' + String(param));
    }
    function getNumber(param) {
        if (typeof param === 'number')
            return param;
        if (param instanceof Plywood.LiteralExpression && param.type === 'NUMBER') {
            return param.value;
        }
        throw new Error('could not extract a number out of ' + String(param));
    }
    function ply(dataset) {
        if (!dataset)
            dataset = new Plywood.Dataset({ data: [{}] });
        return r(dataset);
    }
    Plywood.ply = ply;
    function $(name, nest, type) {
        if (typeof name !== 'string')
            throw new TypeError('$() argument must be a string');
        if (typeof nest === 'string') {
            type = nest;
            nest = 0;
        }
        return new Plywood.RefExpression({
            name: name,
            nest: nest != null ? nest : 0,
            type: type
        });
    }
    Plywood.$ = $;
    function r(value) {
        if (Plywood.External.isExternal(value))
            throw new TypeError('r can not accept externals');
        if (Array.isArray(value))
            value = Plywood.Set.fromJS(value);
        return Plywood.LiteralExpression.fromJS({ op: 'literal', value: value });
    }
    Plywood.r = r;
    function toJS(thing) {
        return (thing && typeof thing.toJS === 'function') ? thing.toJS() : thing;
    }
    Plywood.toJS = toJS;
    function chainVia(op, expressions, zero) {
        var n = expressions.length;
        if (!n)
            return zero;
        var acc = expressions[0];
        if (!Expression.isExpression(acc))
            acc = Expression.fromJSLoose(acc);
        for (var i = 1; i < n; i++)
            acc = acc[op](expressions[i]);
        return acc;
    }
    var check;
    var Expression = (function () {
        function Expression(parameters, dummy) {
            if (dummy === void 0) { dummy = null; }
            this.op = parameters.op;
            if (dummy !== dummyObject) {
                throw new TypeError("can not call `new Expression` directly use Expression.fromJS instead");
            }
            if (parameters.simple)
                this.simple = true;
        }
        Expression.isExpression = function (candidate) {
            return Plywood.isInstanceOf(candidate, Expression);
        };
        Expression.parse = function (str, timezone) {
            var original = Plywood.defaultParserTimezone;
            if (timezone)
                Plywood.defaultParserTimezone = timezone;
            try {
                return expressionParser.parse(str);
            }
            catch (e) {
                throw new Error("Expression parse error: " + e.message + " on '" + str + "'");
            }
            finally {
                Plywood.defaultParserTimezone = original;
            }
        };
        Expression.parseSQL = function (str, timezone) {
            var original = Plywood.defaultParserTimezone;
            if (timezone)
                Plywood.defaultParserTimezone = timezone;
            try {
                return plyqlParser.parse(str);
            }
            catch (e) {
                throw new Error("SQL parse error: " + e.message + " on '" + str + "'");
            }
            finally {
                Plywood.defaultParserTimezone = original;
            }
        };
        Expression.fromJSLoose = function (param) {
            var expressionJS;
            switch (typeof param) {
                case 'undefined':
                    throw new Error('must have an expression');
                case 'object':
                    if (param === null) {
                        return Expression.NULL;
                    }
                    else if (Expression.isExpression(param)) {
                        return param;
                    }
                    else if (Plywood.isImmutableClass(param)) {
                        if (param.constructor.type) {
                            expressionJS = { op: 'literal', value: param };
                        }
                        else {
                            throw new Error("unknown object");
                        }
                    }
                    else if (param.op) {
                        expressionJS = param;
                    }
                    else if (param.toISOString) {
                        expressionJS = { op: 'literal', value: new Date(param) };
                    }
                    else if (Array.isArray(param)) {
                        expressionJS = { op: 'literal', value: Plywood.Set.fromJS(param) };
                    }
                    else if (hasOwnProperty(param, 'start') && hasOwnProperty(param, 'end')) {
                        expressionJS = { op: 'literal', value: Plywood.Range.fromJS(param) };
                    }
                    else {
                        throw new Error('unknown parameter');
                    }
                    break;
                case 'number':
                case 'boolean':
                    expressionJS = { op: 'literal', value: param };
                    break;
                case 'string':
                    return Expression.parse(param);
                default:
                    throw new Error("unrecognizable expression");
            }
            return Expression.fromJS(expressionJS);
        };
        Expression.inOrIs = function (lhs, value) {
            var literal = new Plywood.LiteralExpression({
                op: 'literal',
                value: value
            });
            var literalType = literal.type;
            var returnExpression = null;
            if (literalType === 'NUMBER_RANGE' || literalType === 'TIME_RANGE' || Plywood.isSetType(literalType)) {
                returnExpression = lhs.in(literal);
            }
            else {
                returnExpression = lhs.is(literal);
            }
            return returnExpression.simplify();
        };
        Expression.jsNullSafety = function (lhs, rhs, combine, lhsCantBeNull, rhsCantBeNull) {
            if (lhsCantBeNull) {
                if (rhsCantBeNull) {
                    return "(" + combine(lhs, rhs) + ")";
                }
                else {
                    return "(_=" + rhs + ",(_==null)?null:(" + combine(lhs, '_') + "))";
                }
            }
            else {
                if (rhsCantBeNull) {
                    return "(_=" + lhs + ",(_==null)?null:(" + combine('_', rhs) + "))";
                }
                else {
                    return "(_1=" + rhs + ",_2=" + lhs + ",(_1==null||_2==null)?null:(" + combine('_1', '_2') + ")";
                }
            }
        };
        Expression.and = function (expressions) {
            return chainVia('and', expressions, Expression.TRUE);
        };
        Expression.or = function (expressions) {
            return chainVia('or', expressions, Expression.FALSE);
        };
        Expression.add = function (expressions) {
            return chainVia('add', expressions, Expression.ZERO);
        };
        Expression.subtract = function (expressions) {
            return chainVia('subtract', expressions, Expression.ZERO);
        };
        Expression.multiply = function (expressions) {
            return chainVia('multiply', expressions, Expression.ONE);
        };
        Expression.power = function (expressions) {
            return chainVia('power', expressions, Expression.ZERO);
        };
        Expression.concat = function (expressions) {
            return chainVia('concat', expressions, Expression.EMPTY_STRING);
        };
        Expression.register = function (ex) {
            var op = ex.name.replace('Expression', '').replace(/^\w/, function (s) { return s.toLowerCase(); });
            Expression.classMap[op] = ex;
        };
        Expression.fromJS = function (expressionJS, req = null) {
            if (!hasOwnProperty(expressionJS, "op")) {
                throw new Error("op must be defined");
            }
            var op = expressionJS.op;
            if (typeof op !== "string") {
                throw new Error("op must be a string");
            }
            var ClassFn = Expression.classMap[op];
            if (!ClassFn) {
                throw new Error("unsupported expression op '" + op + "'");
            }
            return ClassFn.fromJS(expressionJS, req);
        };
        Expression.prototype._ensureOp = function (op) {
            if (!this.op) {
                this.op = op;
                return;
            }
            if (this.op !== op) {
                throw new TypeError("incorrect expression op '" + this.op + "' (needs to be: '" + op + "')");
            }
        };
        Expression.prototype.valueOf = function () {
            var value = { op: this.op };
            if (this.simple)
                value.simple = true;
            return value;
        };
        Expression.prototype.toJS = function () {
            return {
                op: this.op
            };
        };
        Expression.prototype.toJSON = function () {
            return this.toJS();
        };
        Expression.prototype.toString = function (indent) {
            return 'BaseExpression';
        };
        Expression.prototype.equals = function (other) {
            return Expression.isExpression(other) &&
                this.op === other.op &&
                this.type === other.type;
        };
        Expression.prototype.canHaveType = function (wantedType) {
            var type = this.type;
            if (!type)
                return true;
            if (wantedType === 'SET') {
                return Plywood.isSetType(type);
            }
            else {
                return type === wantedType;
            }
        };
        Expression.prototype.expressionCount = function () {
            return 1;
        };
        Expression.prototype.isOp = function (op) {
            return this.op === op;
        };
        Expression.prototype.containsOp = function (op) {
            return this.some(function (ex) { return ex.isOp(op) || null; });
        };
        Expression.prototype.hasExternal = function () {
            return this.some(function (ex) {
                if (ex instanceof Plywood.ExternalExpression)
                    return true;
                if (ex instanceof Plywood.RefExpression)
                    return ex.isRemote();
                return null;
            });
        };
        Expression.prototype.getBaseExternals = function () {
            var externals = [];
            this.forEach(function (ex) {
                if (ex instanceof Plywood.ExternalExpression)
                    externals.push(ex.external.getBase());
            });
            return Plywood.External.deduplicateExternals(externals);
        };
        Expression.prototype.getRawExternals = function () {
            var externals = [];
            this.forEach(function (ex) {
                if (ex instanceof Plywood.ExternalExpression)
                    externals.push(ex.external.getRaw());
            });
            return Plywood.External.deduplicateExternals(externals);
        };
        Expression.prototype.getFreeReferences = function () {
            var freeReferences = [];
            this.forEach(function (ex, index, depth, nestDiff) {
                if (ex instanceof Plywood.RefExpression && nestDiff <= ex.nest) {
                    freeReferences.push(repeat('^', ex.nest - nestDiff) + ex.name);
                }
            });
            return Plywood.helper.deduplicateSort(freeReferences);
        };
        Expression.prototype.getFreeReferenceIndexes = function () {
            var freeReferenceIndexes = [];
            this.forEach(function (ex, index, depth, nestDiff) {
                if (ex instanceof Plywood.RefExpression && nestDiff <= ex.nest) {
                    freeReferenceIndexes.push(index);
                }
            });
            return freeReferenceIndexes;
        };
        Expression.prototype.incrementNesting = function (by) {
            if (by === void 0) { by = 1; }
            var freeReferenceIndexes = this.getFreeReferenceIndexes();
            if (freeReferenceIndexes.length === 0)
                return this;
            return this.substitute(function (ex, index) {
                if (ex instanceof Plywood.RefExpression && freeReferenceIndexes.indexOf(index) !== -1) {
                    return ex.incrementNesting(by);
                }
                return null;
            });
        };
        Expression.prototype.simplify = function () {
            return this;
        };
        Expression.prototype.every = function (iter, thisArg) {
            return this._everyHelper(iter, thisArg, { index: 0 }, 0, 0);
        };
        Expression.prototype._everyHelper = function (iter, thisArg, indexer, depth, nestDiff) {
            var pass = iter.call(thisArg, this, indexer.index, depth, nestDiff);
            if (pass != null) {
                return pass;
            }
            else {
                indexer.index++;
            }
            return true;
        };
        Expression.prototype.some = function (iter, thisArg) {
            var _this = this;
            return !this.every(function (ex, index, depth, nestDiff) {
                var v = iter.call(_this, ex, index, depth, nestDiff);
                return (v == null) ? null : !v;
            }, thisArg);
        };
        Expression.prototype.forEach = function (iter, thisArg) {
            var _this = this;
            this.every(function (ex, index, depth, nestDiff) {
                iter.call(_this, ex, index, depth, nestDiff);
                return null;
            }, thisArg);
        };
        Expression.prototype.substitute = function (substitutionFn, thisArg) {
            return this._substituteHelper(substitutionFn, thisArg, { index: 0 }, 0, 0);
        };
        Expression.prototype._substituteHelper = function (substitutionFn, thisArg, indexer, depth, nestDiff) {
            var sub = substitutionFn.call(thisArg, this, indexer.index, depth, nestDiff);
            if (sub) {
                indexer.index += this.expressionCount();
                return sub;
            }
            else {
                indexer.index++;
            }
            return this;
        };
        Expression.prototype.substituteAction = function (actionMatchFn, actionSubstitutionFn, options, thisArg) {
            var _this = this;
            if (options === void 0) { options = {}; }
            return this.substitute(function (ex) {
                if (ex instanceof Plywood.ChainExpression) {
                    var actions = ex.actions;
                    for (var i = 0; i < actions.length; i++) {
                        var action = actions[i];
                        if (actionMatchFn.call(_this, action)) {
                            var newEx = actionSubstitutionFn.call(_this, ex.headActions(i), action);
                            for (var j = i + 1; j < actions.length; j++)
                                newEx = newEx.performAction(actions[j]);
                            if (options.onceInChain)
                                return newEx;
                            return newEx.substituteAction(actionMatchFn, actionSubstitutionFn, options, _this);
                        }
                    }
                }
                return null;
            }, thisArg);
        };
        Expression.prototype.getFn = function () {
            throw new Error('should never be called directly');
        };
        Expression.prototype.getJS = function (datumVar) {
            throw new Error('should never be called directly');
        };
        Expression.prototype.getJSFn = function (datumVar) {
            if (datumVar === void 0) { datumVar = 'd[]'; }
            var type = this.type;
            var jsEx = this.getJS(datumVar);
            var body;
            if (type === 'NUMBER' || type === 'NUMBER_RANGE') {
                body = "_=" + jsEx + ";return isNaN(_)?null:_";
            }
            else {
                body = "return " + jsEx + ";";
            }
            return "function(" + datumVar.replace('[]', '') + "){" + body + "}";
        };
        Expression.prototype.getSQL = function (dialect) {
            throw new Error('should never be called directly');
        };
        Expression.prototype.extractFromAnd = function (matchFn) {
            if (this.type !== 'BOOLEAN')
                return null;
            if (matchFn(this)) {
                return {
                    extract: this,
                    rest: Expression.TRUE
                };
            }
            else {
                return {
                    extract: Expression.TRUE,
                    rest: this
                };
            }
        };
        Expression.prototype.breakdownByDataset = function (tempNamePrefix) {
            var nameIndex = 0;
            var singleDatasetActions = [];
            var externals = this.getBaseExternals();
            if (externals.length < 2) {
                throw new Error('not a multiple dataset expression');
            }
            var combine = this.substitute(function (ex) {
                var externals = ex.getBaseExternals();
                if (externals.length !== 1)
                    return null;
                var existingApply = Plywood.helper.find(singleDatasetActions, function (apply) { return apply.expression.equals(ex); });
                var tempName;
                if (existingApply) {
                    tempName = existingApply.name;
                }
                else {
                    tempName = tempNamePrefix + (nameIndex++);
                    singleDatasetActions.push(new Plywood.ApplyAction({
                        action: 'apply',
                        name: tempName,
                        expression: ex
                    }));
                }
                return new Plywood.RefExpression({
                    op: 'ref',
                    name: tempName,
                    nest: 0
                });
            });
            return {
                combineExpression: combine,
                singleDatasetActions: singleDatasetActions
            };
        };
        Expression.prototype.actionize = function (containingAction) {
            return null;
        };
        Expression.prototype.getExpressionPattern = function (actionType) {
            var actions = this.actionize(actionType);
            return actions ? actions.map(function (action) { return action.expression; }) : null;
        };
        Expression.prototype.firstAction = function () {
            return null;
        };
        Expression.prototype.lastAction = function () {
            return null;
        };
        Expression.prototype.headActions = function (n) {
            return this;
        };
        Expression.prototype.popAction = function () {
            return null;
        };
        Expression.prototype.getLiteralValue = function () {
            return null;
        };
        Expression.prototype.bumpStringLiteralToTime = function () {
            return this;
        };
        Expression.prototype.bumpStringLiteralToSetString = function () {
            return this;
        };
        Expression.prototype.performAction = function (action, markSimple) {
            return this.performActions([action], markSimple);
        };
        Expression.prototype.performActions = function (actions, markSimple) {
            if (!actions.length)
                return this;
            return new Plywood.ChainExpression({
                expression: this,
                actions: actions,
                simple: Boolean(markSimple)
            });
        };
        Expression.prototype._performMultiAction = function (action, exs) {
            if (!exs.length)
                throw new Error(action + " action must have at least one argument");
            var ret = this;
            for (var _i = 0, exs_1 = exs; _i < exs_1.length; _i++) {
                var ex = exs_1[_i];
                if (!Expression.isExpression(ex))
                    ex = Expression.fromJSLoose(ex);
                ret = ret.performAction(new Plywood.Action.classMap[action]({ expression: ex }));
            }
            return ret;
        };
        Expression.prototype.add = function () {
            var exs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                exs[_i - 0] = arguments[_i];
            }
            return this._performMultiAction('add', exs);
        };
        Expression.prototype.subtract = function () {
            var exs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                exs[_i - 0] = arguments[_i];
            }
            return this._performMultiAction('subtract', exs);
        };
        Expression.prototype.negate = function () {
            return Expression.ZERO.subtract(this);
        };
        Expression.prototype.multiply = function () {
            var exs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                exs[_i - 0] = arguments[_i];
            }
            return this._performMultiAction('multiply', exs);
        };
        Expression.prototype.divide = function () {
            var exs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                exs[_i - 0] = arguments[_i];
            }
            return this._performMultiAction('divide', exs);
        };
        Expression.prototype.reciprocate = function () {
            return Expression.ONE.divide(this);
        };
        Expression.prototype.sqrt = function () {
            return this.power(0.5);
        };
        Expression.prototype.power = function () {
            var exs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                exs[_i - 0] = arguments[_i];
            }
            return this._performMultiAction('power', exs);
        };
        Expression.prototype.fallback = function (ex) {
            if (!Expression.isExpression(ex))
                ex = Expression.fromJSLoose(ex);
            return this.performAction(new Plywood.FallbackAction({ expression: ex }));
        };
        Expression.prototype.is = function (ex) {
            if (!Expression.isExpression(ex))
                ex = Expression.fromJSLoose(ex);
            return this.performAction(new Plywood.IsAction({ expression: ex }));
        };
        Expression.prototype.isnt = function (ex) {
            return this.is(ex).not();
        };
        Expression.prototype.lessThan = function (ex) {
            if (!Expression.isExpression(ex))
                ex = Expression.fromJSLoose(ex);
            return this.bumpStringLiteralToTime().performAction(new Plywood.LessThanAction({ expression: ex.bumpStringLiteralToTime() }));
        };
        Expression.prototype.lessThanOrEqual = function (ex) {
            if (!Expression.isExpression(ex))
                ex = Expression.fromJSLoose(ex);
            return this.bumpStringLiteralToTime().performAction(new Plywood.LessThanOrEqualAction({ expression: ex.bumpStringLiteralToTime() }));
        };
        Expression.prototype.greaterThan = function (ex) {
            if (!Expression.isExpression(ex))
                ex = Expression.fromJSLoose(ex);
            return this.bumpStringLiteralToTime().performAction(new Plywood.GreaterThanAction({ expression: ex.bumpStringLiteralToTime() }));
        };
        Expression.prototype.greaterThanOrEqual = function (ex) {
            if (!Expression.isExpression(ex))
                ex = Expression.fromJSLoose(ex);
            return this.bumpStringLiteralToTime().performAction(new Plywood.GreaterThanOrEqualAction({ expression: ex.bumpStringLiteralToTime() }));
        };
        Expression.prototype.contains = function (ex, compare) {
            if (!Expression.isExpression(ex))
                ex = Expression.fromJSLoose(ex);
            if (compare)
                compare = getString(compare);
            return this.performAction(new Plywood.ContainsAction({ expression: ex, compare: compare }));
        };
        Expression.prototype.match = function (re) {
            return this.performAction(new Plywood.MatchAction({ regexp: getString(re) }));
        };
        Expression.prototype.in = function (ex, snd) {
            if (arguments.length === 2) {
                ex = getValue(ex);
                snd = getValue(snd);
                if (typeof ex === 'string') {
                    ex = Plywood.parseISODate(ex, Plywood.defaultParserTimezone);
                    if (!ex)
                        throw new Error('can not convert start to date');
                }
                if (typeof snd === 'string') {
                    snd = Plywood.parseISODate(snd, Plywood.defaultParserTimezone);
                    if (!snd)
                        throw new Error('can not convert end to date');
                }
                if (typeof ex === 'number' && typeof snd === 'number') {
                    ex = new Plywood.NumberRange({ start: ex, end: snd });
                }
                else if (ex.toISOString && snd.toISOString) {
                    ex = new Plywood.TimeRange({ start: ex, end: snd });
                }
                else {
                    throw new Error('uninterpretable IN parameters');
                }
            }
            if (!Expression.isExpression(ex))
                ex = Expression.fromJSLoose(ex);
            return this.performAction(new Plywood.InAction({ expression: ex }));
        };
        Expression.prototype.overlap = function (ex) {
            if (!Expression.isExpression(ex))
                ex = Expression.fromJSLoose(ex);
            return this.bumpStringLiteralToSetString().performAction(new Plywood.OverlapAction({ expression: ex.bumpStringLiteralToSetString() }));
        };
        Expression.prototype.not = function () {
            return this.performAction(new Plywood.NotAction({}));
        };
        Expression.prototype.and = function () {
            var exs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                exs[_i - 0] = arguments[_i];
            }
            return this._performMultiAction('and', exs);
        };
        Expression.prototype.or = function () {
            var exs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                exs[_i - 0] = arguments[_i];
            }
            return this._performMultiAction('or', exs);
        };
        Expression.prototype.substr = function (position, length) {
            return this.performAction(new Plywood.SubstrAction({ position: getNumber(position), length: getNumber(length) }));
        };
        Expression.prototype.extract = function (re) {
            return this.performAction(new Plywood.ExtractAction({ regexp: getString(re) }));
        };
        Expression.prototype.concat = function () {
            var exs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                exs[_i - 0] = arguments[_i];
            }
            return this._performMultiAction('concat', exs);
        };
        Expression.prototype.lookup = function (lookup) {
            return this.performAction(new Plywood.LookupAction({ lookup: getString(lookup) }));
        };
        Expression.prototype.numberBucket = function (size, offset) {
            if (offset === void 0) { offset = 0; }
            return this.performAction(new Plywood.NumberBucketAction({ size: getNumber(size), offset: getNumber(offset) }));
        };
        Expression.prototype.absolute = function () {
            return this.performAction(new Plywood.AbsoluteAction({}));
        };
        Expression.prototype.timeBucket = function (duration, timezone) {
            if (!Plywood.Duration.isDuration(duration))
                duration = Plywood.Duration.fromJS(getString(duration));
            if (timezone && !Plywood.Timezone.isTimezone(timezone))
                timezone = Plywood.Timezone.fromJS(getString(timezone));
            return this.bumpStringLiteralToTime().performAction(new Plywood.TimeBucketAction({ duration: duration, timezone: timezone }));
        };
        Expression.prototype.timeFloor = function (duration, timezone) {
            if (!Plywood.Duration.isDuration(duration))
                duration = Plywood.Duration.fromJS(getString(duration));
            if (timezone && !Plywood.Timezone.isTimezone(timezone))
                timezone = Plywood.Timezone.fromJS(getString(timezone));
            return this.bumpStringLiteralToTime().performAction(new Plywood.TimeFloorAction({ duration: duration, timezone: timezone }));
        };
        Expression.prototype.timeShift = function (duration, step, timezone) {
            if (!Plywood.Duration.isDuration(duration))
                duration = Plywood.Duration.fromJS(getString(duration));
            if (timezone && !Plywood.Timezone.isTimezone(timezone))
                timezone = Plywood.Timezone.fromJS(getString(timezone));
            return this.bumpStringLiteralToTime().performAction(new Plywood.TimeShiftAction({ duration: duration, step: getNumber(step), timezone: timezone }));
        };
        Expression.prototype.timeRange = function (duration, step, timezone) {
            if (!Plywood.Duration.isDuration(duration))
                duration = Plywood.Duration.fromJS(getString(duration));
            if (timezone && !Plywood.Timezone.isTimezone(timezone))
                timezone = Plywood.Timezone.fromJS(getString(timezone));
            return this.bumpStringLiteralToTime().performAction(new Plywood.TimeRangeAction({ duration: duration, step: getNumber(step), timezone: timezone }));
        };
        Expression.prototype.timePart = function (part, timezone) {
            if (timezone && !Plywood.Timezone.isTimezone(timezone))
                timezone = Plywood.Timezone.fromJS(getString(timezone));
            return this.bumpStringLiteralToTime().performAction(new Plywood.TimePartAction({ part: getString(part), timezone: timezone }));
        };
        Expression.prototype.filter = function (ex) {
            if (!Expression.isExpression(ex))
                ex = Expression.fromJSLoose(ex);
            return this.performAction(new Plywood.FilterAction({ expression: ex }));
        };
        Expression.prototype.split = function (splits, name, dataName) {
            if (arguments.length === 3 ||
                (arguments.length === 2 && splits && (typeof splits === 'string' || typeof splits.op === 'string'))) {
                name = getString(name);
                var realSplits = Object.create(null);
                realSplits[name] = splits;
                splits = realSplits;
            }
            else {
                dataName = name;
            }
            var parsedSplits = Object.create(null);
            for (var k in splits) {
                if (!hasOwnProperty(splits, k))
                    continue;
                var ex = splits[k];
                parsedSplits[k] = Expression.isExpression(ex) ? ex : Expression.fromJSLoose(ex);
            }
            dataName = dataName ? getString(dataName) : getDataName(this);
            if (!dataName)
                throw new Error("could not guess data name in `split`, please provide one explicitly");
            return this.performAction(new Plywood.SplitAction({ splits: parsedSplits, dataName: dataName }));
        };
        Expression.prototype.apply = function (name, ex) {
            if (arguments.length < 2)
                throw new Error('invalid arguments to .apply, did you forget to specify a name?');
            if (!Expression.isExpression(ex))
                ex = Expression.fromJSLoose(ex);
            return this.performAction(new Plywood.ApplyAction({ name: getString(name), expression: ex }));
        };
        Expression.prototype.sort = function (ex, direction) {
            if (direction === void 0) { direction = 'ascending'; }
            if (!Expression.isExpression(ex))
                ex = Expression.fromJSLoose(ex);
            return this.performAction(new Plywood.SortAction({ expression: ex, direction: getString(direction) }));
        };
        Expression.prototype.limit = function (limit) {
            return this.performAction(new Plywood.LimitAction({ limit: getNumber(limit) }));
        };
        Expression.prototype.select = function () {
            var attributes = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                attributes[_i - 0] = arguments[_i];
            }
            attributes = attributes.map(getString);
            return this.performAction(new Plywood.SelectAction({ attributes: attributes }));
        };
        Expression.prototype.count = function () {
            if (arguments.length)
                throw new Error('.count() should not have arguments, did you want to .filter().count()?');
            return this.performAction(new Plywood.CountAction({}));
        };
        Expression.prototype.sum = function (ex) {
            if (!Expression.isExpression(ex))
                ex = Expression.fromJSLoose(ex);
            return this.performAction(new Plywood.SumAction({ expression: ex }));
        };
        Expression.prototype.min = function (ex) {
            if (!Expression.isExpression(ex))
                ex = Expression.fromJSLoose(ex);
            return this.performAction(new Plywood.MinAction({ expression: ex }));
        };
        Expression.prototype.max = function (ex) {
            if (!Expression.isExpression(ex))
                ex = Expression.fromJSLoose(ex);
            return this.performAction(new Plywood.MaxAction({ expression: ex }));
        };
        Expression.prototype.average = function (ex) {
            if (!Expression.isExpression(ex))
                ex = Expression.fromJSLoose(ex);
            return this.performAction(new Plywood.AverageAction({ expression: ex }));
        };
        Expression.prototype.countDistinct = function (ex) {
            if (!Expression.isExpression(ex))
                ex = Expression.fromJSLoose(ex);
            return this.performAction(new Plywood.CountDistinctAction({ expression: ex }));
        };
        Expression.prototype.quantile = function (ex, quantile) {
            if (!Expression.isExpression(ex))
                ex = Expression.fromJSLoose(ex);
            return this.performAction(new Plywood.QuantileAction({ expression: ex, quantile: getNumber(quantile) }));
        };
        Expression.prototype.custom = function (custom) {
            return this.performAction(new Plywood.CustomAction({ custom: getString(custom) }));
        };
        Expression.prototype.join = function (ex) {
            if (!Expression.isExpression(ex))
                ex = Expression.fromJSLoose(ex);
            return this.performAction(new Plywood.JoinAction({ expression: ex }));
        };
        Expression.prototype.defineEnvironment = function (environment) {
            if (!environment.timezone)
                environment = { timezone: Plywood.Timezone.UTC };
            if (typeof environment.timezone === 'string')
                environment = { timezone: Plywood.Timezone.fromJS(environment.timezone) };
            return this.substituteAction(function (action) { return action.needsEnvironment(); }, function (preEx, action) { return preEx.performAction(action.defineEnvironment(environment)); });
        };
        Expression.prototype.referenceCheck = function (context) {
            return this.referenceCheckInTypeContext(Plywood.getFullTypeFromDatum(context));
        };
        Expression.prototype.definedInTypeContext = function (typeContext) {
            try {
                var alterations = {};
                this._fillRefSubstitutions(typeContext, { index: 0 }, alterations);
            }
            catch (e) {
                return false;
            }
            return true;
        };
        Expression.prototype.referenceCheckInTypeContext = function (typeContext) {
            var alterations = {};
            this._fillRefSubstitutions(typeContext, { index: 0 }, alterations);
            if (Plywood.helper.emptyLookup(alterations))
                return this;
            return this.substitute(function (ex, index) { return alterations[index] || null; });
        };
        Expression.prototype._fillRefSubstitutions = function (typeContext, indexer, alterations) {
            indexer.index++;
            return typeContext;
        };
        Expression.prototype.resolve = function (context, ifNotFound) {
            if (ifNotFound === void 0) { ifNotFound = 'throw'; }
            var expressions = Object.create(null);
            for (var k in context) {
                if (!hasOwnProperty(context, k))
                    continue;
                var value = context[k];
                expressions[k] = Plywood.External.isExternal(value) ?
                    new Plywood.ExternalExpression({ external: value }) :
                    new Plywood.LiteralExpression({ value: value });
            }
            return this.resolveWithExpressions(expressions, ifNotFound);
        };
        Expression.prototype.resolveWithExpressions = function (expressions, ifNotFound) {
            if (ifNotFound === void 0) { ifNotFound = 'throw'; }
            return this.substitute(function (ex, index, depth, nestDiff) {
                if (ex instanceof Plywood.RefExpression) {
                    var nest = ex.nest;
                    if (nestDiff === nest) {
                        var foundExpression = null;
                        var valueFound = false;
                        if (hasOwnProperty(expressions, ex.name)) {
                            foundExpression = expressions[ex.name];
                            valueFound = true;
                        }
                        else {
                            valueFound = false;
                        }
                        if (valueFound) {
                            return foundExpression;
                        }
                        else if (ifNotFound === 'throw') {
                            throw new Error("could not resolve " + ex + " because is was not in the context");
                        }
                        else if (ifNotFound === 'null') {
                            return Expression.NULL;
                        }
                        else if (ifNotFound === 'leave') {
                            return ex;
                        }
                    }
                    else if (nestDiff < nest) {
                        throw new Error("went too deep during resolve on: " + ex);
                    }
                }
                return null;
            });
        };
        Expression.prototype.resolved = function () {
            return this.every(function (ex) {
                return (ex instanceof Plywood.RefExpression) ? ex.nest === 0 : null;
            });
        };
        Expression.prototype.contained = function () {
            return this.every(function (ex, index, depth, nestDiff) {
                if (ex instanceof Plywood.RefExpression) {
                    var nest = ex.nest;
                    return nestDiff >= nest;
                }
                return null;
            });
        };
        Expression.prototype.decomposeAverage = function (countEx) {
            return this.substituteAction(function (action) {
                return action.action === 'average';
            }, function (preEx, action) {
                var expression = action.expression;
                return preEx.sum(expression).divide(countEx ? preEx.sum(countEx) : preEx.count());
            });
        };
        Expression.prototype.distribute = function () {
            return this.substituteAction(function (action) {
                return action.canDistribute();
            }, function (preEx, action) {
                var distributed = action.distribute(preEx);
                if (!distributed)
                    throw new Error('distribute returned null');
                return distributed;
            });
        };
        Expression.prototype.maxPossibleSplitValues = function () {
            throw new Error('must be implemented by sub class');
        };
        Expression.prototype._initialPrepare = function (context, environment) {
            return this.defineEnvironment(environment)
                .referenceCheck(context)
                .resolve(context)
                .simplify();
        };
        Expression.prototype.simulate = function (context, environment) {
            if (context === void 0) { context = {}; }
            if (environment === void 0) { environment = {}; }
            var readyExpression = this._initialPrepare(context, environment);
            if (readyExpression instanceof Plywood.ExternalExpression) {
                readyExpression = readyExpression.unsuppress();
            }
            return readyExpression._computeResolvedSimulate(true, []);
        };
        Expression.prototype.simulateQueryPlan = function (context, environment) {
            if (context === void 0) { context = {}; }
            if (environment === void 0) { environment = {}; }
            if (!Plywood.datumHasExternal(context) && !this.hasExternal())
                return [];
            var readyExpression = this._initialPrepare(context, environment);
            if (readyExpression instanceof Plywood.ExternalExpression) {
                readyExpression = readyExpression.unsuppress();
            }
            var simulatedQueries = [];
            readyExpression._computeResolvedSimulate(true, simulatedQueries);
            return simulatedQueries;
        };
        Expression.prototype._computeResolvedSimulate = function (lastNode, simulatedQueries) {
            throw new Error("can not call this directly");
        };
        Expression.prototype.compute = function (context, environment) {
            var _this = this;
            if (context === void 0) { context = {}; }
            if (environment === void 0) { environment = {}; }
            if (!Plywood.datumHasExternal(context) && !this.hasExternal()) {
                return Q.fcall(function () {
                    var referenceChecked = _this.defineEnvironment(environment).referenceCheck(context);
                    return referenceChecked.getFn()(context, null);
                });
            }
            return Plywood.introspectDatum(context)
                .then(function (introspectedContext) {
                var readyExpression = _this._initialPrepare(introspectedContext, environment);
                if (readyExpression instanceof Plywood.ExternalExpression) {
                    readyExpression = readyExpression.unsuppress();
                }
                return readyExpression._computeResolved(true);
            });
        };
        Expression.prototype._computeResolved = function (lastNode) {
            throw new Error("can not call this directly");
        };
        Expression.classMap = {};
        return Expression;
    }());
    Plywood.Expression = Expression;
    check = Expression;
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var LiteralExpression = (function (_super) {
        __extends(LiteralExpression, _super);
        function LiteralExpression(parameters, req) {
            _super.call(this, parameters, dummyObject);
            var value = parameters.value;
            this.value = value;
            this._ensureOp("literal");
            if (typeof this.value === 'undefined') {
                throw new TypeError("must have a `value`");
            }
            this.type = Plywood.getValueType(value);
            this.simple = true;
            this.__req = req;
        }
        LiteralExpression.fromJS = function (parameters, req = null) {
            var value = {
                op: parameters.op,
                type: parameters.type
            };
            if (!hasOwnProperty(parameters, 'value'))
                throw new Error('literal expression must have value');
            var v = parameters.value;
            if (Plywood.isImmutableClass(v)) {
                value.value = v;
            }
            else {
                value.value = Plywood.valueFromJS(v, parameters.type);
            }
            return new LiteralExpression(value);
        };
        LiteralExpression.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.value = this.value;
            if (this.type)
                value.type = this.type;
            return value;
        };
        LiteralExpression.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            if (this.value && this.value.toJS) {
                js.value = this.value.toJS();
                js.type = Plywood.isSetType(this.type) ? 'SET' : this.type;
            }
            else {
                js.value = this.value;
                if (this.type === 'TIME')
                    js.type = 'TIME';
            }
            return js;
        };
        LiteralExpression.prototype.toString = function () {
            var value = this.value;
            if (value instanceof Plywood.Dataset && value.basis()) {
                return 'ply()';
            }
            else if (this.type === 'STRING') {
                return JSON.stringify(value);
            }
            else {
                return String(value);
            }
        };
        LiteralExpression.prototype.getFn = function () {
            var value = this.value;
            return function () { return value; };
        };
        LiteralExpression.prototype.getJS = function (datumVar) {
            return JSON.stringify(this.value);
        };
        LiteralExpression.prototype.getSQL = function (dialect) {
            var value = this.value;
            if (value === null)
                return 'NULL';
            switch (this.type) {
                case 'STRING':
                    return dialect.escapeLiteral(value);
                case 'BOOLEAN':
                    return dialect.booleanToSQL(value);
                case 'NUMBER':
                    return dialect.numberToSQL(value);
                case 'NUMBER_RANGE':
                    return "" + dialect.numberToSQL(value.start);
                case 'TIME':
                    return dialect.timeToSQL(value);
                case 'TIME_RANGE':
                    return "" + dialect.timeToSQL(value.start);
                case 'SET/STRING':
                case 'SET/NUMBER':
                    return '(' + value.elements.map(function (v) { return typeof v === 'number' ? v : dialect.escapeLiteral(v); }).join(',') + ')';
                case 'SET/NUMBER_RANGE':
                case 'SET/TIME_RANGE':
                    return 'FALSE';
                default:
                    throw new Error("currently unsupported type: " + this.type);
            }
        };
        LiteralExpression.prototype.equals = function (other) {
            if (!_super.prototype.equals.call(this, other) || this.type !== other.type)
                return false;
            if (this.value) {
                if (this.value.equals) {
                    return this.value.equals(other.value);
                }
                else if (this.value.toISOString && other.value.toISOString) {
                    return this.value.valueOf() === other.value.valueOf();
                }
                else {
                    return this.value === other.value;
                }
            }
            else {
                return this.value === other.value;
            }
        };
        LiteralExpression.prototype._fillRefSubstitutions = function (typeContext, indexer, alterations) {
            indexer.index++;
            if (this.type == 'DATASET') {
                var newTypeContext = this.value.getFullType();
                newTypeContext.parent = typeContext;
                return newTypeContext;
            }
            else {
                return { type: this.type };
            }
        };
        LiteralExpression.prototype.getLiteralValue = function () {
            return this.value;
        };
        LiteralExpression.prototype._computeResolvedSimulate = function () {
            return this.value;
        };
        LiteralExpression.prototype._computeResolved = function () {
            return Q(this.value);
        };
        LiteralExpression.prototype.maxPossibleSplitValues = function () {
            var value = this.value;
            return Plywood.Set.isSet(value) ? value.size() : 1;
        };
        LiteralExpression.prototype.bumpStringLiteralToTime = function () {
            if (this.type !== 'STRING')
                return this;
            var parse = Plywood.parseISODate(this.value, Plywood.defaultParserTimezone);
            if (!parse)
                throw new Error("could not parse '" + this.value + "' as time");
            return Plywood.r(parse);
        };
        LiteralExpression.prototype.bumpStringLiteralToSetString = function () {
            if (this.type !== 'STRING')
                return this;
            return Plywood.r(Plywood.Set.fromJS([this.value]));
        };
        return LiteralExpression;
    }(Plywood.Expression));
    Plywood.LiteralExpression = LiteralExpression;
    Plywood.Expression.NULL = new LiteralExpression({ value: null });
    Plywood.Expression.ZERO = new LiteralExpression({ value: 0 });
    Plywood.Expression.ONE = new LiteralExpression({ value: 1 });
    Plywood.Expression.FALSE = new LiteralExpression({ value: false });
    Plywood.Expression.TRUE = new LiteralExpression({ value: true });
    Plywood.Expression.EMPTY_STRING = new LiteralExpression({ value: '' });
    Plywood.Expression.EMPTY_SET = new LiteralExpression({ value: Plywood.Set.fromJS([]) });
    Plywood.Expression.register(LiteralExpression);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    Plywood.POSSIBLE_TYPES = {
        'NULL': 1,
        'BOOLEAN': 1,
        'NUMBER': 1,
        'TIME': 1,
        'STRING': 1,
        'NUMBER_RANGE': 1,
        'TIME_RANGE': 1,
        'SET': 1,
        'SET/NULL': 1,
        'SET/BOOLEAN': 1,
        'SET/NUMBER': 1,
        'SET/TIME': 1,
        'SET/STRING': 1,
        'SET/NUMBER_RANGE': 1,
        'SET/TIME_RANGE': 1,
        'DATASET': 1
    };
    var GENERATIONS_REGEXP = /^\^+/;
    var TYPE_REGEXP = /:([A-Z\/_]+)$/;
    var RefExpression = (function (_super) {
        __extends(RefExpression, _super);
        function RefExpression(parameters, req) {
            _super.call(this, parameters, dummyObject);
            this._ensureOp("ref");
            var name = parameters.name;
            if (typeof name !== 'string' || name.length === 0) {
                throw new TypeError("must have a nonempty `name`");
            }
            this.name = name;
            var nest = parameters.nest;
            if (typeof nest !== 'number') {
                throw new TypeError("must have nest");
            }
            if (nest < 0) {
                throw new Error("nest must be non-negative");
            }
            this.nest = nest;
            var myType = parameters.type;
            if (myType) {
                if (!RefExpression.validType(myType)) {
                    throw new TypeError("unsupported type '" + myType + "'");
                }
                this.type = myType;
            }
            this.remote = Boolean(parameters.remote);
            this.simple = true;
            this.__req = req;
        }
        RefExpression.fromJS = function (parameters, req = null) {
            var value;
            if (hasOwnProperty(parameters, 'nest')) {
                value = parameters;
            }
            else {
                value = {
                    op: 'ref',
                    nest: 0,
                    name: parameters.name,
                    type: parameters.type
                };
            }
            return new RefExpression(value);
        };
        RefExpression.parse = function (str) {
            var refValue = { op: 'ref' };
            var match;
            match = str.match(GENERATIONS_REGEXP);
            if (match) {
                var nest = match[0].length;
                refValue.nest = nest;
                str = str.substr(nest);
            }
            else {
                refValue.nest = 0;
            }
            match = str.match(TYPE_REGEXP);
            if (match) {
                refValue.type = match[1];
                str = str.substr(0, str.length - match[0].length);
            }
            if (str[0] === '{' && str[str.length - 1] === '}') {
                str = str.substr(1, str.length - 2);
            }
            refValue.name = str;
            return new RefExpression(refValue);
        };
        RefExpression.validType = function (typeName) {
            return hasOwnProperty(Plywood.POSSIBLE_TYPES, typeName);
        };
        RefExpression.toSimpleName = function (variableName) {
            if (!RefExpression.SIMPLE_NAME_REGEXP.test(variableName)) {
                variableName = variableName.replace(/\W/g, '');
            }
            return variableName;
        };
        RefExpression.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.name = this.name;
            value.nest = this.nest;
            if (this.type)
                value.type = this.type;
            if (this.remote)
                value.remote = true;
            return value;
        };
        RefExpression.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.name = this.name;
            if (this.nest)
                js.nest = this.nest;
            if (this.type)
                js.type = this.type;
            return js;
        };
        RefExpression.prototype.toString = function () {
            var str = this.name;
            if (!RefExpression.SIMPLE_NAME_REGEXP.test(str)) {
                str = '{' + str + '}';
            }
            if (this.nest) {
                str = repeat('^', this.nest) + str;
            }
            if (this.type) {
                str += ':' + this.type;
            }
            return '$' + str;
        };
        RefExpression.prototype.getFn = function () {
            var name = this.name;
            var nest = this.nest;
            return function (d, c) {
                if (nest) {
                    return c[name];
                }
                else {
                    if (hasOwnProperty(d, name)) {
                        return d[name];
                    }
                    else {
                        return null;
                    }
                }
            };
        };
        RefExpression.prototype.getJS = function (datumVar) {
            if (this.nest)
                throw new Error("can not call getJS on unresolved expression");
            var name = this.name;
            var expr;
            if (datumVar) {
                expr = datumVar.replace('[]', "[" + JSON.stringify(name) + "]");
            }
            else {
                expr = RefExpression.toSimpleName(name);
            }
            if (this.type === 'NUMBER')
                expr = "(+" + expr + ")";
            return expr;
        };
        RefExpression.prototype.getSQL = function (dialect, minimal) {
            if (minimal === void 0) { minimal = false; }
            if (this.nest)
                throw new Error("can not call getSQL on unresolved expression: " + this);
            return dialect.escapeName(this.name);
        };
        RefExpression.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.name === other.name &&
                this.nest === other.nest &&
                this.remote === other.remote;
        };
        RefExpression.prototype.isRemote = function () {
            return this.remote;
        };
        RefExpression.prototype._fillRefSubstitutions = function (typeContext, indexer, alterations) {
            var myIndex = indexer.index;
            indexer.index++;
            var nest = this.nest;
            var myTypeContext = typeContext;
            while (nest--) {
                myTypeContext = myTypeContext.parent;
                if (!myTypeContext)
                    throw new Error('went too deep on ' + this.toString());
            }
            var nestDiff = 0;
            while (myTypeContext && !myTypeContext.datasetType[this.name]) {
                myTypeContext = myTypeContext.parent;
                nestDiff++;
            }
            if (!myTypeContext) {
                throw new Error('could not resolve ' + this.toString());
            }
            var myFullType = myTypeContext.datasetType[this.name];
            var myType = myFullType.type;
            var myRemote = Boolean(myFullType.remote);
            if (this.type && this.type !== myType) {
                throw new TypeError("type mismatch in " + this + " (has: " + this.type + " needs: " + myType + ")");
            }
            if (!this.type || nestDiff > 0 || this.remote !== myRemote) {
                alterations[myIndex] = new RefExpression({
                    name: this.name,
                    nest: this.nest + nestDiff,
                    type: myType,
                    remote: myRemote
                });
            }
            if (myType === 'DATASET') {
                return {
                    parent: typeContext,
                    type: 'DATASET',
                    datasetType: myFullType.datasetType,
                    remote: myFullType.remote
                };
            }
            return myFullType;
        };
        RefExpression.prototype.incrementNesting = function (by) {
            if (by === void 0) { by = 1; }
            var value = this.valueOf();
            value.nest = by + value.nest;
            return new RefExpression(value);
        };
        RefExpression.prototype.maxPossibleSplitValues = function () {
            return this.type === 'BOOLEAN' ? 3 : Infinity;
        };
        RefExpression.SIMPLE_NAME_REGEXP = /^([a-z_]\w*)$/i;
        return RefExpression;
    }(Plywood.Expression));
    Plywood.RefExpression = RefExpression;
    Plywood.Expression.register(RefExpression);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var ExternalExpression = (function (_super) {
        __extends(ExternalExpression, _super);
        function ExternalExpression(parameters, req=null) {
            _super.call(this, parameters, dummyObject);
            var external = parameters.external;
            if (!external)
                throw new Error('must have an external');
            this.external = external;
            this._ensureOp('external');
            this.type = external.mode === 'value' ? 'NUMBER' : 'DATASET';
            this.simple = true;
            this.__req = req;
        }
        ExternalExpression.fromJS = function (parameters, req = null) {
            var value = {
                op: parameters.op
            };
            value.external = Plywood.External.fromJS(parameters.external);
            return new ExternalExpression(value);
        };
        ExternalExpression.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.external = this.external;
            return value;
        };
        ExternalExpression.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.external = this.external.toJS();
            return js;
        };
        ExternalExpression.prototype.toString = function () {
            return "E:" + this.external;
        };
        ExternalExpression.prototype.getFn = function () {
            throw new Error('should not call getFn on External');
        };
        ExternalExpression.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.external.equals(other.external);
        };
        ExternalExpression.prototype._fillRefSubstitutions = function (typeContext, indexer, alterations) {
            indexer.index++;
            var external = this.external;
            if (external.mode === 'value') {
                return { type: 'NUMBER' };
            }
            else {
                var newTypeContext = this.external.getFullType();
                newTypeContext.parent = typeContext;
                return newTypeContext;
            }
        };
        ExternalExpression.prototype._computeResolvedSimulate = function (lastNode, simulatedQueries) {
            var external = this.external;
            if (external.suppress)
                return external;
            return external.simulateValue(lastNode, simulatedQueries);
        };
        ExternalExpression.prototype._computeResolved = function (lastNode) {
            var external = this.external;
            if (external.suppress)
                return Q(external);
            return external.queryValue(lastNode, this.__req);
        };
        ExternalExpression.prototype.unsuppress = function () {
            var value = this.valueOf();
            value.external = this.external.show();
            return new ExternalExpression(value);
        };
        ExternalExpression.prototype.addAction = function (action) {
            var newExternal = this.external.addAction(action);
            if (!newExternal)
                return null;
            return new ExternalExpression({ external: newExternal });
        };
        ExternalExpression.prototype.maxPossibleSplitValues = function () {
            return Infinity;
        };
        return ExternalExpression;
    }(Plywood.Expression));
    Plywood.ExternalExpression = ExternalExpression;
    Plywood.Expression.register(ExternalExpression);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var ChainExpression = (function (_super) {
        __extends(ChainExpression, _super);
        function ChainExpression(parameters, req) {
            _super.call(this, parameters, dummyObject);
            var expression = parameters.expression;
            this.expression = expression;
            var actions = parameters.actions;
            if (!actions.length)
                throw new Error('can not have empty actions');
            this.actions = actions;
            this._ensureOp('chain');
            var type = expression.type;
            for (var _i = 0, actions_1 = actions; _i < actions_1.length; _i++) {
                var action = actions_1[_i];
                type = action.getOutputType(type);
            }
            this.type = type;
            this.__req = req;
        }
        ChainExpression.fromJS = function (parameters, req = null) {
            var value = {
                op: parameters.op
            };
            value.expression = Plywood.Expression.fromJS(parameters.expression);
            if (hasOwnProperty(parameters, 'action')) {
                value.actions = [Plywood.Action.fromJS(parameters.action)];
            }
            else {
                if (!Array.isArray(parameters.actions))
                    throw new Error('chain `actions` must be an array');
                value.actions = parameters.actions.map(Plywood.Action.fromJS);
            }
            return new ChainExpression(value);
        };
        ChainExpression.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.expression = this.expression;
            value.actions = this.actions;
            return value;
        };
        ChainExpression.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.expression = this.expression.toJS();
            var actions = this.actions;
            if (actions.length === 1) {
                js.action = actions[0].toJS();
            }
            else {
                js.actions = actions.map(function (action) { return action.toJS(); });
            }
            return js;
        };
        ChainExpression.prototype.toString = function (indent) {
            var expression = this.expression;
            var actions = this.actions;
            var joinStr = '.';
            var nextIndent = null;
            if (indent != null && (actions.length > 1 || expression.type === 'DATASET')) {
                joinStr = '\n' + repeat(' ', indent) + joinStr;
                nextIndent = indent + 2;
            }
            return [expression.toString()]
                .concat(actions.map(function (action) { return action.toString(nextIndent); }))
                .join(joinStr);
        };
        ChainExpression.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.expression.equals(other.expression) &&
                Plywood.immutableArraysEqual(this.actions, other.actions);
        };
        ChainExpression.prototype.expressionCount = function () {
            var expressionCount = 1 + this.expression.expressionCount();
            var actions = this.actions;
            for (var _i = 0, actions_2 = actions; _i < actions_2.length; _i++) {
                var action = actions_2[_i];
                expressionCount += action.expressionCount();
            }
            return expressionCount;
        };
        ChainExpression.prototype.getFn = function () {
            var fn = this.expression.getFn();
            var actions = this.actions;
            for (var _i = 0, actions_3 = actions; _i < actions_3.length; _i++) {
                var action = actions_3[_i];
                fn = action.getFn(fn);
            }
            return fn;
        };
        ChainExpression.prototype.getJS = function (datumVar) {
            var expression = this.expression;
            var actions = this.actions;
            var js = expression.getJS(datumVar);
            for (var _i = 0, actions_4 = actions; _i < actions_4.length; _i++) {
                var action = actions_4[_i];
                js = action.getJS(js, datumVar);
            }
            return js;
        };
        ChainExpression.prototype.getSQL = function (dialect) {
            var expression = this.expression;
            var actions = this.actions;
            var sql = expression.getSQL(dialect);
            for (var _i = 0, actions_5 = actions; _i < actions_5.length; _i++) {
                var action = actions_5[_i];
                sql = action.getSQL(sql, dialect);
            }
            return sql;
        };
        ChainExpression.prototype.getSingleAction = function (neededAction) {
            var actions = this.actions;
            if (actions.length !== 1)
                return null;
            var singleAction = actions[0];
            if (neededAction && singleAction.action !== neededAction)
                return null;
            return singleAction;
        };
        ChainExpression.prototype.foldIntoExternal = function () {
            var _a = this, expression = _a.expression, actions = _a.actions;
            var baseExternals = this.getBaseExternals();
            if (baseExternals.length === 0)
                return this;
            if (expression instanceof Plywood.ExternalExpression) {
                var myExternal = expression;
                var undigestedActions = [];
                for (var _i = 0, actions_6 = actions; _i < actions_6.length; _i++) {
                    var action = actions_6[_i];
                    var newExternal = myExternal.addAction(action);
                    if (newExternal) {
                        myExternal = newExternal;
                    }
                    else {
                        undigestedActions.push(action);
                    }
                }
                if (undigestedActions.length) {
                    return new ChainExpression({
                        expression: myExternal,
                        actions: undigestedActions,
                        simple: true
                    });
                }
                else {
                    return myExternal;
                }
            }
            var dataset = expression.getLiteralValue();
            if (Plywood.Dataset.isDataset(dataset) && dataset.basis()) {
                if (baseExternals.length > 1) {
                    throw new Error('multiple externals not supported for now');
                }
                var dataDefinitions = Object.create(null);
                var hasExternalValueApply = false;
                var applies = [];
                var undigestedActions = [];
                var allActions = [];
                function addExternalApply(action) {
                    var externalMode = action.expression.external.mode;
                    if (externalMode === 'raw') {
                        dataDefinitions[action.name] = action.expression;
                    }
                    else if (externalMode === 'value') {
                        applies.push(action);
                        allActions.push(action);
                        hasExternalValueApply = true;
                    }
                    else {
                        undigestedActions.push(action);
                        allActions.push(action);
                    }
                }
                for (var _b = 0, actions_7 = actions; _b < actions_7.length; _b++) {
                    var action_1 = actions_7[_b];
                    if (action_1 instanceof Plywood.ApplyAction) {
                        var substitutedAction = action_1.substitute(function (ex, index, depth, nestDiff) {
                            if (ex instanceof Plywood.RefExpression && ex.type === 'DATASET' && nestDiff === 1) {
                                return dataDefinitions[ex.name] || null;
                            }
                            return null;
                        }).simplify();
                        if (substitutedAction.expression instanceof Plywood.ExternalExpression) {
                            addExternalApply(substitutedAction);
                        }
                        else if (substitutedAction.expression.type !== 'DATASET') {
                            applies.push(substitutedAction);
                            allActions.push(substitutedAction);
                        }
                        else {
                            undigestedActions.push(substitutedAction);
                            allActions.push(substitutedAction);
                        }
                    }
                    else {
                        undigestedActions.push(action_1);
                        allActions.push(action_1);
                    }
                }
                var newExpression;
                if (hasExternalValueApply) {
                    var combinedExternal = baseExternals[0].makeTotal(applies);
                    if (!combinedExternal)
                        throw new Error('something went wrong');
                    newExpression = new Plywood.ExternalExpression({ external: combinedExternal });
                    if (undigestedActions.length)
                        newExpression = newExpression.performActions(undigestedActions, true);
                    return newExpression;
                }
                else {
                    return Plywood.ply().performActions(allActions);
                }
            }
            return this.substituteAction(function (action) {
                var expression = action.expression;
                return (expression instanceof Plywood.ExternalExpression) && expression.external.mode === 'value';
            }, function (preEx, action) {
                var external = action.expression.external;
                return new Plywood.ExternalExpression({
                    external: external.prePack(preEx, action)
                });
            }, {
                onceInChain: true
            }).simplify();
        };
        ChainExpression.prototype.simplify = function () {
            if (this.simple)
                return this;
            var simpleExpression = this.expression.simplify();
            var actions = this.actions;
            if (simpleExpression instanceof ChainExpression) {
                return new ChainExpression({
                    expression: simpleExpression.expression,
                    actions: simpleExpression.actions.concat(actions)
                }).simplify();
            }
            for (var _i = 0, actions_8 = actions; _i < actions_8.length; _i++) {
                var action = actions_8[_i];
                simpleExpression = action.performOnSimple(simpleExpression);
            }
            if (!simpleExpression.isOp('chain'))
                return simpleExpression;
            return simpleExpression.foldIntoExternal();
        };
        ChainExpression.prototype._everyHelper = function (iter, thisArg, indexer, depth, nestDiff) {
            var pass = iter.call(thisArg, this, indexer.index, depth, nestDiff);
            if (pass != null) {
                return pass;
            }
            else {
                indexer.index++;
            }
            depth++;
            var expression = this.expression;
            if (!expression._everyHelper(iter, thisArg, indexer, depth, nestDiff))
                return false;
            var actions = this.actions;
            var every = true;
            for (var _i = 0, actions_9 = actions; _i < actions_9.length; _i++) {
                var action = actions_9[_i];
                if (every) {
                    every = action._everyHelper(iter, thisArg, indexer, depth, nestDiff);
                }
                else {
                    indexer.index += action.expressionCount();
                }
            }
            return every;
        };
        ChainExpression.prototype._substituteHelper = function (substitutionFn, thisArg, indexer, depth, nestDiff) {
            var sub = substitutionFn.call(thisArg, this, indexer.index, depth, nestDiff);
            if (sub) {
                indexer.index += this.expressionCount();
                return sub;
            }
            else {
                indexer.index++;
            }
            depth++;
            var expression = this.expression;
            var subExpression = expression._substituteHelper(substitutionFn, thisArg, indexer, depth, nestDiff);
            var actions = this.actions;
            var subActions = actions.map(function (action) { return action._substituteHelper(substitutionFn, thisArg, indexer, depth, nestDiff); });
            if (expression === subExpression && arraysEqual(actions, subActions))
                return this;
            var value = this.valueOf();
            value.expression = subExpression;
            value.actions = subActions;
            delete value.simple;
            return new ChainExpression(value);
        };
        ChainExpression.prototype.performAction = function (action, markSimple) {
            if (!action)
                throw new Error('must have action');
            return new ChainExpression({
                expression: this.expression,
                actions: this.actions.concat(action),
                simple: Boolean(markSimple)
            });
        };
        ChainExpression.prototype._fillRefSubstitutions = function (typeContext, indexer, alterations) {
            indexer.index++;
            var currentContext = typeContext;
            var outputContext = this.expression._fillRefSubstitutions(currentContext, indexer, alterations);
            currentContext = outputContext.type === 'DATASET' ? outputContext : typeContext;
            var actions = this.actions;
            for (var _i = 0, actions_10 = actions; _i < actions_10.length; _i++) {
                var action = actions_10[_i];
                outputContext = action._fillRefSubstitutions(currentContext, outputContext, indexer, alterations);
                currentContext = outputContext.type === 'DATASET' ? outputContext : typeContext;
            }
            return outputContext;
        };
        ChainExpression.prototype.actionize = function (containingAction) {
            var actions = this.actions;
            var k = actions.length - 1;
            for (; k >= 0; k--) {
                if (actions[k].action !== containingAction)
                    break;
            }
            k++;
            if (k === actions.length)
                return null;
            var newExpression;
            if (k === 0) {
                newExpression = this.expression;
            }
            else {
                var value = this.valueOf();
                value.actions = actions.slice(0, k);
                newExpression = new ChainExpression(value);
            }
            return [
                new Plywood.Action.classMap[containingAction]({
                    expression: newExpression
                })
            ].concat(actions.slice(k));
        };
        ChainExpression.prototype.firstAction = function () {
            return this.actions[0] || null;
        };
        ChainExpression.prototype.lastAction = function () {
            var actions = this.actions;
            return actions[actions.length - 1] || null;
        };
        ChainExpression.prototype.headActions = function (n) {
            var actions = this.actions;
            if (actions.length <= n)
                return this;
            if (n <= 0)
                return this.expression;
            var value = this.valueOf();
            value.actions = actions.slice(0, n);
            return new ChainExpression(value);
        };
        ChainExpression.prototype.popAction = function () {
            var actions = this.actions;
            if (!actions.length)
                return null;
            actions = actions.slice(0, -1);
            if (!actions.length)
                return this.expression;
            var value = this.valueOf();
            value.actions = actions;
            return new ChainExpression(value);
        };
        ChainExpression.prototype._computeResolvedSimulate = function (lastNode, simulatedQueries) {
            var _a = this, expression = _a.expression, actions = _a.actions;
            if (expression.isOp('external')) {
                var exV = expression._computeResolvedSimulate(false, simulatedQueries);
                var newExpression = Plywood.r(exV).performActions(actions).simplify();
                if (newExpression.hasExternal()) {
                    return newExpression._computeResolvedSimulate(true, simulatedQueries);
                }
                else {
                    return newExpression.getFn()(null, null);
                }
            }
            function execAction(i, dataset) {
                var action = actions[i];
                var actionExpression = action.expression;
                if (action instanceof Plywood.FilterAction) {
                    return dataset.filter(actionExpression.getFn(), null);
                }
                else if (action instanceof Plywood.ApplyAction) {
                    if (actionExpression.hasExternal()) {
                        return dataset.apply(action.name, function (d) {
                            var simpleExpression = actionExpression.resolve(d).simplify();
                            return simpleExpression._computeResolvedSimulate(simpleExpression.isOp('external'), simulatedQueries);
                        }, actionExpression.type, null);
                    }
                    else {
                        return dataset.apply(action.name, actionExpression.getFn(), actionExpression.type, null);
                    }
                }
                else if (action instanceof Plywood.SortAction) {
                    return dataset.sort(actionExpression.getFn(), action.direction, null);
                }
                else if (action instanceof Plywood.LimitAction) {
                    return dataset.limit(action.limit);
                }
                else if (action instanceof Plywood.SelectAction) {
                    return dataset.select(action.attributes);
                }
                throw new Error("could not execute action " + action);
            }
            var value = expression._computeResolvedSimulate(false, simulatedQueries);
            for (var i = 0; i < actions.length; i++) {
                value = execAction(i, value);
            }
            return value;
        };
        ChainExpression.prototype._computeResolved = function () {
            var _a = this, expression = _a.expression, actions = _a.actions;
            if (expression.isOp('external')) {
                return expression._computeResolved(false).then(function (exV) {
                    var newExpression = Plywood.r(exV).performActions(actions).simplify();
                    if (newExpression.hasExternal()) {
                        return newExpression._computeResolved(true);
                    }
                    else {
                        return newExpression.getFn()(null, null);
                    }
                });
            }
            function execAction(i) {
                return function (dataset) {
                    var action = actions[i];
                    var actionExpression = action.expression;
                    if (action instanceof Plywood.FilterAction) {
                        return dataset.filter(actionExpression.getFn(), null);
                    }
                    else if (action instanceof Plywood.ApplyAction) {
                        if (actionExpression.hasExternal()) {
                            return dataset.applyPromise(action.name, function (d) {
                                var simpleExpression = actionExpression.resolve(d).simplify();
                                return simpleExpression._computeResolved(simpleExpression.isOp('external'));
                            }, actionExpression.type, null);
                        }
                        else {
                            return dataset.apply(action.name, actionExpression.getFn(), actionExpression.type, null);
                        }
                    }
                    else if (action instanceof Plywood.SortAction) {
                        return dataset.sort(actionExpression.getFn(), action.direction, null);
                    }
                    else if (action instanceof Plywood.LimitAction) {
                        return dataset.limit(action.limit);
                    }
                    else if (action instanceof Plywood.SelectAction) {
                        return dataset.select(action.attributes);
                    }
                    throw new Error("could not execute action " + action);
                };
            }
            var promise = expression._computeResolved(false);
            for (var i = 0; i < actions.length; i++) {
                promise = promise.then(execAction(i));
            }
            return promise;
        };
        ChainExpression.prototype.extractFromAnd = function (matchFn) {
            if (!this.simple)
                return this.simplify().extractFromAnd(matchFn);
            var andExpressions = this.getExpressionPattern('and');
            if (!andExpressions)
                return _super.prototype.extractFromAnd.call(this, matchFn);
            var includedExpressions = [];
            var excludedExpressions = [];
            for (var _i = 0, andExpressions_1 = andExpressions; _i < andExpressions_1.length; _i++) {
                var ex = andExpressions_1[_i];
                if (matchFn(ex)) {
                    includedExpressions.push(ex);
                }
                else {
                    excludedExpressions.push(ex);
                }
            }
            return {
                extract: Plywood.Expression.and(includedExpressions).simplify(),
                rest: Plywood.Expression.and(excludedExpressions).simplify()
            };
        };
        ChainExpression.prototype.maxPossibleSplitValues = function () {
            return this.type === 'BOOLEAN' ? 3 : this.lastAction().maxPossibleSplitValues();
        };
        return ChainExpression;
    }(Plywood.Expression));
    Plywood.ChainExpression = ChainExpression;
    Plywood.Expression.register(ChainExpression);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var checkAction;
    var Action = (function () {
        function Action(parameters, dummy) {
            if (dummy === void 0) { dummy = null; }
            if (dummy !== dummyObject) {
                throw new TypeError("can not call `new Action` directly use Action.fromJS instead");
            }
            this.action = parameters.action;
            this.expression = parameters.expression;
            this.simple = parameters.simple;
        }
        Action.jsToValue = function (parameters) {
            var value = {
                action: parameters.action
            };
            if (parameters.expression) {
                value.expression = Plywood.Expression.fromJS(parameters.expression);
            }
            return value;
        };
        Action.actionsDependOn = function (actions, name) {
            for (var _i = 0, actions_11 = actions; _i < actions_11.length; _i++) {
                var action = actions_11[_i];
                var freeReferences = action.getFreeReferences();
                if (freeReferences.indexOf(name) !== -1)
                    return true;
                if (action.name === name)
                    return false;
            }
            return false;
        };
        Action.isAction = function (candidate) {
            return Plywood.isInstanceOf(candidate, Action);
        };
        Action.register = function (act) {
            var action = act.name.replace('Action', '').replace(/^\w/, function (s) { return s.toLowerCase(); });
            Action.classMap[action] = act;
        };
        Action.fromJS = function (actionJS) {
            if (!hasOwnProperty(actionJS, "action")) {
                throw new Error("action must be defined");
            }
            var action = actionJS.action;
            if (typeof action !== "string") {
                throw new Error("action must be a string");
            }
            var ClassFn = Action.classMap[action];
            if (!ClassFn) {
                throw new Error("unsupported action '" + action + "'");
            }
            return ClassFn.fromJS(actionJS);
        };
        Action.prototype._ensureAction = function (action) {
            if (!this.action) {
                this.action = action;
                return;
            }
            if (this.action !== action) {
                throw new TypeError("incorrect action '" + this.action + "' (needs to be: '" + action + "')");
            }
        };
        Action.prototype._toStringParameters = function (expressionString) {
            return expressionString ? [expressionString] : [];
        };
        Action.prototype.toString = function (indent) {
            var expression = this.expression;
            var spacer = '';
            var joinStr = indent != null ? ', ' : ',';
            var nextIndent = null;
            if (indent != null && expression && expression.type === 'DATASET') {
                var space = repeat(' ', indent);
                spacer = '\n' + space;
                joinStr = ',\n' + space;
                nextIndent = indent + 2;
            }
            return [
                this.action,
                '(',
                spacer,
                this._toStringParameters(expression ? expression.toString(nextIndent) : null).join(joinStr),
                spacer,
                ')'
            ].join('');
        };
        Action.prototype.valueOf = function () {
            var value = {
                action: this.action
            };
            if (this.expression)
                value.expression = this.expression;
            if (this.simple)
                value.simple = true;
            return value;
        };
        Action.prototype.toJS = function () {
            var js = {
                action: this.action
            };
            if (this.expression) {
                js.expression = this.expression.toJS();
            }
            return js;
        };
        Action.prototype.toJSON = function () {
            return this.toJS();
        };
        Action.prototype.equals = function (other) {
            return Action.isAction(other) &&
                this.action === other.action &&
                Boolean(this.expression) === Boolean(other.expression) &&
                (!this.expression || this.expression.equals(other.expression));
        };
        Action.prototype.isAggregate = function () {
            return false;
        };
        Action.prototype._checkInputTypes = function (inputType) {
            var neededTypes = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                neededTypes[_i - 1] = arguments[_i];
            }
            if (inputType && inputType !== 'NULL' && neededTypes.indexOf(inputType) === -1) {
                if (neededTypes.length === 1) {
                    throw new Error(this.action + " must have input of type " + neededTypes[0] + " (is " + inputType + ")");
                }
                else {
                    throw new Error(this.action + " must have input of type " + neededTypes.join(' or ') + " (is " + inputType + ")");
                }
            }
        };
        Action.prototype._checkNoExpression = function () {
            if (this.expression) {
                throw new Error(this.action + " must no have an expression (is " + this.expression + ")");
            }
        };
        Action.prototype._checkExpressionTypes = function () {
            var neededTypes = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                neededTypes[_i - 0] = arguments[_i];
            }
            var expressionType = this.expression.type;
            if (expressionType && expressionType !== 'NULL' && neededTypes.indexOf(expressionType) === -1) {
                if (neededTypes.length === 1) {
                    throw new Error(this.action + " must have expression of type " + neededTypes[0] + " (is " + expressionType + ")");
                }
                else {
                    throw new Error(this.action + " must have expression of type " + neededTypes.join(' or ') + " (is " + expressionType + ")");
                }
            }
        };
        Action.prototype.getOutputType = function (inputType) {
            throw new Error("must implement getOutputType in " + this.action);
        };
        Action.prototype._stringTransformOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'STRING', 'SET/STRING');
            return inputType;
        };
        Action.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            throw new Error("must implement _fillRefSubstitutions in " + this.action);
        };
        Action.prototype._getFnHelper = function (inputFn, expressionFn) {
            var action = this.action;
            return function (d, c) {
                var inV = inputFn(d, c);
                return inV ? inV[action](expressionFn, Plywood.foldContext(d, c)) : null;
            };
        };
        Action.prototype.getFn = function (inputFn) {
            var expression = this.expression;
            var expressionFn = expression ? expression.getFn() : null;
            return this._getFnHelper(inputFn, expressionFn);
        };
        Action.prototype._getJSHelper = function (inputJS, expressionJS) {
            throw new Error('can not call this directly');
        };
        Action.prototype.getJS = function (inputJS, datumVar) {
            var expression = this.expression;
            var expressionJS = expression ? expression.getJS(datumVar) : null;
            return this._getJSHelper(inputJS, expressionJS);
        };
        Action.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            throw new Error('can not call this directly');
        };
        Action.prototype.getSQL = function (inputSQL, dialect) {
            var expression = this.expression;
            var expressionSQL = expression ? expression.getSQL(dialect) : null;
            return this._getSQLHelper(dialect, inputSQL, expressionSQL);
        };
        Action.prototype.expressionCount = function () {
            return this.expression ? this.expression.expressionCount() : 0;
        };
        Action.prototype.fullyDefined = function () {
            var expression = this.expression;
            return !expression || expression.isOp('literal');
        };
        Action.prototype._specialSimplify = function (simpleExpression) {
            return null;
        };
        Action.prototype.simplify = function () {
            if (this.simple)
                return this;
            var expression = this.expression;
            var simpleExpression = expression ? expression.simplify() : null;
            var special = this._specialSimplify(simpleExpression);
            if (special)
                return special;
            var value = this.valueOf();
            if (simpleExpression) {
                value.expression = simpleExpression;
            }
            value.simple = true;
            return new Action.classMap[this.action](value);
        };
        Action.prototype._removeAction = function () {
            return false;
        };
        Action.prototype._nukeExpression = function (precedingExpression) {
            return null;
        };
        Action.prototype._distributeAction = function () {
            return null;
        };
        Action.prototype._performOnLiteral = function (literalExpression) {
            return null;
        };
        Action.prototype._performOnRef = function (refExpression) {
            return null;
        };
        Action.prototype._foldWithPrevAction = function (prevAction) {
            return null;
        };
        Action.prototype._putBeforeLastAction = function (lastAction) {
            return null;
        };
        Action.prototype._performOnSimpleChain = function (chainExpression) {
            return null;
        };
        Action.prototype.performOnSimple = function (simpleExpression) {
            if (!this.simple)
                return this.simplify().performOnSimple(simpleExpression);
            if (!simpleExpression.simple)
                throw new Error('must get a simple expression');
            if (this._removeAction())
                return simpleExpression;
            var nukedExpression = this._nukeExpression(simpleExpression);
            if (nukedExpression)
                return nukedExpression;
            var distributedActions = this._distributeAction();
            if (distributedActions) {
                for (var _i = 0, distributedActions_1 = distributedActions; _i < distributedActions_1.length; _i++) {
                    var distributedAction = distributedActions_1[_i];
                    simpleExpression = distributedAction.performOnSimple(simpleExpression);
                }
                return simpleExpression;
            }
            if (simpleExpression instanceof Plywood.LiteralExpression) {
                if (this.fullyDefined()) {
                    return new Plywood.LiteralExpression({
                        value: this.getFn(simpleExpression.getFn())(null, null)
                    });
                }
                var special = this._performOnLiteral(simpleExpression);
                if (special)
                    return special;
            }
            else if (simpleExpression instanceof Plywood.RefExpression) {
                var special = this._performOnRef(simpleExpression);
                if (special)
                    return special;
            }
            else if (simpleExpression instanceof Plywood.ChainExpression) {
                var actions = simpleExpression.actions;
                var lastAction = actions[actions.length - 1];
                var foldedAction = this._foldWithPrevAction(lastAction);
                if (foldedAction) {
                    return foldedAction.performOnSimple(simpleExpression.popAction());
                }
                var beforeAction = this._putBeforeLastAction(lastAction);
                if (beforeAction) {
                    return lastAction.performOnSimple(beforeAction.performOnSimple(simpleExpression.popAction()));
                }
                var special = this._performOnSimpleChain(simpleExpression);
                if (special)
                    return special;
            }
            return simpleExpression.performAction(this, true);
        };
        Action.prototype.getExpressions = function () {
            return this.expression ? [this.expression] : [];
        };
        Action.prototype.getFreeReferences = function () {
            var freeReferences = [];
            this.getExpressions().forEach(function (ex) {
                freeReferences = freeReferences.concat(ex.getFreeReferences());
            });
            return Plywood.helper.deduplicateSort(freeReferences);
        };
        Action.prototype._everyHelper = function (iter, thisArg, indexer, depth, nestDiff) {
            var nestDiffNext = nestDiff + Number(this.isNester());
            return this.getExpressions().every(function (ex) { return ex._everyHelper(iter, thisArg, indexer, depth, nestDiffNext); });
        };
        Action.prototype.substitute = function (substitutionFn, thisArg) {
            return this._substituteHelper(substitutionFn, thisArg, { index: 0 }, 0, 0);
        };
        Action.prototype._substituteHelper = function (substitutionFn, thisArg, indexer, depth, nestDiff) {
            var expression = this.expression;
            if (!expression)
                return this;
            var subExpression = expression._substituteHelper(substitutionFn, thisArg, indexer, depth, nestDiff + Number(this.isNester()));
            if (expression === subExpression)
                return this;
            var value = this.valueOf();
            value.simple = false;
            value.expression = subExpression;
            return new (Action.classMap[this.action])(value);
        };
        Action.prototype.canDistribute = function () {
            return false;
        };
        Action.prototype.distribute = function (preEx) {
            return null;
        };
        Action.prototype.changeExpression = function (newExpression) {
            var expression = this.expression;
            if (!expression || expression === newExpression)
                return this;
            var value = this.valueOf();
            value.expression = newExpression;
            return new (Action.classMap[this.action])(value);
        };
        Action.prototype.isNester = function () {
            return false;
        };
        Action.prototype.getLiteralValue = function () {
            var expression = this.expression;
            if (expression instanceof Plywood.LiteralExpression) {
                return expression.value;
            }
            return null;
        };
        Action.prototype.maxPossibleSplitValues = function () {
            return Infinity;
        };
        Action.prototype.needsEnvironment = function () {
            return false;
        };
        Action.prototype.defineEnvironment = function (environment) {
            return this;
        };
        Action.prototype.getTimezone = function () {
            return Plywood.Timezone.UTC;
        };
        Action.prototype.alignsWith = function (actions) {
            return true;
        };
        Action.classMap = {};
        return Action;
    }());
    Plywood.Action = Action;
    checkAction = Action;
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var AbsoluteAction = (function (_super) {
        __extends(AbsoluteAction, _super);
        function AbsoluteAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("absolute");
            this._checkNoExpression();
        }
        AbsoluteAction.fromJS = function (parameters) {
            return new AbsoluteAction(Plywood.Action.jsToValue(parameters));
        };
        AbsoluteAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'NUMBER');
            return 'NUMBER';
        };
        AbsoluteAction.prototype._fillRefSubstitutions = function (typeContext, inputType) {
            return inputType;
        };
        AbsoluteAction.prototype._getFnHelper = function (inputFn) {
            return function (d, c) {
                var inV = inputFn(d, c);
                if (inV === null)
                    return null;
                return Math.abs(inV);
            };
        };
        AbsoluteAction.prototype._foldWithPrevAction = function (prevAction) {
            if (prevAction.equals(this)) {
                return this;
            }
            return null;
        };
        AbsoluteAction.prototype._getJSHelper = function (inputJS) {
            return "Math.abs(" + inputJS + ")";
        };
        AbsoluteAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "ABS(" + inputSQL + ")";
        };
        return AbsoluteAction;
    }(Plywood.Action));
    Plywood.AbsoluteAction = AbsoluteAction;
    Plywood.Action.register(AbsoluteAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var AddAction = (function (_super) {
        __extends(AddAction, _super);
        function AddAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("add");
            this._checkExpressionTypes('NUMBER');
        }
        AddAction.fromJS = function (parameters) {
            return new AddAction(Plywood.Action.jsToValue(parameters));
        };
        AddAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'NUMBER');
            return 'NUMBER';
        };
        AddAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return inputType;
        };
        AddAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            return function (d, c) {
                return (inputFn(d, c) || 0) + (expressionFn(d, c) || 0);
            };
        };
        AddAction.prototype._getJSHelper = function (inputJS, expressionJS) {
            return "(" + inputJS + "+" + expressionJS + ")";
        };
        AddAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "(" + inputSQL + "+" + expressionSQL + ")";
        };
        AddAction.prototype._removeAction = function () {
            return this.expression.equals(Plywood.Expression.ZERO);
        };
        AddAction.prototype._distributeAction = function () {
            return this.expression.actionize(this.action);
        };
        AddAction.prototype._performOnLiteral = function (literalExpression) {
            if (literalExpression.equals(Plywood.Expression.ZERO)) {
                return this.expression;
            }
            return null;
        };
        AddAction.prototype._foldWithPrevAction = function (prevAction) {
            if (prevAction instanceof AddAction) {
                var prevValue = prevAction.expression.getLiteralValue();
                var myValue = this.expression.getLiteralValue();
                if (typeof prevValue === 'number' && typeof myValue === 'number') {
                    return new AddAction({
                        expression: Plywood.r(prevValue + myValue)
                    });
                }
            }
            return null;
        };
        return AddAction;
    }(Plywood.Action));
    Plywood.AddAction = AddAction;
    Plywood.Action.register(AddAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var IS_OR_IN_ACTION = {
        'is': true,
        'in': true
    };
    function mergeAnd(ex1, ex2) {
        if (!ex1.isOp('chain') ||
            !ex2.isOp('chain') ||
            !ex1.expression.isOp('ref') ||
            !ex2.expression.isOp('ref') ||
            !arraysEqual(ex1.getFreeReferences(), ex2.getFreeReferences()))
            return null;
        var ex1Actions = ex1.actions;
        var ex2Actions = ex2.actions;
        if (ex1Actions.length !== 1 || ex2Actions.length !== 1)
            return null;
        var ex1Action = ex1Actions[0];
        var ex2Action = ex2Actions[0];
        if (!IS_OR_IN_ACTION[ex1Action.action] || !IS_OR_IN_ACTION[ex2Action.action])
            return null;
        var firstActionExpression1 = ex1Action.expression;
        var firstActionExpression2 = ex2Action.expression;
        if (!firstActionExpression1 || !firstActionExpression2 || !firstActionExpression1.isOp('literal') || !firstActionExpression2.isOp('literal'))
            return null;
        var intersect = Plywood.Set.generalIntersect(firstActionExpression1.getLiteralValue(), firstActionExpression2.getLiteralValue());
        if (intersect === null)
            return null;
        return Plywood.Expression.inOrIs(ex1.expression, intersect);
    }
    var AndAction = (function (_super) {
        __extends(AndAction, _super);
        function AndAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("and");
        }
        AndAction.fromJS = function (parameters) {
            return new AndAction(Plywood.Action.jsToValue(parameters));
        };
        AndAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'BOOLEAN');
            return 'BOOLEAN';
        };
        AndAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return inputType;
        };
        AndAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            return function (d, c) { return inputFn(d, c) && expressionFn(d, c); };
        };
        AndAction.prototype._getJSHelper = function (inputJS, expressionJS) {
            return "(" + inputJS + "&&" + expressionJS + ")";
        };
        AndAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "(" + inputSQL + " AND " + expressionSQL + ")";
        };
        AndAction.prototype._removeAction = function () {
            return this.expression.equals(Plywood.Expression.TRUE);
        };
        AndAction.prototype._nukeExpression = function () {
            if (this.expression.equals(Plywood.Expression.FALSE))
                return Plywood.Expression.FALSE;
            return null;
        };
        AndAction.prototype._distributeAction = function () {
            return this.expression.actionize(this.action);
        };
        AndAction.prototype._performOnLiteral = function (literalExpression) {
            if (literalExpression.equals(Plywood.Expression.TRUE)) {
                return this.expression;
            }
            if (literalExpression.equals(Plywood.Expression.FALSE)) {
                return Plywood.Expression.FALSE;
            }
            return null;
        };
        AndAction.prototype._performOnSimpleChain = function (chainExpression) {
            var expression = this.expression;
            var andExpressions = chainExpression.getExpressionPattern('and');
            if (andExpressions) {
                for (var i = 0; i < andExpressions.length; i++) {
                    var andExpression = andExpressions[i];
                    var mergedExpression = mergeAnd(andExpression, expression);
                    if (mergedExpression) {
                        andExpressions[i] = mergedExpression;
                        return Plywood.Expression.and(andExpressions).simplify();
                    }
                }
            }
            return mergeAnd(chainExpression, expression);
        };
        return AndAction;
    }(Plywood.Action));
    Plywood.AndAction = AndAction;
    Plywood.Action.register(AndAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var ApplyAction = (function (_super) {
        __extends(ApplyAction, _super);
        function ApplyAction(parameters) {
            if (parameters === void 0) { parameters = {}; }
            _super.call(this, parameters, dummyObject);
            this.name = parameters.name;
            this._ensureAction("apply");
        }
        ApplyAction.fromJS = function (parameters) {
            var value = Plywood.Action.jsToValue(parameters);
            value.name = parameters.name;
            return new ApplyAction(value);
        };
        ApplyAction.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.name = this.name;
            return value;
        };
        ApplyAction.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.name = this.name;
            return js;
        };
        ApplyAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'DATASET');
            return 'DATASET';
        };
        ApplyAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            typeContext.datasetType[this.name] = this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return typeContext;
        };
        ApplyAction.prototype._toStringParameters = function (expressionString) {
            var name = this.name;
            if (!Plywood.RefExpression.SIMPLE_NAME_REGEXP.test(name))
                name = JSON.stringify(name);
            return [name, expressionString];
        };
        ApplyAction.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.name === other.name;
        };
        ApplyAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            var name = this.name;
            var type = this.expression.type;
            return function (d, c) {
                var inV = inputFn(d, c);
                return inV ? inV.apply(name, expressionFn, type, Plywood.foldContext(d, c)) : null;
            };
        };
        ApplyAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return expressionSQL + " AS " + dialect.escapeName(this.name);
        };
        ApplyAction.prototype.isSimpleAggregate = function () {
            var expression = this.expression;
            if (expression instanceof Plywood.ChainExpression) {
                var actions = expression.actions;
                return actions.length === 1 && actions[0].isAggregate();
            }
            return false;
        };
        ApplyAction.prototype.isNester = function () {
            return true;
        };
        ApplyAction.prototype._removeAction = function () {
            var _a = this, name = _a.name, expression = _a.expression;
            if (expression instanceof Plywood.RefExpression) {
                return expression.name === name && expression.nest === 0;
            }
            return false;
        };
        ApplyAction.prototype._putBeforeLastAction = function (lastAction) {
            if (this.isSimpleAggregate() &&
                lastAction instanceof ApplyAction &&
                !lastAction.isSimpleAggregate() &&
                this.expression.getFreeReferences().indexOf(lastAction.name) === -1) {
                return this;
            }
            return null;
        };
        return ApplyAction;
    }(Plywood.Action));
    Plywood.ApplyAction = ApplyAction;
    Plywood.Action.register(ApplyAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var AverageAction = (function (_super) {
        __extends(AverageAction, _super);
        function AverageAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("average");
            this._checkExpressionTypes('NUMBER');
        }
        AverageAction.fromJS = function (parameters) {
            return new AverageAction(Plywood.Action.jsToValue(parameters));
        };
        AverageAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'DATASET');
            return 'NUMBER';
        };
        AverageAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return {
                type: 'NUMBER'
            };
        };
        AverageAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "AVG(" + dialect.aggregateFilterIfNeeded(inputSQL, expressionSQL) + ")";
        };
        AverageAction.prototype.isAggregate = function () {
            return true;
        };
        AverageAction.prototype.isNester = function () {
            return true;
        };
        return AverageAction;
    }(Plywood.Action));
    Plywood.AverageAction = AverageAction;
    Plywood.Action.register(AverageAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var ConcatAction = (function (_super) {
        __extends(ConcatAction, _super);
        function ConcatAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("concat");
            this._checkExpressionTypes('STRING');
        }
        ConcatAction.fromJS = function (parameters) {
            return new ConcatAction(Plywood.Action.jsToValue(parameters));
        };
        ConcatAction.prototype.getOutputType = function (inputType) {
            return this._stringTransformOutputType(inputType);
        };
        ConcatAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return inputType;
        };
        ConcatAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            return function (d, c) {
                var inV = inputFn(d, c);
                if (inV === null)
                    return null;
                var exV = expressionFn(d, c);
                if (exV === null)
                    return null;
                return '' + inV + exV;
            };
        };
        ConcatAction.prototype._getJSHelper = function (inputJS, expressionJS) {
            return Plywood.Expression.jsNullSafety(inputJS, expressionJS, function (a, b) { return a + "+" + b; }, inputJS[0] === '"', expressionJS[0] === '"');
        };
        ConcatAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return dialect.concatExpression(inputSQL, expressionSQL);
        };
        ConcatAction.prototype._removeAction = function () {
            return this.expression.equals(Plywood.Expression.EMPTY_STRING);
        };
        ConcatAction.prototype._performOnLiteral = function (literalExpression) {
            if (literalExpression.equals(Plywood.Expression.EMPTY_STRING)) {
                return this.expression;
            }
            return null;
        };
        ConcatAction.prototype._foldWithPrevAction = function (prevAction) {
            if (prevAction instanceof ConcatAction) {
                var prevValue = prevAction.expression.getLiteralValue();
                var myValue = this.expression.getLiteralValue();
                if (typeof prevValue === 'string' && typeof myValue === 'string') {
                    return new ConcatAction({
                        expression: Plywood.r(prevValue + myValue)
                    });
                }
            }
            return null;
        };
        return ConcatAction;
    }(Plywood.Action));
    Plywood.ConcatAction = ConcatAction;
    Plywood.Action.register(ConcatAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var ContainsAction = (function (_super) {
        __extends(ContainsAction, _super);
        function ContainsAction(parameters) {
            _super.call(this, parameters, dummyObject);
            var compare = parameters.compare;
            if (!compare) {
                compare = ContainsAction.NORMAL;
            }
            else if (compare !== ContainsAction.NORMAL && compare !== ContainsAction.IGNORE_CASE) {
                throw new Error("compare must be '" + ContainsAction.NORMAL + "' or '" + ContainsAction.IGNORE_CASE + "'");
            }
            this.compare = compare;
            this._ensureAction("contains");
            this._checkExpressionTypes('STRING');
        }
        ContainsAction.fromJS = function (parameters) {
            var value = Plywood.Action.jsToValue(parameters);
            value.compare = parameters.compare;
            return new ContainsAction(value);
        };
        ContainsAction.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.compare = this.compare;
            return value;
        };
        ContainsAction.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.compare = this.compare;
            return js;
        };
        ContainsAction.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.compare === other.compare;
        };
        ContainsAction.prototype._toStringParameters = function (expressionString) {
            return [expressionString, this.compare];
        };
        ContainsAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'STRING', 'SET/STRING');
            return 'BOOLEAN';
        };
        ContainsAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return inputType;
        };
        ContainsAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            if (this.compare === ContainsAction.NORMAL) {
                return function (d, c) {
                    return String(inputFn(d, c)).indexOf(expressionFn(d, c)) > -1;
                };
            }
            else {
                return function (d, c) {
                    return String(inputFn(d, c)).toLowerCase().indexOf(String(expressionFn(d, c)).toLowerCase()) > -1;
                };
            }
        };
        ContainsAction.prototype._getJSHelper = function (inputJS, expressionJS) {
            var combine;
            if (this.compare === ContainsAction.NORMAL) {
                combine = function (lhs, rhs) { return ("(''+" + lhs + ").indexOf(" + rhs + ")>-1"); };
            }
            else {
                combine = function (lhs, rhs) { return ("(''+" + lhs + ").toLowerCase().indexOf((''+" + rhs + ").toLowerCase())>-1"); };
            }
            return Plywood.Expression.jsNullSafety(inputJS, expressionJS, combine, inputJS[0] === '"', expressionJS[0] === '"');
        };
        ContainsAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            if (this.compare === ContainsAction.IGNORE_CASE) {
                expressionSQL = "LOWER(" + expressionSQL + ")";
                inputSQL = "LOWER(" + inputSQL + ")";
            }
            return dialect.containsExpression(expressionSQL, inputSQL);
        };
        ContainsAction.NORMAL = 'normal';
        ContainsAction.IGNORE_CASE = 'ignoreCase';
        return ContainsAction;
    }(Plywood.Action));
    Plywood.ContainsAction = ContainsAction;
    Plywood.Action.register(ContainsAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var CountAction = (function (_super) {
        __extends(CountAction, _super);
        function CountAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("count");
            this._checkNoExpression();
        }
        CountAction.fromJS = function (parameters) {
            return new CountAction(Plywood.Action.jsToValue(parameters));
        };
        CountAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'DATASET');
            return 'NUMBER';
        };
        CountAction.prototype._fillRefSubstitutions = function () {
            return {
                type: 'NUMBER'
            };
        };
        CountAction.prototype.getFn = function (inputFn) {
            return function (d, c) {
                var inV = inputFn(d, c);
                return inV ? inV.count() : 0;
            };
        };
        CountAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return inputSQL.indexOf(' WHERE ') === -1 ? "COUNT(*)" : "SUM(" + dialect.aggregateFilterIfNeeded(inputSQL, '1') + ")";
        };
        CountAction.prototype.isAggregate = function () {
            return true;
        };
        return CountAction;
    }(Plywood.Action));
    Plywood.CountAction = CountAction;
    Plywood.Action.register(CountAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var CountDistinctAction = (function (_super) {
        __extends(CountDistinctAction, _super);
        function CountDistinctAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("countDistinct");
        }
        CountDistinctAction.fromJS = function (parameters) {
            return new CountDistinctAction(Plywood.Action.jsToValue(parameters));
        };
        CountDistinctAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'DATASET');
            return 'NUMBER';
        };
        CountDistinctAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return {
                type: 'NUMBER'
            };
        };
        CountDistinctAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "COUNT(DISTINCT " + dialect.aggregateFilterIfNeeded(inputSQL, expressionSQL, 'NULL') + ")";
        };
        CountDistinctAction.prototype.isAggregate = function () {
            return true;
        };
        CountDistinctAction.prototype.isNester = function () {
            return true;
        };
        return CountDistinctAction;
    }(Plywood.Action));
    Plywood.CountDistinctAction = CountDistinctAction;
    Plywood.Action.register(CountDistinctAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var CustomAction = (function (_super) {
        __extends(CustomAction, _super);
        function CustomAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this.custom = parameters.custom;
            this._ensureAction("custom");
        }
        CustomAction.fromJS = function (parameters) {
            var value = Plywood.Action.jsToValue(parameters);
            value.custom = parameters.custom;
            return new CustomAction(value);
        };
        CustomAction.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.custom = this.custom;
            return value;
        };
        CustomAction.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.custom = this.custom;
            return js;
        };
        CustomAction.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.custom === other.custom;
        };
        CustomAction.prototype._toStringParameters = function (expressionString) {
            return [this.custom];
        };
        CustomAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'DATASET');
            return 'NUMBER';
        };
        CustomAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            return {
                type: 'NUMBER'
            };
        };
        CustomAction.prototype.getFn = function (inputFn) {
            throw new Error('can not getFn on custom action');
        };
        CustomAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            throw new Error('custom action not implemented');
        };
        CustomAction.prototype.isAggregate = function () {
            return true;
        };
        return CustomAction;
    }(Plywood.Action));
    Plywood.CustomAction = CustomAction;
    Plywood.Action.register(CustomAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var DivideAction = (function (_super) {
        __extends(DivideAction, _super);
        function DivideAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("divide");
            this._checkExpressionTypes('NUMBER');
        }
        DivideAction.fromJS = function (parameters) {
            return new DivideAction(Plywood.Action.jsToValue(parameters));
        };
        DivideAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'NUMBER');
            return 'NUMBER';
        };
        DivideAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return inputType;
        };
        DivideAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            return function (d, c) {
                var v = (inputFn(d, c) || 0) / (expressionFn(d, c) || 0);
                return isNaN(v) ? null : v;
            };
        };
        DivideAction.prototype._getJSHelper = function (inputJS, expressionJS) {
            return "(" + inputJS + "/" + expressionJS + ")";
        };
        DivideAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "(" + inputSQL + "/" + expressionSQL + ")";
        };
        DivideAction.prototype._removeAction = function () {
            return this.expression.equals(Plywood.Expression.ONE);
        };
        return DivideAction;
    }(Plywood.Action));
    Plywood.DivideAction = DivideAction;
    Plywood.Action.register(DivideAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var ExtractAction = (function (_super) {
        __extends(ExtractAction, _super);
        function ExtractAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this.regexp = parameters.regexp;
            this._ensureAction("extract");
        }
        ExtractAction.fromJS = function (parameters) {
            var value = Plywood.Action.jsToValue(parameters);
            value.regexp = parameters.regexp;
            return new ExtractAction(value);
        };
        ExtractAction.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.regexp = this.regexp;
            return value;
        };
        ExtractAction.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.regexp = this.regexp;
            return js;
        };
        ExtractAction.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.regexp === other.regexp;
        };
        ExtractAction.prototype._toStringParameters = function (expressionString) {
            return [this.regexp];
        };
        ExtractAction.prototype.getOutputType = function (inputType) {
            return this._stringTransformOutputType(inputType);
        };
        ExtractAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            return inputType;
        };
        ExtractAction.prototype._getFnHelper = function (inputFn) {
            var re = new RegExp(this.regexp);
            return function (d, c) {
                return (String(inputFn(d, c)).match(re) || [])[1] || null;
            };
        };
        ExtractAction.prototype._getJSHelper = function (inputJS, expressionJS) {
            return "((''+" + inputJS + ").match(/" + this.regexp + "/) || [])[1] || null";
        };
        ExtractAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return dialect.extractExpression(inputSQL, this.regexp);
        };
        return ExtractAction;
    }(Plywood.Action));
    Plywood.ExtractAction = ExtractAction;
    Plywood.Action.register(ExtractAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var FallbackAction = (function (_super) {
        __extends(FallbackAction, _super);
        function FallbackAction(parameters) {
            if (parameters === void 0) { parameters = {}; }
            _super.call(this, parameters, dummyObject);
            this._ensureAction("fallback");
        }
        FallbackAction.fromJS = function (parameters) {
            return new FallbackAction(Plywood.Action.jsToValue(parameters));
        };
        FallbackAction.prototype.getOutputType = function (inputType) {
            var expressionType = this.expression.type;
            if (expressionType && expressionType !== 'NULL')
                this._checkInputTypes(inputType, expressionType);
            return expressionType;
        };
        FallbackAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return inputType;
        };
        FallbackAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            return function (d, c) {
                var val = inputFn(d, c);
                if (val === null) {
                    return expressionFn(d, c);
                }
                return val;
            };
        };
        FallbackAction.prototype._getJSHelper = function (inputJS, expressionJS) {
            return "(_ = " + inputJS + ", (_ === null ? " + expressionJS + " : _))";
        };
        FallbackAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "COALESCE(" + inputSQL + ", " + expressionSQL + ")";
        };
        FallbackAction.prototype._removeAction = function () {
            return this.expression.equals(Plywood.Expression.NULL);
        };
        return FallbackAction;
    }(Plywood.Action));
    Plywood.FallbackAction = FallbackAction;
    Plywood.Action.register(FallbackAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var FilterAction = (function (_super) {
        __extends(FilterAction, _super);
        function FilterAction(parameters) {
            if (parameters === void 0) { parameters = {}; }
            _super.call(this, parameters, dummyObject);
            this._ensureAction("filter");
            this._checkExpressionTypes('BOOLEAN');
        }
        FilterAction.fromJS = function (parameters) {
            return new FilterAction({
                action: parameters.action,
                name: parameters.name,
                expression: Plywood.Expression.fromJS(parameters.expression)
            });
        };
        FilterAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'DATASET');
            return 'DATASET';
        };
        FilterAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return inputType;
        };
        FilterAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return inputSQL + " WHERE " + expressionSQL;
        };
        FilterAction.prototype.isNester = function () {
            return true;
        };
        FilterAction.prototype._foldWithPrevAction = function (prevAction) {
            if (prevAction instanceof FilterAction) {
                return new FilterAction({
                    expression: prevAction.expression.and(this.expression)
                });
            }
            return null;
        };
        FilterAction.prototype._putBeforeLastAction = function (lastAction) {
            if (lastAction instanceof Plywood.ApplyAction) {
                var freeReferences = this.getFreeReferences();
                return freeReferences.indexOf(lastAction.name) === -1 ? this : null;
            }
            if (lastAction instanceof Plywood.SplitAction) {
                var splits = lastAction.splits;
                return new FilterAction({
                    expression: this.expression.substitute(function (ex) {
                        if (ex instanceof Plywood.RefExpression && splits[ex.name])
                            return splits[ex.name];
                        return null;
                    })
                });
            }
            if (lastAction instanceof Plywood.SortAction) {
                return this;
            }
            return null;
        };
        return FilterAction;
    }(Plywood.Action));
    Plywood.FilterAction = FilterAction;
    Plywood.Action.register(FilterAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var GreaterThanAction = (function (_super) {
        __extends(GreaterThanAction, _super);
        function GreaterThanAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("greaterThan");
            this._checkExpressionTypes('NUMBER', 'TIME');
        }
        GreaterThanAction.fromJS = function (parameters) {
            return new GreaterThanAction(Plywood.Action.jsToValue(parameters));
        };
        GreaterThanAction.prototype.getOutputType = function (inputType) {
            var expressionType = this.expression.type;
            if (expressionType)
                this._checkInputTypes(inputType, expressionType);
            return 'BOOLEAN';
        };
        GreaterThanAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return {
                type: 'BOOLEAN'
            };
        };
        GreaterThanAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            return function (d, c) {
                return inputFn(d, c) > expressionFn(d, c);
            };
        };
        GreaterThanAction.prototype._getJSHelper = function (inputJS, expressionJS) {
            return "(" + inputJS + ">" + expressionJS + ")";
        };
        GreaterThanAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "(" + inputSQL + ">" + expressionSQL + ")";
        };
        GreaterThanAction.prototype._specialSimplify = function (simpleExpression) {
            var expression = this.expression;
            if (expression instanceof Plywood.LiteralExpression) {
                return new Plywood.InAction({
                    expression: new Plywood.LiteralExpression({
                        value: Plywood.Range.fromJS({ start: expression.value, end: null, bounds: '()' })
                    })
                });
            }
            return null;
        };
        GreaterThanAction.prototype._performOnLiteral = function (literalExpression) {
            return (new Plywood.InAction({
                expression: new Plywood.LiteralExpression({
                    value: Plywood.Range.fromJS({ start: null, end: literalExpression.value, bounds: '()' })
                })
            })).performOnSimple(this.expression);
        };
        return GreaterThanAction;
    }(Plywood.Action));
    Plywood.GreaterThanAction = GreaterThanAction;
    Plywood.Action.register(GreaterThanAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var GreaterThanOrEqualAction = (function (_super) {
        __extends(GreaterThanOrEqualAction, _super);
        function GreaterThanOrEqualAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("greaterThanOrEqual");
            this._checkExpressionTypes('NUMBER', 'TIME');
        }
        GreaterThanOrEqualAction.fromJS = function (parameters) {
            return new GreaterThanOrEqualAction(Plywood.Action.jsToValue(parameters));
        };
        GreaterThanOrEqualAction.prototype.getOutputType = function (inputType) {
            var expressionType = this.expression.type;
            if (expressionType)
                this._checkInputTypes(inputType, expressionType);
            return 'BOOLEAN';
        };
        GreaterThanOrEqualAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return {
                type: 'BOOLEAN'
            };
        };
        GreaterThanOrEqualAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            return function (d, c) {
                return inputFn(d, c) >= expressionFn(d, c);
            };
        };
        GreaterThanOrEqualAction.prototype._getJSHelper = function (inputJS, expressionJS) {
            return "(" + inputJS + ">=" + expressionJS + ")";
        };
        GreaterThanOrEqualAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "(" + inputSQL + ">=" + expressionSQL + ")";
        };
        GreaterThanOrEqualAction.prototype._specialSimplify = function (simpleExpression) {
            var expression = this.expression;
            if (expression instanceof Plywood.LiteralExpression) {
                return new Plywood.InAction({
                    expression: new Plywood.LiteralExpression({
                        value: Plywood.Range.fromJS({ start: expression.value, end: null, bounds: '[)' })
                    })
                });
            }
            return null;
        };
        GreaterThanOrEqualAction.prototype._performOnLiteral = function (literalExpression) {
            return (new Plywood.InAction({
                expression: new Plywood.LiteralExpression({
                    value: Plywood.Range.fromJS({ start: null, end: literalExpression.value, bounds: '(]' })
                })
            })).performOnSimple(this.expression);
        };
        return GreaterThanOrEqualAction;
    }(Plywood.Action));
    Plywood.GreaterThanOrEqualAction = GreaterThanOrEqualAction;
    Plywood.Action.register(GreaterThanOrEqualAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var InAction = (function (_super) {
        __extends(InAction, _super);
        function InAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("in");
        }
        InAction.fromJS = function (parameters) {
            return new InAction(Plywood.Action.jsToValue(parameters));
        };
        InAction.prototype.getOutputType = function (inputType) {
            var expression = this.expression;
            if (inputType) {
                if (!((!Plywood.isSetType(inputType) && expression.canHaveType('SET')) ||
                    (inputType === 'NUMBER' && expression.canHaveType('NUMBER_RANGE')) ||
                    (inputType === 'TIME' && expression.canHaveType('TIME_RANGE')))) {
                    throw new TypeError("in action has a bad type combination " + inputType + " IN " + (expression.type || '*'));
                }
            }
            else {
                if (!(expression.canHaveType('NUMBER_RANGE') || expression.canHaveType('TIME_RANGE') || expression.canHaveType('SET'))) {
                    throw new TypeError("in action has invalid expression type " + expression.type);
                }
            }
            return 'BOOLEAN';
        };
        InAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return {
                type: 'BOOLEAN'
            };
        };
        InAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            return function (d, c) {
                var inV = inputFn(d, c);
                var exV = expressionFn(d, c);
                if (!exV)
                    return null;
                return exV.contains(inV);
            };
        };
        InAction.prototype._getJSHelper = function (inputJS, expressionJS) {
            var expression = this.expression;
            if (expression instanceof Plywood.LiteralExpression) {
                switch (expression.type) {
                    case 'NUMBER_RANGE':
                    case 'TIME_RANGE':
                        var range = expression.value;
                        var r0 = range.start;
                        var r1 = range.end;
                        var bounds = range.bounds;
                        var cmpStrings = [];
                        if (r0 != null) {
                            cmpStrings.push(JSON.stringify(r0) + " " + (bounds[0] === '(' ? '<' : '<=') + " _");
                        }
                        if (r1 != null) {
                            cmpStrings.push("_ " + (bounds[1] === ')' ? '<' : '<=') + " " + JSON.stringify(r1));
                        }
                        return "(_=" + inputJS + ", " + cmpStrings.join(' && ') + ")";
                    case 'SET/STRING':
                        var valueSet = expression.value;
                        return JSON.stringify(valueSet.elements) + ".indexOf(" + inputJS + ")>-1";
                    default:
                        throw new Error("can not convert " + this + " to JS function, unsupported type " + expression.type);
                }
            }
            throw new Error("can not convert " + this + " to JS function");
        };
        InAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            var expression = this.expression;
            var expressionType = expression.type;
            switch (expressionType) {
                case 'NUMBER_RANGE':
                case 'TIME_RANGE':
                    if (expression instanceof Plywood.LiteralExpression) {
                        var range = expression.value;
                        return dialect.inExpression(inputSQL, dialect.numberOrTimeToSQL(range.start), dialect.numberOrTimeToSQL(range.end), range.bounds);
                    }
                    throw new Error("can not convert action to SQL " + this);
                case 'SET/STRING':
                case 'SET/NUMBER':
                    return inputSQL + " IN " + expressionSQL;
                case 'SET/NUMBER_RANGE':
                case 'SET/TIME_RANGE':
                    if (expression instanceof Plywood.LiteralExpression) {
                        var setOfRange = expression.value;
                        return setOfRange.elements.map(function (range) {
                            return dialect.inExpression(inputSQL, dialect.numberOrTimeToSQL(range.start), dialect.numberOrTimeToSQL(range.end), range.bounds);
                        }).join(' OR ');
                    }
                    throw new Error("can not convert action to SQL " + this);
                default:
                    throw new Error("can not convert action to SQL " + this);
            }
        };
        InAction.prototype._nukeExpression = function () {
            var expression = this.expression;
            if (expression instanceof Plywood.LiteralExpression &&
                Plywood.isSetType(expression.type) &&
                expression.value.empty())
                return Plywood.Expression.FALSE;
            return null;
        };
        InAction.prototype._performOnSimpleWhatever = function (ex) {
            var expression = this.expression;
            var setValue = expression.getLiteralValue();
            if (setValue && 'SET/' + ex.type === expression.type && setValue.size() === 1) {
                return new Plywood.IsAction({ expression: Plywood.r(setValue.elements[0]) }).performOnSimple(ex);
            }
            return null;
        };
        InAction.prototype._performOnLiteral = function (literalExpression) {
            return this._performOnSimpleWhatever(literalExpression);
        };
        InAction.prototype._performOnRef = function (refExpression) {
            return this._performOnSimpleWhatever(refExpression);
        };
        InAction.prototype._performOnSimpleChain = function (chainExpression) {
            return this._performOnSimpleWhatever(chainExpression);
        };
        return InAction;
    }(Plywood.Action));
    Plywood.InAction = InAction;
    Plywood.Action.register(InAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var IsAction = (function (_super) {
        __extends(IsAction, _super);
        function IsAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("is");
        }
        IsAction.fromJS = function (parameters) {
            return new IsAction(Plywood.Action.jsToValue(parameters));
        };
        IsAction.prototype.getOutputType = function (inputType) {
            var expressionType = this.expression.type;
            if (expressionType && expressionType !== 'NULL')
                this._checkInputTypes(inputType, expressionType);
            return 'BOOLEAN';
        };
        IsAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return {
                type: 'BOOLEAN'
            };
        };
        IsAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            return function (d, c) {
                return inputFn(d, c) === expressionFn(d, c);
            };
        };
        IsAction.prototype._getJSHelper = function (inputJS, expressionJS) {
            return "(" + inputJS + "===" + expressionJS + ")";
        };
        IsAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return dialect.isNotDistinctFromExpression(inputSQL, expressionSQL);
        };
        IsAction.prototype._nukeExpression = function (precedingExpression) {
            var prevAction = precedingExpression.lastAction();
            var literalValue = this.getLiteralValue();
            if (prevAction instanceof Plywood.TimeBucketAction && literalValue instanceof Plywood.TimeRange && prevAction.timezone) {
                if (literalValue.start !== null && Plywood.TimeRange.timeBucket(literalValue.start, prevAction.duration, prevAction.timezone).equals(literalValue))
                    return null;
                return Plywood.Expression.FALSE;
            }
            if (prevAction instanceof Plywood.NumberBucketAction && literalValue instanceof Plywood.NumberRange) {
                if (literalValue.start !== null && Plywood.NumberRange.numberBucket(literalValue.start, prevAction.size, prevAction.offset).equals(literalValue))
                    return null;
                return Plywood.Expression.FALSE;
            }
            return null;
        };
        IsAction.prototype._foldWithPrevAction = function (prevAction) {
            var literalValue = this.getLiteralValue();
            if (prevAction instanceof Plywood.TimeBucketAction && literalValue instanceof Plywood.TimeRange && prevAction.timezone) {
                if (!(literalValue.start !== null && Plywood.TimeRange.timeBucket(literalValue.start, prevAction.duration, prevAction.timezone).equals(literalValue)))
                    return null;
                return new Plywood.InAction({ expression: this.expression });
            }
            if (prevAction instanceof Plywood.NumberBucketAction && literalValue instanceof Plywood.NumberRange) {
                if (!(literalValue.start !== null && Plywood.NumberRange.numberBucket(literalValue.start, prevAction.size, prevAction.offset).equals(literalValue)))
                    return null;
                return new Plywood.InAction({ expression: this.expression });
            }
            if (prevAction instanceof Plywood.FallbackAction && prevAction.expression.isOp('literal') && this.expression.isOp('literal') && !prevAction.expression.equals(this.expression)) {
                return this;
            }
            return null;
        };
        IsAction.prototype._performOnLiteral = function (literalExpression) {
            var expression = this.expression;
            if (!expression.isOp('literal')) {
                return new IsAction({ expression: literalExpression }).performOnSimple(expression);
            }
            return null;
        };
        IsAction.prototype._performOnRef = function (refExpression) {
            if (this.expression.equals(refExpression)) {
                return Plywood.Expression.TRUE;
            }
            return null;
        };
        IsAction.prototype._performOnSimpleChain = function (chainExpression) {
            if (this.expression.equals(chainExpression)) {
                return Plywood.Expression.TRUE;
            }
            return null;
        };
        return IsAction;
    }(Plywood.Action));
    Plywood.IsAction = IsAction;
    Plywood.Action.register(IsAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var JoinAction = (function (_super) {
        __extends(JoinAction, _super);
        function JoinAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("join");
            if (!this.expression.canHaveType('DATASET'))
                throw new TypeError('expression must be a DATASET');
        }
        JoinAction.fromJS = function (parameters) {
            return new JoinAction(Plywood.Action.jsToValue(parameters));
        };
        JoinAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'DATASET');
            return 'DATASET';
        };
        JoinAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            var typeContextParent = typeContext.parent;
            var expressionFullType = this.expression._fillRefSubstitutions(typeContextParent, indexer, alterations);
            var inputDatasetType = typeContext.datasetType;
            var expressionDatasetType = expressionFullType.datasetType;
            var newDatasetType = Object.create(null);
            for (var k in inputDatasetType) {
                newDatasetType[k] = inputDatasetType[k];
            }
            for (var k in expressionDatasetType) {
                var ft = expressionDatasetType[k];
                if (hasOwnProperty(newDatasetType, k)) {
                    if (newDatasetType[k].type !== ft.type) {
                        throw new Error("incompatible types of joins on " + k + " between " + newDatasetType[k].type + " and " + ft.type);
                    }
                }
                else {
                    newDatasetType[k] = ft;
                }
            }
            return {
                parent: typeContextParent,
                type: 'DATASET',
                datasetType: newDatasetType,
                remote: typeContext.remote || expressionFullType.remote
            };
        };
        JoinAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            return function (d, c) {
                var inV = inputFn(d, c);
                return inV ? inV.join(expressionFn(d, c)) : inV;
            };
        };
        JoinAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            throw new Error('not possible');
        };
        return JoinAction;
    }(Plywood.Action));
    Plywood.JoinAction = JoinAction;
    Plywood.Action.register(JoinAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var LessThanAction = (function (_super) {
        __extends(LessThanAction, _super);
        function LessThanAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("lessThan");
            this._checkExpressionTypes('NUMBER', 'TIME');
        }
        LessThanAction.fromJS = function (parameters) {
            return new LessThanAction(Plywood.Action.jsToValue(parameters));
        };
        LessThanAction.prototype.getOutputType = function (inputType) {
            var expressionType = this.expression.type;
            if (expressionType)
                this._checkInputTypes(inputType, expressionType);
            return 'BOOLEAN';
        };
        LessThanAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return {
                type: 'BOOLEAN'
            };
        };
        LessThanAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            return function (d, c) {
                return inputFn(d, c) < expressionFn(d, c);
            };
        };
        LessThanAction.prototype._getJSHelper = function (inputJS, expressionJS) {
            return "(" + inputJS + "<" + expressionJS + ")";
        };
        LessThanAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "(" + inputSQL + "<" + expressionSQL + ")";
        };
        LessThanAction.prototype._specialSimplify = function (simpleExpression) {
            var expression = this.expression;
            if (expression instanceof Plywood.LiteralExpression) {
                return new Plywood.InAction({
                    expression: new Plywood.LiteralExpression({
                        value: Plywood.Range.fromJS({ start: null, end: expression.value, bounds: '()' })
                    })
                });
            }
            return null;
        };
        LessThanAction.prototype._performOnLiteral = function (literalExpression) {
            return (new Plywood.InAction({
                expression: new Plywood.LiteralExpression({
                    value: Plywood.Range.fromJS({ start: literalExpression.value, end: null, bounds: '()' })
                })
            })).performOnSimple(this.expression);
        };
        return LessThanAction;
    }(Plywood.Action));
    Plywood.LessThanAction = LessThanAction;
    Plywood.Action.register(LessThanAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var LessThanOrEqualAction = (function (_super) {
        __extends(LessThanOrEqualAction, _super);
        function LessThanOrEqualAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("lessThanOrEqual");
            this._checkExpressionTypes('NUMBER', 'TIME');
        }
        LessThanOrEqualAction.fromJS = function (parameters) {
            return new LessThanOrEqualAction(Plywood.Action.jsToValue(parameters));
        };
        LessThanOrEqualAction.prototype.getOutputType = function (inputType) {
            var expressionType = this.expression.type;
            if (expressionType)
                this._checkInputTypes(inputType, expressionType);
            return 'BOOLEAN';
        };
        LessThanOrEqualAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return {
                type: 'BOOLEAN'
            };
        };
        LessThanOrEqualAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            return function (d, c) {
                return inputFn(d, c) <= expressionFn(d, c);
            };
        };
        LessThanOrEqualAction.prototype._getJSHelper = function (inputJS, expressionJS) {
            return "(" + inputJS + "<=" + expressionJS + ")";
        };
        LessThanOrEqualAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "(" + inputSQL + "<=" + expressionSQL + ")";
        };
        LessThanOrEqualAction.prototype._specialSimplify = function (simpleExpression) {
            var expression = this.expression;
            if (expression instanceof Plywood.LiteralExpression) {
                return new Plywood.InAction({
                    expression: new Plywood.LiteralExpression({
                        value: Plywood.Range.fromJS({ start: null, end: expression.value, bounds: '(]' })
                    })
                });
            }
            return null;
        };
        LessThanOrEqualAction.prototype._performOnLiteral = function (literalExpression) {
            return (new Plywood.InAction({
                expression: new Plywood.LiteralExpression({
                    value: Plywood.Range.fromJS({ start: literalExpression.value, end: null, bounds: '[)' })
                })
            })).performOnSimple(this.expression);
        };
        return LessThanOrEqualAction;
    }(Plywood.Action));
    Plywood.LessThanOrEqualAction = LessThanOrEqualAction;
    Plywood.Action.register(LessThanOrEqualAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var LookupAction = (function (_super) {
        __extends(LookupAction, _super);
        function LookupAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this.lookup = parameters.lookup;
            this._ensureAction("lookup");
        }
        LookupAction.fromJS = function (parameters) {
            var value = Plywood.Action.jsToValue(parameters);
            value.lookup = parameters.lookup;
            return new LookupAction(value);
        };
        LookupAction.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.lookup = this.lookup;
            return value;
        };
        LookupAction.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.lookup = this.lookup;
            return js;
        };
        LookupAction.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.lookup === other.lookup;
        };
        LookupAction.prototype._toStringParameters = function (expressionString) {
            return [String(this.lookup)];
        };
        LookupAction.prototype.getOutputType = function (inputType) {
            return this._stringTransformOutputType(inputType);
        };
        LookupAction.prototype._fillRefSubstitutions = function (typeContext, inputType) {
            return inputType;
        };
        LookupAction.prototype.fullyDefined = function () {
            return false;
        };
        LookupAction.prototype._getFnHelper = function (inputFn) {
            throw new Error('can not express as JS');
        };
        LookupAction.prototype._getJSHelper = function (inputJS) {
            throw new Error('can not express as JS');
        };
        LookupAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            throw new Error('can not express as SQL');
        };
        return LookupAction;
    }(Plywood.Action));
    Plywood.LookupAction = LookupAction;
    Plywood.Action.register(LookupAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var LimitAction = (function (_super) {
        __extends(LimitAction, _super);
        function LimitAction(parameters) {
            if (parameters === void 0) { parameters = {}; }
            _super.call(this, parameters, dummyObject);
            this.limit = parameters.limit;
            this._ensureAction("limit");
        }
        LimitAction.fromJS = function (parameters) {
            return new LimitAction({
                action: parameters.action,
                limit: parameters.limit
            });
        };
        LimitAction.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.limit = this.limit;
            return value;
        };
        LimitAction.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.limit = this.limit;
            return js;
        };
        LimitAction.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.limit === other.limit;
        };
        LimitAction.prototype._toStringParameters = function (expressionString) {
            return [String(this.limit)];
        };
        LimitAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'DATASET');
            return 'DATASET';
        };
        LimitAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            return inputType;
        };
        LimitAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            var limit = this.limit;
            return function (d, c) {
                var inV = inputFn(d, c);
                return inV ? inV.limit(limit) : null;
            };
        };
        LimitAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "LIMIT " + this.limit;
        };
        LimitAction.prototype._foldWithPrevAction = function (prevAction) {
            if (prevAction instanceof LimitAction) {
                return new LimitAction({
                    limit: Math.min(prevAction.limit, this.limit)
                });
            }
            return null;
        };
        LimitAction.prototype._putBeforeLastAction = function (lastAction) {
            if (lastAction instanceof Plywood.ApplyAction) {
                return this;
            }
            return null;
        };
        return LimitAction;
    }(Plywood.Action));
    Plywood.LimitAction = LimitAction;
    Plywood.Action.register(LimitAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var REGEXP_SPECIAL = "\\^$.|?*+()[{";
    var MatchAction = (function (_super) {
        __extends(MatchAction, _super);
        function MatchAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this.regexp = parameters.regexp;
            this._ensureAction("match");
        }
        MatchAction.likeToRegExp = function (like, escapeChar) {
            if (escapeChar === void 0) { escapeChar = '\\'; }
            var regExp = ['^'];
            for (var i = 0; i < like.length; i++) {
                var char = like[i];
                if (char === escapeChar) {
                    var nextChar = like[i + 1];
                    if (!nextChar)
                        throw new Error("invalid LIKE string '" + like + "'");
                    char = nextChar;
                    i++;
                }
                else if (char === '%') {
                    regExp.push('.*');
                    continue;
                }
                else if (char === '_') {
                    regExp.push('.');
                    continue;
                }
                if (REGEXP_SPECIAL.indexOf(char) !== -1) {
                    regExp.push('\\');
                }
                regExp.push(char);
            }
            regExp.push('$');
            return regExp.join('');
        };
        MatchAction.fromJS = function (parameters) {
            var value = Plywood.Action.jsToValue(parameters);
            value.regexp = parameters.regexp;
            return new MatchAction(value);
        };
        MatchAction.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.regexp = this.regexp;
            return value;
        };
        MatchAction.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.regexp = this.regexp;
            return js;
        };
        MatchAction.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.regexp === other.regexp;
        };
        MatchAction.prototype._toStringParameters = function (expressionString) {
            return [this.regexp];
        };
        MatchAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'STRING', 'SET/STRING');
            return 'BOOLEAN';
        };
        MatchAction.prototype._fillRefSubstitutions = function () {
            return {
                type: 'BOOLEAN'
            };
        };
        MatchAction.prototype._getFnHelper = function (inputFn) {
            var re = new RegExp(this.regexp);
            return function (d, c) {
                var inV = inputFn(d, c);
                if (!inV)
                    return null;
                if (inV === null)
                    return null;
                return re.test(inV);
            };
        };
        MatchAction.prototype._getJSHelper = function (inputJS, expressionJS) {
            return "/" + this.regexp + "/.test(" + inputJS + ")";
        };
        MatchAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return dialect.regexpExpression(inputSQL, this.regexp);
        };
        return MatchAction;
    }(Plywood.Action));
    Plywood.MatchAction = MatchAction;
    Plywood.Action.register(MatchAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var MaxAction = (function (_super) {
        __extends(MaxAction, _super);
        function MaxAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("max");
            this._checkExpressionTypes('NUMBER', 'TIME');
        }
        MaxAction.fromJS = function (parameters) {
            return new MaxAction(Plywood.Action.jsToValue(parameters));
        };
        MaxAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'DATASET');
            return 'NUMBER';
        };
        MaxAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return {
                type: 'NUMBER'
            };
        };
        MaxAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "MAX(" + dialect.aggregateFilterIfNeeded(inputSQL, expressionSQL) + ")";
        };
        MaxAction.prototype.isAggregate = function () {
            return true;
        };
        MaxAction.prototype.isNester = function () {
            return true;
        };
        return MaxAction;
    }(Plywood.Action));
    Plywood.MaxAction = MaxAction;
    Plywood.Action.register(MaxAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var MinAction = (function (_super) {
        __extends(MinAction, _super);
        function MinAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("min");
            this._checkExpressionTypes('NUMBER', 'TIME');
        }
        MinAction.fromJS = function (parameters) {
            return new MinAction(Plywood.Action.jsToValue(parameters));
        };
        MinAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'DATASET');
            return 'NUMBER';
        };
        MinAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return {
                type: 'NUMBER'
            };
        };
        MinAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "MIN(" + dialect.aggregateFilterIfNeeded(inputSQL, expressionSQL) + ")";
        };
        MinAction.prototype.isAggregate = function () {
            return true;
        };
        MinAction.prototype.isNester = function () {
            return true;
        };
        return MinAction;
    }(Plywood.Action));
    Plywood.MinAction = MinAction;
    Plywood.Action.register(MinAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var MultiplyAction = (function (_super) {
        __extends(MultiplyAction, _super);
        function MultiplyAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("multiply");
            this._checkExpressionTypes('NUMBER');
        }
        MultiplyAction.fromJS = function (parameters) {
            return new MultiplyAction(Plywood.Action.jsToValue(parameters));
        };
        MultiplyAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'NUMBER');
            return 'NUMBER';
        };
        MultiplyAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return inputType;
        };
        MultiplyAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            return function (d, c) {
                return (inputFn(d, c) || 0) * (expressionFn(d, c) || 0);
            };
        };
        MultiplyAction.prototype._getJSHelper = function (inputJS, expressionJS) {
            return "(" + inputJS + "*" + expressionJS + ")";
        };
        MultiplyAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "(" + inputSQL + "*" + expressionSQL + ")";
        };
        MultiplyAction.prototype._removeAction = function () {
            return this.expression.equals(Plywood.Expression.ONE);
        };
        MultiplyAction.prototype._nukeExpression = function () {
            if (this.expression.equals(Plywood.Expression.ZERO))
                return Plywood.Expression.ZERO;
            return null;
        };
        MultiplyAction.prototype._distributeAction = function () {
            return this.expression.actionize(this.action);
        };
        MultiplyAction.prototype._performOnLiteral = function (literalExpression) {
            if (literalExpression.equals(Plywood.Expression.ONE)) {
                return this.expression;
            }
            else if (literalExpression.equals(Plywood.Expression.ZERO)) {
                return Plywood.Expression.ZERO;
            }
            return null;
        };
        return MultiplyAction;
    }(Plywood.Action));
    Plywood.MultiplyAction = MultiplyAction;
    Plywood.Action.register(MultiplyAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var NotAction = (function (_super) {
        __extends(NotAction, _super);
        function NotAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("not");
            this._checkNoExpression();
        }
        NotAction.fromJS = function (parameters) {
            return new NotAction(Plywood.Action.jsToValue(parameters));
        };
        NotAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'BOOLEAN');
            return 'BOOLEAN';
        };
        NotAction.prototype._fillRefSubstitutions = function (typeContext, inputType) {
            return inputType;
        };
        NotAction.prototype._getFnHelper = function (inputFn) {
            return function (d, c) {
                return !inputFn(d, c);
            };
        };
        NotAction.prototype._getJSHelper = function (inputJS) {
            return "!(" + inputJS + ")";
        };
        NotAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "NOT(" + inputSQL + ")";
        };
        NotAction.prototype._foldWithPrevAction = function (prevAction) {
            if (prevAction instanceof NotAction) {
                return new Plywood.AndAction({ expression: Plywood.Expression.TRUE });
            }
            return null;
        };
        return NotAction;
    }(Plywood.Action));
    Plywood.NotAction = NotAction;
    Plywood.Action.register(NotAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var NumberBucketAction = (function (_super) {
        __extends(NumberBucketAction, _super);
        function NumberBucketAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this.size = parameters.size;
            this.offset = parameters.offset;
            this._ensureAction("numberBucket");
        }
        NumberBucketAction.fromJS = function (parameters) {
            var value = Plywood.Action.jsToValue(parameters);
            value.size = parameters.size;
            value.offset = hasOwnProperty(parameters, 'offset') ? parameters.offset : 0;
            return new NumberBucketAction(value);
        };
        NumberBucketAction.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.size = this.size;
            value.offset = this.offset;
            return value;
        };
        NumberBucketAction.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.size = this.size;
            if (this.offset)
                js.offset = this.offset;
            return js;
        };
        NumberBucketAction.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.size === other.size &&
                this.offset === other.offset;
        };
        NumberBucketAction.prototype._toStringParameters = function (expressionString) {
            var params = [String(this.size)];
            if (this.offset)
                params.push(String(this.offset));
            return params;
        };
        NumberBucketAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'NUMBER', 'NUMBER_RANGE');
            return 'NUMBER_RANGE';
        };
        NumberBucketAction.prototype._fillRefSubstitutions = function () {
            return {
                type: 'NUMBER_RANGE'
            };
        };
        NumberBucketAction.prototype._getFnHelper = function (inputFn) {
            var size = this.size;
            var offset = this.offset;
            return function (d, c) {
                var num = inputFn(d, c);
                if (num === null)
                    return null;
                return Plywood.NumberRange.numberBucket(num, size, offset);
            };
        };
        NumberBucketAction.prototype._getJSHelper = function (inputJS) {
            return Plywood.continuousFloorExpression(inputJS, "Math.floor", this.size, this.offset);
        };
        NumberBucketAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return Plywood.continuousFloorExpression(inputSQL, "FLOOR", this.size, this.offset);
        };
        return NumberBucketAction;
    }(Plywood.Action));
    Plywood.NumberBucketAction = NumberBucketAction;
    Plywood.Action.register(NumberBucketAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    function mergeOr(ex1, ex2) {
        if (!ex1.isOp('chain') ||
            !ex2.isOp('chain') ||
            !ex1.expression.isOp('ref') ||
            !ex2.expression.isOp('ref') ||
            !arraysEqual(ex1.getFreeReferences(), ex2.getFreeReferences()))
            return null;
        var ex1Actions = ex1.actions;
        var ex2Actions = ex2.actions;
        if (ex1Actions.length !== 1 || ex2Actions.length !== 1)
            return null;
        var firstActionExpression1 = ex1Actions[0].expression;
        var firstActionExpression2 = ex2Actions[0].expression;
        if (!firstActionExpression1.isOp('literal') || !firstActionExpression2.isOp('literal'))
            return null;
        var intersect = Plywood.Set.generalUnion(firstActionExpression1.getLiteralValue(), firstActionExpression2.getLiteralValue());
        if (intersect === null)
            return null;
        return Plywood.Expression.inOrIs(ex1.expression, intersect);
    }
    var OrAction = (function (_super) {
        __extends(OrAction, _super);
        function OrAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("or");
        }
        OrAction.fromJS = function (parameters) {
            return new OrAction(Plywood.Action.jsToValue(parameters));
        };
        OrAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'BOOLEAN');
            return 'BOOLEAN';
        };
        OrAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return inputType;
        };
        OrAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            return function (d, c) {
                return inputFn(d, c) || expressionFn(d, c);
            };
        };
        OrAction.prototype._getJSHelper = function (inputJS, expressionJS) {
            return "(" + inputJS + "||" + expressionJS + ")";
        };
        OrAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "(" + inputSQL + " OR " + expressionSQL + ")";
        };
        OrAction.prototype._removeAction = function () {
            return this.expression.equals(Plywood.Expression.FALSE);
        };
        OrAction.prototype._nukeExpression = function () {
            if (this.expression.equals(Plywood.Expression.TRUE))
                return Plywood.Expression.TRUE;
            return null;
        };
        OrAction.prototype._distributeAction = function () {
            return this.expression.actionize(this.action);
        };
        OrAction.prototype._performOnLiteral = function (literalExpression) {
            if (literalExpression.equals(Plywood.Expression.FALSE)) {
                return this.expression;
            }
            if (literalExpression.equals(Plywood.Expression.TRUE)) {
                return Plywood.Expression.TRUE;
            }
            return null;
        };
        OrAction.prototype._performOnSimpleChain = function (chainExpression) {
            var expression = this.expression;
            var orExpressions = chainExpression.getExpressionPattern('or');
            if (orExpressions) {
                for (var i = 0; i < orExpressions.length; i++) {
                    var orExpression = orExpressions[i];
                    var mergedExpression = mergeOr(orExpression, expression);
                    if (mergedExpression) {
                        orExpressions[i] = mergedExpression;
                        return Plywood.Expression.or(orExpressions).simplify();
                    }
                }
            }
            return mergeOr(chainExpression, expression);
        };
        return OrAction;
    }(Plywood.Action));
    Plywood.OrAction = OrAction;
    Plywood.Action.register(OrAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var OverlapAction = (function (_super) {
        __extends(OverlapAction, _super);
        function OverlapAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("overlap");
            if (!this.expression.canHaveType('SET')) {
                throw new Error(this.action + " must have an expression of type SET (is: " + this.expression.type + ")");
            }
        }
        OverlapAction.fromJS = function (parameters) {
            return new OverlapAction(Plywood.Action.jsToValue(parameters));
        };
        OverlapAction.prototype.getOutputType = function (inputType) {
            var expressionType = this.expression.type;
            if (expressionType && expressionType !== 'NULL' && expressionType !== 'SET/NULL' && inputType && inputType !== 'NULL') {
                var setInputType = Plywood.wrapSetType(inputType);
                var setExpressionType = Plywood.wrapSetType(expressionType);
                if (setInputType !== setExpressionType) {
                    throw new Error("type mismatch in overlap action: " + inputType + " is incompatible with " + expressionType);
                }
            }
            return 'BOOLEAN';
        };
        OverlapAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return {
                type: 'BOOLEAN'
            };
        };
        OverlapAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            return function (d, c) {
                var inV = inputFn(d, c);
                var exV = expressionFn(d, c);
                if (exV == null)
                    return null;
                return Plywood.Set.isSet(inV) ? inV.overlap(exV) : exV.contains(inV);
            };
        };
        OverlapAction.prototype._nukeExpression = function () {
            if (this.expression.equals(Plywood.Expression.EMPTY_SET))
                return Plywood.Expression.FALSE;
            return null;
        };
        OverlapAction.prototype._performOnSimpleWhatever = function (ex) {
            var expression = this.expression;
            if ('SET/' + ex.type === expression.type) {
                return new Plywood.InAction({ expression: expression }).performOnSimple(ex);
            }
            return null;
        };
        OverlapAction.prototype._performOnLiteral = function (literalExpression) {
            var expression = this.expression;
            if (!expression.isOp('literal'))
                return new OverlapAction({ expression: literalExpression }).performOnSimple(expression);
            return this._performOnSimpleWhatever(literalExpression);
        };
        OverlapAction.prototype._performOnRef = function (refExpression) {
            return this._performOnSimpleWhatever(refExpression);
        };
        OverlapAction.prototype._performOnSimpleChain = function (chainExpression) {
            return this._performOnSimpleWhatever(chainExpression);
        };
        return OverlapAction;
    }(Plywood.Action));
    Plywood.OverlapAction = OverlapAction;
    Plywood.Action.register(OverlapAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var PowerAction = (function (_super) {
        __extends(PowerAction, _super);
        function PowerAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("power");
            this._checkExpressionTypes('NUMBER');
        }
        PowerAction.fromJS = function (parameters) {
            return new PowerAction(Plywood.Action.jsToValue(parameters));
        };
        PowerAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'NUMBER');
            return 'NUMBER';
        };
        PowerAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return inputType;
        };
        PowerAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            return function (d, c) {
                return Math.pow((inputFn(d, c) || 0), (expressionFn(d, c) || 0));
            };
        };
        PowerAction.prototype._getJSHelper = function (inputJS, expressionJS) {
            return "Math.pow(" + inputJS + "," + expressionJS + ")";
        };
        PowerAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "POW(" + inputSQL + "," + expressionSQL + ")";
        };
        PowerAction.prototype._removeAction = function () {
            return this.expression.equals(Plywood.Expression.ONE);
        };
        PowerAction.prototype._performOnRef = function (simpleExpression) {
            if (this.expression.equals(Plywood.Expression.ZERO))
                return simpleExpression;
            return null;
        };
        return PowerAction;
    }(Plywood.Action));
    Plywood.PowerAction = PowerAction;
    Plywood.Action.register(PowerAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var QuantileAction = (function (_super) {
        __extends(QuantileAction, _super);
        function QuantileAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this.quantile = parameters.quantile;
            this._ensureAction("quantile");
            this._checkExpressionTypes('NUMBER');
        }
        QuantileAction.fromJS = function (parameters) {
            var value = Plywood.Action.jsToValue(parameters);
            value.quantile = parameters.quantile;
            return new QuantileAction(value);
        };
        QuantileAction.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.quantile = this.quantile;
            return value;
        };
        QuantileAction.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.quantile = this.quantile;
            return js;
        };
        QuantileAction.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.quantile === other.quantile;
        };
        QuantileAction.prototype._toStringParameters = function (expressionString) {
            return [expressionString, String(this.quantile)];
        };
        QuantileAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'DATASET');
            return 'NUMBER';
        };
        QuantileAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return {
                type: 'NUMBER'
            };
        };
        QuantileAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            var quantile = this.quantile;
            return function (d, c) {
                var inV = inputFn(d, c);
                return inV ? inV.quantile(expressionFn, quantile, Plywood.foldContext(d, c)) : null;
            };
        };
        QuantileAction.prototype.isAggregate = function () {
            return true;
        };
        QuantileAction.prototype.isNester = function () {
            return true;
        };
        return QuantileAction;
    }(Plywood.Action));
    Plywood.QuantileAction = QuantileAction;
    Plywood.Action.register(QuantileAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var SelectAction = (function (_super) {
        __extends(SelectAction, _super);
        function SelectAction(parameters) {
            if (parameters === void 0) { parameters = {}; }
            _super.call(this, parameters, dummyObject);
            this.attributes = parameters.attributes;
            this._ensureAction("select");
        }
        SelectAction.fromJS = function (parameters) {
            return new SelectAction({
                action: parameters.action,
                attributes: parameters.attributes
            });
        };
        SelectAction.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.attributes = this.attributes;
            return value;
        };
        SelectAction.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.attributes = this.attributes;
            return js;
        };
        SelectAction.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                String(this.attributes) === String(other.attributes);
        };
        SelectAction.prototype._toStringParameters = function (expressionString) {
            return this.attributes;
        };
        SelectAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'DATASET');
            return 'DATASET';
        };
        SelectAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            var attributes = this.attributes;
            var datasetType = typeContext.datasetType;
            var newDatasetType = Object.create(null);
            for (var _i = 0, attributes_6 = attributes; _i < attributes_6.length; _i++) {
                var attr = attributes_6[_i];
                var attrType = datasetType[attr];
                if (!attrType)
                    throw new Error("unknown attribute '" + attr + "' in select");
                newDatasetType[attr] = attrType;
            }
            typeContext.datasetType = newDatasetType;
            return typeContext;
        };
        SelectAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            var attributes = this.attributes;
            return function (d, c) {
                var inV = inputFn(d, c);
                return inV ? inV.select(attributes) : null;
            };
        };
        SelectAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            throw new Error('can not be expressed as SQL directly');
        };
        SelectAction.prototype._foldWithPrevAction = function (prevAction) {
            var attributes = this.attributes;
            if (prevAction instanceof SelectAction) {
                return new SelectAction({
                    attributes: prevAction.attributes.filter(function (a) { return attributes.indexOf(a) !== -1; })
                });
            }
            else if (prevAction instanceof Plywood.ApplyAction) {
                if (attributes.indexOf(prevAction.name) === -1) {
                    return this;
                }
            }
            return null;
        };
        return SelectAction;
    }(Plywood.Action));
    Plywood.SelectAction = SelectAction;
    Plywood.Action.register(SelectAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var SortAction = (function (_super) {
        __extends(SortAction, _super);
        function SortAction(parameters) {
            if (parameters === void 0) { parameters = {}; }
            _super.call(this, parameters, dummyObject);
            var direction = parameters.direction || 'ascending';
            if (direction !== SortAction.DESCENDING && direction !== SortAction.ASCENDING) {
                throw new Error("direction must be '" + SortAction.DESCENDING + "' or '" + SortAction.ASCENDING + "'");
            }
            this.direction = direction;
            if (!this.expression.isOp('ref')) {
                throw new Error("must be a reference expression: " + this.expression);
            }
            this._ensureAction("sort");
        }
        SortAction.fromJS = function (parameters) {
            var value = Plywood.Action.jsToValue(parameters);
            value.direction = parameters.direction;
            return new SortAction(value);
        };
        SortAction.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.direction = this.direction;
            return value;
        };
        SortAction.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.direction = this.direction;
            return js;
        };
        SortAction.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.direction === other.direction;
        };
        SortAction.prototype._toStringParameters = function (expressionString) {
            return [expressionString, this.direction];
        };
        SortAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'DATASET');
            return 'DATASET';
        };
        SortAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return typeContext;
        };
        SortAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            var direction = this.direction;
            return function (d, c) {
                var inV = inputFn(d, c);
                return inV ? inV.sort(expressionFn, direction) : null;
            };
        };
        SortAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            var dir = this.direction === SortAction.DESCENDING ? 'DESC' : 'ASC';
            return "ORDER BY " + expressionSQL + " " + dir;
        };
        SortAction.prototype.refName = function () {
            var expression = this.expression;
            return (expression instanceof Plywood.RefExpression) ? expression.name : null;
        };
        SortAction.prototype.isNester = function () {
            return true;
        };
        SortAction.prototype._foldWithPrevAction = function (prevAction) {
            if (prevAction instanceof SortAction && this.expression.equals(prevAction.expression)) {
                return this;
            }
            return null;
        };
        SortAction.prototype.toggleDirection = function () {
            return new SortAction({
                expression: this.expression,
                direction: this.direction === SortAction.ASCENDING ? SortAction.DESCENDING : SortAction.ASCENDING
            });
        };
        SortAction.DESCENDING = 'descending';
        SortAction.ASCENDING = 'ascending';
        return SortAction;
    }(Plywood.Action));
    Plywood.SortAction = SortAction;
    Plywood.Action.register(SortAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var SplitAction = (function (_super) {
        __extends(SplitAction, _super);
        function SplitAction(parameters) {
            _super.call(this, parameters, dummyObject);
            var splits = parameters.splits;
            if (!splits)
                throw new Error('must have splits');
            this.splits = splits;
            this.keys = Object.keys(splits).sort();
            if (!this.keys.length)
                throw new Error('must have at least one split');
            this.dataName = parameters.dataName;
            this._ensureAction("split");
        }
        SplitAction.fromJS = function (parameters) {
            var value = {
                action: parameters.action
            };
            var splits;
            if (parameters.expression && parameters.name) {
                splits = (_a = {}, _a[parameters.name] = parameters.expression, _a);
            }
            else {
                splits = parameters.splits;
            }
            value.splits = Plywood.helper.expressionLookupFromJS(splits);
            value.dataName = parameters.dataName;
            return new SplitAction(value);
            var _a;
        };
        SplitAction.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.splits = this.splits;
            value.dataName = this.dataName;
            return value;
        };
        SplitAction.prototype.toJS = function () {
            var splits = this.splits;
            var js = _super.prototype.toJS.call(this);
            if (this.isMultiSplit()) {
                js.splits = Plywood.helper.expressionLookupToJS(splits);
            }
            else {
                for (var name in splits) {
                    js.name = name;
                    js.expression = splits[name].toJS();
                }
            }
            js.dataName = this.dataName;
            return js;
        };
        SplitAction.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                Plywood.immutableLookupsEqual(this.splits, other.splits) &&
                this.dataName === other.dataName;
        };
        SplitAction.prototype._toStringParameters = function (expressionString) {
            if (this.isMultiSplit()) {
                var splits = this.splits;
                var splitStrings = [];
                for (var name in splits) {
                    splitStrings.push(name + ": " + splits[name]);
                }
                return [splitStrings.join(', '), this.dataName];
            }
            else {
                return [this.firstSplitExpression().toString(), this.firstSplitName(), this.dataName];
            }
        };
        SplitAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'DATASET');
            return 'DATASET';
        };
        SplitAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            var newDatasetType = {};
            this.mapSplits(function (name, expression) {
                newDatasetType[name] = expression._fillRefSubstitutions(typeContext, indexer, alterations);
            });
            newDatasetType[this.dataName] = typeContext;
            return {
                parent: typeContext.parent,
                type: 'DATASET',
                datasetType: newDatasetType,
                remote: false
            };
        };
        SplitAction.prototype.getFn = function (inputFn) {
            var dataName = this.dataName;
            var splitFns = this.mapSplitExpressions(function (ex) { return ex.getFn(); });
            return function (d, c) {
                var inV = inputFn(d, c);
                return inV ? inV.split(splitFns, dataName) : null;
            };
        };
        SplitAction.prototype.getSQL = function (inputSQL, dialect) {
            var groupBys = this.mapSplits(function (name, expression) { return expression.getSQL(dialect); });
            return "GROUP BY " + groupBys.join(', ');
        };
        SplitAction.prototype.getSelectSQL = function (dialect) {
            return this.mapSplits(function (name, expression) { return (expression.getSQL(dialect) + " AS " + dialect.escapeName(name)); });
        };
        SplitAction.prototype.getShortGroupBySQL = function () {
            return 'GROUP BY ' + Object.keys(this.splits).map(function (d, i) { return i + 1; }).join(', ');
        };
        SplitAction.prototype.expressionCount = function () {
            var count = 0;
            this.mapSplits(function (k, expression) {
                count += expression.expressionCount();
            });
            return count;
        };
        SplitAction.prototype.fullyDefined = function () {
            return false;
        };
        SplitAction.prototype.simplify = function () {
            if (this.simple)
                return this;
            var simpleSplits = this.mapSplitExpressions(function (ex) { return ex.simplify(); });
            var value = this.valueOf();
            value.splits = simpleSplits;
            value.simple = true;
            return new SplitAction(value);
        };
        SplitAction.prototype.getExpressions = function () {
            return this.mapSplits(function (name, ex) { return ex; });
        };
        SplitAction.prototype._substituteHelper = function (substitutionFn, thisArg, indexer, depth, nestDiff) {
            var nestDiffNext = nestDiff + 1;
            var hasChanged = false;
            var subSplits = this.mapSplitExpressions(function (ex) {
                var subExpression = ex._substituteHelper(substitutionFn, thisArg, indexer, depth, nestDiffNext);
                if (subExpression !== ex)
                    hasChanged = true;
                return subExpression;
            });
            if (!hasChanged)
                return this;
            var value = this.valueOf();
            value.splits = subSplits;
            return new SplitAction(value);
        };
        SplitAction.prototype.isNester = function () {
            return true;
        };
        SplitAction.prototype.numSplits = function () {
            return this.keys.length;
        };
        SplitAction.prototype.isMultiSplit = function () {
            return this.numSplits() > 1;
        };
        SplitAction.prototype.mapSplits = function (fn) {
            var _a = this, splits = _a.splits, keys = _a.keys;
            var res = [];
            for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
                var k = keys_2[_i];
                var v = fn(k, splits[k]);
                if (typeof v !== 'undefined')
                    res.push(v);
            }
            return res;
        };
        SplitAction.prototype.mapSplitExpressions = function (fn) {
            var _a = this, splits = _a.splits, keys = _a.keys;
            var ret = Object.create(null);
            for (var _i = 0, keys_3 = keys; _i < keys_3.length; _i++) {
                var key = keys_3[_i];
                ret[key] = fn(splits[key], key);
            }
            return ret;
        };
        SplitAction.prototype.transformExpressions = function (fn) {
            var _a = this, splits = _a.splits, keys = _a.keys;
            var newSplits = Object.create(null);
            var changed = false;
            for (var _i = 0, keys_4 = keys; _i < keys_4.length; _i++) {
                var key = keys_4[_i];
                var ex = splits[key];
                var transformed = fn(ex, key);
                if (transformed !== ex)
                    changed = true;
                newSplits[key] = transformed;
            }
            if (!changed)
                return this;
            var value = this.valueOf();
            value.splits = newSplits;
            return new SplitAction(value);
        };
        SplitAction.prototype.firstSplitName = function () {
            return this.keys[0];
        };
        SplitAction.prototype.firstSplitExpression = function () {
            return this.splits[this.firstSplitName()];
        };
        SplitAction.prototype.filterFromDatum = function (datum) {
            return Plywood.Expression.and(this.mapSplits(function (name, expression) {
                if (Plywood.isSetType(expression.type)) {
                    return Plywood.r(datum[name]).in(expression);
                }
                else {
                    return expression.is(Plywood.r(datum[name]));
                }
            })).simplify();
        };
        SplitAction.prototype.hasKey = function (key) {
            return hasOwnProperty(this.splits, key);
        };
        SplitAction.prototype.maxBucketNumber = function () {
            var _a = this, splits = _a.splits, keys = _a.keys;
            var num = 1;
            for (var _i = 0, keys_5 = keys; _i < keys_5.length; _i++) {
                var key = keys_5[_i];
                num *= splits[key].maxPossibleSplitValues();
            }
            return num;
        };
        SplitAction.prototype.isAggregate = function () {
            return true;
        };
        return SplitAction;
    }(Plywood.Action));
    Plywood.SplitAction = SplitAction;
    Plywood.Action.register(SplitAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var SubstrAction = (function (_super) {
        __extends(SubstrAction, _super);
        function SubstrAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this.position = parameters.position;
            this.length = parameters.length;
            this._ensureAction("substr");
        }
        SubstrAction.fromJS = function (parameters) {
            var value = Plywood.Action.jsToValue(parameters);
            value.position = parameters.position;
            value.length = parameters.length;
            return new SubstrAction(value);
        };
        SubstrAction.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.position = this.position;
            value.length = this.length;
            return value;
        };
        SubstrAction.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.position = this.position;
            js.length = this.length;
            return js;
        };
        SubstrAction.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.position === other.position &&
                this.length === other.length;
        };
        SubstrAction.prototype._toStringParameters = function (expressionString) {
            return [String(this.position), String(this.length)];
        };
        SubstrAction.prototype.getOutputType = function (inputType) {
            return this._stringTransformOutputType(inputType);
        };
        SubstrAction.prototype._fillRefSubstitutions = function (typeContext, inputType) {
            return inputType;
        };
        SubstrAction.prototype._getFnHelper = function (inputFn) {
            var _a = this, position = _a.position, length = _a.length;
            return function (d, c) {
                var inV = inputFn(d, c);
                if (inV === null)
                    return null;
                return inV.substr(position, length);
            };
        };
        SubstrAction.prototype._getJSHelper = function (inputJS) {
            var _a = this, position = _a.position, length = _a.length;
            return "(_=" + inputJS + ",_==null?null:(''+_).substr(" + position + "," + length + "))";
        };
        SubstrAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "SUBSTR(" + inputSQL + "," + (this.position + 1) + "," + this.length + ")";
        };
        return SubstrAction;
    }(Plywood.Action));
    Plywood.SubstrAction = SubstrAction;
    Plywood.Action.register(SubstrAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var SubtractAction = (function (_super) {
        __extends(SubtractAction, _super);
        function SubtractAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("subtract");
            this._checkExpressionTypes('NUMBER');
        }
        SubtractAction.fromJS = function (parameters) {
            return new SubtractAction(Plywood.Action.jsToValue(parameters));
        };
        SubtractAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'NUMBER');
            return 'NUMBER';
        };
        SubtractAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return inputType;
        };
        SubtractAction.prototype._getFnHelper = function (inputFn, expressionFn) {
            return function (d, c) {
                return (inputFn(d, c) || 0) - (expressionFn(d, c) || 0);
            };
        };
        SubtractAction.prototype._getJSHelper = function (inputJS, expressionJS) {
            return "(" + inputJS + "-" + expressionJS + ")";
        };
        SubtractAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "(" + inputSQL + "-" + expressionSQL + ")";
        };
        SubtractAction.prototype._removeAction = function () {
            return this.expression.equals(Plywood.Expression.ZERO);
        };
        return SubtractAction;
    }(Plywood.Action));
    Plywood.SubtractAction = SubtractAction;
    Plywood.Action.register(SubtractAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var SumAction = (function (_super) {
        __extends(SumAction, _super);
        function SumAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this._ensureAction("sum");
            this._checkExpressionTypes('NUMBER');
        }
        SumAction.fromJS = function (parameters) {
            return new SumAction(Plywood.Action.jsToValue(parameters));
        };
        SumAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'DATASET');
            return 'NUMBER';
        };
        SumAction.prototype._fillRefSubstitutions = function (typeContext, inputType, indexer, alterations) {
            this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
            return {
                type: 'NUMBER'
            };
        };
        SumAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return "SUM(" + dialect.aggregateFilterIfNeeded(inputSQL, expressionSQL) + ")";
        };
        SumAction.prototype.isAggregate = function () {
            return true;
        };
        SumAction.prototype.isNester = function () {
            return true;
        };
        SumAction.prototype.canDistribute = function () {
            var expression = this.expression;
            return expression instanceof Plywood.LiteralExpression ||
                Boolean(expression.getExpressionPattern('add') || expression.getExpressionPattern('subtract'));
        };
        SumAction.prototype.distribute = function (preEx) {
            var expression = this.expression;
            if (expression instanceof Plywood.LiteralExpression) {
                var value = expression.value;
                if (value === 0)
                    return Plywood.Expression.ZERO;
                return expression.multiply(preEx.count()).simplify();
            }
            var pattern;
            if (pattern = expression.getExpressionPattern('add')) {
                return Plywood.Expression.add(pattern.map(function (ex) { return preEx.sum(ex).distribute(); }));
            }
            if (pattern = expression.getExpressionPattern('subtract')) {
                return Plywood.Expression.subtract(pattern.map(function (ex) { return preEx.sum(ex).distribute(); }));
            }
            return null;
        };
        return SumAction;
    }(Plywood.Action));
    Plywood.SumAction = SumAction;
    Plywood.Action.register(SumAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var TimeBucketAction = (function (_super) {
        __extends(TimeBucketAction, _super);
        function TimeBucketAction(parameters) {
            _super.call(this, parameters, dummyObject);
            var duration = parameters.duration;
            this.duration = duration;
            this.timezone = parameters.timezone;
            this._ensureAction("timeBucket");
            if (!Plywood.Duration.isDuration(duration)) {
                throw new Error("`duration` must be a Duration");
            }
            if (!duration.isFloorable()) {
                throw new Error("duration '" + duration.toString() + "' is not floorable");
            }
        }
        TimeBucketAction.fromJS = function (parameters) {
            var value = Plywood.Action.jsToValue(parameters);
            value.duration = Plywood.Duration.fromJS(parameters.duration);
            if (parameters.timezone)
                value.timezone = Plywood.Timezone.fromJS(parameters.timezone);
            return new TimeBucketAction(value);
        };
        TimeBucketAction.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.duration = this.duration;
            if (this.timezone)
                value.timezone = this.timezone;
            return value;
        };
        TimeBucketAction.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.duration = this.duration.toJS();
            if (this.timezone)
                js.timezone = this.timezone.toJS();
            return js;
        };
        TimeBucketAction.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.duration.equals(other.duration) &&
                Plywood.immutableEqual(this.timezone, other.timezone);
        };
        TimeBucketAction.prototype._toStringParameters = function (expressionString) {
            var ret = [this.duration.toString()];
            if (this.timezone)
                ret.push(this.timezone.toString());
            return ret;
        };
        TimeBucketAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'TIME', 'TIME_RANGE');
            return 'TIME_RANGE';
        };
        TimeBucketAction.prototype._fillRefSubstitutions = function () {
            return {
                type: 'TIME_RANGE'
            };
        };
        TimeBucketAction.prototype._getFnHelper = function (inputFn) {
            var duration = this.duration;
            var timezone = this.getTimezone();
            return function (d, c) {
                var inV = inputFn(d, c);
                if (inV === null)
                    return null;
                return Plywood.TimeRange.timeBucket(inV, duration, timezone);
            };
        };
        TimeBucketAction.prototype._getJSHelper = function (inputJS) {
            throw new Error("implement me");
        };
        TimeBucketAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return dialect.timeBucketExpression(inputSQL, this.duration, this.getTimezone());
        };
        TimeBucketAction.prototype.needsEnvironment = function () {
            return !this.timezone;
        };
        TimeBucketAction.prototype.defineEnvironment = function (environment) {
            if (this.timezone || !environment.timezone)
                return this;
            var value = this.valueOf();
            value.timezone = environment.timezone;
            return new TimeBucketAction(value);
        };
        TimeBucketAction.prototype.getTimezone = function () {
            return this.timezone || Plywood.Timezone.UTC;
        };
        return TimeBucketAction;
    }(Plywood.Action));
    Plywood.TimeBucketAction = TimeBucketAction;
    Plywood.Action.register(TimeBucketAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var TimeFloorAction = (function (_super) {
        __extends(TimeFloorAction, _super);
        function TimeFloorAction(parameters) {
            _super.call(this, parameters, dummyObject);
            var duration = parameters.duration;
            this.duration = duration;
            this.timezone = parameters.timezone;
            this._ensureAction("timeFloor");
            if (!Plywood.Duration.isDuration(duration)) {
                throw new Error("`duration` must be a Duration");
            }
            if (!duration.isFloorable()) {
                throw new Error("duration '" + duration.toString() + "' is not floorable");
            }
        }
        TimeFloorAction.fromJS = function (parameters) {
            var value = Plywood.Action.jsToValue(parameters);
            value.duration = Plywood.Duration.fromJS(parameters.duration);
            if (parameters.timezone)
                value.timezone = Plywood.Timezone.fromJS(parameters.timezone);
            return new TimeFloorAction(value);
        };
        TimeFloorAction.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.duration = this.duration;
            if (this.timezone)
                value.timezone = this.timezone;
            return value;
        };
        TimeFloorAction.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.duration = this.duration.toJS();
            if (this.timezone)
                js.timezone = this.timezone.toJS();
            return js;
        };
        TimeFloorAction.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.duration.equals(other.duration) &&
                Plywood.immutableEqual(this.timezone, other.timezone);
        };
        TimeFloorAction.prototype._toStringParameters = function (expressionString) {
            var ret = [this.duration.toString()];
            if (this.timezone)
                ret.push(this.timezone.toString());
            return ret;
        };
        TimeFloorAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'TIME');
            return 'TIME';
        };
        TimeFloorAction.prototype._fillRefSubstitutions = function () {
            return {
                type: 'TIME'
            };
        };
        TimeFloorAction.prototype._getFnHelper = function (inputFn) {
            var duration = this.duration;
            var timezone = this.getTimezone();
            return function (d, c) {
                var inV = inputFn(d, c);
                if (inV === null)
                    return null;
                return duration.floor(inV, timezone);
            };
        };
        TimeFloorAction.prototype._getJSHelper = function (inputJS) {
            throw new Error("implement me");
        };
        TimeFloorAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return dialect.timeFloorExpression(inputSQL, this.duration, this.getTimezone());
        };
        TimeFloorAction.prototype._foldWithPrevAction = function (prevAction) {
            if (prevAction.equals(this)) {
                return this;
            }
            return null;
        };
        TimeFloorAction.prototype.needsEnvironment = function () {
            return !this.timezone;
        };
        TimeFloorAction.prototype.defineEnvironment = function (environment) {
            if (this.timezone || !environment.timezone)
                return this;
            var value = this.valueOf();
            value.timezone = environment.timezone;
            return new TimeFloorAction(value);
        };
        TimeFloorAction.prototype.getTimezone = function () {
            return this.timezone || Plywood.Timezone.UTC;
        };
        TimeFloorAction.prototype.alignsWith = function (actions) {
            if (!actions.length)
                return false;
            var action = actions[0];
            var _a = this, timezone = _a.timezone, duration = _a.duration;
            if (!timezone)
                return false;
            if (action instanceof TimeFloorAction || action instanceof Plywood.TimeBucketAction) {
                return timezone.equals(action.timezone) && action.duration.dividesBy(duration);
            }
            if (action instanceof Plywood.InAction || action instanceof Plywood.OverlapAction) {
                var literal = action.getLiteralValue();
                if (Plywood.TimeRange.isTimeRange(literal)) {
                    return literal.isAligned(duration, timezone);
                }
                else if (Plywood.Set.isSet(literal)) {
                    if (literal.setType !== 'TIME_RANGE')
                        return false;
                    return literal.elements.every(function (e) {
                        return e.isAligned(duration, timezone);
                    });
                }
            }
            return false;
        };
        return TimeFloorAction;
    }(Plywood.Action));
    Plywood.TimeFloorAction = TimeFloorAction;
    Plywood.Action.register(TimeFloorAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var PART_TO_FUNCTION = {
        SECOND_OF_MINUTE: function (d) { return d.getSeconds(); },
        SECOND_OF_HOUR: function (d) { return d.getMinutes() * 60 + d.getSeconds(); },
        SECOND_OF_DAY: function (d) { return (d.getHours() * 60 + d.getMinutes()) * 60 + d.getSeconds(); },
        SECOND_OF_WEEK: function (d) { return ((d.getDay() * 24) + d.getHours() * 60 + d.getMinutes()) * 60 + d.getSeconds(); },
        SECOND_OF_MONTH: function (d) { return (((d.getDate() - 1) * 24) + d.getHours() * 60 + d.getMinutes()) * 60 + d.getSeconds(); },
        SECOND_OF_YEAR: null,
        MINUTE_OF_HOUR: function (d) { return d.getMinutes(); },
        MINUTE_OF_DAY: function (d) { return d.getHours() * 60 + d.getMinutes(); },
        MINUTE_OF_WEEK: function (d) { return (d.getDay() * 24) + d.getHours() * 60 + d.getMinutes(); },
        MINUTE_OF_MONTH: function (d) { return ((d.getDate() - 1) * 24) + d.getHours() * 60 + d.getMinutes(); },
        MINUTE_OF_YEAR: null,
        HOUR_OF_DAY: function (d) { return d.getHours(); },
        HOUR_OF_WEEK: function (d) { return d.getDay() * 24 + d.getHours(); },
        HOUR_OF_MONTH: function (d) { return (d.getDate() - 1) * 24 + d.getHours(); },
        HOUR_OF_YEAR: null,
        DAY_OF_WEEK: function (d) { return d.getDay() || 7; },
        DAY_OF_MONTH: function (d) { return d.getDate(); },
        DAY_OF_YEAR: null,
        WEEK_OF_MONTH: null,
        WEEK_OF_YEAR: null,
        MONTH_OF_YEAR: function (d) { return d.getMonth(); },
        YEAR: function (d) { return d.getFullYear(); }
    };
    var PART_TO_MAX_VALUES = {
        SECOND_OF_MINUTE: 61,
        SECOND_OF_HOUR: 3601,
        SECOND_OF_DAY: 93601,
        SECOND_OF_WEEK: null,
        SECOND_OF_MONTH: null,
        SECOND_OF_YEAR: null,
        MINUTE_OF_HOUR: 60,
        MINUTE_OF_DAY: 26 * 60,
        MINUTE_OF_WEEK: null,
        MINUTE_OF_MONTH: null,
        MINUTE_OF_YEAR: null,
        HOUR_OF_DAY: 26,
        HOUR_OF_WEEK: null,
        HOUR_OF_MONTH: null,
        HOUR_OF_YEAR: null,
        DAY_OF_WEEK: 7,
        DAY_OF_MONTH: 31,
        DAY_OF_YEAR: 366,
        WEEK_OF_MONTH: 5,
        WEEK_OF_YEAR: 53,
        MONTH_OF_YEAR: 12,
        YEAR: null
    };
    var TimePartAction = (function (_super) {
        __extends(TimePartAction, _super);
        function TimePartAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this.part = parameters.part;
            this.timezone = parameters.timezone;
            this._ensureAction("timePart");
            if (typeof this.part !== 'string') {
                throw new Error("`part` must be a string");
            }
        }
        TimePartAction.fromJS = function (parameters) {
            var value = Plywood.Action.jsToValue(parameters);
            value.part = parameters.part;
            if (parameters.timezone)
                value.timezone = Plywood.Timezone.fromJS(parameters.timezone);
            return new TimePartAction(value);
        };
        TimePartAction.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.part = this.part;
            if (this.timezone)
                value.timezone = this.timezone;
            return value;
        };
        TimePartAction.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.part = this.part;
            if (this.timezone)
                js.timezone = this.timezone.toJS();
            return js;
        };
        TimePartAction.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.part === other.part &&
                Plywood.immutableEqual(this.timezone, other.timezone);
        };
        TimePartAction.prototype._toStringParameters = function (expressionString) {
            var ret = [this.part];
            if (this.timezone)
                ret.push(this.timezone.toString());
            return ret;
        };
        TimePartAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'TIME');
            return 'NUMBER';
        };
        TimePartAction.prototype._fillRefSubstitutions = function () {
            return {
                type: 'NUMBER'
            };
        };
        TimePartAction.prototype._getFnHelper = function (inputFn) {
            var part = this.part;
            var timezone = this.getTimezone();
            var parter = PART_TO_FUNCTION[part];
            if (!parter)
                throw new Error("unsupported part '" + part + "'");
            return function (d, c) {
                var inV = inputFn(d, c);
                if (!inV)
                    return null;
                inV = Plywood.WallTime.UTCToWallTime(inV, timezone.toString());
                return parter(inV);
            };
        };
        TimePartAction.prototype._getJSHelper = function (inputJS) {
            throw new Error("implement me");
        };
        TimePartAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return dialect.timePartExpression(inputSQL, this.part, this.getTimezone());
        };
        TimePartAction.prototype.maxPossibleSplitValues = function () {
            var maxValue = PART_TO_MAX_VALUES[this.part];
            if (!maxValue)
                return Infinity;
            return maxValue + 1;
        };
        TimePartAction.prototype.needsEnvironment = function () {
            return !this.timezone;
        };
        TimePartAction.prototype.defineEnvironment = function (environment) {
            if (this.timezone || !environment.timezone)
                return this;
            var value = this.valueOf();
            value.timezone = environment.timezone;
            return new TimePartAction(value);
        };
        TimePartAction.prototype.getTimezone = function () {
            return this.timezone || Plywood.Timezone.UTC;
        };
        return TimePartAction;
    }(Plywood.Action));
    Plywood.TimePartAction = TimePartAction;
    Plywood.Action.register(TimePartAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var TimeRangeAction = (function (_super) {
        __extends(TimeRangeAction, _super);
        function TimeRangeAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this.duration = parameters.duration;
            this.step = parameters.step || TimeRangeAction.DEFAULT_STEP;
            this.timezone = parameters.timezone;
            this._ensureAction("timeRange");
            if (!Plywood.Duration.isDuration(this.duration)) {
                throw new Error("`duration` must be a Duration");
            }
        }
        TimeRangeAction.fromJS = function (parameters) {
            var value = Plywood.Action.jsToValue(parameters);
            value.duration = Plywood.Duration.fromJS(parameters.duration);
            value.step = parameters.step;
            if (parameters.timezone)
                value.timezone = Plywood.Timezone.fromJS(parameters.timezone);
            return new TimeRangeAction(value);
        };
        TimeRangeAction.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.duration = this.duration;
            value.step = this.step;
            if (this.timezone)
                value.timezone = this.timezone;
            return value;
        };
        TimeRangeAction.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.duration = this.duration.toJS();
            js.step = this.step;
            if (this.timezone)
                js.timezone = this.timezone.toJS();
            return js;
        };
        TimeRangeAction.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.duration.equals(other.duration) &&
                this.step === other.step &&
                Plywood.immutableEqual(this.timezone, other.timezone);
        };
        TimeRangeAction.prototype._toStringParameters = function (expressionString) {
            var ret = [this.duration.toString(), this.step.toString()];
            if (this.timezone)
                ret.push(this.timezone.toString());
            return ret;
        };
        TimeRangeAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'TIME');
            return 'TIME_RANGE';
        };
        TimeRangeAction.prototype._fillRefSubstitutions = function () {
            return {
                type: 'TIME_RANGE'
            };
        };
        TimeRangeAction.prototype._getFnHelper = function (inputFn) {
            var duration = this.duration;
            var step = this.step;
            var timezone = this.getTimezone();
            return function (d, c) {
                var inV = inputFn(d, c);
                if (inV === null)
                    return null;
                var other = duration.shift(inV, timezone, step);
                if (step > 0) {
                    return new Plywood.TimeRange({ start: inV, end: other });
                }
                else {
                    return new Plywood.TimeRange({ start: other, end: inV });
                }
            };
        };
        TimeRangeAction.prototype._getJSHelper = function (inputJS) {
            throw new Error("implement me");
        };
        TimeRangeAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            throw new Error("implement me");
        };
        TimeRangeAction.prototype.needsEnvironment = function () {
            return !this.timezone;
        };
        TimeRangeAction.prototype.defineEnvironment = function (environment) {
            if (this.timezone || !environment.timezone)
                return this;
            var value = this.valueOf();
            value.timezone = environment.timezone;
            return new TimeRangeAction(value);
        };
        TimeRangeAction.prototype.getTimezone = function () {
            return this.timezone || Plywood.Timezone.UTC;
        };
        TimeRangeAction.DEFAULT_STEP = 1;
        return TimeRangeAction;
    }(Plywood.Action));
    Plywood.TimeRangeAction = TimeRangeAction;
    Plywood.Action.register(TimeRangeAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var TimeShiftAction = (function (_super) {
        __extends(TimeShiftAction, _super);
        function TimeShiftAction(parameters) {
            _super.call(this, parameters, dummyObject);
            this.duration = parameters.duration;
            this.step = parameters.step || TimeShiftAction.DEFAULT_STEP;
            this.timezone = parameters.timezone;
            this._ensureAction("timeShift");
            if (!Plywood.Duration.isDuration(this.duration)) {
                throw new Error("`duration` must be a Duration");
            }
        }
        TimeShiftAction.fromJS = function (parameters) {
            var value = Plywood.Action.jsToValue(parameters);
            value.duration = Plywood.Duration.fromJS(parameters.duration);
            value.step = parameters.step;
            if (parameters.timezone)
                value.timezone = Plywood.Timezone.fromJS(parameters.timezone);
            return new TimeShiftAction(value);
        };
        TimeShiftAction.prototype.valueOf = function () {
            var value = _super.prototype.valueOf.call(this);
            value.duration = this.duration;
            value.step = this.step;
            if (this.timezone)
                value.timezone = this.timezone;
            return value;
        };
        TimeShiftAction.prototype.toJS = function () {
            var js = _super.prototype.toJS.call(this);
            js.duration = this.duration.toJS();
            js.step = this.step;
            if (this.timezone)
                js.timezone = this.timezone.toJS();
            return js;
        };
        TimeShiftAction.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                this.duration.equals(other.duration) &&
                this.step === other.step &&
                Plywood.immutableEqual(this.timezone, other.timezone);
        };
        TimeShiftAction.prototype._toStringParameters = function (expressionString) {
            var ret = [this.duration.toString(), this.step.toString()];
            if (this.timezone)
                ret.push(this.timezone.toString());
            return ret;
        };
        TimeShiftAction.prototype.getOutputType = function (inputType) {
            this._checkInputTypes(inputType, 'TIME');
            return 'TIME';
        };
        TimeShiftAction.prototype._fillRefSubstitutions = function () {
            return {
                type: 'TIME'
            };
        };
        TimeShiftAction.prototype._getFnHelper = function (inputFn) {
            var duration = this.duration;
            var step = this.step;
            var timezone = this.getTimezone();
            return function (d, c) {
                var inV = inputFn(d, c);
                if (inV === null)
                    return null;
                return duration.shift(inV, timezone, step);
            };
        };
        TimeShiftAction.prototype._getJSHelper = function (inputJS) {
            throw new Error("implement me");
        };
        TimeShiftAction.prototype._getSQLHelper = function (dialect, inputSQL, expressionSQL) {
            return dialect.timeShiftExpression(inputSQL, this.duration, this.getTimezone());
        };
        TimeShiftAction.prototype._foldWithPrevAction = function (prevAction) {
            if (prevAction instanceof TimeShiftAction) {
                if (this.duration.equals(prevAction.duration) &&
                    Boolean(this.timezone) === Boolean(prevAction.timezone) &&
                    (!this.timezone || this.timezone.equals(prevAction.timezone))) {
                    var value = this.valueOf();
                    value.step += prevAction.step;
                    return new TimeShiftAction(value);
                }
            }
            return null;
        };
        TimeShiftAction.prototype.needsEnvironment = function () {
            return !this.timezone;
        };
        TimeShiftAction.prototype.defineEnvironment = function (environment) {
            if (this.timezone || !environment.timezone)
                return this;
            var value = this.valueOf();
            value.timezone = environment.timezone;
            return new TimeShiftAction(value);
        };
        TimeShiftAction.prototype.getTimezone = function () {
            return this.timezone || Plywood.Timezone.UTC;
        };
        TimeShiftAction.DEFAULT_STEP = 1;
        return TimeShiftAction;
    }(Plywood.Action));
    Plywood.TimeShiftAction = TimeShiftAction;
    Plywood.Action.register(TimeShiftAction);
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    function basicExecutorFactory(parameters) {
        var datasets = parameters.datasets;
        return function (ex, env) {
            if (env === void 0) { env = {}; }
            return ex.compute(datasets, env);
        };
    }
    Plywood.basicExecutorFactory = basicExecutorFactory;
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var helper;
    (function (helper) {
        var integerRegExp = /^\d+$/;
        function simpleLocator(parameters) {
            if (typeof parameters === "string")
                parameters = { resource: parameters };
            var resource = parameters.resource;
            var defaultPort = parameters.defaultPort;
            if (!resource)
                throw new Error("must have resource");
            var locations = resource.split(";").map(function (locationString) {
                var parts = locationString.split(":");
                if (parts.length > 2)
                    throw new Error("invalid resource part '" + locationString + "'");
                var location = {
                    hostname: parts[0]
                };
                if (parts.length === 2) {
                    if (!integerRegExp.test(parts[1])) {
                        throw new Error("invalid port in resource '" + parts[1] + "'");
                    }
                    location.port = Number(parts[1]);
                }
                else if (defaultPort) {
                    location.port = defaultPort;
                }
                return location;
            });
            return function () { return Q(locations[Math.floor(Math.random() * locations.length)]); };
        }
        helper.simpleLocator = simpleLocator;
    })(helper = Plywood.helper || (Plywood.helper = {}));
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var helper;
    (function (helper) {
        function verboseRequesterFactory(parameters) {
            var requester = parameters.requester;
            var printLine = parameters.printLine || (function (line) {
                console['log'](line);
            });
            var preQuery = parameters.preQuery || (function (query, queryNumber) {
                printLine("vvvvvvvvvvvvvvvvvvvvvvvvvv");
                printLine("Sending query " + queryNumber + ":");
                printLine(JSON.stringify(query, null, 2));
                printLine("^^^^^^^^^^^^^^^^^^^^^^^^^^");
            });
            var onSuccess = parameters.onSuccess || (function (data, time, query, queryNumber) {
                printLine("vvvvvvvvvvvvvvvvvvvvvvvvvv");
                printLine("Got result from query " + queryNumber + ": (in " + time + "ms)");
                printLine(JSON.stringify(data, null, 2));
                printLine("^^^^^^^^^^^^^^^^^^^^^^^^^^");
            });
            var onError = parameters.onError || (function (error, time, query, queryNumber) {
                printLine("vvvvvvvvvvvvvvvvvvvvvvvvvv");
                printLine("Got error in query " + queryNumber + ": " + error.message + " (in " + time + "ms)");
                printLine("^^^^^^^^^^^^^^^^^^^^^^^^^^");
            });
            var queryNumber = 0;
            return function (request) {
                queryNumber++;
                var myQueryNumber = queryNumber;
                preQuery(request.query, myQueryNumber);
                var startTime = Date.now();
                return requester(request)
                    .then(function (data) {
                    onSuccess(data, Date.now() - startTime, request.query, myQueryNumber);
                    return data;
                }, function (error) {
                    onError(error, Date.now() - startTime, request.query, myQueryNumber);
                    throw error;
                });
            };
        }
        helper.verboseRequesterFactory = verboseRequesterFactory;
    })(helper = Plywood.helper || (Plywood.helper = {}));
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var helper;
    (function (helper) {
        function retryRequester(parameters) {
            console.warn('retryRequester has been renamed to retryRequesterFactory and will soon be deprecated');
            return retryRequesterFactory(parameters);
        }
        helper.retryRequester = retryRequester;
        function retryRequesterFactory(parameters) {
            var requester = parameters.requester;
            var delay = parameters.delay || 500;
            var retry = parameters.retry || 3;
            var retryOnTimeout = Boolean(parameters.retryOnTimeout);
            if (typeof delay !== "number")
                throw new TypeError("delay should be a number");
            if (typeof retry !== "number")
                throw new TypeError("retry should be a number");
            return function (request) {
                var tries = 1;
                function handleError(err) {
                    if (tries > retry)
                        throw err;
                    tries++;
                    if (err.message === "timeout" && !retryOnTimeout)
                        throw err;
                    return Q.delay(delay).then(function () { return requester(request); }).catch(handleError);
                }
                return requester(request).catch(handleError);
            };
        }
        helper.retryRequesterFactory = retryRequesterFactory;
    })(helper = Plywood.helper || (Plywood.helper = {}));
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var helper;
    (function (helper) {
        function concurrentLimitRequesterFactory(parameters) {
            var requester = parameters.requester;
            var concurrentLimit = parameters.concurrentLimit || 5;
            if (typeof concurrentLimit !== "number")
                throw new TypeError("concurrentLimit should be a number");
            var requestQueue = [];
            var outstandingRequests = 0;
            function requestFinished() {
                outstandingRequests--;
                if (!(requestQueue.length && outstandingRequests < concurrentLimit))
                    return;
                var queueItem = requestQueue.shift();
                var deferred = queueItem.deferred;
                outstandingRequests++;
                requester(queueItem.request)
                    .then(deferred.resolve, deferred.reject)
                    .fin(requestFinished);
            }
            return function (request) {
                if (outstandingRequests < concurrentLimit) {
                    outstandingRequests++;
                    return requester(request).fin(requestFinished);
                }
                else {
                    var deferred = Q.defer();
                    requestQueue.push({
                        request: request,
                        deferred: deferred
                    });
                    return deferred.promise;
                }
            };
        }
        helper.concurrentLimitRequesterFactory = concurrentLimitRequesterFactory;
    })(helper = Plywood.helper || (Plywood.helper = {}));
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var helper;
    (function (helper) {
        function promiseWhile(condition, action) {
            var loop = function () {
                if (!condition())
                    return Q(null);
                return Q(action()).then(loop);
            };
            return Q(null).then(loop);
        }
        helper.promiseWhile = promiseWhile;
    })(helper = Plywood.helper || (Plywood.helper = {}));
})(Plywood || (Plywood = {}));
var Plywood;
(function (Plywood) {
    var helper;
    (function (helper) {
        function parseJSON(text) {
            text = text.trim();
            var firstChar = text[0];
            if (firstChar[0] === '[') {
                try {
                    return JSON.parse(text);
                }
                catch (e) {
                    throw new Error("could not parse");
                }
            }
            else if (firstChar[0] === '{') {
                return text.split(/\r?\n/).map(function (line, i) {
                    try {
                        return JSON.parse(line);
                    }
                    catch (e) {
                        throw new Error("problem in line: " + i + ": '" + line + "'");
                    }
                });
            }
            else {
                throw new Error("Unsupported start, starts with '" + firstChar[0] + "'");
            }
        }
        helper.parseJSON = parseJSON;
        function find(array, fn) {
            for (var i = 0, n = array.length; i < n; i++) {
                var a = array[i];
                if (fn.call(array, a, i))
                    return a;
            }
            return null;
        }
        helper.find = find;
        function findIndex(array, fn) {
            for (var i = 0, n = array.length; i < n; i++) {
                var a = array[i];
                if (fn.call(array, a, i))
                    return i;
            }
            return -1;
        }
        helper.findIndex = findIndex;
        function findByName(array, name) {
            return find(array, function (x) { return x.name === name; });
        }
        helper.findByName = findByName;
        function findIndexByName(array, name) {
            return findIndex(array, function (x) { return x.name === name; });
        }
        helper.findIndexByName = findIndexByName;
        function overrideByName(things, thingOverride) {
            var overrideName = thingOverride.name;
            var added = false;
            things = things.map(function (t) {
                if (t.name === overrideName) {
                    added = true;
                    return thingOverride;
                }
                else {
                    return t;
                }
            });
            if (!added)
                things.push(thingOverride);
            return things;
        }
        helper.overrideByName = overrideByName;
        function overridesByName(things, thingOverrides) {
            for (var _i = 0, thingOverrides_1 = thingOverrides; _i < thingOverrides_1.length; _i++) {
                var thingOverride = thingOverrides_1[_i];
                things = overrideByName(things, thingOverride);
            }
            return things;
        }
        helper.overridesByName = overridesByName;
        function shallowCopy(thing) {
            var newThing = {};
            for (var k in thing) {
                if (hasOwnProperty(thing, k))
                    newThing[k] = thing[k];
            }
            return newThing;
        }
        helper.shallowCopy = shallowCopy;
        function deduplicateSort(a) {
            a = a.sort();
            var newA = [];
            var last = null;
            for (var _i = 0, a_1 = a; _i < a_1.length; _i++) {
                var v = a_1[_i];
                if (v !== last)
                    newA.push(v);
                last = v;
            }
            return newA;
        }
        helper.deduplicateSort = deduplicateSort;
        function mapLookup(thing, fn) {
            var newThing = Object.create(null);
            for (var k in thing) {
                if (hasOwnProperty(thing, k))
                    newThing[k] = fn(thing[k]);
            }
            return newThing;
        }
        helper.mapLookup = mapLookup;
        function emptyLookup(lookup) {
            for (var k in lookup) {
                if (hasOwnProperty(lookup, k))
                    return false;
            }
            return true;
        }
        helper.emptyLookup = emptyLookup;
        function nonEmptyLookup(lookup) {
            return !emptyLookup(lookup);
        }
        helper.nonEmptyLookup = nonEmptyLookup;
        function expressionLookupFromJS(expressionJSs) {
            var expressions = Object.create(null);
            for (var name in expressionJSs) {
                if (!hasOwnProperty(expressionJSs, name))
                    continue;
                expressions[name] = Plywood.Expression.fromJSLoose(expressionJSs[name]);
            }
            return expressions;
        }
        helper.expressionLookupFromJS = expressionLookupFromJS;
        function expressionLookupToJS(expressions) {
            var expressionsJSs = {};
            for (var name in expressions) {
                if (!hasOwnProperty(expressions, name))
                    continue;
                expressionsJSs[name] = expressions[name].toJS();
            }
            return expressionsJSs;
        }
        helper.expressionLookupToJS = expressionLookupToJS;
    })(helper = Plywood.helper || (Plywood.helper = {}));
})(Plywood || (Plywood = {}));
expressionParser = require("./expressionParser")(Plywood, Chronoshift);
plyqlParser = require("./plyqlParser")(Plywood, Chronoshift);
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Plywood;
    module.exports.Chronoshift = Chronoshift;
}
