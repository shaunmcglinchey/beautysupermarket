var beautyApp = angular.module('beautyApp')
    .controller('ProductListController', ['$scope', '$state','$location', 'productAPI', 'productService',
        function ($scope, $state, $location, productAPI, productService) {

            $scope.itemsPerPage = 10;
            $scope.currentPage = 1;
            $scope.maxSize = 5;
            $scope.storeLimit = 10;
            $scope.brandLimit = 10;
            $scope.brands = [];
            $scope.merchants = [];
            var SearchQuery = {};
            var filters = [];
            var query = {};
            query.term = '';
            query.page = 1;
            query.rpp = 10;
            SearchQuery.query = query;
            SearchQuery.query.filters = filters;
            $scope.storeSelection = [];
            $scope.brandSelection = [];
            $scope.categorySelection = ['13000'];

            //TODO fix filter expand logic --should be checked after data resolved
            $scope.incrementStoreLimit = function () {
                $scope.storeLimit = $scope.merchants.length;
            };
            $scope.decrementStoreLimit = function () {
                $scope.storeLimit = 10;
            };
            $scope.storeFullyExpanded = function () {
                //console.log('mercha length:'+$scope.merchants.count);
                if (typeof ($scope.merchants) != 'undefined' && $scope.merchants.length) {
                    console.log('mercha length:'+$scope.merchants.length);
                    if ($scope.merchants.length > $scope.storeLimit)
                        return false;
                    return true;
                } else {
                    return true;
                }
            };

            $scope.incrementBrandLimit = function () {
                $scope.brandLimit = $scope.brands.length;
            };
            $scope.decrementBrandLimit = function () {
                $scope.brandLimit = 10;
            };
            $scope.brandFullyExpanded = function () {
                if ($scope.brands) {
                    if ($scope.brandLimit < $scope.brands.length)
                        return false;
                    return true;
                } else {
                    return true;
                }
            };

            $scope.clearFilters = function () {
                $scope.storeSelection.length = 0;
                $scope.brandSelection.length = 0;
                $scope.categorySelection.length = 0;
                $scope.categorySelection.push('13000');
                filters.length = 0;
            }

            $scope.clearFilter = function (filterType) {
                if (filterType == 'merchant') {
                    console.log('removing merchant filters');
                    $scope.storeSelection.length = 0;
                    console.log('store selection:' + JSON.stringify($scope.storeSelection));
                    rebuildFilters();
                    //run new search
                    if ($scope.keyword)
                        query.term = $scope.keyword;
                    resetQuery();
                    $scope.storeLimit = 10;
                    doSearch(SearchQuery);
                } else if (filterType == 'brand') {
                    console.log('removing brand filters');
                    $scope.brandSelection.length = 0;
                    console.log('brand selection:' + JSON.stringify($scope.brandSelection));
                    rebuildFilters();
                    //run new search
                    if ($scope.keyword)
                        query.term = $scope.keyword;
                    resetQuery();
                    $scope.brandLimit = 10;
                    doSearch(SearchQuery);
                }
            };

            $scope.filter = function (filterId, filterType) {

                console.log('filter function called');
                var idx;
                if (filterType == 'brand') {
                    //check if brand filter already selected
                    idx = $scope.brandSelection.indexOf(filterId);

                    if (idx > -1) {
                        $scope.brandSelection.splice(idx, 1);
                    } else { // else is not selected so select it
                        $scope.brandSelection.push(filterId);
                    }
                } else if (filterType == 'merchant') {
                    //check if merchant filter already selected
                    idx = $scope.storeSelection.indexOf(filterId);

                    if (idx > -1) {
                        $scope.storeSelection.splice(idx, 1);
                    } else { // else is not selected so select it
                        $scope.storeSelection.push(filterId);
                    }
                } else if (filterType == 'category') {
                    $scope.categorySelection.length = 0;
                    $scope.categorySelection.push(filterId);
                }

                if ($scope.keyword)
                    query.term = $scope.keyword;

                query.page = 1;
                $scope.currentPage = 1;

                rebuildFilters();
                console.log('Filter SearchQuery:' + JSON.stringify(SearchQuery));
                doSearch(SearchQuery);
            }

            function rebuildFilters() {
                filters.length = 0;

                if ($scope.storeSelection.length > 0)
                    filters.push({
                        'filter': $scope.storeSelection.join(),
                        'filterType': 'merchant'
                    });

                if ($scope.brandSelection.length > 0)
                    filters.push({
                        'filter': $scope.brandSelection.join(),
                        'filterType': 'brand'
                    });

                if ($scope.categorySelection.length > 0)
                    filters.push({
                        'filter': $scope.categorySelection.join(),
                        'filterType': 'category'
                    });
            }

            $scope.search = function (q) {
                console.log('searching for: ' + q);
                query.term = q;
                query.page = 1;
                query.rpp = 10;
                $scope.keyword = query.term;
                $scope.currentPage = 1;
                doSearch(SearchQuery);
            };


            function doSearch(searchQuery) {
                console.log('hitting productAPI with query:' + JSON.stringify(searchQuery));
                productAPI.fetchProducts(searchQuery).then(function (res) {
                    //console.log('productAPI.fetchProducts returned data:' + JSON.stringify(res));
                    //console.log('scope id:'+$scope.$id);
                    console.log('productAPI.fetchProducts returned data');
                    $scope.products = res.data.results.products;
                    $scope.product_arr = res.data.results.products.product;
                    $scope.num_merchants = res.data.resources.merchants.count;
                    $scope.total = res.data.results.products.count;
                    $scope.totalItems = res.data.results.products.count;
                    $scope.merchants = res.data.resources.merchants;
                    $scope.merchant_arr = res.data.resources.merchants.merchant;
                    $scope.brands = res.data.resources.brands.brand;
                    $scope.prices = res.data.filters.filter
                    productService.setMerchants(res.data.resources.merchants.merchant);
                    $state.go('products.list');
                }, function (result){
                    console.log("The fetchProducts request failed with error " + result);
                });
                //console.log('finished doSearch');
            }

            function getCategories(){
                console.log('fetching categories from API');
                productAPI.fetchCategories().then(function (res){
                    console.log('productAPI.fetchCategories returned data');
                    $scope.tree = res.data;
                })
            }

            $scope.selectItem = function (product) {
                //use the productService to select the item
                productService.selectProduct(product);
                console.log('selected item:' + product.name);
                var url = '/products/' + product.id;
                $location.path(url);
            }

            $scope.reset = function () {
                resetQuery();
                $scope.clearFilters();
                doSearch(SearchQuery);
            }

            function resetQuery(){
                query.term = '';
                query.page = 1;
                query.rpp = 10;
                $scope.setPage(1);
            }
            getCategories();

            /* Pagination logic */
            $scope.range = function () {
                var rangeSize = 5;
                var ret = [];
                var start;
                console.log('page count:' + $scope.pageCount());
                start = $scope.currentPage;
                console.log('start:' + start);
                if (start > $scope.pageCount() - rangeSize) {
                    start = $scope.pageCount() - rangeSize;
                    console.log('start:' + start);
                }

                if (start < 1) {
                    start = 1;
                }

                if (rangeSize > $scope.pageCount()) {
                    rangeSize = $scope.pageCount();
                }
                for (var i = start; i < start + rangeSize; i++) {
                    ret.push(i);
                }
                return ret;
            };

            $scope.prevPage = function () {
                if ($scope.currentPage > 1) {
                    $scope.currentPage--;
                }
            };

            $scope.prevPageDisabled = function () {
                return $scope.currentPage === 1 ? "disabled" : "";
            };

            $scope.nextPage = function () {
                if ($scope.currentPage < $scope.pageCount()) {
                    $scope.currentPage++;
                }
            };

            $scope.nextPageDisabled = function () {
                return $scope.currentPage === $scope.pageCount() ? "disabled" : "";
            };

            $scope.pageCount = function () {
                return Math.ceil($scope.total / $scope.itemsPerPage);
            };

            $scope.setPage = function (pageNo) {
                console.log('new page:'+pageNo);
                $scope.currentPage = pageNo;
            };

            $scope.pageChanged = function() {
                console.log('Page changed to: ' + $scope.currentPage);
            };

            $scope.$watch("currentPage", function (newValue, oldValue) {
                console.log('requesting page:' + newValue)
                query.page = newValue;
                console.log('requesting rpp:' + query.rpp)
                console.log('requesting keyword:' + query.term)
                //console.log('category:'+)
                doSearch(SearchQuery);

                //getCategories();
            });

            /* End pagination logic */
        }])
    .controller('ProductDetailController', ['$scope', 'product',
        function ($scope, product) {
            //console.log('loaded product:'+JSON.stringify(product.info()));
            console.log('loaded product');
            $scope.product_info = product.info();
            $scope.product = $scope.product_info.product;
            $scope.merchants = $scope.product_info.merchants;
            console.log('name:'+$scope.product_info.product.name);
  }])
    .controller('TermsController', ['$scope', '$routeParams',
  function ($scope, $routeParams) {

  }])
    .controller('AboutController', ['$scope', '$routeParams',
  function ($scope, $routeParams) {

  }])
    .controller('PrivacyController', ['$scope', '$routeParams',
  function ($scope, $routeParams) {

  }])
    .controller('CookiesController', ['$scope', '$routeParams',
  function ($scope, $routeParams) {

  }])
    .controller('ContactController', ['$scope', '$routeParams',
  function ($scope, $routeParams) {

  }]);

