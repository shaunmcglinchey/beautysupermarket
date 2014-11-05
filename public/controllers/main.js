angular.module('beautyApp')
    .controller('ProductListController', ['$scope', '$state','$location', 'productAPI', 'productService',
        function ($scope, $state, $location, productAPI, productService) {

            $scope.itemsPerPage = 10;
            $scope.currentPage = 1;
            $scope.maxSize = 5;
            $scope.storeLimit = 10;
            $scope.brandLimit = 10;
            $scope.brands = [];
            $scope.merchants = [];
           // var filterSelection = new Array();
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

            $scope.incrementStoreLimit = function () {
                $scope.storeLimit = $scope.merchants.length;
            };
            $scope.decrementStoreLimit = function () {
                $scope.storeLimit = 10;
            };

            $scope.storeFullyExpanded = function () {
                if (typeof ($scope.merchants) != 'undefined' && $scope.merchants.length) {

                    if ($scope.storeLimit < $scope.merchants.length)
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
                    doSearch(SearchQuery);
                } else if (filterType == 'brand') {
                    console.log('removing brand filters');
                    $scope.brandSelection.length = 0;
                    console.log('brand selection:' + JSON.stringify($scope.brandSelection));
                    rebuildFilters();
                    //run new search
                    if ($scope.keyword)
                        query.term = $scope.keyword;
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
                }

                if ($scope.keyword)
                    query.term = $scope.keyword;


                rebuildFilters();
                //SearchQuery.filters = filters;
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
                    //$scope.product_arr = [{name:'rosina'}];
                    $state.go('products.list');
                });
                console.log('finished doSearch');
            }

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


            $scope.setPage = function (n) {
                if (n > 0 && n < $scope.pageCount() + 1) {
                    $scope.currentPage = n;
                }
                console.log('set current page to:' + $scope.currentPage);
            };


            function getCategories(){
                console.log('fetching categories from API');
                productAPI.fetchCategories().then(function (res){
                    ///console.log('productAPI.fetchCategories returned data:'+JSON.stringify(res));
                    console.log('productAPI.fetchCategories returned data');
                    $scope.top_level_categories = res.data.categories.category.categories.categories.category;
                    console.log('These are the top level categories:'+JSON.stringify($scope.top_level_categories));

                    $scope.list = [
                        {
                            "id": 1,
                            "title": "1. dragon-breath",
                            "items": []
                        },
                        {
                            "id": 2,
                            "title": "2. moiré-vision",
                            "items": [
                                {
                                    "id": 21,
                                    "title": "2.1. tofu-animation",
                                    "items": [
                                        {
                                            "id": 211,
                                            "title": "2.1.1. spooky-giraffe",
                                            "items": []
                                        },
                                        {
                                            "id": 212,
                                            "title": "2.1.2. bubble-burst",
                                            "items": []
                                        }
                                    ]
                                },
                                {
                                    "id": 22,
                                    "title": "2.2. barehand-atomsplitting",
                                    "items": []
                                }
                            ]
                        },
                        {
                            "id": 3,
                            "title": "3. unicorn-zapper",
                            "items": []
                        },
                        {
                            "id": 4,
                            "title": "4. romantic-transclusion",
                            "items": []
                        }
                    ];
                })
            }

            $scope.$watch("currentPage", function (newValue, oldValue) {
                console.log('requesting page:' + newValue)
                query.page = newValue;
                console.log('requesting rpp:' + query.rpp)
                console.log('requesting keyword:' + query.term)
                doSearch(SearchQuery);
                //getCategories();
            });

            $scope.selectItem = function (product) {
                //use the productService to select the item
                productService.selectProduct(product);
                console.log('selected item:' + product.name);
                var url = '/products/' + product.id;
                $location.path(url);
            }

            $scope.reset = function () {
                query.term = '';
                query.page = 1;
                query.rpp = 10;
                $scope.clearFilters();
                doSearch(SearchQuery);
            }


        }])
    .controller('ProductDetailController', ['$scope', 'product',
        function ($scope, product) {
            $scope.product_info = product;

            console.log('name:'+$scope.product_info.product.name);

            $scope.product = $scope.product_info.product;
            $scope.merchants = $scope.product_info.merchants;

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