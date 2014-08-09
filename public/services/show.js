angular.module('beautyApp')
    .factory('apiService', function ($http, $resource, $q) {
        var resource = $resource('/api/search/', {
            page: '@page',
            rpp: '@rpp',
            keyword: '@keyword'
        });
        return {
            getProds: function (SearchParams) {
                var deferred = $q.defer();
                resource.get({
                        page: SearchParams.page,
                        rpp: SearchParams.rpp,
                        keyword: SearchParams.keyword
                    },
                    function (event) {
                        deferred.resolve(event);
                    },
                    function (response) {
                        deferred.reject(response);
                    });
                return deferred.promise;
            }
        }
    });