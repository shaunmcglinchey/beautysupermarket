var express = require('express');
var path = require('path');
var logger = require('morgan');
var log = require('npmlog');
var _ = require('underscore')._;
//var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var superagent = require('superagent')
var SearchResult = require('./public/javascripts/searchresult');

var account = '5ftkmyi63draxm60tz3rlah2q'
var catalog = 'byuklpjkivbpyfxcryx05rv0u'
var popShopsUrl = 'http://popshops.com/v3/products.json'
var results;
var search_params = {};
var numResults;
var rpp;

var app = express();
app.disable('etag');

app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// get an instance of router
var beauty = express.Router()

// route middleware to validate :keyword
beauty.param('keyword', function(req,res,next,keyword){
    console.log('keyword url param set: '+keyword);
    req.kw = keyword;
    next()
})

// route middleware to validate :page
beauty.param('page', function(req, res, next, page) {
    console.log('page url param set: '+page)
    if(page>100){
      var badRequest = new Error('Bad request: please specify a valid page number');
      badRequest.status = 400;
      return next(badRequest);
    }
    req.page = page;
    next()
})

// route middleware to validate :rpp
beauty.param('rpp', function(req, res, next, rpp) {
    console.log('rpp url param set: '+rpp)
    if(rpp>100){
      var badRequest = new Error('Bad request: please specify a valid rpp range');
      badRequest.status = 400;
      return next(badRequest);
    }
    req.rpp = rpp;
    next()
})

beauty.get('/api/search', function(req, res, next) {
    results = null;
    
    if(req.query.keyword){
     search_params.keyword = req.query.keyword;
     console.log('searching for keyword:'+req.query.keyword);
    }else{
    console.log('old kw:'+search_params.keyword);
    search_params.keyword = '';
    }
    
    if(req.query.page){
     search_params.page = req.query.page;
     console.log('searching for page:'+req.query.page);
    }
    
    if(req.query.rpp){
     search_params.results_per_page = req.query.rpp;
     console.log('searching for rpp:'+req.query.rpp);
    }
    
    if(req.query.filterId){
        console.log('searching with filter Id:'+req.query.filterId+',of type:'+req.query.filterType);
        if(req.query.filterType == 'merchant'){
            console.log('filterType:merchant, filterId:'+req.query.filterId);
            search_params.merchant = req.query.filterId;
        }else if(req.query.filterType == 'brand'){
            console.log('filterType:brand, filterId:'+req.query.filterId);
            search_params.brand = req.query.filterId;
        }
    }else{
        console.log('resetting filters');
        //reset the filters
        delete search_params.filterId;
        delete search_params.filterType;
    }
    
    search_params.account = account;
    search_params.catalog = catalog;
   
    superagent.post(popShopsUrl)
        .send(search_params)
        .end(function(e,result){
              
              if (result.body.results) {
               //console.log('results returned from popshops')
               //console.log(result.body.results)
              // results = new SearchResult(res.body)
               //console.log('was transformed into SearchResult: '+JSON.stringify(results))
               //console.log(JSON.stringify(res.body))
               //results = res.body
               
              }else{
               //console.log('no results returned from popshops');
               results = '';
              }
             //console.log('\n\n\n\n\n\n\nYOYOYO sending these results over the wire: '+JSON.stringify(results))
             //count the number of products returned
             //console.log('num products:'+ _.pluck(result.body.results.products, 'count'))    ; 
             res.send(result.body) 
        }); 
})

// handle errors
beauty.use(function(err, req, res, next) { 
    console.log('testing for 404')
    console.log('err status: '+err.status)
    if(err.status == 404){
        res.status(404)
        console.log('handling 404 Not Found error')
    }else if(err.status == 400){
        res.status(400)
        console.log('handling 400 Bad Request error')
    }else{
        res.status(500)
        console.log('handling 500 Internal Server error')
    }
  res.send(err.message);
});

// apply the routes to our application
// all of our routes will be prefixed with /api/search
app.use('/', beauty)

// listen for requests to our routes
app.listen(app.get('port'), function() {
    //log.info('yo','Express server listening on port ' + app.get('port'));
    console.log('Express server listening on port ' + app.get('port'))
})


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