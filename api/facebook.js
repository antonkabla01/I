import * as facebook from './go/facebook.js';

export default async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.end(
            JSON.stringify(
                {
                    code: 400,
                    msg: "Try Again"
                }, null, 2
            )
        );
    }

    try {
        const extractors = [
            ...Object.values(facebook)
        ].filter(e => typeof e === 'function');

        const extractor = extractors.find(IEClass => {
            const instance = new IEClass();
            return instance.VALID_URL?.test(url);
        });

        if (!extractor) {
            return res.end(
                JSON.stringify(
                    {
                        code: 400,
                        msg: 'No extractor found for URL: ', url
                    }, null, 2
                )
            );
        }

        const instance = new extractor();
        const result = await instance.extract(url);

        return res.end(
            JSON.stringify(
                {
                    status: "success",
                    body: result
                }, null, 2
            )
        );
    } catch (e) {
        return res.end(
            JSON.stringify(
                {
                    CODE: 404,
                    msg: e.message ?? e
                }, null, 2
            )
        );
    }
};
