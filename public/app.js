var app = angular.module('beautyApp', ['ngCookies', 'ngResource', 'ngMessages', 'ngRoute', 'mgcrea.ngStrap', 'ui.bootstrap', 'truncate'])
    .config(['$routeProvider', '$locationProvider',
        function ($routeProvider, $locationProvider) {
            $locationProvider.html5Mode(true);

            $routeProvider
                .when('/', {
                    templateUrl: 'views/home.html',
                    controller: 'ProductListController'
                })
                .when('/products/:productId', {
                    templateUrl: 'views/product-detail.html',
                    controller: 'ProductDetailController'
                })
                .when('/login', {
                    templateUrl: 'views/login.html',
                    controller: 'LoginCtrl'
                })
                .when('/signup', {
                    templateUrl: 'views/signup.html',
                    controller: 'SignupCtrl'
                })
                .when('/terms', {
                    templateUrl: 'views/terms.html',
                    controller: 'TermsController'
                })
                .when('/about', {
                    templateUrl: 'views/about.html',
                    controller: 'AboutController'
                })
                .when('/privacy', {
                    templateUrl: 'views/privacy.html',
                    controller: 'PrivacyController'
                })
                .when('/cookies', {
                    templateUrl: 'views/cookies.html',
                    controller: 'CookiesController'
                })
                .when('/contact', {
                    templateUrl: 'views/contact.html',
                    controller: 'ContactController'
                })
                .otherwise({
                    redirectTo: '/'
                });
    }]);