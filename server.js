var express = require('express');
var path = require('path');
var logger = require('morgan');
var log = require('npmlog');
var _ = require('underscore')._;
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
var numResults;
var rpp;
var merchants = [];
var brands = [];

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

//need to accept a map of filters - in that map we specify brand (single), store (multi), price range selections 
//and use the map to construct an appropriate popshops API call

//how to post a map to node.js express 4
beauty.post('/api/products', function (req, res, next) {
    console.log('running product endpoint');
    merchants.length = 0;
    brands.length = 0;

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

            //console.log('query object filter map found:')

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

        } else {
            console.log('query object filter map not found')
        }
    } else {
        console.log('no query object found')
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
            //remove popshops API credentials
            result.body.parameters = _.without(result.body.parameters, _.findWhere(result.body.parameters, {
                name: 'account'
            }));
            result.body.parameters = _.without(result.body.parameters, _.findWhere(result.body.parameters, {
                name: 'catalog'
            }));
            //console.log('wta val:' + JSON.stringify(result.body.parameters));
            //result.body = _.without(result.body, _.findWhere(result.body, {n: 3}));
            res.send(result.body)
        });


})



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