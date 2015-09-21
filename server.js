var express = require('express');
var path = require('path');
var logger = require('morgan');
var log = require('npmlog');
var _ = require('lodash')._;
var url = require('url');
var bodyParser = require('body-parser');
var superagent = require('superagent');
var useragent = require('useragent');
var productSearch = {};
var productView = {};
var visitMerchant = {};
var category = {};
var categories = [];
var catid = {};
var brand = {};
var brands = [];
var event = {};

var Keen = require('keen.io');

var client = Keen.configure({
    projectId: '', // removed as Keen account no longer active
    writeKey: '' // removed as Keen account no longer active
});

var account = ''; // removed as PopShops account no longer active
var catalog = ''; // removed as PopShops account no longer active
var popShopsUrl = 'http://popshops.com/v3/products.json';
var dealsUrl = 'http://popshops.com/v3/deals.json';
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
var beauty = express.Router();

beauty.get('/api/products/:productId', function(req, res, next){
    res.set('Content-Type', 'application/json');
    var agent = useragent.parse(req.headers['user-agent']);

    resetParams();

    //TODO validate product id
    if(isNaN(req.params.productId)){
        var notFound = new Error('Product Not Found');
        notFound.status = 404;
        return next(notFound);
    }else{
        search_params.product = req.params.productId;
        delete search_params['keyword'];

        superagent.post(popShopsUrl)
            .send(search_params)
            .end(function (result) {
                if(result.ok){
                    if (result.body.results) {
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
                        productView.agent = agent.family;
                        productView.device = agent.device.toString();

                        if(req.host!='localhost') {
                            client.addEvent("ProductView", productView, function (err, res) {
                            });
                        }
                    }
                    res.send(product_info)
                }else{
                    var notFound = new Error('Deals Not Found');
                    notFound.status = 404;
                    return next(notFound);
                }
            });
    }
});

beauty.post('/api/event', function (req, res, next) {
    if (req.body.event) {
        console.log('event object found:' + JSON.stringify(req.body.event));
        event = req.body.event;
        if (event.eventType) {
            switch (event.eventType) {
                case 'facebookLike':
                    console.log('facebookLike event');
                    break;
                case 'favoritedProduct':
                    console.log('favoritedProduct event');
                    break;
                case 'visitMerchant':
                    console.log('visitMerchant event');
                    visitMerchant.url = event.url;
                    client.addEvent("VisitMerchant", visitMerchant, function(err, res) {});
                    break;
                default:
                    console.log('no match found for event type')
            }
        }
    }
    res.send();
});

beauty.param('deal_type', function(req,res,next,deal_type){
    if(deal_type == 1 || deal_type == 2 || deal_type == 3 || deal_type == 4 ||
        deal_type == 5){
        console.log('validating deal type');
        req.body.deal_type = deal_type;
        next();
    }else{
        return next(new Error('Invalid deal type'));
    }
});

beauty.get('/api/deals/:deal_type', function (req, res) {
    console.log('reached deal endpoint');
    if(req.body.deal_type)
        search_params.deal_type = req.body.deal_type;
    search_params.results_per_page = 100;

    superagent.post(dealsUrl)
        .send(search_params)
        .end(function (e, result) {
            if (!result.body.results)
                console.log('no results returned from popshops');
            result = removeCredentials(result);
            res.send(result.body)
        });
});


/* need to accept a map of filters - in that map we specify brand (single), store (multi), price range selections
   and use the map to construct an appropriate popshops API call */

beauty.post('/api/products', function (req, res) {
    var agent = useragent.parse(req.headers['user-agent']);

    merchants.length = 0;
    brands.length = 0;
    categories.length = 0;

    resetParams();

    if (req.body.query) {

        console.log('query object found:' + JSON.stringify(req.body.query));

        if (req.body.query.term) {
            search_params.keyword = req.body.query.term;
        } else {
            console.log('query object term not found');
            search_params.keyword = '';
        }

        if (req.body.query.page) {
            search_params.page = req.body.query.page;
        }

        if (req.body.query.rpp) {
            search_params.results_per_page = req.body.query.rpp;
        }

        //check for a product ID
        if (req.body.query.product) {
            // TODO -- check is valid number
            search_params.product = req.body.query.product;
        }

        if (req.body.query.filters) {

            _.each(req.body.query.filters, function (f) {

                switch (f.filterType) {
                case 'merchant':
                    merchants.push(f.filter);
                    break;
                case 'brand':
                    brands.push(f.filter);
                    break;
                case 'category':
                    categories.push(f.filter);
                    break;
                default:
                    console.log('no match found for filter type')
                }

            });
            if (merchants.length > 0) {
                search_params.merchant = merchants.join();
            }
            if (brands.length > 0) {
                search_params.brand = brands.join();
            }
            if (categories.length > 0) {
                search_params.category = categories.join();
            }
        }
    }
    if (categories.length < 1) {
        search_params.category = 13250;
    }
    console.log('popshops search params:' + JSON.stringify(search_params));

    search_params.include_discounts = true;

    superagent.post(popShopsUrl)
        .send(search_params)
        .end(function (e, result) {
            if (res.error) {
                console.log('error:' + result.error.message);
            } else {
                console.log('no error');
            }

            if (result.body.results) {
                productSearch.keyword = search_params.keyword;
                productSearch.category = search_params.category;
                productSearch.agent = agent.family;
                productSearch.device = agent.device.toString();

                if(result.body.resources.categories){
                    if(result.body.resources.categories.context){
                        categories = result.body.resources.categories.context.category;
                        catid = productSearch.category;
                        category =_.find(categories, function(cat) {
                            return cat.id == catid;
                        });
                        if(category){
                            if(category.name){
                                productSearch.categoryName = category.name;
                            }
                        }
                    }
                    removeUndesiredCategories(result);
                }

                if(search_params.brand) {
                    productSearch.brand = search_params.brand;
                    if(result.body.resources.brands){
                        brands = result.body.resources.brands.brand;
                        brand = _.find(brands, function(b) {
                            return b.id == productSearch.brand;
                        });
                        if(brand){
                            if(brand.name){
                                productSearch.brandName = brand.name;
                            }
                        }

                    }
                }
                if(search_params.merchant)
                    productSearch.merchant = search_params.merchant;

                // check if we're on the localhost - development or not, otherwise send the event
                if(req.host!='localhost'){
                    // send single event to Keen IO
                    client.addEvent("ProductSearch", productSearch, function(err, res) {
                        if (err) {
                            console.log("Oh no, could not log productSearch!");
                        } else {
                            console.log("productSearch event log");
                        }
                    });
                }
            } else {
                console.log('no results returned from popshops');
                results = '';
            }
            result = removeCredentials(result);
            res.send(result.body)
        });
});

// handle errors
beauty.use(function (err, req, res, next) {
    console.log('err:' + JSON.stringify(err));
    console.log('err status: ' + err.status);
    console.log('err:' + err.message);

    if (err.status == 404) {
        res.status(404);
        console.log('handling 404 Not Found error')
    } else if (err.status == 400) {
        res.status(400);
        console.log('handling 400 Bad Request error')
    } else {
        res.status(500);
        console.log('handling 500 Internal Server error')
    }
    res.json(err.message);
});

// apply the routes to our application
app.use('/', beauty);

// listen for requests to our routes
app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'))
});


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
                || category.id == 7000 || category.id == 15000 || category.id == 3000 || category.id == 10000 || category.id == 32346 || category.id == 9000 || category.id == 2000
                || category.id == 5000 || category.id == 9000 || category.id == 11000 || category.id == 22000 || category.id == 9001 || category.id == 9100
                || category.id == 8400 || category.id == 24000 || category.id == 25000 || category.id == 13000;
        });
    }
}

function replaceMerchants(result){
    // loop over the offers for a given product and replace the merchant ID with a merchant object composed of ID, name, logo_url, and url
    _(result.body.results.products.product[0].offers.offer).forEach(function(offer)
        {
            //find the merchant by ID
           var m = _.find(result.body.resources.merchants.merchant, { 'id': offer.merchant });
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

    if (search_params.keyword)
        delete search_params.keyword;

    if (search_params.page)
        delete search_params.page;

    if (search_params.product)
        delete search_params.product;

    if (search_params.category)
        delete search_params.category;
}

