var beautyApp = angular.module('beautyApp', ['ngCookies', 'ngResource', 'ngMessages','ui.router', 'truncate','ui.bootstrap','angularSpinner'])
    .config(['$stateProvider', '$urlRouterProvider', '$locationProvider',
        function ($stateProvider, $urlRouterProvider, $locationProvider) {

            //$locationProvider.html5Mode(true);
           // var product = [];
            $urlRouterProvider.when("", "/products/list");
            $urlRouterProvider.when("/", "/products/list");
          //  $urlRouterProvider.otherwise('/products/list');
            // For any unmatched url, send to 404
            $urlRouterProvider.otherwise('/404');

            $stateProvider
                .state('products', {
                    abstract: true,
                    url: '/products',
                    views: {
                        'header@products': { templateUrl: './views/header.html' },
                        // the main template will be placed here (relatively named)
                        '': { templateUrl: './views/products.html' }
                    },
                    onEnter: function(){
                        console.log("enter products");
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
                        },
                        'footer@products.list': { templateUrl: './views/footer.html' }
                    },
                    onEnter: function(){
                        console.log("enter products.list");
                    }
                })
                .state('products.detail', {
                    url: '/:id',
                    // loaded into ui-view of parent's template
                    templateUrl: './views/product.detail.html',
                    controller: 'ProductDetailController',
                    resolve: {
                        "product": function($q,$http,$stateParams){
                           // productInfo.length = 0;
                            var d = $q.defer();

                            var url = "/api/products/" + $stateParams.id;

                            /* either return the data or reject the promise */
                            $http.get(url).success(function(data) {
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
                        console.log("enter products.detail");
                    }
                })

                .state('products.404', {
                    url: '/404',
                    templateUrl: './views/404.html',
                    onEnter: function(){
                        console.log("404 page not found");
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
                    onEnter: function(){
                        console.log("enter products.list");
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
                    },
                    onEnter: function(){
                        console.log("enter products.list");
                    }
                });
        }])
    .run(function($state,$rootScope) {
    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
        event.preventDefault();
        console.log('caught stateChangeError');
        //$location.path('/products/404/')
        $state.go('products.404');
    });
});
