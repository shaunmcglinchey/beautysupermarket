var express = require('express');
var path = require('path');
var logger = require('morgan');
var log = require('npmlog');
//var _ = require('underscore')._;
var _ = require('lodash')._;
//var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var superagent = require('superagent')
var Analytics = require('analytics-node');
var analytics = new Analytics('k9pY4FSNyL', {
    flushAt: 1
});

var SearchResult = require('./public/javascripts/searchresult');

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


beauty.get('/api/products/:productId', function(req, res, next){
    console.log('Looking for product:'+req.params.productId);

    search_params.product = req.params.productId;
    superagent.post(popShopsUrl)
        .send(search_params)
        .end(function (e, result) {
            if (result.body.results) {
                console.log('found product');
                console.log('results returned from popshops')
                console.log('response:' + JSON.stringify(result.body));
                replaceMerchants(result);
                product_info.product = result.body.results.products.product[0];
                product_info.merchants = result.body.resources.merchants.merchant;
                product_info.brands = result.body.resources.brands.brand;

            } else {
                console.log('no results returned from popshops');
            }
            res.send(product_info)
        });
});
//need to accept a map of filters - in that map we specify brand (single), store (multi), price range selections 
//and use the map to construct an appropriate popshops API call

//how to post a map to node.js express 4
beauty.post('/api/products', function (req, res, next) {
    console.log('running product endpoint');
    merchants.length = 0;
    brands.length = 0;
    categories.length = 0;

    if (search_params.merchant)
        delete search_params.merchant;

    if (search_params.brand)
        delete search_params.brand;

    if (search_params.rpp)
        delete search_params.rpp;

    if (search_params.keyword)
        delete search_params.keyword;

    if (search_params.page)
        delete search_params.page;

    if (search_params.product)
        delete search_params.product;

    if (search_params.category)
        delete search_params.category;

    console.log('checking for filter params');

    if (req.body.query) {

        console.log('query object found:' + JSON.stringify(req.body.query));

        if (req.body.query.term) {
            //console.log('query object term found:' + JSON.stringify(req.body.query.term))
            search_params.keyword = req.body.query.term;
        } else {
            console.log('query object term not found');
            search_params.keyword = '';
            //TODO if query not set, set query to all - is there a popshop equiv to *
        }

        if (req.body.query.page) {
            //console.log('query object page found:' + req.body.query.page)
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
                console.log('filter val: ' + f.filter);
                console.log('filter type: ' + f.filterType);
                //TODO build filters up here
                switch (f.filterType) {
                case 'merchant':
                    console.log('merchant filter found')
                    merchants.push(f.filter);
                    break;
                case 'brand':
                    console.log('brand filter found')
                    brands.push(f.filter);
                    break;
                case 'category':
                    console.log('category filter found')
                    categories.push(f.filter);
                    break;
                default:
                    console.log('no match found for filter type')
                }
            });
            if (merchants.length > 0) {
                search_params.merchant = merchants.join();
                console.log('merchants:' + search_params.merchant);
            }
            if (brands.length > 0) {
                search_params.brand = brands.join();
                console.log('brands:' + search_params.brand);
            }
            if (categories.length > 0) {
                search_params.category = categories.join();
                console.log('category:' + search_params.category);
            }else{
                //if no category is set we specify the default category (Health & Beauty)
                search_params.category = 13000;
            }

        } else {
            console.log('query object filter map not found')
        }
    } else {
        console.log('no query object found')
    }
    if (categories.length < 1) {
        search_params.category = 13000;
    }
    console.log('popshops search params:' + JSON.stringify(search_params))

    //track the API call - move this later
    analytics.track({
        userId: 'jock',
        event: 'invoked the search API',
        properties: {
     revenue: 39.95,
     shippingMethod: '2-day'
 }
    });
    superagent.post(popShopsUrl)
        .send(search_params)
        .end(function (e, result) {
            console.log('yoyoyoyo');
            if (res.error) {
                console.log('error:' + result.error.message);
                //alert('oh no ' + res.error.message);
            } else {
                console.log('no error');
            }

            if (result.body.results) {
                console.log('results returned from popshops')
                //console.log('response:' + JSON.stringify(result.body));
            } else {
                console.log('no results returned from popshops');
                results = '';
            }

            result = removeCredentials(result);
            if (result.body.resources.categories.matches)
                removeUndesiredCategories(result);
            res.send(result.body)
        });


})
/*
beauty.post('/api/categories', function (req, res, next) {
    console.log('running categories endpoint');
    res.setHeader('Content-Type', 'application/json');
    res.send({
      "categories": {
        "category": {
            "id": 1,
                "name": "All",
                "categories": {
                "id": 13000,
                    "name": "Health&Beauty",
                    "categories": {
                    "category": [
                        {
                            "id": 13250,
                            "name": "Cosmetics&Makeup",
                            "categories": {
                                "category": [
                                    {
                                        "id": 13276,
                                        "name": "Concealers",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13251,
                                        "name": "Cosmetic&MakeupSets",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13261,
                                        "name": "CosmeticMirrors",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13281,
                                        "name": "Exfoliants",
                                        "leaf": true
                                    },
                                    {
                                        "id": 32536,
                                        "name": "EyeBrow",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13461,
                                        "name": "EyeLash/Mascara",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13471,
                                        "name": "EyeLiner",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13481,
                                        "name": "EyeShadow",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13271,
                                        "name": "FacialCareBlush",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13318,
                                        "name": "FacialCleansers",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13296,
                                        "name": "FacialMasks",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13324,
                                        "name": "FacialTreatments",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13678,
                                        "name": "LipLiners",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13698,
                                        "name": "Lipsticks&Gloss",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13291,
                                        "name": "Make-UpRemover",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13256,
                                        "name": "MakeupBrushes&Applicators",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13286,
                                        "name": "MakeupFoundationsandPrimers",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13301,
                                        "name": "OtherCosmetics&Makeup",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13306,
                                        "name": "Powders",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13331,
                                        "name": "SkinMoisturizers",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13311,
                                        "name": "Toners",
                                        "leaf": true
                                    }
                                ]
                            }
                        },
                        {
                            "id": 13001,
                            "name": "Fragrances",
                            "categories": {
                                "category": [
                                    {
                                        "id": 13012,
                                        "name": "FragranceGiftSets",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13022,
                                        "name": "Men'sFragrances",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13002,
                                        "name": "OtherFragrances",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13042,
                                        "name": "UnisexFragrance",
                                        "leaf": true
                                    },
                                    {
                                        "id": 13032,
                                        "name": "Women'sFragrances",
                                        "leaf": true
                                    }
                                ]
                            }
                        },
                        {
                            "id": 13050,
                            "name": "Hair Care",
                            "categories": {
                                "category": [
                                    {
                                        "id": 32551,
                                        "name": "Coloring",
                                        "leaf": true
                                    },
                                    {
                                        "id": 32553,
                                        "name": "Hair & Scalp Treatment",
                                        "leaf": true
                                    },
                                    {
                                        "id": 32556,
                                        "name": "Hair Care Accessories",
                                        "leaf": true
                                    },
                                    {
                                        "id": 32555,
                                        "name": "Hair Dryers, Stylers & Barber Tools",
                                        "leaf": true
                                    },
                                    {
                                        "id": 32554,
                                        "name": "Hair Removal",
                                        "leaf": true
                                    },
                                    {
                                        "id": 32557,
                                        "name": "Shampoos & Conditioners",
                                        "leaf": true
                                    },
                                    {
                                        "id": 32558,
                                        "name": "Styling",
                                        "leaf": true
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        }
    }
    });
});
*/
beauty.get('/api/categories', function (req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    res.send([{name: "All", id: 13000, nodes: [
        {name: "Cosmetics & Makeup", id: 13250, nodes: [
            {name: "Concealers", id: 13276},
            {name: "Cosmetic & Makeup Sets", id: 13251},
            {name: "Cosmetic Mirrors", id: 13261},
            {name: "Exfoliants", id: 13281},
            {name: "Eyebrow", id: 32536},
            {name: "EyeLash/Mascara", id: 13461},
            {name: "Eye Liner", id: 13471},
            {name: "Eye Shadow", id: 13471},
            {name: "Facial Care Blush", id: 13271},
            {name: "Facial Cleansers", id: 13318},
            {name: "Facial Masks", id: 13296},
            {name: "Facial Treatments", id: 13324},
            {name: "Lip Liners", id: 13678},
            {name: "Lipsticks & Gloss", id: 13698},
            {name: "Makeup Remover", id: 13291},
            {name: "Makeup Brushes & Applicators", id: 13256},
            {name: "Makeup Foundations & Primers", id: 13286},
            {name: "Other Cosmetics & Makeup", id: 13301},
            {name: "Powders", id: 13306},
            {name: "Skin Moisturisers", id: 13331},
            {name: "Toners", id: 13311}
        ]},
        {name: "Fragrances", id: 13001, nodes: [
            {name: "Fragrance Gift Sets", id: 13012},
            {name: "Men's Fragrances", id: 13022},
            {name: "Other Fragrances", id: 13002},
            {name: "Unisex Fragrances", id: 13042},
            {name: "Women's Fragrances", id: 13032}
        ]},
        {name: "Hair Care", id: 13050, nodes: [
            {name: "Coloring", id: 32551},
            {name: "Hair & Scalp Treatment", id: 32553},
            {name: "Hair Care Accessories", id: 32556},
            {name: "Hair Dryers, Stylers & Barber Tools", id: 32555},
            {name: "Hair Removal", id: 32554},
            {name: "Shampoos & Conditioners", id: 32557},
            {name: "Styling", id: 32558}
        ]},
    ]}]);
});


/*
beauty.get('/api/search', function (req, res, next) {
    results = null;

    //should not delete filters on every request - what about existing filter selections?
    if (search_params.merchant)
        delete search_params.merchant;

    if (search_params.brand)
        delete search_params.brand;

    if (req.query.keyword) {
        search_params.keyword = req.query.keyword;
        console.log('searching for keyword:' + req.query.keyword);
    } else {
        console.log('old kw:' + search_params.keyword);
        search_params.keyword = '';
    }

    if (req.query.page) {
        search_params.page = req.query.page;
        console.log('searching for page:' + req.query.page);
    }

    if (req.query.rpp) {
        search_params.results_per_page = req.query.rpp;
        console.log('searching for rpp:' + req.query.rpp);
    }

    if (req.query.filterId) {
        console.log('searching with filter Id:' + req.query.filterId + ',of type:' + req.query.filterType);
        if (req.query.filterType == 'merchant') {
            console.log('filterType:merchant, filterId:' + req.query.filterId);
            search_params.merchant = req.query.filterId;
        } else if (req.query.filterType == 'brand') {
            console.log('filterType:brand, filterId:' + req.query.filterId);
            search_params.brand = req.query.filterId;
        }
    } else {
        console.log('resetting filters');
        //reset the filters
        // delete search_params.filterId;
        //delete search_params.filterType;
    }



    console.log('GET search params: ' + JSON.stringify(search_params));
    superagent.post(popShopsUrl)
        .send(search_params)
        .end(function (e, result) {

            if (result.body.results) {
                //console.log('results returned from popshops')
                //console.log(result.body.results)
                // results = new SearchResult(res.body)
                //console.log('was transformed into SearchResult: '+JSON.stringify(results))
                //console.log(JSON.stringify(res.body))
                //results = res.body

            } else {
                //console.log('no results returned from popshops');
                results = '';
            }
            //console.log('\n\n\n\n\n\n\nYOYOYO sending these results over the wire: '+JSON.stringify(results))
            //count the number of products returned
            // console.log('num products:'+ _.pluck(result.body.results.products, 'count').indexOf(0); 
            res.send(result.body)
        });
})
*/

// handle errors
beauty.use(function (err, req, res, next) {
    console.log('testing for 404')
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
    res.send(err.message);
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

    _.remove(result.body.resources.categories.matches.category, function(category) {
        return category.id == 14090 || category.id == 14029 || category.id == 32538 || category.id == 14091 || category.id == 1;
    });

    /*
    _(result.body.resources.categories.matches.category).forEach(function (n) {
        _.remove(result.body.resources.categories.matches.category, { 'name': n });
        console.log('category: '+JSON.stringify(n));
    });
    */
}

function replaceMerchants(result){
    console.log('looking up merchants');
    //loop over the offers for a given product and replace the merchant ID with a merchant object composed of ID, name, logo_url, and url
    _(result.body.results.products.product[0].offers.offer).forEach(function(offer)
        {

            //find the merchant by ID
           var m = _.find(result.body.resources.merchants.merchant, { 'id': offer.merchant });
            //console.log('m:'+m);

            offer.merchant = m;

        });
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