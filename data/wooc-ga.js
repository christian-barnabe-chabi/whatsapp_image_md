// https://www.npmjs.com/package/woocommerce-api
const chalk = require("chalk");
const WoocommerceAPI = require("woocommerce-api");

function woocGabon(slug, next = null) {
  const woocommerce = new WoocommerceAPI({
    url: process.env.WOOC_URL_GABON,
    consumerKey: process.env.WOOC_KEY_GABON,
    consumerSecret: process.env.WOOC_SECRET_GABON,
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

    try {
      const productData = JSON.parse(data.body);
      if (productData.length === 0) {
        next({ error: true, message: `No product with slug ${slug} found` });
        return;
      }
      if (next) {
        next(productData[0]);
      }
      
    } catch (error) {
      next({ error: true, message: `No product with slug ${slug} found` });
      return;
    }
  });
}

module.exports = woocGabon;
