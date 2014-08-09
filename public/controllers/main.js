angular.module('beautyApp')
    .controller('beautyController', ['$scope', '$rootScope', 'apiService',
        function ($scope, $rootScope, apiService) {

            $scope.products = [];
            $scope.itemsPerPage = 10;
            $scope.currentPage = 1;

            var SearchParams = {};
            SearchParams.keyword = '';
            SearchParams.page = 1;
            SearchParams.rpp = 10;

            function fetchData(SearchParams) {
                apiService.getProds(SearchParams).then(function (res) {
                    //console.log('product data ready to go');
                    $scope.products = res.results;
                    $scope.num_results = res.results.products.count;
                    $scope.num_merchants = res.resources.merchants.count;
                    //$rootScope.$apply();
                    //console.log('service data: ' + JSON.stringify(res));
                });
            };


            fetchData(SearchParams);

            $scope.search = function () {
                console.log('searching for: ' + $scope.form.query);
                SearchParams.keyword = $scope.form.query;
                SearchParams.page = 1;
                SearchParams.rpp = 10;
                fetchData(SearchParams);
                $scope.form.query = "";
            };


            $scope.range = function () {
                var rangeSize = 5;
                var ret = [];
                var start;

                start = $scope.currentPage;
                if (start > $scope.pageCount() - rangeSize) {
                    start = $scope.pageCount() - rangeSize;
                }

                for (var i = start; i < start + rangeSize; i++) {
                    ret.push(i);
                }
                return ret;
            };

            $scope.prevPage = function () {
                console.log('prevPage called');
                if ($scope.currentPage > 0) {
                    $scope.currentPage--;
                }
            };

            $scope.prevPageDisabled = function () {
                console.log('prevPage disabled');
                return $scope.currentPage === 0 ? "disabled" : "";
            };

            $scope.nextPage = function () {
                console.log('nextPage called');
                if ($scope.currentPage < $scope.pageCount() - 1) {
                    $scope.currentPage++;
                }
            };

            $scope.nextPageDisabled = function () {
                console.log('nextPage disabled');
                return $scope.currentPage === $scope.pageCount() - 1 ? "disabled" : "";
            };

            $scope.pageCount = function () {
                console.log('pageCount called');
                return Math.ceil($scope.total / $scope.itemsPerPage);
            };

            $scope.setPage = function (n) {
                console.log('setPage called');
                if (n > 0 && n < $scope.pageCount()) {
                    $scope.currentPage = n;
                }
            };
            /*
            scope.$watch("currentPage", function (newValue, oldValue) {
                //console.log('currentPage updated');
                //$scope.pagedItems = Products.get(newValue*$scope.itemsPerPage, $scope.itemsPerPage);
                console.log('requesting offset:' + newValue * $scope.itemsPerPage + ' with rpp:' + $scope.itemsPerPage);
                $scope.pagedItems = Products.fetchPage(newValue * $scope.itemsPerPage, $scope.itemsPerPage);
                //$scope.pagedItems = Products.get();
                $scope.total = Products.total();
                //Products.fetchPage();
            });
            */
}]);