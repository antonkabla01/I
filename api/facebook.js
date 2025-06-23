import * as facebook from './go/facebook.js';

export default async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.end(
            JSON.stringify(
                {
                    code: 400,
                    msg: "Try Again"
                }
            )
        );
    }
    try {
        const x = [...Object.values(facebook)].filter(e => typeof e === 'function');
        const extractor = x.find(IEClass => {
            const instance = new IEClass();
            return instance.VALID_URL?.test(url);
        });
        if (!extractor) {
            return res.end(
                JSON.stringify(
                    {
                        code: 400,
                        msg: 'No extractor found for URL: ', url
                    }
                )
            );
        }
        const instance = new extractor();
        const result = await instance.extract(url);
        return res.end(
            JSON.stringify(
                {
                    status: "success",
                    github: 'github.com/AntonThomzz,
                    body: result
                }
            )
        );
    } catch (e) {
        return res.end(
            JSON.stringify(
                {
                    CODE: 404,
                    msg: e.message ?? e
                }
            )
        );
    }
};