var beautyApp = angular.module('beautyApp', ['ngCookies', 'ngResource', 'ngMessages','ui.router', 'truncate'])
    .config(['$stateProvider', '$urlRouterProvider', '$locationProvider',
        function ($stateProvider, $urlRouterProvider, $locationProvider) {


            //$locationProvider.html5Mode(true);

            $urlRouterProvider.when("", "/products/list");
            $urlRouterProvider.when("/", "/products/list");
            $urlRouterProvider.otherwise('/products/list');

            $stateProvider
                .state('products', {
                    abstract: true,
                    url: '/products',
                    templateUrl: './views/products.html',
                   /* controller: 'ProductListController',*/
                    /*
                    controller: function($scope){
                      $scope.product_arr = [{name:'jock'}];
                    },
                    */
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
                        }
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
                        // Let's fetch the product in question
                        // so we can provide it directly to the controller.
                        product:  function($http, $stateParams){
                            var url = "/api/products/" + $stateParams.id;
                            return $http.get(url)
                                .then(function(res){ return res.data; });
                        }
                    },
                    onEnter: function(){
                        console.log("enter products.detail");
                    }
                })
        }]);



beautyApp.controller('RootCtrl', function($scope) {

    $scope.processForm = function (q) {
        console.log('searching for term:'+q);
        //products array from parent state is available to this controller, and thus any state that uses this controller
        $scope.product_arr.push({ id:2, name: "Jock" });

        //$state.go('products.list');
    }
});