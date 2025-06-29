import * as facebook from './go/facebook.js';
import { URLSearchParams } from 'url';

const getRawBody = req =>
   new Promise((resolve, reject) => {
      let data = '';
      req
         .on('data', chunk => (data += chunk))
         .on('end', () => resolve(data))
         .on('error', reject);
   });

export default async function handler(req, res) {
   try {
      let url = '';

      if (req.method === 'GET') {
         url = req.query?.url;
      }
      else if (req.method === 'POST') {
         if (req.body && typeof req.body === 'object') {
            url = req.body.url;
         }
         else {
            const raw = await getRawBody(req);
            url = new URLSearchParams(raw).get('url');
         }
      }
      else {
         return res.end(
            JSON.stringify(
               {
                  code: 405,
                  msg: 'Method Not Allowed'
               }, null, 2
            )
        );
      }

      if (!url) {
         return res.end(
            JSON.stringify(
               {
                  code: 400,
                  msg: 'Parameter "url" found'
               }, null, 2
            )
         );
      }

      const extractorClasses = Object.values(facebook).filter(fn => typeof fn === 'function');
      const Extractor = extractorClasses.find(IE => new IE().VALID_URL?.test(url));

      if (!Extractor) {
         res.end(
            JSON.stringify(
               {
                  code: 400,
                  msg: `No extractor found for URL: ${url}`
               }, null, 2
            )
         );
      }

      const result = await new Extractor().extract(url);
      return res.end(
         JSON.stringify(
            {
               status : 'success',
               github : 'github.com/AntonThomzz',
               body : result
            }
         )
      );
   }
   catch (e) {
      res.end(
         JSON.stringify(
            {
               code: 500,
               msg: e?.message || e
            }
         )
      );
   }
}
