angular.module('beautyApp')
    .controller('ProductListController', ['$scope', '$location', 'productAPI', 'productService',
        function ($scope, $location, productAPI, productService) {

            $scope.itemsPerPage = 10;
            $scope.currentPage = 1;
            $scope.maxSize = 5;
            $scope.storeLimit = 10;
            $scope.brandLimit = 10;
            $scope.brands = [];
            $scope.merchants = [];
            var limitStep = 5;
            var filterSelection = new Array();
            var selectedFilter;
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
                $scope.storeLimit += limitStep;
            };
            $scope.decrementStoreLimit = function () {
                $scope.storeLimit -= limitStep;
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

            $scope.storePartiallyExpanded = function () {
                if ($scope.storeLimit > 10)
                    return true;
                return false;
            };

            $scope.incrementBrandLimit = function () {
                $scope.brandLimit += limitStep;
            };
            $scope.decrementBrandLimit = function () {
                $scope.brandLimit -= limitStep;
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

            $scope.brandPartiallyExpanded = function () {
                if ($scope.brandLimit > 10)
                    return true;
                return false;
            };

            $scope.clearFilter = function (filterType) {
                if (filterType == 'merchant') {
                    console.log('removing merchant filters');
                    $scope.storeSelection.length = 0;
                    console.log('store selection:' + JSON.stringify($scope.storeSelection));
                    //rebuildFilters
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

                /*
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
                */
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

            $scope.search = function () {
                console.log('searching for: ' + $scope.form.query);
                query.term = $scope.form.query;
                query.page = 1;
                query.rpp = 10;
                $scope.keyword = query.term;
                $scope.currentPage = 1;
                doSearch(SearchQuery);
            };


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

            function doSearch(searchQuery) {
                console.log('hitting productAPI with query:' + JSON.stringify(searchQuery));
                productAPI.fetchProducts(searchQuery).then(function (res) {
                    //console.log('productAPI.fetchProducts returned data:' + JSON.stringify(res));
                    console.log('productAPI.fetchProducts returned data');
                    $scope.products = res.data.results;
                    $scope.num_merchants = res.data.resources.merchants.count;
                    $scope.total = res.data.results.products.count;
                    $scope.totalItems = res.data.results.products.count;
                    $scope.merchants = res.data.resources.merchants.merchant;
                    $scope.brands = res.data.resources.brands.brand;
                    $scope.prices = res.data.filters.filter
                    productService.setMerchants(res.data.resources.merchants.merchant);
                });
            }

            $scope.$watch("currentPage", function (newValue, oldValue) {
                console.log('requesting page:' + newValue)
                query.page = newValue;
                console.log('requesting rpp:' + query.rpp)
                console.log('requesting keyword:' + query.term)
                doSearch(SearchQuery);
            });

            function getID(filterArray, filterProperty) {
                filterSelection = _.where(filterArray, {
                    name: filterProperty
                });
                selectedFilterIdList = _.pluck(filterSelection, "id");
                return selectedFilterIdList[0];
            }

            $scope.selectItem = function (product) {
                //use the productService to select the item
                productService.selectProduct(product);
                console.log('selected item:' + product.name);
                var url = '/products/' + product.id;
                $location.path(url);
            }
        }])
    .controller('ProductDetailController', ['$scope', '$routeParams', 'productService',
  function ($scope, $routeParams, productService) {
            var filterSelection = new Array();
            $scope.productId = $routeParams.productId;
            console.log('reached product detail page for product: ' + $scope.productId);

            //fetch the product from the product service
            $scope.product = productService.getSelectedProduct();
            $scope.merchants = productService.getMerchants();
            $scope.min_merchant_name = getMerchantName($scope.merchants, $scope.product.price_min_merchant);

            function getMerchantName(filterArray, filterProperty) {
                filterSelection = _.where(filterArray, {
                    id: filterProperty
                });
                selectedFilterIdList = _.pluck(filterSelection, "name");
                return selectedFilterIdList[0];
            }

            function getMerchantLogo(filterArray, filterProperty) {
                filterSelection = _.where(filterArray, {
                    id: filterProperty
                });
                selectedFilterIdList = _.pluck(filterSelection, "logo_url");
                return selectedFilterIdList[0];
            }

            function getMerchantLogoUrl(merchant_id) {
                logoUrl = getMerchantLogo($scope.merchants, merchant_id);
                console.log('logo url:' + logoUrl);
                return logoUrl;
            };

            //TODO alter the scope data loaded into the view to include all the details it needs - so image urls for logos etc
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