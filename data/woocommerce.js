// https://www.npmjs.com/package/woocommerce-api
const chalk = require("chalk");
const WoocommerceAPI = require("woocommerce-api");

function wooc(slug, next = null) {
  const woocommerce = new WoocommerceAPI({
    url: process.env.WOOC_URL_SENEGAL,
    consumerKey: process.env.WOOC_KEY_SENEGAL,
    consumerSecret: process.env.WOOC_SECRET_SENEGAL,
    wpAPI: true,
    version: "wc/v3",
  });

  // const slug = "X5-639"
  woocommerce.get(`products?slug=${slug}`, (err, data) => {
    if (err) throw new Error(err);

    // status code
    if (data.statusCode != 200) {
      next({ error: true, message: `God ${data.statusCode} from woocom` });
    }

    const productData = JSON.parse(data.body);

    // data

    if (productData.length === 0) {
      next({ error: true, message: `No product with slug ${slug} found` });
      return;
    }

    // body
    if (next) {
      next(productData[0]);
    }
  });
}

module.exports = wooc;
