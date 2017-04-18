/// <reference path="../typings/q/Q.d.ts" />
/// <reference path="../typings/immutable-class.d.ts" />
/// <reference path="../typings/chronoshift.d.ts" />
/// <reference path="../typings/locator.d.ts" />
/// <reference path="../typings/requester.d.ts" />
/// <reference path="../typings/druid/druid.d.ts" />
interface Lookup<T> {
    [key: string]: T;
}
declare type int = number;
interface Dummy {
}
declare module "plywood" {
    const version: string;
    var isInstanceOf: (thing: any, constructor: any) => boolean;
    var isImmutableClass: (thing: any) => boolean;
    var generalEqual: <T>(a: T, b: T) => boolean;
    var immutableEqual: <T extends ImmutableClass.Equalable>(a: T, b: T) => boolean;
    var immutableArraysEqual: <T extends ImmutableClass.Equalable>(arrayA: T[], arrayB: T[]) => boolean;
    var immutableLookupsEqual: <T extends ImmutableClass.Equalable>(lookupA: {
        [k: string]: T;
    }, lookupB: {
        [k: string]: T;
    }) => boolean;
    export import Class = ImmutableClass.Class;
    export import Instance = ImmutableClass.Instance;
    export import Timezone = Chronoshift.Timezone;
    export import Duration = Chronoshift.Duration;
    export import WallTime = Chronoshift.WallTime;
    var parseISODate: typeof Chronoshift.parseISODate;
    var defaultParserTimezone: Timezone;
    type PlywoodValue = boolean | number | string | Date | NumberRange | TimeRange | Set | Dataset | External;
    interface PseudoDatum {
        [attribute: string]: any;
    }
    interface Datum {
        [attribute: string]: PlywoodValue;
    }
    function safeAdd(num: number, delta: number): number;
    function continuousFloorExpression(variable: string, floorFn: string, size: number, offset: number): string;
    class SQLDialect {
        constructor();
        constantGroupBy(): string;
        escapeName(name: string): string;
        escapeLiteral(name: string): string;
        booleanToSQL(bool: boolean): string;
        numberOrTimeToSQL(x: number | Date): string;
        numberToSQL(num: number): string;
        dateToSQLDateString(date: Date): string;
        timeToSQL(date: Date): string;
        aggregateFilterIfNeeded(inputSQL: string, expressionSQL: string, zeroSQL?: string): string;
        conditionalExpression(condition: string, thenPart: string, elsePart: string): string;
        concatExpression(a: string, b: string): string;
        containsExpression(a: string, b: string): string;
        isNotDistinctFromExpression(a: string, b: string): string;
        regexpExpression(expression: string, regexp: string): string;
        inExpression(operand: string, start: string, end: string, bounds: string): string;
        timeFloorExpression(operand: string, duration: Duration, timezone: Timezone): string;
        timeBucketExpression(operand: string, duration: Duration, timezone: Timezone): string;
        timePartExpression(operand: string, part: string, timezone: Timezone): string;
        timeShiftExpression(operand: string, duration: Duration, timezone: Timezone): string;
        extractExpression(operand: string, regexp: string): string;
    }
    class MySQLDialect extends SQLDialect {
        static TIME_BUCKETING: Lookup<string>;
        static TIME_PART_TO_FUNCTION: Lookup<string>;
        constructor();
        escapeName(name: string): string;
        escapeLiteral(name: string): string;
        timeToSQL(date: Date): string;
        concatExpression(a: string, b: string): string;
        containsExpression(a: string, b: string): string;
        isNotDistinctFromExpression(a: string, b: string): string;
        regexpExpression(expression: string, regexp: string): string;
        utcToWalltime(operand: string, timezone: Timezone): string;
        walltimeToUTC(operand: string, timezone: Timezone): string;
        timeFloorExpression(operand: string, duration: Duration, timezone: Timezone): string;
        timeBucketExpression(operand: string, duration: Duration, timezone: Timezone): string;
        timePartExpression(operand: string, part: string, timezone: Timezone): string;
        timeShiftExpression(operand: string, duration: Duration, timezone: Timezone): string;
        extractExpression(operand: string, regexp: string): string;
    }
    class PostgresDialect extends SQLDialect {
        static TIME_BUCKETING: Lookup<string>;
        static TIME_PART_TO_FUNCTION: Lookup<string>;
        constructor();
        constantGroupBy(): string;
        timeToSQL(date: Date): string;
        conditionalExpression(condition: string, thenPart: string, elsePart: string): string;
        concatExpression(a: string, b: string): string;
        containsExpression(a: string, b: string): string;
        regexpExpression(expression: string, regexp: string): string;
        utcToWalltime(operand: string, timezone: Timezone): string;
        walltimeToUTC(operand: string, timezone: Timezone): string;
        timeFloorExpression(operand: string, duration: Duration, timezone: Timezone): string;
        timeBucketExpression(operand: string, duration: Duration, timezone: Timezone): string;
        timePartExpression(operand: string, part: string, timezone: Timezone): string;
        timeShiftExpression(operand: string, duration: Duration, timezone: Timezone): string;
        extractExpression(operand: string, regexp: string): string;
    }
    function isDate(dt: any): dt is Date;
    function getValueType(value: any): PlyType;
    function getFullType(value: any): FullType;
    function getFullTypeFromDatum(datum: Datum): DatasetFullType;
    function valueFromJS(v: any, typeOverride?: string): any;
    function valueToJS(v: any): any;
    function valueToJSInlineType(v: any): any;
    function datumHasExternal(datum: Datum): boolean;
    function introspectDatum(datum: Datum): Q.Promise<Datum>;
    type PlyTypeSimple = 'NULL' | 'BOOLEAN' | 'NUMBER' | 'TIME' | 'STRING' | 'NUMBER_RANGE' | 'TIME_RANGE' | 'SET' | 'SET/NULL' | 'SET/BOOLEAN' | 'SET/NUMBER' | 'SET/TIME' | 'SET/STRING' | 'SET/NUMBER_RANGE' | 'SET/TIME_RANGE';
    type PlyType = PlyTypeSimple | 'DATASET';
    function isSetType(type: PlyType): boolean;
    function wrapSetType(type: PlyType): PlyType;
    function unwrapSetType(type: PlyType): PlyType;
    interface SimpleFullType {
        type: PlyTypeSimple;
    }
    interface DatasetFullType {
        type: 'DATASET';
        datasetType: Lookup<FullType>;
        parent?: DatasetFullType;
        remote?: boolean;
    }
    type FullType = SimpleFullType | DatasetFullType;
    type Attributes = AttributeInfo[];
    type AttributeJSs = AttributeInfoJS[];
    interface AttributeInfoValue {
        special?: string;
        name: string;
        type?: PlyType;
        datasetType?: Lookup<FullType>;
        unsplitable?: boolean;
        makerAction?: Action;
        separator?: string;
        rangeSize?: number;
        digitsBeforeDecimal?: int;
        digitsAfterDecimal?: int;
    }
    interface AttributeInfoJS {
        special?: string;
        name: string;
        type?: PlyType;
        datasetType?: Lookup<FullType>;
        unsplitable?: boolean;
        makerAction?: ActionJS;
        separator?: string;
        rangeSize?: number;
        digitsBeforeDecimal?: int;
        digitsAfterDecimal?: int;
    }
    class AttributeInfo implements Instance<AttributeInfoValue, AttributeInfoJS> {
        static isAttributeInfo(candidate: any): candidate is AttributeInfo;
        static jsToValue(parameters: AttributeInfoJS): AttributeInfoValue;
        static classMap: Lookup<typeof AttributeInfo>;
        static register(ex: typeof AttributeInfo): void;
        static fromJS(parameters: AttributeInfoJS): AttributeInfo;
        static fromJSs(attributeJSs: AttributeJSs): Attributes;
        static toJSs(attributes: Attributes): AttributeJSs;
        static override(attributes: Attributes, attributeOverrides: Attributes): Attributes;
        special: string;
        name: string;
        type: PlyType;
        datasetType: Lookup<FullType>;
        unsplitable: boolean;
        makerAction: Action;
        constructor(parameters: AttributeInfoValue);
        _ensureSpecial(special: string): void;
        _ensureType(myType: PlyType): void;
        toString(): string;
        valueOf(): AttributeInfoValue;
        toJS(): AttributeInfoJS;
        toJSON(): AttributeInfoJS;
        equals(other: AttributeInfo): boolean;
        serialize(value: any): any;
    }
    class RangeAttributeInfo extends AttributeInfo {
        static fromJS(parameters: AttributeInfoJS): RangeAttributeInfo;
        separator: string;
        rangeSize: number;
        digitsBeforeDecimal: int;
        digitsAfterDecimal: int;
        constructor(parameters: AttributeInfoValue);
        valueOf(): AttributeInfoValue;
        toJS(): AttributeInfoJS;
        equals(other: RangeAttributeInfo): boolean;
        _serializeNumber(value: number): string;
        serialize(range: any): string;
        getMatchingRegExpString(): string;
    }
    class UniqueAttributeInfo extends AttributeInfo {
        static fromJS(parameters: AttributeInfoJS): UniqueAttributeInfo;
        constructor(parameters: AttributeInfoValue);
        serialize(value: any): string;
    }
    class ThetaAttributeInfo extends AttributeInfo {
        static fromJS(parameters: AttributeInfoJS): ThetaAttributeInfo;
        constructor(parameters: AttributeInfoValue);
        serialize(value: any): string;
    }
    class HistogramAttributeInfo extends AttributeInfo {
        static fromJS(parameters: AttributeInfoJS): HistogramAttributeInfo;
        constructor(parameters: AttributeInfoValue);
        serialize(value: any): string;
    }
    type PlywoodRange = Range<number | Date>;
    class Range<T> {
        static DEFAULT_BOUNDS: string;
        static isRange(candidate: any): candidate is PlywoodRange;
        static fromJS(parameters: any): PlywoodRange;
        start: T;
        end: T;
        bounds: string;
        constructor(start: T, end: T, bounds: string);
        toString(): string;
        compare(other: Range<T>): number;
        openStart(): boolean;
        openEnd(): boolean;
        empty(): boolean;
        degenerate(): boolean;
        contains(val: T): boolean;
        intersects(other: Range<T>): boolean;
        adjacent(other: Range<T>): boolean;
        mergeable(other: Range<T>): boolean;
        union(other: Range<T>): Range<T>;
        extent(): Range<T>;
        extend(other: Range<T>): Range<T>;
        intersect(other: Range<T>): Range<T>;
    }
    interface NumberRangeValue {
        start: number;
        end: number;
        bounds?: string;
    }
    interface NumberRangeJS {
        start: any;
        end: any;
        bounds?: string;
    }
    class NumberRange extends Range<number> implements Instance<NumberRangeValue, NumberRangeJS> {
        static type: string;
        static isNumberRange(candidate: any): candidate is NumberRange;
        static numberBucket(num: number, size: number, offset: number): NumberRange;
        static fromNumber(n: number): NumberRange;
        static fromJS(parameters: NumberRangeJS): NumberRange;
        constructor(parameters: NumberRangeValue);
        valueOf(): NumberRangeValue;
        toJS(): NumberRangeJS;
        toJSON(): NumberRangeJS;
        equals(other: NumberRange): boolean;
        midpoint(): number;
    }
    interface SetValue {
        setType: string;
        elements: Array<any>;
    }
    interface SetJS {
        setType: string;
        elements: Array<any>;
    }
    class Set implements Instance<SetValue, SetJS> {
        static type: string;
        static EMPTY: Set;
        static isSet(candidate: any): candidate is Set;
        static convertToSet(thing: any): Set;
        static generalUnion(a: any, b: any): any;
        static generalIntersect(a: any, b: any): any;
        static fromJS(parameters: Array<any>): Set;
        static fromJS(parameters: SetJS): Set;
        setType: string;
        elements: Array<any>;
        private keyFn;
        private hash;
        constructor(parameters: SetValue);
        valueOf(): SetValue;
        toJS(): SetJS;
        toJSON(): SetJS;
        toString(): string;
        equals(other: Set): boolean;
        size(): int;
        empty(): boolean;
        simplify(): any;
        getType(): string;
        upgradeType(): Set;
        downgradeType(): Set;
        extent(): PlywoodRange;
        union(other: Set): Set;
        intersect(other: Set): Set;
        overlap(other: Set): boolean;
        contains(value: any): boolean;
        containsWithin(value: any): boolean;
        add(value: any): Set;
        remove(value: any): Set;
        toggle(value: any): Set;
    }
    interface TimeRangeValue {
        start: Date;
        end: Date;
        bounds?: string;
    }
    interface TimeRangeJS {
        start: Date | string;
        end: Date | string;
        bounds?: string;
    }
    class TimeRange extends Range<Date> implements Instance<TimeRangeValue, TimeRangeJS> {
        static type: string;
        static isTimeRange(candidate: any): candidate is TimeRange;
        static intervalFromDate(date: Date): string;
        static timeBucket(date: Date, duration: Duration, timezone: Timezone): TimeRange;
        static fromTime(t: Date): TimeRange;
        static fromJS(parameters: TimeRangeJS): TimeRange;
        constructor(parameters: TimeRangeValue);
        valueOf(): TimeRangeValue;
        toJS(): TimeRangeJS;
        toJSON(): TimeRangeJS;
        equals(other: TimeRange): boolean;
        toInterval(): string;
        midpoint(): Date;
        isAligned(duration: Duration, timezone: Timezone): boolean;
    }
    function foldContext(d: Datum, c: Datum): Datum;
    interface ComputeFn {
        (d: Datum, c: Datum, index?: number): any;
    }
    interface SplitFns {
        [name: string]: ComputeFn;
    }
    interface ComputePromiseFn {
        (d: Datum, c: Datum): Q.Promise<any>;
    }
    interface DirectionFn {
        (a: any, b: any): number;
    }
    interface Column {
        name: string;
        type: string;
        columns?: Column[];
    }
    interface Formatter extends Lookup<Function> {
        'NULL'?: (v: any) => string;
        'TIME'?: (v: Date) => string;
        'TIME_RANGE'?: (v: TimeRange) => string;
        'SET/TIME'?: (v: Set) => string;
        'SET/TIME_RANGE'?: (v: Set) => string;
        'STRING'?: (v: string) => string;
        'SET/STRING'?: (v: Set) => string;
        'BOOLEAN'?: (v: boolean) => string;
        'NUMBER'?: (v: number) => string;
        'NUMBER_RANGE'?: (v: NumberRange) => string;
        'SET/NUMBER'?: (v: Set) => string;
        'SET/NUMBER_RANGE'?: (v: Set) => string;
        'DATASET'?: (v: Dataset) => string;
    }
    interface FlattenOptions {
        prefixColumns?: boolean;
        order?: string;
        nestingName?: string;
        parentName?: string;
    }
    type FinalLineBreak = 'include' | 'suppress';
    interface TabulatorOptions extends FlattenOptions {
        separator?: string;
        lineBreak?: string;
        finalLineBreak?: FinalLineBreak;
        formatter?: Formatter;
        finalizer?: (v: string) => string;
    }
    interface DatasetValue {
        attributeOverrides?: Attributes;
        attributes?: Attributes;
        keys?: string[];
        data?: Datum[];
        suppress?: boolean;
    }
    interface DatasetJS {
        attributes?: AttributeJSs;
        keys?: string[];
        data?: Datum[];
    }
    class Dataset implements Instance<DatasetValue, any> {
        static type: string;
        static isDataset(candidate: any): candidate is Dataset;
        static getAttributesFromData(data: Datum[]): Attributes;
        static fromJS(parameters: any): Dataset;
        suppress: boolean;
        attributes: Attributes;
        keys: string[];
        data: Datum[];
        constructor(parameters: DatasetValue);
        valueOf(): DatasetValue;
        toJS(): any;
        toString(): string;
        toJSON(): any;
        equals(other: Dataset): boolean;
        hide(): Dataset;
        basis(): boolean;
        hasExternal(): boolean;
        getFullType(): DatasetFullType;
        select(attrs: string[]): Dataset;
        apply(name: string, exFn: ComputeFn, type: PlyType, context: Datum): Dataset;
        applyPromise(name: string, exFn: ComputePromiseFn, type: PlyType, context: Datum): Q.Promise<Dataset>;
        filter(exFn: ComputeFn, context: Datum): Dataset;
        sort(exFn: ComputeFn, direction: string, context: Datum): Dataset;
        limit(limit: number): Dataset;
        count(): int;
        sum(exFn: ComputeFn, context: Datum): number;
        average(exFn: ComputeFn, context: Datum): number;
        min(exFn: ComputeFn, context: Datum): number;
        max(exFn: ComputeFn, context: Datum): number;
        countDistinct(exFn: ComputeFn, context: Datum): number;
        quantile(exFn: ComputeFn, quantile: number, context: Datum): number;
        split(splitFns: SplitFns, datasetName: string, context: Datum): Dataset;
        introspect(): void;
        getExternals(): External[];
        join(other: Dataset): Dataset;
        findDatumByAttribute(attribute: string, value: any): Datum;
        getNestedColumns(): Column[];
        getColumns(options?: FlattenOptions): Column[];
        private _flattenHelper(nestedColumns, prefix, order, nestingName, parentName, nesting, context, flat);
        flatten(options?: FlattenOptions): PseudoDatum[];
        toTabular(tabulatorOptions: TabulatorOptions): string;
        toCSV(tabulatorOptions?: TabulatorOptions): string;
        toTSV(tabulatorOptions?: TabulatorOptions): string;
    }
    interface PostProcess {
        (result: any): PlywoodValue;
    }
    interface NextFn<Q, R> {
        (prevQuery: Q, prevResult: R): Q;
    }
    interface QueryAndPostProcess<T> {
        query: T;
        postProcess: PostProcess;
        next?: NextFn<T, any>;
    }
    interface Inflater {
        (d: Datum, i: number, data: Datum[]): void;
    }
    type QueryMode = "raw" | "value" | "total" | "split";
    interface ExternalValue {
        engine?: string;
        version?: string;
        suppress?: boolean;
        rollup?: boolean;
        attributes?: Attributes;
        attributeOverrides?: Attributes;
        derivedAttributes?: Lookup<Expression>;
        delegates?: External[];
        concealBuckets?: boolean;
        mode?: QueryMode;
        dataName?: string;
        rawAttributes?: Attributes;
        filter?: Expression;
        valueExpression?: ChainExpression;
        select?: SelectAction;
        split?: SplitAction;
        applies?: ApplyAction[];
        sort?: SortAction;
        limit?: LimitAction;
        havingFilter?: Expression;
        table?: string;
        dataSource?: string | string[];
        timeAttribute?: string;
        customAggregations?: CustomDruidAggregations;
        allowEternity?: boolean;
        allowSelectQueries?: boolean;
        introspectionStrategy?: string;
        exactResultsOnly?: boolean;
        context?: Lookup<any>;
        finalizers?: Druid.PostAggregation[];
        requester?: Requester.PlywoodRequester<any>;
    }
    interface ExternalJS {
        engine: string;
        version?: string;
        rollup?: boolean;
        attributes?: AttributeJSs;
        attributeOverrides?: AttributeJSs;
        derivedAttributes?: Lookup<ExpressionJS>;
        filter?: ExpressionJS;
        rawAttributes?: AttributeJSs;
        concealBuckets?: boolean;
        table?: string;
        dataSource?: string | string[];
        timeAttribute?: string;
        customAggregations?: CustomDruidAggregations;
        allowEternity?: boolean;
        allowSelectQueries?: boolean;
        introspectionStrategy?: string;
        exactResultsOnly?: boolean;
        context?: Lookup<any>;
    }
    interface ApplySegregation {
        aggregateApplies: ApplyAction[];
        postAggregateApplies: ApplyAction[];
    }
    interface AttributesAndApplies {
        attributes?: Attributes;
        applies?: ApplyAction[];
    }
    interface IntrospectResult {
        version: string;
        attributes: Attributes;
    }
    class External {
        static type: string;
        static SEGMENT_NAME: string;
        static VALUE_NAME: string;
        static isExternal(candidate: any): candidate is External;
        static extractVersion(v: string): string;
        static versionLessThan(va: string, vb: string): boolean;
        static deduplicateExternals(externals: External[]): External[];
        static makeZeroDatum(applies: ApplyAction[]): Datum;
        static normalizeAndAddApply(attributesAndApplies: AttributesAndApplies, apply: ApplyAction): AttributesAndApplies;
        static segregationAggregateApplies(applies: ApplyAction[]): ApplySegregation;
        static getCommonFilterFromExternals(externals: External[]): Expression;
        static getMergedDerivedAttributesFromExternals(externals: External[]): Lookup<Expression>;
        static getSimpleInflater(splitExpression: Expression, label: string): Inflater;
        static booleanInflaterFactory(label: string): Inflater;
        static timeRangeInflaterFactory(label: string, duration: Duration, timezone: Timezone): Inflater;
        static numberRangeInflaterFactory(label: string, rangeSize: number): Inflater;
        static numberInflaterFactory(label: string): Inflater;
        static timeInflaterFactory(label: string): Inflater;
        static setStringInflaterFactory(label: string): Inflater;
        static jsToValue(parameters: ExternalJS, requester: Requester.PlywoodRequester<any>): ExternalValue;
        static classMap: Lookup<typeof External>;
        static register(ex: typeof External, id?: string): void;
        static fromJS(parameters: ExternalJS, requester?: Requester.PlywoodRequester<any>): External;
        static fromValue(parameters: ExternalValue): External;
        engine: string;
        version: string;
        suppress: boolean;
        rollup: boolean;
        attributes: Attributes;
        attributeOverrides: Attributes;
        derivedAttributes: Lookup<Expression>;
        delegates: External[];
        concealBuckets: boolean;
        rawAttributes: Attributes;
        requester: Requester.PlywoodRequester<any>;
        mode: QueryMode;
        filter: Expression;
        valueExpression: ChainExpression;
        select: SelectAction;
        split: SplitAction;
        dataName: string;
        applies: ApplyAction[];
        sort: SortAction;
        limit: LimitAction;
        havingFilter: Expression;
        constructor(parameters: ExternalValue, dummy?: Dummy);
        valueOf(): ExternalValue;
        toJS(): ExternalJS;
        toJSON(): ExternalJS;
        toString(): string;
        equals(other: External): boolean;
        equalBase(other: External): boolean;
        attachRequester(requester: Requester.PlywoodRequester<any>): External;
        versionBefore(neededVersion: string): boolean;
        getAttributesInfo(attributeName: string): AttributeInfo;
        updateAttribute(newAttribute: AttributeInfo): External;
        show(): External;
        hasAttribute(name: string): boolean;
        expressionDefined(ex: Expression): boolean;
        bucketsConcealed(ex: Expression): boolean;
        canHandleFilter(ex: Expression): boolean;
        canHandleTotal(): boolean;
        canHandleSplit(ex: Expression): boolean;
        canHandleApply(ex: Expression): boolean;
        canHandleSort(sortAction: SortAction): boolean;
        canHandleLimit(limitAction: LimitAction): boolean;
        canHandleHavingFilter(ex: Expression): boolean;
        addDelegate(delegate: External): External;
        getBase(): External;
        getRaw(): External;
        makeTotal(applies: ApplyAction[]): External;
        addAction(action: Action): External;
        private _addFilterAction(action);
        addFilter(expression: Expression): External;
        private _addSelectAction(selectAction);
        private _addSplitAction(splitAction);
        private _addApplyAction(action);
        private _addSortAction(action);
        private _addLimitAction(action);
        private _addAggregateAction(action);
        private _addPostAggregateAction(action);
        prePack(prefix: Expression, myAction: Action): External;
        valueExpressionWithinFilter(withinFilter: Expression): ChainExpression;
        toValueApply(): ApplyAction;
        sortOnLabel(): boolean;
        inlineDerivedAttributes(expression: Expression): Expression;
        inlineDerivedAttributesInAggregate(expression: Expression): Expression;
        switchToRollupCount(expression: Expression): Expression;
        getRollupCountName(): string;
        getQuerySplit(): SplitAction;
        getQueryFilter(): Expression;
        getSelectedAttributes(): Attributes;
        addNextExternal(dataset: Dataset): Dataset;
        getDelegate(): External;
        simulateValue(lastNode: boolean, simulatedQueries: any[], externalForNext?: External): PlywoodValue;
        getQueryAndPostProcess(): QueryAndPostProcess<any>;
        queryValue(lastNode: boolean, externalForNext?: External, req?: any): Q.Promise<PlywoodValue>;
        needsIntrospect(): boolean;
        getIntrospectAttributes(): Q.Promise<IntrospectResult>;
        introspect(): Q.Promise<External>;
        getRawDatasetType(): Lookup<FullType>;
        getFullType(): DatasetFullType;
    }
    interface CustomDruidAggregation {
        aggregation: Druid.Aggregation;
        accessType?: string;
    }
    type CustomDruidAggregations = Lookup<CustomDruidAggregation>;
    interface DruidFilterAndIntervals {
        filter: Druid.Filter;
        intervals: Druid.Intervals;
    }
    interface AggregationsAndPostAggregations {
        aggregations: Druid.Aggregation[];
        postAggregations: Druid.PostAggregation[];
    }
    interface Normalizer {
        (result: any): Datum[];
    }
    interface GranularityInflater {
        granularity: Druid.Granularity;
        inflater: Inflater;
    }
    interface DimensionInflater {
        dimension: Druid.DimensionSpec;
        inflater?: Inflater;
    }
    interface DruidSplit {
        queryType: string;
        timestampLabel?: string;
        granularity: Druid.Granularity | string;
        dimension?: Druid.DimensionSpec;
        dimensions?: Druid.DimensionSpec[];
        postProcess: PostProcess;
    }
    interface IntrospectPostProcess {
        (result: any): Attributes;
    }
    class DruidExternal extends External {
        static type: string;
        static TRUE_INTERVAL: string;
        static FALSE_INTERVAL: string;
        static VALID_INTROSPECTION_STRATEGIES: string[];
        static DEFAULT_INTROSPECTION_STRATEGY: string;
        static SELECT_INIT_LIMIT: number;
        static SELECT_MAX_LIMIT: number;
        static fromJS(parameters: ExternalJS, requester: Requester.PlywoodRequester<any>): DruidExternal;
        static getSourceList(requester: Requester.PlywoodRequester<any>): Q.Promise<string[]>;
        static getVersion(requester: Requester.PlywoodRequester<any>): Q.Promise<string>;
        static movePagingIdentifiers(pagingIdentifiers: Druid.PagingIdentifiers, increment: number): Druid.PagingIdentifiers;
        static TIME_PART_TO_FORMAT: Lookup<string>;
        static TIME_PART_TO_EXPR: Lookup<string>;
        static timePartToExtraction(part: string, timezone: Timezone): Druid.ExtractionFn;
        static SPAN_TO_FLOOR_FORMAT: Lookup<string>;
        static SPAN_TO_PROPERTY: Lookup<string>;
        static timeFloorToExtraction(duration: Duration, timezone: Timezone): Druid.ExtractionFn;
        dataSource: string | string[];
        timeAttribute: string;
        customAggregations: CustomDruidAggregations;
        allowEternity: boolean;
        allowSelectQueries: boolean;
        introspectionStrategy: string;
        exactResultsOnly: boolean;
        context: Lookup<any>;
        constructor(parameters: ExternalValue);
        valueOf(): ExternalValue;
        toJS(): ExternalJS;
        equals(other: DruidExternal): boolean;
        getSingleReferenceAttributeInfo(ex: Expression): AttributeInfo;
        canHandleFilter(ex: Expression): boolean;
        canHandleTotal(): boolean;
        canHandleSplit(ex: Expression): boolean;
        canHandleApply(ex: Expression): boolean;
        canHandleSort(sortAction: SortAction): boolean;
        canHandleLimit(limitAction: LimitAction): boolean;
        canHandleHavingFilter(ex: Expression): boolean;
        isTimeseries(): boolean;
        getDruidDataSource(): Druid.DataSource;
        makeJavaScriptFilter(ex: Expression): Druid.Filter;
        makeExtractionFilter(ex: Expression): Druid.Filter;
        makeSelectorFilter(ex: Expression, value: any): Druid.Filter;
        makeInFilter(ex: Expression, valueSet: Set): Druid.Filter;
        makeBoundFilter(ex: Expression, range: PlywoodRange): Druid.Filter;
        makeRegexFilter(ex: Expression, regex: string): Druid.Filter;
        makeContainsFilter(lhs: Expression, rhs: Expression, compare: string): Druid.Filter;
        timelessFilterToDruid(filter: Expression, aggregatorFilter: boolean): Druid.Filter;
        timeFilterToIntervals(filter: Expression): Druid.Intervals;
        filterToDruid(filter: Expression): DruidFilterAndIntervals;
        isTimeRef(ex: Expression): boolean;
        splitExpressionToGranularityInflater(splitExpression: Expression, label: string): GranularityInflater;
        expressionToExtractionFn(expression: Expression): Druid.ExtractionFn;
        private _expressionToExtractionFns(expression, extractionFns);
        private _processRefExtractionFn(ref, extractionFns);
        actionToExtractionFn(action: Action, fallbackAction: FallbackAction): Druid.ExtractionFn;
        private _processConcatExtractionFn(pattern, extractionFns);
        actionToJavaScriptExtractionFn(action: Action): Druid.ExtractionFn;
        expressionToJavaScriptExtractionFn(ex: Expression): Druid.ExtractionFn;
        getRangeBucketingExtractionFn(attributeInfo: RangeAttributeInfo, numberBucket: NumberBucketAction): Druid.ExtractionFn;
        expressionToDimensionInflater(expression: Expression, label: string): DimensionInflater;
        splitToDruid(split: SplitAction): DruidSplit;
        getAccessTypeForAggregation(aggregationType: string): string;
        getAccessType(aggregations: Druid.Aggregation[], aggregationName: string): string;
        expressionToPostAggregation(ex: Expression, aggregations: Druid.Aggregation[], postAggregations: Druid.PostAggregation[]): Druid.PostAggregation;
        applyToPostAggregation(action: ApplyAction, aggregations: Druid.Aggregation[], postAggregations: Druid.PostAggregation[]): void;
        makeNativeAggregateFilter(filterExpression: Expression, aggregator: Druid.Aggregation): Druid.Aggregation;
        makeStandardAggregation(name: string, aggregateAction: Action): Druid.Aggregation;
        makeCountDistinctAggregation(name: string, action: CountDistinctAction, postAggregations: Druid.PostAggregation[]): Druid.Aggregation;
        makeCustomAggregation(name: string, action: CustomAction): Druid.Aggregation;
        makeQuantileAggregation(name: string, action: QuantileAction, postAggregations: Druid.PostAggregation[]): Druid.Aggregation;
        makeJavaScriptAggregation(name: string, aggregateAction: Action): Druid.Aggregation;
        applyToAggregation(action: ApplyAction, aggregations: Druid.Aggregation[], postAggregations: Druid.PostAggregation[]): void;
        getAggregationsAndPostAggregations(applies: ApplyAction[]): AggregationsAndPostAggregations;
        makeHavingComparison(agg: string, op: string, value: number): Druid.Having;
        inToHavingFilter(agg: string, range: NumberRange): Druid.Having;
        havingFilterToDruid(filter: Expression): Druid.Having;
        isMinMaxTimeApply(apply: ApplyAction): boolean;
        getTimeBoundaryQueryAndPostProcess(): QueryAndPostProcess<Druid.Query>;
        getQueryAndPostProcess(): QueryAndPostProcess<Druid.Query>;
        getIntrospectAttributesWithSegmentMetadata(withAggregators: boolean): Q.Promise<Attributes>;
        getIntrospectAttributesWithGet(): Q.Promise<Attributes>;
        getIntrospectAttributes(): Q.Promise<IntrospectResult>;
    }
    class SQLExternal extends External {
        static type: string;
        static jsToValue(parameters: ExternalJS, requester: Requester.PlywoodRequester<any>): ExternalValue;
        table: string;
        dialect: SQLDialect;
        constructor(parameters: ExternalValue, dialect: SQLDialect);
        valueOf(): ExternalValue;
        toJS(): ExternalJS;
        equals(other: SQLExternal): boolean;
        canHandleFilter(ex: Expression): boolean;
        canHandleTotal(): boolean;
        canHandleSplit(ex: Expression): boolean;
        canHandleApply(ex: Expression): boolean;
        canHandleSort(sortAction: SortAction): boolean;
        canHandleLimit(limitAction: LimitAction): boolean;
        canHandleHavingFilter(ex: Expression): boolean;
        getQueryAndPostProcess(): QueryAndPostProcess<string>;
        getIntrospectAttributes(): Q.Promise<IntrospectResult>;
    }
    class MySQLExternal extends SQLExternal {
        static type: string;
        static fromJS(parameters: ExternalJS, requester: Requester.PlywoodRequester<any>): MySQLExternal;
        static getSourceList(requester: Requester.PlywoodRequester<any>): Q.Promise<string[]>;
        constructor(parameters: ExternalValue);
        getIntrospectAttributes(): Q.Promise<IntrospectResult>;
    }
    class PostgresExternal extends SQLExternal {
        static type: string;
        static fromJS(parameters: ExternalJS, requester: Requester.PlywoodRequester<any>): PostgresExternal;
        static getSourceList(requester: Requester.PlywoodRequester<any>): Q.Promise<string[]>;
        constructor(parameters: ExternalValue);
        getIntrospectAttributes(): Q.Promise<IntrospectResult>;
    }
    interface BooleanExpressionIterator {
        (ex?: Expression, index?: int, depth?: int, nestDiff?: int): boolean;
    }
    interface VoidExpressionIterator {
        (ex?: Expression, index?: int, depth?: int, nestDiff?: int): void;
    }
    interface SubstitutionFn {
        (ex?: Expression, index?: int, depth?: int, nestDiff?: int): Expression;
    }
    interface ExpressionMatchFn {
        (ex?: Expression): boolean;
    }
    interface ActionMatchFn {
        (action?: Action): boolean;
    }
    interface ActionSubstitutionFn {
        (preEx?: Expression, action?: Action): Expression;
    }
    interface DatasetBreakdown {
        singleDatasetActions: ApplyAction[];
        combineExpression: Expression;
    }
    interface Digest {
        expression: Expression;
        undigested: ApplyAction;
    }
    interface Indexer {
        index: int;
    }
    type Alterations = Lookup<Expression>;
    interface SQLParse {
        verb: string;
        rewrite?: string;
        expression?: Expression;
        table?: string;
        database?: string;
        rest?: string;
    }
    interface ExpressionValue {
        op?: string;
        type?: PlyType;
        simple?: boolean;
        value?: any;
        name?: string;
        nest?: int;
        external?: External;
        expression?: Expression;
        actions?: Action[];
        remote?: boolean;
    }
    interface ExpressionJS {
        op: string;
        type?: PlyType;
        value?: any;
        name?: string;
        nest?: int;
        external?: ExternalJS;
        expression?: ExpressionJS;
        action?: ActionJS;
        actions?: ActionJS[];
    }
    interface ExtractAndRest {
        extract: Expression;
        rest: Expression;
    }
    type IfNotFound = "throw" | "leave" | "null";
    interface SubstituteActionOptions {
        onceInChain?: boolean;
    }
    function ply(dataset?: Dataset): LiteralExpression;
    function $(name: string, nest?: number, type?: PlyType): RefExpression;
    function $(name: string, type?: PlyType): RefExpression;
    function r(value: any): LiteralExpression;
    function toJS(thing: any): any;
    class Expression implements Instance<ExpressionValue, ExpressionJS> {
        static NULL: LiteralExpression;
        static ZERO: LiteralExpression;
        static ONE: LiteralExpression;
        static FALSE: LiteralExpression;
        static TRUE: LiteralExpression;
        static EMPTY_STRING: LiteralExpression;
        static EMPTY_SET: LiteralExpression;
        static isExpression(candidate: any): candidate is Expression;
        static parse(str: string, timezone?: Timezone): Expression;
        static parseSQL(str: string, timezone?: Timezone): SQLParse;
        static fromJSLoose(param: any): Expression;
        static inOrIs(lhs: Expression, value: any): Expression;
        static jsNullSafety(lhs: string, rhs: string, combine: (lhs: string, rhs: string) => string, lhsCantBeNull?: boolean, rhsCantBeNull?: boolean): string;
        static and(expressions: Expression[]): Expression;
        static or(expressions: Expression[]): Expression;
        static add(expressions: Expression[]): Expression;
        static subtract(expressions: Expression[]): Expression;
        static multiply(expressions: Expression[]): Expression;
        static power(expressions: Expression[]): Expression;
        static concat(expressions: Expression[]): Expression;
        static classMap: Lookup<typeof Expression>;
        static register(ex: typeof Expression): void;
        static fromJS(expressionJS: ExpressionJS): Expression;
        op: string;
        type: PlyType;
        simple: boolean;
        constructor(parameters: ExpressionValue, dummy?: Dummy);
        valueOf(): ExpressionValue;
        toJS(): ExpressionJS;
        toJSON(): ExpressionJS;
        toString(indent?: int): string;
        equals(other: Expression): boolean;
        canHaveType(wantedType: string): boolean;
        expressionCount(): int;
        isOp(op: string): boolean;
        containsOp(op: string): boolean;
        hasExternal(): boolean;
        getBaseExternals(): External[];
        getRawExternals(): External[];
        getFreeReferences(): string[];
        getFreeReferenceIndexes(): number[];
        incrementNesting(by?: int): Expression;
        simplify(): Expression;
        every(iter: BooleanExpressionIterator, thisArg?: any): boolean;
        _everyHelper(iter: BooleanExpressionIterator, thisArg: any, indexer: Indexer, depth: int, nestDiff: int): boolean;
        some(iter: BooleanExpressionIterator, thisArg?: any): boolean;
        forEach(iter: VoidExpressionIterator, thisArg?: any): void;
        substitute(substitutionFn: SubstitutionFn, thisArg?: any): Expression;
        _substituteHelper(substitutionFn: SubstitutionFn, thisArg: any, indexer: Indexer, depth: int, nestDiff: int): Expression;
        substituteAction(actionMatchFn: ActionMatchFn, actionSubstitutionFn: ActionSubstitutionFn, options?: SubstituteActionOptions, thisArg?: any): Expression;
        getFn(): ComputeFn;
        getJS(datumVar: string): string;
        getJSFn(datumVar?: string): string;
        getSQL(dialect: SQLDialect): string;
        extractFromAnd(matchFn: ExpressionMatchFn): ExtractAndRest;
        breakdownByDataset(tempNamePrefix: string): DatasetBreakdown;
        actionize(containingAction: string): Action[];
        getExpressionPattern(actionType: string): Expression[];
        firstAction(): Action;
        lastAction(): Action;
        headActions(n: int): Expression;
        popAction(): Expression;
        getLiteralValue(): any;
        bumpStringLiteralToTime(): Expression;
        bumpStringLiteralToSetString(): Expression;
        performAction(action: Action, markSimple?: boolean): ChainExpression;
        performActions(actions: Action[], markSimple?: boolean): Expression;
        private _performMultiAction(action, exs);
        add(...exs: any[]): ChainExpression;
        subtract(...exs: any[]): ChainExpression;
        negate(): ChainExpression;
        multiply(...exs: any[]): ChainExpression;
        divide(...exs: any[]): ChainExpression;
        reciprocate(): ChainExpression;
        sqrt(): ChainExpression;
        power(...exs: any[]): ChainExpression;
        fallback(ex: any): ChainExpression;
        is(ex: any): ChainExpression;
        isnt(ex: any): ChainExpression;
        lessThan(ex: any): ChainExpression;
        lessThanOrEqual(ex: any): ChainExpression;
        greaterThan(ex: any): ChainExpression;
        greaterThanOrEqual(ex: any): ChainExpression;
        contains(ex: any, compare?: string): ChainExpression;
        match(re: string): ChainExpression;
        in(start: Date, end: Date): ChainExpression;
        in(start: number, end: number): ChainExpression;
        in(start: string, end: string): ChainExpression;
        in(ex: any): ChainExpression;
        overlap(ex: any): ChainExpression;
        not(): ChainExpression;
        and(...exs: any[]): ChainExpression;
        or(...exs: any[]): ChainExpression;
        substr(position: number, length: number): ChainExpression;
        extract(re: string): ChainExpression;
        concat(...exs: any[]): ChainExpression;
        lookup(lookup: string): ChainExpression;
        numberBucket(size: number, offset?: number): ChainExpression;
        absolute(): ChainExpression;
        timeBucket(duration: any, timezone?: any): ChainExpression;
        timeFloor(duration: any, timezone?: any): ChainExpression;
        timeShift(duration: any, step: number, timezone?: any): ChainExpression;
        timeRange(duration: any, step: number, timezone?: any): ChainExpression;
        timePart(part: string, timezone?: any): ChainExpression;
        filter(ex: any): ChainExpression;
        split(splits: any, dataName?: string): ChainExpression;
        split(ex: any, name: string, dataName?: string): ChainExpression;
        apply(name: string, ex: any): ChainExpression;
        sort(ex: any, direction?: string): ChainExpression;
        limit(limit: number): ChainExpression;
        select(...attributes: string[]): ChainExpression;
        count(): ChainExpression;
        sum(ex: any): ChainExpression;
        min(ex: any): ChainExpression;
        max(ex: any): ChainExpression;
        average(ex: any): ChainExpression;
        countDistinct(ex: any): ChainExpression;
        quantile(ex: any, quantile: number): ChainExpression;
        custom(custom: string): ChainExpression;
        join(ex: any): ChainExpression;
        defineEnvironment(environment: Environment): Expression;
        referenceCheck(context: Datum): Expression;
        definedInTypeContext(typeContext: DatasetFullType): boolean;
        referenceCheckInTypeContext(typeContext: DatasetFullType): Expression;
        _fillRefSubstitutions(typeContext: DatasetFullType, indexer: Indexer, alterations: Alterations): FullType;
        resolve(context: Datum, ifNotFound?: IfNotFound): Expression;
        resolveWithExpressions(expressions: Lookup<Expression>, ifNotFound?: IfNotFound): Expression;
        resolved(): boolean;
        contained(): boolean;
        decomposeAverage(countEx?: Expression): Expression;
        distribute(): Expression;
        maxPossibleSplitValues(): number;
        private _initialPrepare(context, environment);
        simulate(context?: Datum, environment?: Environment): PlywoodValue;
        simulateQueryPlan(context?: Datum, environment?: Environment): any[];
        _computeResolvedSimulate(lastNode: boolean, simulatedQueries: any[]): PlywoodValue;
        compute(context?: Datum, environment?: Environment, req?: any): Q.Promise<PlywoodValue>;
        _computeResolved(lastNode: boolean, req?: any): Q.Promise<PlywoodValue>;
    }
    class LiteralExpression extends Expression {
        static fromJS(parameters: ExpressionJS): LiteralExpression;
        value: any;
        constructor(parameters: ExpressionValue);
        valueOf(): ExpressionValue;
        toJS(): ExpressionJS;
        toString(): string;
        getFn(): ComputeFn;
        getJS(datumVar: string): string;
        getSQL(dialect: SQLDialect): string;
        equals(other: LiteralExpression): boolean;
        _fillRefSubstitutions(typeContext: DatasetFullType, indexer: Indexer, alterations: Alterations): FullType;
        getLiteralValue(): any;
        _computeResolvedSimulate(): PlywoodValue;
        _computeResolved(): Q.Promise<PlywoodValue>;
        maxPossibleSplitValues(): number;
        bumpStringLiteralToTime(): Expression;
        bumpStringLiteralToSetString(): Expression;
    }
    const POSSIBLE_TYPES: Lookup<number>;
    class RefExpression extends Expression {
        static SIMPLE_NAME_REGEXP: RegExp;
        static fromJS(parameters: ExpressionJS): RefExpression;
        static parse(str: string): RefExpression;
        static validType(typeName: string): boolean;
        static toSimpleName(variableName: string): string;
        nest: int;
        name: string;
        remote: boolean;
        constructor(parameters: ExpressionValue);
        valueOf(): ExpressionValue;
        toJS(): ExpressionJS;
        toString(): string;
        getFn(): ComputeFn;
        getJS(datumVar: string): string;
        getSQL(dialect: SQLDialect, minimal?: boolean): string;
        equals(other: RefExpression): boolean;
        isRemote(): boolean;
        _fillRefSubstitutions(typeContext: DatasetFullType, indexer: Indexer, alterations: Alterations): FullType;
        incrementNesting(by?: int): RefExpression;
        maxPossibleSplitValues(): number;
    }
    class ExternalExpression extends Expression {
        static fromJS(parameters: ExpressionJS): Expression;
        external: External;
        constructor(parameters: ExpressionValue);
        valueOf(): ExpressionValue;
        toJS(): ExpressionJS;
        toString(): string;
        getFn(): ComputeFn;
        equals(other: ExternalExpression): boolean;
        _fillRefSubstitutions(typeContext: DatasetFullType, indexer: Indexer, alterations: Alterations): FullType;
        _computeResolvedSimulate(lastNode: boolean, simulatedQueries: any[]): PlywoodValue;
        _computeResolved(lastNode: boolean, req?: any): Q.Promise<PlywoodValue>;
        unsuppress(): ExternalExpression;
        addAction(action: Action): ExternalExpression;
        maxPossibleSplitValues(): number;
    }
    class ChainExpression extends Expression {
        static fromJS(parameters: ExpressionJS): ChainExpression;
        expression: Expression;
        actions: Action[];
        constructor(parameters: ExpressionValue);
        valueOf(): ExpressionValue;
        toJS(): ExpressionJS;
        toString(indent?: int): string;
        equals(other: ChainExpression): boolean;
        expressionCount(): int;
        getFn(): ComputeFn;
        getJS(datumVar: string): string;
        getSQL(dialect: SQLDialect): string;
        getSingleAction(neededAction?: string): Action;
        foldIntoExternal(): Expression;
        simplify(): Expression;
        _everyHelper(iter: BooleanExpressionIterator, thisArg: any, indexer: Indexer, depth: int, nestDiff: int): boolean;
        _substituteHelper(substitutionFn: SubstitutionFn, thisArg: any, indexer: Indexer, depth: int, nestDiff: int): Expression;
        performAction(action: Action, markSimple?: boolean): ChainExpression;
        _fillRefSubstitutions(typeContext: DatasetFullType, indexer: Indexer, alterations: Alterations): FullType;
        actionize(containingAction: string): Action[];
        firstAction(): Action;
        lastAction(): Action;
        headActions(n: int): Expression;
        popAction(): Expression;
        _computeResolvedSimulate(lastNode: boolean, simulatedQueries: any[]): PlywoodValue;
        _computeResolved(req?: any, req2?: any): Q.Promise<PlywoodValue>;
        extractFromAnd(matchFn: ExpressionMatchFn): ExtractAndRest;
        maxPossibleSplitValues(): number;
    }
    interface Splits {
        [name: string]: Expression;
    }
    interface SplitsJS {
        [name: string]: ExpressionJS;
    }
    interface ActionValue {
        action?: string;
        name?: string;
        dataName?: string;
        expression?: Expression;
        splits?: Splits;
        direction?: string;
        limit?: int;
        size?: number;
        offset?: number;
        duration?: Duration;
        timezone?: Timezone;
        part?: string;
        step?: number;
        position?: int;
        length?: int;
        regexp?: string;
        quantile?: number;
        selector?: string;
        prop?: Lookup<any>;
        custom?: string;
        compare?: string;
        lookup?: string;
        attributes?: string[];
        simple?: boolean;
    }
    interface ActionJS {
        action?: string;
        name?: string;
        dataName?: string;
        expression?: ExpressionJS;
        splits?: SplitsJS;
        direction?: string;
        limit?: int;
        size?: number;
        offset?: number;
        duration?: string;
        timezone?: string;
        part?: string;
        step?: number;
        position?: int;
        length?: int;
        regexp?: string;
        quantile?: number;
        selector?: string;
        prop?: Lookup<any>;
        custom?: string;
        compare?: string;
        lookup?: string;
        attributes?: string[];
    }
    interface Environment {
        timezone?: Timezone;
    }
    class Action implements Instance<ActionValue, ActionJS> {
        static jsToValue(parameters: ActionJS): ActionValue;
        static actionsDependOn(actions: Action[], name: string): boolean;
        static isAction(candidate: any): candidate is Action;
        static classMap: Lookup<typeof Action>;
        static register(act: typeof Action): void;
        static fromJS(actionJS: ActionJS): Action;
        action: string;
        expression: Expression;
        simple: boolean;
        constructor(parameters: ActionValue, dummy?: Dummy);
        toString(indent?: int): string;
        valueOf(): ActionValue;
        toJS(): ActionJS;
        toJSON(): ActionJS;
        equals(other: Action): boolean;
        isAggregate(): boolean;
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
        getFn(inputFn: ComputeFn): ComputeFn;
        getJS(inputJS: string, datumVar: string): string;
        getSQL(inputSQL: string, dialect: SQLDialect): string;
        expressionCount(): int;
        fullyDefined(): boolean;
        simplify(): Action;
        performOnSimple(simpleExpression: Expression): Expression;
        getExpressions(): Expression[];
        getFreeReferences(): string[];
        _everyHelper(iter: BooleanExpressionIterator, thisArg: any, indexer: Indexer, depth: int, nestDiff: int): boolean;
        substitute(substitutionFn: SubstitutionFn, thisArg?: any): Action;
        _substituteHelper(substitutionFn: SubstitutionFn, thisArg: any, indexer: Indexer, depth: int, nestDiff: int): Action;
        canDistribute(): boolean;
        distribute(preEx: Expression): Expression;
        changeExpression(newExpression: Expression): Action;
        isNester(): boolean;
        getLiteralValue(): any;
        maxPossibleSplitValues(): number;
        needsEnvironment(): boolean;
        defineEnvironment(environment: Environment): Action;
        getTimezone(): Timezone;
        alignsWith(actions: Action[]): boolean;
    }
    class AbsoluteAction extends Action {
        static fromJS(parameters: ActionJS): AbsoluteAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType): FullType;
    }
    class AddAction extends Action {
        static fromJS(parameters: ActionJS): AddAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
    }
    class AndAction extends Action {
        static fromJS(parameters: ActionJS): AndAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
    }
    class ApplyAction extends Action {
        static fromJS(parameters: ActionJS): ApplyAction;
        name: string;
        constructor(parameters?: ActionValue);
        valueOf(): ActionValue;
        toJS(): ActionJS;
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
        equals(other: ApplyAction): boolean;
        isSimpleAggregate(): boolean;
        isNester(): boolean;
    }
    class AverageAction extends Action {
        static fromJS(parameters: ActionJS): AverageAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
        isAggregate(): boolean;
        isNester(): boolean;
    }
    class ConcatAction extends Action {
        static fromJS(parameters: ActionJS): ConcatAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
    }
    class ContainsAction extends Action {
        static NORMAL: string;
        static IGNORE_CASE: string;
        static fromJS(parameters: ActionJS): ContainsAction;
        compare: string;
        constructor(parameters: ActionValue);
        valueOf(): ActionValue;
        toJS(): ActionJS;
        equals(other: ContainsAction): boolean;
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
    }
    class CountAction extends Action {
        static fromJS(parameters: ActionJS): CountAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(): FullType;
        getFn(inputFn: ComputeFn): ComputeFn;
        isAggregate(): boolean;
    }
    class CountDistinctAction extends Action {
        static fromJS(parameters: ActionJS): CountDistinctAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
        isAggregate(): boolean;
        isNester(): boolean;
    }
    class CustomAction extends Action {
        static fromJS(parameters: ActionJS): CustomAction;
        custom: string;
        constructor(parameters: ActionValue);
        valueOf(): ActionValue;
        toJS(): ActionJS;
        equals(other: CustomAction): boolean;
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
        getFn(inputFn: ComputeFn): ComputeFn;
        isAggregate(): boolean;
    }
    class DivideAction extends Action {
        static fromJS(parameters: ActionJS): DivideAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
    }
    class ExtractAction extends Action {
        static fromJS(parameters: ActionJS): ExtractAction;
        regexp: string;
        constructor(parameters: ActionValue);
        valueOf(): ActionValue;
        toJS(): ActionJS;
        equals(other: MatchAction): boolean;
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
    }
    class FallbackAction extends Action {
        static fromJS(parameters: ActionJS): FallbackAction;
        constructor(parameters?: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
    }
    class FilterAction extends Action {
        static fromJS(parameters: ActionJS): FilterAction;
        constructor(parameters?: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
        isNester(): boolean;
    }
    class GreaterThanAction extends Action {
        static fromJS(parameters: ActionJS): GreaterThanAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
    }
    class GreaterThanOrEqualAction extends Action {
        static fromJS(parameters: ActionJS): GreaterThanOrEqualAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
    }
    class InAction extends Action {
        static fromJS(parameters: ActionJS): InAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
        private _performOnSimpleWhatever(ex);
    }
    class IsAction extends Action {
        static fromJS(parameters: ActionJS): IsAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
    }
    class JoinAction extends Action {
        static fromJS(parameters: ActionJS): JoinAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
    }
    class LessThanAction extends Action {
        static fromJS(parameters: ActionJS): LessThanAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
    }
    class LessThanOrEqualAction extends Action {
        static fromJS(parameters: ActionJS): LessThanOrEqualAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
    }
    class LookupAction extends Action {
        static fromJS(parameters: ActionJS): LookupAction;
        lookup: string;
        constructor(parameters: ActionValue);
        valueOf(): ActionValue;
        toJS(): ActionJS;
        equals(other: LookupAction): boolean;
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType): FullType;
        fullyDefined(): boolean;
    }
    class LimitAction extends Action {
        static fromJS(parameters: ActionJS): LimitAction;
        limit: int;
        constructor(parameters?: ActionValue);
        valueOf(): ActionValue;
        toJS(): ActionJS;
        equals(other: LimitAction): boolean;
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
    }
    class MatchAction extends Action {
        static likeToRegExp(like: string, escapeChar?: string): string;
        static fromJS(parameters: ActionJS): MatchAction;
        regexp: string;
        constructor(parameters: ActionValue);
        valueOf(): ActionValue;
        toJS(): ActionJS;
        equals(other: MatchAction): boolean;
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(): FullType;
    }
    class MaxAction extends Action {
        static fromJS(parameters: ActionJS): MaxAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
        isAggregate(): boolean;
        isNester(): boolean;
    }
    class MinAction extends Action {
        static fromJS(parameters: ActionJS): MinAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
        isAggregate(): boolean;
        isNester(): boolean;
    }
    class MultiplyAction extends Action {
        static fromJS(parameters: ActionJS): MultiplyAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
    }
    class NotAction extends Action {
        static fromJS(parameters: ActionJS): NotAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType): FullType;
    }
    class NumberBucketAction extends Action {
        static fromJS(parameters: ActionJS): NumberBucketAction;
        size: number;
        offset: number;
        constructor(parameters: ActionValue);
        valueOf(): ActionValue;
        toJS(): ActionJS;
        equals(other: NumberBucketAction): boolean;
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(): FullType;
    }
    class OrAction extends Action {
        static fromJS(parameters: ActionJS): OrAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
    }
    class OverlapAction extends Action {
        static fromJS(parameters: ActionJS): OverlapAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
        private _performOnSimpleWhatever(ex);
    }
    class PowerAction extends Action {
        static fromJS(parameters: ActionJS): PowerAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
    }
    class QuantileAction extends Action {
        static fromJS(parameters: ActionJS): QuantileAction;
        quantile: number;
        constructor(parameters: ActionValue);
        valueOf(): ActionValue;
        toJS(): ActionJS;
        equals(other: QuantileAction): boolean;
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
        isAggregate(): boolean;
        isNester(): boolean;
    }
    class SelectAction extends Action {
        static fromJS(parameters: ActionJS): SelectAction;
        attributes: string[];
        constructor(parameters?: ActionValue);
        valueOf(): ActionValue;
        toJS(): ActionJS;
        equals(other: SelectAction): boolean;
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
    }
    class SortAction extends Action {
        static DESCENDING: string;
        static ASCENDING: string;
        static fromJS(parameters: ActionJS): SortAction;
        direction: string;
        constructor(parameters?: ActionValue);
        valueOf(): ActionValue;
        toJS(): ActionJS;
        equals(other: SortAction): boolean;
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
        refName(): string;
        isNester(): boolean;
        toggleDirection(): SortAction;
    }
    class SplitAction extends Action {
        static fromJS(parameters: ActionJS): SplitAction;
        keys: string[];
        splits: Splits;
        dataName: string;
        constructor(parameters: ActionValue);
        valueOf(): ActionValue;
        toJS(): ActionJS;
        equals(other: SplitAction): boolean;
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
        getFn(inputFn: ComputeFn): ComputeFn;
        getSQL(inputSQL: string, dialect: SQLDialect): string;
        getSelectSQL(dialect: SQLDialect): string[];
        getShortGroupBySQL(): string;
        expressionCount(): int;
        fullyDefined(): boolean;
        simplify(): Action;
        getExpressions(): Expression[];
        _substituteHelper(substitutionFn: SubstitutionFn, thisArg: any, indexer: Indexer, depth: int, nestDiff: int): Action;
        isNester(): boolean;
        numSplits(): number;
        isMultiSplit(): boolean;
        mapSplits<T>(fn: (name: string, expression?: Expression) => T): T[];
        mapSplitExpressions<T>(fn: (expression: Expression, name?: string) => T): Lookup<T>;
        transformExpressions(fn: (expression: Expression, name?: string) => Expression): SplitAction;
        firstSplitName(): string;
        firstSplitExpression(): Expression;
        filterFromDatum(datum: Datum): Expression;
        hasKey(key: string): boolean;
        maxBucketNumber(): number;
        isAggregate(): boolean;
    }
    class SubstrAction extends Action {
        static fromJS(parameters: ActionJS): SubstrAction;
        position: int;
        length: int;
        constructor(parameters: ActionValue);
        valueOf(): ActionValue;
        toJS(): ActionJS;
        equals(other: SubstrAction): boolean;
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType): FullType;
    }
    class SubtractAction extends Action {
        static fromJS(parameters: ActionJS): SubtractAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
    }
    class SumAction extends Action {
        static fromJS(parameters: ActionJS): SumAction;
        constructor(parameters: ActionValue);
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType;
        isAggregate(): boolean;
        isNester(): boolean;
        canDistribute(): boolean;
        distribute(preEx: Expression): Expression;
    }
    class TimeBucketAction extends Action {
        static fromJS(parameters: ActionJS): TimeBucketAction;
        duration: Duration;
        timezone: Timezone;
        constructor(parameters: ActionValue);
        valueOf(): ActionValue;
        toJS(): ActionJS;
        equals(other: TimeBucketAction): boolean;
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(): FullType;
        needsEnvironment(): boolean;
        defineEnvironment(environment: Environment): Action;
        getTimezone(): Timezone;
    }
    class TimeFloorAction extends Action {
        static fromJS(parameters: ActionJS): TimeFloorAction;
        duration: Duration;
        timezone: Timezone;
        constructor(parameters: ActionValue);
        valueOf(): ActionValue;
        toJS(): ActionJS;
        equals(other: TimeBucketAction): boolean;
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(): FullType;
        needsEnvironment(): boolean;
        defineEnvironment(environment: Environment): Action;
        getTimezone(): Timezone;
        alignsWith(actions: Action[]): boolean;
    }
    class TimePartAction extends Action {
        static fromJS(parameters: ActionJS): TimePartAction;
        part: string;
        timezone: Timezone;
        constructor(parameters: ActionValue);
        valueOf(): ActionValue;
        toJS(): ActionJS;
        equals(other: TimePartAction): boolean;
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(): FullType;
        maxPossibleSplitValues(): number;
        needsEnvironment(): boolean;
        defineEnvironment(environment: Environment): Action;
        getTimezone(): Timezone;
    }
    class TimeRangeAction extends Action {
        static DEFAULT_STEP: number;
        static fromJS(parameters: ActionJS): TimeRangeAction;
        duration: Duration;
        step: number;
        timezone: Timezone;
        constructor(parameters: ActionValue);
        valueOf(): ActionValue;
        toJS(): ActionJS;
        equals(other: TimeRangeAction): boolean;
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(): FullType;
        needsEnvironment(): boolean;
        defineEnvironment(environment: Environment): Action;
        getTimezone(): Timezone;
    }
    class TimeShiftAction extends Action {
        static DEFAULT_STEP: number;
        static fromJS(parameters: ActionJS): TimeShiftAction;
        duration: Duration;
        step: number;
        timezone: Timezone;
        constructor(parameters: ActionValue);
        valueOf(): ActionValue;
        toJS(): ActionJS;
        equals(other: TimeShiftAction): boolean;
        getOutputType(inputType: PlyType): PlyType;
        _fillRefSubstitutions(): FullType;
        needsEnvironment(): boolean;
        defineEnvironment(environment: Environment): Action;
        getTimezone(): Timezone;
    }
    interface Executor {
        (ex: Expression, env?: Environment, req?: any): Q.Promise<PlywoodValue>;
    }
    interface BasicExecutorParameters {
        datasets: Datum;
    }
    function basicExecutorFactory(parameters: BasicExecutorParameters): Executor;
    module helper {
        interface SimpleLocatorParameters {
            resource: string;
            defaultPort?: int;
        }
        function simpleLocator(parameters: string): Locator.PlywoodLocator;
        function simpleLocator(parameters: SimpleLocatorParameters): Locator.PlywoodLocator;
    }
    module helper {
        interface VerboseRequesterParameters<T> {
            requester: Requester.PlywoodRequester<T>;
            printLine?: (line: string) => void;
            preQuery?: (query: any) => void;
            onSuccess?: (data: any, time: number, query: any) => void;
            onError?: (error: Error, time: number, query: any) => void;
        }
        function verboseRequesterFactory<T>(parameters: VerboseRequesterParameters<T>): Requester.PlywoodRequester<any>;
    }
    module helper {
        interface RetryRequesterParameters<T> {
            requester: Requester.PlywoodRequester<T>;
            delay?: number;
            retry?: int;
            retryOnTimeout?: boolean;
        }
        function retryRequester<T>(parameters: RetryRequesterParameters<T>): Requester.PlywoodRequester<T>;
        function retryRequesterFactory<T>(parameters: RetryRequesterParameters<T>): Requester.PlywoodRequester<T>;
    }
    module helper {
        interface ConcurrentLimitRequesterParameters<T> {
            requester: Requester.PlywoodRequester<T>;
            concurrentLimit: int;
        }
        function concurrentLimitRequesterFactory<T>(parameters: ConcurrentLimitRequesterParameters<T>): Requester.PlywoodRequester<T>;
    }
    module helper {
        function promiseWhile(condition: () => boolean, action: () => Q.Promise<any>): Q.Promise<any>;
    }
    module helper {
        function parseJSON(text: string): any[];
        function find<T>(array: T[], fn: (value: T, index: int, array: T[]) => boolean): T;
        function findIndex<T>(array: T[], fn: (value: T, index: int, array: T[]) => boolean): int;
        interface Nameable {
            name: string;
        }
        function findByName<T extends Nameable>(array: T[], name: string): T;
        function findIndexByName<T extends Nameable>(array: T[], name: string): int;
        function overrideByName<T extends Nameable>(things: T[], thingOverride: T): T[];
        function overridesByName<T extends Nameable>(things: T[], thingOverrides: T[]): T[];
        function shallowCopy<T>(thing: Lookup<T>): Lookup<T>;
        function deduplicateSort(a: string[]): string[];
        function mapLookup<T, U>(thing: Lookup<T>, fn: (x: T) => U): Lookup<U>;
        function emptyLookup(lookup: Lookup<any>): boolean;
        function nonEmptyLookup(lookup: Lookup<any>): boolean;
        function expressionLookupFromJS(expressionJSs: Lookup<ExpressionJS>): Lookup<Expression>;
        function expressionLookupToJS(expressions: Lookup<Expression>): Lookup<ExpressionJS>;
    }
}

