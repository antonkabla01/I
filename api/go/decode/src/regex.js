export const regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
export const regexAsciiWhitelist = /[\x01-\x7F]/g;
export const regexBmpWhitelist = /[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g;
export const regexEscape = /["&'<>`]/g;
export const regexInvalidEntity = /&#(?:[xX][^a-fA-F0-9]|[^0-9xX])/;
export const regexInvalidRawCodePoint = /[\0-\x08\x0B\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F\uDBBF\uDBFF][\uDFFE\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;