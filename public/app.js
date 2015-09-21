var beautyApp = angular.module('beautyApp', ['ngCookies', 'ngResource', 'ngMessages', 'ui.router', 'truncate', 'ui.bootstrap', 'angularSpinner', 'ngTable', 'ngTextTruncate', 'angulike', 'ngSanitize']);
beautyApp.run([
    '$rootScope', function ($rootScope) {
        $rootScope.facebookAppId = ''; // set your facebook app id here
    }
]);

beautyApp.config(['$stateProvider', '$urlRouterProvider', '$locationProvider',
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
                    'header@products': {templateUrl: './views/header.html'},
                    // the main template will be placed here (relatively named)
                    '': {templateUrl: './views/products.html'},
                    'footer@products': {templateUrl: './views/footer.html'}
                }
            })
            .state('products.list', {
                url: '/list',
                views: {

                    // the main template will be placed here (relatively named)
                    '': {templateUrl: './views/products.container.html'},

                    // the child views will be defined here (absolutely named)
                    'filters@products.list': {templateUrl: './views/filters.html'},

                    // for column two, we'll define a separate controller
                    'results@products.list': {
                        templateUrl: './views/products.list.html'
                    }
                }
            })
            .state('products.detail', {
                url: '/:id',
                // loaded into ui-view of parent's template
                templateUrl: './views/product.detail.html',
                controller: 'ProductDetailController',
                resolve: {
                    "product": function ($q, $http, $stateParams) {
                        var d = $q.defer();

                        var url = "/api/products/" + $stateParams.id;

                        /* either return the data or reject the promise */
                        $http.get(url).success(function (data) {
                            d.resolve({
                                    info: function () {
                                        return data;
                                    }
                                }
                            );
                            //return data;
                        }).error(function (data, status) {
                            d.reject(status);
                        });
                        return d.promise;
                    }
                }
            })
            .state('products.nothing', {
                url: '/nothing',
                views: {
                    // the main template will be placed here (relatively named)
                    '': {templateUrl: './views/products.container.html'},

                    // the child views will be defined here (absolutely named)
                    'filters@products.nothing': {templateUrl: './views/filters.html'},

                    // for column two, we'll define a separate controller
                    'results@products.nothing': {
                        templateUrl: './views/products.nothing.html'
                    }
                },
                onEnter: function () {
                    console.log("enter products.nothing");
                }
            })
            .state('404', {
                url: '/404',
                templateUrl: './views/404.html'
            })
            .state('deals', {
                url: '/deals',
                views: {
                    'header@deals': {templateUrl: './views/header.html'},
                    // the main template will be placed here (relatively named)
                    '': {templateUrl: './views/deals.html'},

                    // the child views will be defined here (absolutely named)
                    'content@deals': {templateUrl: './views/deallist.html', controller: 'DealsController'},
                    'footer@deals': {templateUrl: './views/footer.html'}
                },
                resolve: {
                    "sale_deals": function ($q, $http) {
                        var d = $q.defer();
                        var url = "/api/deals/4";

                        // either return the data or reject the promise
                        $http.get(url).success(function (data) {
                            d.resolve(data);
                        }).error(function (data, status) {
                            d.reject(status);
                        });
                        return d.promise;
                    },
                    "percent_off_deals": function ($q, $http) {
                        var d = $q.defer();
                        var url = "/api/deals/5";

                        // either return the data or reject the promise
                        $http.get(url).success(function (data) {
                            d.resolve(data);
                        }).error(function (data, status) {
                            d.reject(status);
                        });
                        return d.promise;
                    },
                    "free_gift_deals": function ($q, $http) {
                        var d = $q.defer();
                        var url = "/api/deals/3";

                        // either return the data or reject the promise
                        $http.get(url).success(function (data) {
                            d.resolve(data);
                        }).error(function (data, status) {
                            d.reject(status);
                        });
                        return d.promise;
                    }
                },
                onEnter: function () {
                    console.log("entered deals state");
                },
                onExit: function () {
                    console.log("exiting deals state");
                }
            })
            .state('terms', {
                url: '/terms',
                views: {
                    'header@terms': {templateUrl: './views/header.html'},
                    // the main template will be placed here (relatively named)
                    '': {templateUrl: './views/legal.html'},

                    // the child views will be defined here (absolutely named)
                    'content@terms': {templateUrl: './views/terms.html'},
                    'footer@terms': {templateUrl: './views/footer.html'}
                },
                controller: function ($scope) {
                    console.log('terms');
                }
            })
            .state('privacy', {
                url: '/privacy',
                views: {
                    'header@privacy': {templateUrl: './views/header.html'},
                    // the main template will be placed here (relatively named)
                    '': {templateUrl: './views/legal.html'},

                    // the child views will be defined here (absolutely named)
                    'content@privacy': {templateUrl: './views/privacy.html'},
                    'footer@privacy': {templateUrl: './views/footer.html'}
                }
            });
    }])
    .run(function ($state, $rootScope) {
        $rootScope.$on('$stateChangeError', function (event) {
            event.preventDefault();
            $state.go('404');
        });
    });



