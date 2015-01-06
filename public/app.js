var beautyApp = angular.module('beautyApp', ['ngCookies', 'ngResource','ngMessages','ui.router', 'truncate','ui.bootstrap','angularSpinner','ngTable','djds4rce.angular-socialshare','ngTextTruncate']);

    beautyApp.run(function($FB){
        $FB.init('386469651480295');
    }).config(['$stateProvider', '$urlRouterProvider', '$locationProvider',
        function ($stateProvider, $urlRouterProvider, $locationProvider) {

            $locationProvider.html5Mode(true);

            $urlRouterProvider.when("", "/products/list");
            $urlRouterProvider.when("/", "/products/list");

            // For any unmatched url, send to 404
            $urlRouterProvider.otherwise('/404');

            $stateProvider
                .state('products', {
                    abstract: true,
                    url: '/products',
                    views: {
                        'header@products': { templateUrl: './views/header.html' },
                        // the main template will be placed here (relatively named)
                        '': { templateUrl: './views/products.html' },
                        'footer@products': { templateUrl: './views/footer.html' }
                    },
                    onEnter: function(){
                        //console.log("enter products");
                    }
                })
                .state('products.list', {
                    url: '/list',
                    views: {

                        // the main template will be placed here (relatively named)
                        '': { templateUrl: './views/products.container.html' },

                        // the child views will be defined here (absolutely named)
                        'filters@products.list': { templateUrl: './views/filters.html' },

                        // for column two, we'll define a separate controller
                        'results@products.list': {
                            templateUrl: './views/products.list.html'
                        }
                    },
                    onEnter: function(){
                        //console.log("enter products.list");
                    }
                })
                .state('products.detail', {
                    url: '/:id',
                    // loaded into ui-view of parent's template
                    templateUrl: './views/product.detail.html',
                    controller: 'ProductDetailController',
                    resolve: {
                        "product": function($q,$http,$stateParams){
                            var d = $q.defer();

                            var url = "/api/products/" + $stateParams.id;

                            /* either return the data or reject the promise */
                            $http.get(url).success(function(data) {
                                //console.log('checking whether we have a valid product record');
                                d.resolve({
                                        info: function( ) {
                                            return data;
                                        }
                                }
                                );
                                //return data;
                            }).error(function(data, status) {
                                d.reject(status);
                            });
                            return d.promise;
                        }
                    },
                    onEnter: function(){
                        //console.log("enter products.detail");
                    }
                })
                .state('deals', {
                    url: '/deals',
                    controller: 'JockController',
                    resolve: {
                        "deals": function($q,$http){
                            var d = $q.defer();

                            var url = "/api/deals";

                            /* either return the data or reject the promise */
                            $http.get(url).success(function(data) {
                                //need to check here whether we did in fact get the data
                                //current a returned HTML page is being treated as a 'success'...
                                console.log('retrieved the deals');
                                d.resolve({
                                        info: function( ) {
                                            return data;
                                        }
                                    }
                                );
                            }).error(function(data, status) {
                                d.reject(status);
                            });
                            return d.promise;
                        }
                    },
                    views: {
                        'header@deals': { templateUrl: './views/header.html' },
                        // the main template will be placed here (relatively named)
                        '': { templateUrl: './views/deals.html' },

                        // the child views will be defined here (absolutely named)
                        'content@deals': { templateUrl: './views/deallist.html' },
                        'footer@deals': { templateUrl: './views/footer.html' }
                    },
                    onEnter: function(){
                        console.log("entered deals state");
                    }
                })
                .state('products.nothing', {
                    url: '/nothing',
                    views: {

                        // the main template will be placed here (relatively named)
                        '': { templateUrl: './views/products.container.html' },

                        // the child views will be defined here (absolutely named)
                        'filters@products.nothing': { templateUrl: './views/filters.html' },

                        // for column two, we'll define a separate controller
                        'results@products.nothing': {
                            templateUrl: './views/products.nothing.html'
                        }
                    },
                    onEnter: function(){
                        console.log("enter products.nothing");
                    }
                })
                .state('404', {
                    url: '/404',
                    templateUrl: './views/404.html',
                    onEnter: function(){
                        //console.log("404 page not found");
                    }
                })
                .state('terms', {
                    url: '/terms',
                    views: {
                        'header@terms': { templateUrl: './views/header.html' },
                        // the main template will be placed here (relatively named)
                        '': { templateUrl: './views/legal.html' },

                        // the child views will be defined here (absolutely named)
                        'content@terms': { templateUrl: './views/terms.html' },
                        'footer@terms': { templateUrl: './views/footer.html' }
                    },
                    controller: function($scope) {
                        console.log('terms');
                    }
                })
                .state('privacy', {
                    url: '/privacy',
                    views: {
                        'header@privacy': { templateUrl: './views/header.html' },
                        // the main template will be placed here (relatively named)
                        '': { templateUrl: './views/legal.html' },

                        // the child views will be defined here (absolutely named)
                        'content@privacy': { templateUrl: './views/privacy.html' },
                        'footer@privacy': { templateUrl: './views/footer.html' }
                    }
                });
        }])
    .run(function($state,$rootScope) {
    $rootScope.$on('$stateChangeError', function(event) {
        event.preventDefault();
        //console.log('caught stateChangeError');
        $state.go('404');
    });
});



