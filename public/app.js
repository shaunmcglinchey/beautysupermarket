var app = angular.module('beautyApp', ['ngCookies', 'ngResource', 'ngMessages', 'ngRoute', 'mgcrea.ngStrap', 'ui.bootstrap'])
    .config(['$routeProvider','$locationProvider', function($routeProvider,$locationProvider) {
        $locationProvider.html5Mode(true);

        $routeProvider
            .when('/', {
                templateUrl: 'views/home.html',
                controller: 'beautyController'
            })
            .when('/shows/:id', {
                templateUrl: 'views/detail.html',
                controller: 'DetailCtrl'
            })
            .when('/login', {
                templateUrl: 'views/login.html',
                controller: 'LoginCtrl'
            })
            .when('/signup', {
                templateUrl: 'views/signup.html',
                controller: 'SignupCtrl'
            })
            .when('/add', {
                templateUrl: 'views/add.html',
                controller: 'AddCtrl'
            })
            .otherwise({
                redirectTo: '/å'
            });


    }]);


