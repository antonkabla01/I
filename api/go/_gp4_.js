import gp4 from 'gp4';
import { decode } from 'gp4';

export class InfoExtractor {
    constructor() {
        this.formats = [];
        this.inputValue = m => m ? m.match(/^(https?:\/\/[^/]+)/)?.[1] : null;
        this.Reg = (val, { v = 'i' } ={}) => new RegExp(val.replace(/\s+/g,''),v);
        this.os = {
            fm_err: (name, style) => `[${style}: ${name}]`,
            Styles: {
                EMPHASIS: 'emphasis',
            }
        };
    }

    static ie_key() {
        return this.name.replace(/IE$/, '');
    }

    static get IE_NAME() {
        return this.name.replace(/IE$/, '');
    }

    url_or_none(url) {
        if (!url || typeof url !== 'string') return null;
        url = url.trim()
            .replace(/\\\//g, '/')
            .replace(/\\\\/g, '\\');
        const regex = new RegExp('^(?:(?:https?|rt(?:m(?:pt?[es]?|fp)|sp[su]?)|mms|ftps?):)?//', 'i');
        return regex.test(url) ? url : null;
    }

    async download(url) {
        return gp4.get(url, {
            headers: {
                "User-Agent": "facebookexternalhit/1.1",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-us,en;q=0.5",
                "Sec-Fetch-Mode": "navigate",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(i => i.x ?? null)
    }

    m_id(url) {
        const m = this.VALID_URL.exec(
            /%[0-9A-F]{2}/i.test(url) ? decodeURIComponent(url) : url
        );
        if (!m) {
            throw new Error(`Unsupported URL: ${this.inputValue(m)}`);
            return null;
        }
        return m ? m.groups?.id : m[1];
    }

    url_result(url, options = {}) {
        const {
            ie = null,
            video_id = null,
            video_title = null,
            url_transparent = false,
            ...kwargs
        } = options;

        if (ie !== null) {
            kwargs.ie_key = typeof ie === 'string' ? ie : ie.ie_key();
        }
        if (video_id !== null) {
            kwargs.id = video_id;
        }
        if (video_title !== null) {
            kwargs.title = video_title;
        }

        return {
            ...kwargs,
            _type: url_transparent ? 'url_transparent' : 'url',
            url,
        };
    }

    flagsToString(flags) {
        const flagMap = {
            1: 'i',
            2: 'm',
            4: 's',
            8: 'u',
            16: 'x',
        };
        let result = '';
        for (const [value, flag] of Object.entries(flagMap)) {
            if (flags & Number(value)) {
                result += flag;
            }
        }
        return result;
    }

    _meta_regexes(prop, {
        noPrefix = null,
        prefix = null
    } = {}) {
        const esp = prop.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const ia = ["og", "fb", "twitter", "article", "video"]

        const _prefix = prefix
            ? prefix
            : `(?:${ia.join('|')})`;

        const content_re = 'content\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^"\'\\s>=]+))';
        const tr = '(?:itemprop|name|property)';

        const property_re = noPrefix
            ? `${tr}\\s*=\\s*(?:"${esp}"|'${esp}'|${esp}(?:\\s|>|/))`
            : `${tr}\\s*=\\s*(?:"${_prefix}:${esp}"|'${_prefix}:${esp}'|${_prefix}:${esp}(?:\\s|>|/))`;

        return [
            `<meta\\b[^>]+?${property_re}[^>]+?${content_re}[^>]*>`,
            `<meta\\b[^>]+?${content_re}[^>]+?${property_re}[^>]*>`,
            `<meta\\b[^>]+?${property_re}[^>]*\\/>`,
            `<meta\\b[^>]+?${property_re}[^>]*>`
        ];
    }

    ms_to_hours(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const hasHour = hours > 0 || days > 0;

        const timeStr = (hasHour ? `${String(hours).padStart(2, '0')}:` : '') +
            `${String(minutes).padStart(2, '0')}:` +
            `${String(seconds).padStart(2, '0')}`;

        return days > 0 ? `${days}d ${timeStr}` : timeStr;
    }

    traverse(html, {
        key = [],
        default: def = null,
        type = 'json',
        path = [],
        safeParse = true,
        maxScan = 20_000,
        filter = null,
        group = 1
    } = {}) {
        const keys = Array.isArray(key) ? key : [key];
        let parsed;
        let results = [];

        for (const currentKey of keys) {
            const regex = new RegExp(`"${currentKey}"\\s*:\\s*{`, 'g');
            let match;

            while ((match = regex.exec(html))) {
                let start = html.indexOf('{', match.index);
                if (start === -1) continue;

                let depth = 0, end = -1;
                for (let i = start; i < html.length && i - start < maxScan; i++) {
                    if (html[i] === '{') depth++;
                    else if (html[i] === '}') depth--;
                    if (depth === 0) {
                        end = i + 1;
                        break;
                    }
                }
                if (end === -1) continue;

                const raw = html.slice(start, end);
                try {
                    parsed = JSON.parse(raw);
                }
                catch (e) {
                    if (!safeParse) continue;
                    try {
                        const re = new RegExp(',\\s*}', g)
                        const fixed = raw.replace(re, '}').replace(/,\s*]/g, ']');
                        parsed = JSON.parse(fixed);
                    }
                    catch {
                        continue;
                    }
                }

                if (!parsed) continue;
                if (!path || path.length === 0) {
                    if (group) return parsed;
                    results.push(parsed);
                    continue;
                }

                let value = parsed;
                for (const p of path) {
                    if (value === undefined || value === null) break;
                    if (Array.isArray(value) && typeof p === 'number') {
                        value = value[p];
                    }
                    else if (typeof value === 'object' && p in value) {
                       value = value[p];
                    }
                    else {
                        value = undefined;
                        break;
                    }
                }

                if (value !== undefined) {
                    const finalVal = typeof filter === 'function' ? filter(value) : value;
                    if (group) return finalVal;
                    results.push(finalVal);
                }
            }

            if (group && results.length > 0) break;
        }

        if (results.length > 0) return results.length === 1 ? results[0] : results;
        if (Array.isArray(def)) {
            for (const alt of def) {
                let v = parsed;
                for (const p of alt) {
                    if (v && typeof v === 'object' && p in v) {
                        v = v[p];
                    }
                    else {
                        v = undefined;
                        break;
                    }
                }
                if (v !== undefined)
                    return typeof filter === 'function' ? filter(v) : v;
            }
            return null;
        }
        else if (typeof def === 'function') {
            return def(parsed);
        }
        else {
            return def;
        }
    }

    timestamp(ts) {
        return new Date(ts * 1000).toLocaleString('sv-SE').replace(' ', ' ');
    }

    search(pattern, string, name, {
        default: def = null,
        fatal = false,
        flags = 0,
        group = 1,
        json = true,
        filter = null,
        get = null
    } = {}) {
        let mobj = null;

        if (string == null) {
            mobj = null;
        }
        else if (typeof pattern === 'string' || pattern instanceof RegExp) {
            mobj = string.match(new RegExp(pattern, this.flagsToString(flags)));
        }
        else if (Array.isArray(pattern)) {
            for (const p of pattern) {
                mobj = string.match(new RegExp(p, this.flagsToString(flags)));
                if (mobj) break;
            }
        }

        const _name = this.os?.fm_err?.(name, this.os?.Styles?.EMPHASIS) ?? name;

        if (mobj) {
            let result;

            if (group === null) {
                for (let i = 1; i < mobj.length; i++) {
                    if (mobj[i] !== undefined) {
                        result = decode(mobj[i]);
                        break;
                    }
                }
                result = result || null;
            }
            else if (Array.isArray(group)) {
                result = decode(group.map(g => mobj[g]));
            }
            else {
                result = decode(mobj[group] ?? '');
            }

            if (typeof filter === 'function') {
                try {
                    result = filter(result);
                }
                catch (e) {
                    if (fatal) throw new Error(`Filter error on ${_name}: ${e.message}`);
                    else console.warn(`Filter error on ${_name}, returning unfiltered value`);
                }
            }

            if (json && result) {
                try {
                    if (typeof result === 'string' && (result.trim().startsWith('{') || result.trim().startsWith('['))) {
                        result = JSON.parse(result);
                    }
                    else if (typeof result === 'string') {
                        const jsonMatch = result.match(/{[\s\S]*?}|\[[\s\S]*?]/);
                        if (jsonMatch) result = JSON.parse(jsonMatch[0]);
                    }
                }
                catch (e) {
                    if (fatal) throw new Error(`Failed to parse JSON from ${_name}: ${e.message}`);
                    else console.warn(`Failed to parse JSON from ${_name}, returning raw`);
                    return result;
                }
            }

            if (get) {
                const keys = Array.isArray(get) ? get : [get];
                const tryGet = obj => {
                    for (const k of keys) {
                        if (obj && typeof obj === 'object' && k in obj) return obj[k];
                    }
                    return null;
                };

                if (Array.isArray(result)) {
                    const mapped = result.map(item => tryGet(item)).filter(Boolean);
                    return mapped.length === 1 ? mapped[0] : mapped.length ? mapped : def;
                }
                else {
                    const value = tryGet(result);
                    return value !== null ? value : def;
                }
            }

            return result;
        }
        else if (def !== null) {
            return def;
        }
        else if (fatal) {
            throw new Error(`Unable to extract ${_name}`);
        }
        else {
            return null;
        }
    }

    meta_search(prop, html, {
        name = null,
        noPrefix = null,
        prefix = null,
        ...kargs
    } = {}) {
        prop = Array.isArray(prop)? prop : [prop];
        if (name === null) {
            name = prop[0];
        }
        
        const meta_regexes = [];
        for (const p of prop) {
            meta_regexes.push(
                ...this._meta_regexes(p, {
                    prefix,
                    noPrefix
                })
            );
        }
        for (const pattern of meta_regexes) {
            const match = html.match(new RegExp(pattern, 's'));
            if (match) {
                for (let i = 1; i <= 3; i++) {
                    if (match[i] !== undefined) {
                        const result = decode(match[i]);
                        return result;
                    }
                }
            }
        }
        throw new Error(`Unsupported OpenGraph: ${name}`);
    }
}