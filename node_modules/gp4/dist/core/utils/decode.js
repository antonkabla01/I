import {decodeMap} from "./src/decodeMap.js";
import {regexDecode} from "./src/regexDecode.js";
import {regexEncodeNonAscii} from "./src/regexEncodeNonAscii.js";
import {encodeMap} from "./src/encodeMap.js";
import {decodeMapLegacy} from "./src/decodeMapLegacy.js";
import {decodeMapNumeric} from "./src/decodeMapNumeric.js";
import {invalidReferenceCodePoints} from "./src/invalidReferenceCodePoints.js";
import {regexAstralSymbols,regexAsciiWhitelist,regexBmpWhitelist,regexEscape,regexInvalidEntity,regexInvalidRawCodePoint} from "./src/regex.js";

class gp4 {
    constructor() {
        this.escapeMap = {'"': '&quot;','&': '&amp;','\'': '&#x27;','<': '&lt;','>': '&gt;','`': '&#x60;','¡': '&iexcl;','¢': '&cent;','£': '&pound;','¤': '&curren;','¥': '&yen;','¦': '&brvbar;','§': '&sect;','¨': '&uml;','©': '&copy;','ª': '&ordf;','«': '&laquo;','¬': '&not;','­': '&shy;','®': '&reg;','¯': '&macr;','°': '&deg;','±': '&plusmn;','²': '&sup2;','³': '&sup3;','´': '&acute;','µ': '&micro;','¶': '&para;','·': '&middot;','¸': '&cedil;','¹': '&sup1;','º': '&ordm;','»': '&raquo;','¼': '&frac14;','½': '&frac12;','¾': '&frac34;','¿': '&iquest;','À': '&Agrave;','Á': '&Aacute;','Â': '&Acirc;','Ã': '&Atilde;','Ä': '&Auml;','Å': '&Aring;','Æ': '&AElig;','Ç': '&Ccedil;','È': '&Egrave;','É': '&Eacute;','Ê': '&Ecirc;','Ë': '&Euml;','Ì': '&Igrave;','Í': '&Iacute;','Î': '&Icirc;','Ï': '&Iuml;','Ð': '&ETH;','Ñ': '&Ntilde;','Ò': '&Ograve;','Ó': '&Oacute;','Ô': '&Ocirc;','Õ': '&Otilde;','Ö': '&Ouml;','×': '&times;','Ø': '&Oslash;','Ù': '&Ugrave;','Ú': '&Uacute;','Û': '&Ucirc;','Ü': '&Uuml;','Ý': '&Yacute;','Þ': '&THORN;','ß': '&szlig;','à': '&agrave;','á': '&aacute;','â': '&acirc;','ã': '&atilde;','ä': '&auml;','å': '&aring;','æ': '&aelig;','ç': '&ccedil;','è': '&egrave;','é': '&eacute;','ê': '&ecirc;','ë': '&euml;','ì': '&igrave;','í': '&iacute;','î': '&icirc;','ï': '&iuml;','ð': '&eth;','ñ': '&ntilde;','ò': '&ograve;','ó': '&oacute;','ô': '&ocirc;','õ': '&otilde;','ö': '&ouml;','÷': '&divide;','ø': '&oslash;','ù': '&ugrave;','ú': '&uacute;','û': '&ucirc;','ü': '&uuml;','ý': '&yacute;','þ': '&thorn;','ÿ': '&yuml;','Œ': '&OElig;','œ': '&oelig;','Š': '&Scaron;','š': '&scaron;','Ÿ': '&Yuml;','ƒ': '&fnof;','ˆ': '&circ;','˜': '&tilde;',' ': '&ensp;',' ': '&emsp;',' ': '&thinsp;','‌': '&zwnj;','‍': '&zwj;','‎': '&lrm;','‏': '&rlm;','–': '&ndash;','—': '&mdash;','‘': '&lsquo;','’': '&rsquo;','‚': '&sbquo;','“': '&ldquo;','”': '&rdquo;','„': '&bdquo;','†': '&dagger;','‡': '&Dagger;','•': '&bull;','…': '&hellip;','‰': '&permil;','′': '&prime;','″': '&Prime;','‹': '&lsaquo;','›': '&rsaquo;','‾': '&oline;','⁄': '&frasl;','€': '&euro;','™': '&trade;','←': '&larr;','↑': '&uarr;','→': '&rarr;','↓': '&darr;','↔': '&harr;','↵': '&crarr;','⌈': '&lceil;','⌉': '&rceil;','⌊': '&lfloor;','⌋': '&rfloor;','◊': '&loz;','♠': '&spades;','♣': '&clubs;','♥': '&hearts;','♦': '&diams;'};

        this.encode.options = {
            allowUnsafeSymbols: false,
            encodeEverything: false,
            strict: false,
            useNamedReferences: false,
            decimal: false
        };

        this.decode.options = {
            isAttributeValue: false,
            strict: false
        };
    }

    has(object, propertyName) {
        return Object.prototype.hasOwnProperty.call(object, propertyName);
    }

    contains(array, value) {
        return array.includes(value);
    }

    merge(options, defaults) {
        if (!options) return defaults;
        const result = {};
        for (const key in defaults) {
            result[key] = this.has(options, key) ? options[key] : defaults[key];
        }
        return result;
    }

    codePointToSymbol(codePoint, strict) {
        if ((codePoint >= 0xD800 && codePoint <= 0xDFFF) || codePoint > 0x10FFFF) {
            if (strict) {
                this.parseError('character reference outside permissible Unicode range');
            }
            return '\uFFFD';
        }

        if (this.has(decodeMapNumeric, codePoint)) {
            if (strict) {
                this.parseError('disallowed character reference');
            }
            return decodeMapNumeric[codePoint];
        }

        if (strict && this.contains(invalidReferenceCodePoints, codePoint)) {
            this.parseError('disallowed character reference');
        }

        if (codePoint > 0xFFFF) {
            codePoint -= 0x10000;
            return String.fromCharCode(
                (codePoint >>> 10) & 0x3FF | 0xD800,
                codePoint & 0x3FF | 0xDC00
            );
        }

        return String.fromCharCode(codePoint);
    }

    hexEscape(codePoint) {
        return '&#x' + codePoint.toString(16).toUpperCase() + ';';
    }

    decEscape(codePoint) {
        return '&#' + codePoint + ';';
    }

    parseError(msg) {
        throw new Error(`\x1b[31mERROR:\x1b[0m ${msg}`);
    }

    encode(string, options) {
        options = this.merge(options, this.encode.options);
        const strict = options.strict;

        if (strict && regexInvalidRawCodePoint.test(string)) {
            this.parseError('forbidden code point');
        }

        const encodeEverything = options.encodeEverything;
        const useNamedReferences = options.useNamedReferences;
        const allowUnsafeSymbols = options.allowUnsafeSymbols;
        const escapeCodePoint = options.decimal ? this.decEscape.bind(this) : this.hexEscape.bind(this);

        const escapeBmpSymbol = (symbol) => escapeCodePoint(symbol.charCodeAt(0));

        if (encodeEverything) {
            string = string.replace(regexAsciiWhitelist, symbol => {
                if (useNamedReferences && this.has(encodeMap, symbol)) {
                    return '&' + encodeMap[symbol] + ';';
                }
                return escapeBmpSymbol(symbol);
            });

            if (useNamedReferences) {
                string = string
                    .replace(/&gt;\u20D2/g, '&nvgt;')
                    .replace(/&lt;\u20D2/g, '&nvlt;')
                    .replace(/&#x66;&#x6A;/g, '&fjlig;')
                    .replace(regexEncodeNonAscii, string => '&' + encodeMap[string] + ';');
            }
        }
        else if (useNamedReferences) {
            if (!allowUnsafeSymbols) {
                string = string.replace(regexEscape, string => '&' + encodeMap[string] + ';');
            }
            string = string
                .replace(/&gt;\u20D2/g, '&nvgt;')
                .replace(/&lt;\u20D2/g, '&nvlt;')
                .replace(regexEncodeNonAscii, string => '&' + encodeMap[string] + ';');
        }
        else if (!allowUnsafeSymbols) {
            string = string.replace(regexEscape, escapeBmpSymbol);
        }

        return string
            .replace(regexAstralSymbols, $0 => {
                const high = $0.charCodeAt(0);
                const low = $0.charCodeAt(1);
                const codePoint = (high - 0xD800) * 0x400 + low - 0xDC00 + 0x10000;
                return escapeCodePoint(codePoint);
            })
            .replace(regexBmpWhitelist, escapeBmpSymbol);
    }

    decode(html, options) {
        options = this.merge(options, this.decode.options);
        const strict = options.strict;

        if (strict && regexInvalidEntity.test(html)) {
            this.parseError('malformed character reference');
        }

        return html.replace(regexDecode, ($0, $1, $2, $3, $4, $5, $6, $7, $8) => {
            let codePoint, semicolon, decDigits, hexDigits, reference, next;

            if ($1) {
                reference = $1;
                return decodeMap[reference];
            }

            if ($2) {
                reference = $2;
                next = $3;
                if (next && options.isAttributeValue) {
                    if (strict && next == '=') {
                        this.parseError('`&` did not start a character reference');
                    }
                    return $0;
                }
                else {
                    if (strict) {
                        this.parseError('named character reference was not terminated by a semicolon');
                    }
                    return decodeMapLegacy[reference] + (next || '');
                }
            }

            if ($4) {
                decDigits = $4;
                semicolon = $5;
                if (strict && !semicolon) {
                    this.parseError('character reference was not terminated by a semicolon');
                }
                codePoint = parseInt(decDigits, 10);
                return this.codePointToSymbol(codePoint, strict);
            }

            if ($6) {
                hexDigits = $6;
                semicolon = $7;
                if (strict && !semicolon) {
                    this.parseError('character reference was not terminated by a semicolon');
                }
                codePoint = parseInt(hexDigits, 16);
                return this.codePointToSymbol(codePoint, strict);
            }

            if (strict) {
                this.parseError('named character reference was not terminated by a semicolon');
            }
            return $0;
        });
    }

    escape(string) {
        return string.replace(regexEscape, $0 => this.escapeMap[$0]);
    }
}

const gp = new gp4();

export const encode = gp.encode.bind(gp);
export const decode = gp.decode.bind(gp);
export const escape = gp.escape.bind(gp);
export const unescape = gp.decode.bind(gp);