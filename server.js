var express = require('express');
var path = require('path');
var logger = require('morgan');
var log = require('npmlog');
var _ = require('lodash')._;
var bodyParser = require('body-parser');
var superagent = require('superagent');
var productSearch = {};
var productView = {};
var category = {};
var categories = [];
var catid = {};

var Keen = require('keen.io');

// Configure instance. Only projectId and writeKey are required to send data.
var client = Keen.configure({
    projectId: "5488d6ed96773d653b922424",
    writeKey: "34aeaa50250884f999516760f791dfb51d2bbc188431dcfd1a784747c9872bbca97934ba6f34b8388a55e4992f1a5c3f9316d4181eea2f1942eda5779c0b8326b91c49c51dbd3b84d0f2aed7a5481d0c2780db49d1a87f0109e22227e0f3e43fe0d69678e85c37c897200b1eef5a08cf"
});



var account = '5ftkmyi63draxm60tz3rlah2q'
var catalog = 'byuklpjkivbpyfxcryx05rv0u'
var popShopsUrl = 'http://popshops.com/v3/products.json'
var results;
var search_params = {};
var product_info = {};
var merchants = [];
var brands = [];
var categories = [];

search_params.account = account;
search_params.catalog = catalog;

var app = express();
app.disable('etag');

app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static(path.join(__dirname, 'public')));

// get an instance of router
var beauty = express.Router()



/* test send 404 error */

/*
 var notFound = new Error('Product Not Found');
 notFound.status = 404;
 return next(notFound);
 */
/*fixed product fetch */
/* end test 404 */

beauty.get('/api/products/:productId', function(req, res, next){
    res.set('Content-Type', 'application/json');
    //console.log('Looking for product:'+req.params.productId);

    resetParams();

    //TODO validate product id
    if(isNaN(req.params.productId)){
        //console.log('supplied product ID is not a valid number:'+req.params.productId);
        var notFound = new Error('Product Not Found');
        notFound.status = 404;
        return next(notFound);
    }else{
        //console.log('supplied product ID is a valid number');
        search_params.product = req.params.productId;
        delete search_params['keyword'];
        //console.log('product endpoint search params:'+JSON.stringify(search_params));

        superagent.post(popShopsUrl)
            .send(search_params)
            .end(function (result) {
                if(result.ok){
                    if (result.body.results) {
                        //console.log('found product');
                        //console.log('results returned from popshops')

                        replaceMerchants(result);
                        product_info.product = result.body.results.products.product[0];
                        product_info.merchants = result.body.resources.merchants.merchant;
                        product_info.brands = result.body.resources.brands.brand;

                        productView.id = product_info.product.id;
                        productView.name = product_info.product.name;
                        productView.category = product_info.product.category;
                        productView.description = product_info.product.description;
                        productView.price_min = product_info.product.price_min;
                        productView.image_url_large = product_info.product.image_url_large;
                        productView.brand = product_info.product.brand;
                        productView.brandName = _.find(product_info.brands, { 'id': product_info.product.brand }).name;

                        client.addEvent("ProductView", productView, function(err, res) {
                            if (err) {
                                //console.log("Oh no, could not log productView!");
                            } else {
                                //console.log("productView event logged");
                            }
                        });
                    }
                    res.send(product_info)
                }else{
                    //console.log('error occurred:'+result.text);
                    //console.log('no results returned from popshops');
                    var notFound = new Error('Product Not Found');
                    notFound.status = 404;
                    return next(notFound);
                }
            });
    }
});
//need to accept a map of filters - in that map we specify brand (single), store (multi), price range selections 
//and use the map to construct an appropriate popshops API call

//how to post a map to node.js express 4
beauty.post('/api/products', function (req, res, next) {
    merchants.length = 0;
    brands.length = 0;
    categories.length = 0;

    resetParams();

    //console.log('checking for filter params');

    if (req.body.query) {

        console.log('query object found:' + JSON.stringify(req.body.query));

        if (req.body.query.term) {
            search_params.keyword = req.body.query.term;
        } else {
            console.log('query object term not found');
            search_params.keyword = '';
            //TODO if query not set, set query to all - is there a popshop equiv to *
        }

        if (req.body.query.page) {
            search_params.page = req.body.query.page;
        } else {
            //console.log('query object page not found')
            //TODO if page not set, set page to page 1
        }

        if (req.body.query.rpp) {
            //console.log('query object rpp found:' + req.body.query.rpp)
            search_params.results_per_page = req.body.query.rpp;
        } else {
            //console.log('query object rpp not found')
            //TODO if rpp not set, set rpp to 10
        }

        //check for a product ID
        if (req.body.query.product) {
            //should check it is a valid id, at least a number
            search_params.product = req.body.query.product;
        }

        if (req.body.query.filters) {

            _.each(req.body.query.filters, function (f) {
                //console.log('filter val: ' + f.filter);
                //console.log('filter type: ' + f.filterType);
                //TODO build filters up here
                switch (f.filterType) {
                case 'merchant':
                    //console.log('merchant filter found')
                    merchants.push(f.filter);
                    break;
                case 'brand':
                    //console.log('brand filter found')
                    brands.push(f.filter);
                    break;
                case 'category':
                    //console.log('category filter found')
                    categories.push(f.filter);
                    break;
                default:
                    console.log('no match found for filter type')
                }
            });
            if (merchants.length > 0) {
                search_params.merchant = merchants.join();
                //console.log('merchants:' + search_params.merchant);
            }
            if (brands.length > 0) {
                search_params.brand = brands.join();
                //console.log('brands:' + search_params.brand);
            }
            if (categories.length > 0) {
                search_params.category = categories.join();
                //console.log('category:' + search_params.category);
            }

        } else {
            //console.log('query object filter map not found')
        }
    } else {
        //console.log('no query object found')
    }
    if (categories.length < 1) {
        search_params.category = 13250;
    }
    console.log('popshops search params:' + JSON.stringify(search_params))



    //track the API call - move this later

    superagent.post(popShopsUrl)
        .send(search_params)
        .end(function (e, result) {
            if (res.error) {
                console.log('error:' + result.error.message);
            } else {
                console.log('no error');
            }

            if (result.body.results) {
                //console.log('results returned from popshops')

                productSearch.keyword = search_params.keyword;
                productSearch.category = search_params.category;

                if(result.body.resources.categories){
                    if(result.body.resources.categories.context){
                        categories = result.body.resources.categories.context.category;
                        catid = productSearch.category;
                        category =_.find(categories, function(cat) {
                            return cat.id == catid;
                        });
                        if(category.name){
                            productSearch.categoryName = category.name;
                        }
                    }
                    removeUndesiredCategories(result);
                }


                if(search_params.brand)
                    productSearch.brand = search_params.brand;
                if(search_params.merchant)
                    productSearch.merchant = search_params.merchant;

                // send single event to Keen IO
                client.addEvent("ProductSearch", productSearch, function(err, res) {
                    if (err) {
                        console.log("Oh no, could not log productSearch!");
                    } else {
                        console.log("productSearch event log");
                    }
                });
            } else {
                console.log('no results returned from popshops');
                results = '';
            }
            result = removeCredentials(result);
            res.send(result.body)
        });
})



// handle errors
beauty.use(function (err, req, res, next) {
    console.log('err:' + JSON.stringify(err));
    console.log('err status: ' + err.status)
    console.log('err:' + err.message)
    if (err.status == 404) {
        res.status(404)
        console.log('handling 404 Not Found error')
    } else if (err.status == 400) {
        res.status(400)
        console.log('handling 400 Bad Request error')
    } else {
        res.status(500)
        console.log('handling 500 Internal Server error')
    }
    //res.send(err.message);
    res.json(err.message);
});

// apply the routes to our application
// all of our routes will be prefixed with /api/search
app.use('/', beauty)

// listen for requests to our routes
app.listen(app.get('port'), function () {
    //log.info('yo','Express server listening on port ' + app.get('port'));
    console.log('Express server listening on port ' + app.get('port'))
})


app.use(function (req, res) {
    res.sendfile(__dirname + '/public/index.html');
});

function removeCredentials(result){
    result.body.parameters = _.without(result.body.parameters, _.findWhere(result.body.parameters, {
        name: 'account'
    }));
    result.body.parameters = _.without(result.body.parameters, _.findWhere(result.body.parameters, {
        name: 'catalog'
    }));
    return result;
}

function removeUndesiredCategories(result){

    if (result.body.resources.categories.matches){
        _.remove(result.body.resources.categories.matches.category, function(category) {
            return category.id == 14090 || category.id == 14029 || category.id == 32538 || category.id == 14091 || category.id == 1 || category.id == 31000
                 || category.id == 27000 || category.id == 23000 || category.id == 21000 || category.id == 12000 || category.id == 16000 || category.id == 32194
                || category.id == 7000 || category.id == 15000 || category.id == 3000 || category.id == 10000 || category.id == 32346 || category.id == 13175;
        });
    }

    /* categories - 14090 (), 14029 (), 32538 (), 14091 (), 1 (All) */
}

function replaceMerchants(result){
    //console.log('looking up merchants');
    //loop over the offers for a given product and replace the merchant ID with a merchant object composed of ID, name, logo_url, and url
    _(result.body.results.products.product[0].offers.offer).forEach(function(offer)
        {

            //find the merchant by ID
           var m = _.find(result.body.resources.merchants.merchant, { 'id': offer.merchant });
            //console.log('m:'+m);

            offer.merchant = m;

        });
}

function resetParams(){
    if (search_params.merchant)
        delete search_params.merchant;

    if (search_params.brand)
        delete search_params.brand;

    if (search_params.results_per_page)
        delete search_params.results_per_page;

    if (search_params.keyword){
        console.log('removing keyword');
        delete search_params.keyword;
    }

    if (search_params.page)
        delete search_params.page;

    if (search_params.product)
        delete search_params.product;

    if (search_params.category)
        delete search_params.category;
}
// route middleware to check if :filters query param exists

/*
 beauty.param('filters', function (req, res, next, filters) {
 console.log('filters param set');
 //req.kw = keyword;
 next()
 })
 */

// route middleware to validate :page
/*
 beauty.param('page', function (req, res, next, page) {
 console.log('page url param set: ' + page)
 if (page > 100) {
 var badRequest = new Error('Bad request: please specify a valid page number');
 badRequest.status = 400;
 return next(badRequest);
 }
 req.page = page;
 next()
 })
 */

// route middleware to validate :rpp
/*
 beauty.param('rpp', function (req, res, next, rpp) {
 console.log('rpp url param set: ' + rpp)
 if (rpp > 100) {
 var badRequest = new Error('Bad request: please specify a valid rpp range');
 badRequest.status = 400;
 return next(badRequest);
 }
 req.rpp = rpp;
 next()
 })
 */

/* Extra -- CORS stuff */


// Enables CORS

/*
var enableCORS = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
 
    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};

// enable CORS!
app.use(enableCORS);
*/
