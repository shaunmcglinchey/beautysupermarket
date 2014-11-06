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
            $scope.categorySelection = [];

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
                $scope.categorySelection.length = 0;
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
                    //check if merchant filter already selected
                    //idx = $scope.categorySelection.indexOf(filterId);

                    $scope.categorySelection.length = 0;
                    $scope.categorySelection.push(filterId);

                    /*
                    if (idx > -1) {
                        $scope.categorySelection.splice(idx, 1);
                    } else { // else is not selected so select it

                    }
                    */
                }

                if ($scope.keyword)
                    query.term = $scope.keyword;


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
                    console.log('scope id:'+$scope.$id);
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
                });
                console.log('finished doSearch');
            }



            function getCategories(){
                console.log('fetching categories from API');
                productAPI.fetchCategories().then(function (res){
                    ///console.log('productAPI.fetchCategories returned data:'+JSON.stringify(res));
                    console.log('productAPI.fetchCategories returned data');
                    $scope.top_level_categories = res.data.categories.category.categories.categories.category;
                    console.log('These are the top level categories:'+JSON.stringify($scope.top_level_categories));
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

            $scope.tree = [{name: "All", id: 13000, nodes: [
                {name: "Cosmetics & Makeup", id: 13250, nodes: [
                    {name: "Concealers", id: 13276},
                    {name: "Cosmetic & Makeup Sets", id: 13251},
                    {name: "Cosmetic Mirrors", id: 13261},
                    {name: "Exfoliants", id: 13281},
                    {name: "Eyebrow", id: 32536},
                    {name: "EyeLash/Mascara", id: 13461},
                    {name: "Eye Liner", id: 13471},
                    {name: "Eye Shadow", id: 13471},
                    {name: "Facial Care Blush", id: 13271},
                    {name: "Facial Cleansers", id: 13318},
                    {name: "Facial Masks", id: 13296},
                    {name: "Facial Treatments", id: 13324},
                    {name: "Lip Liners", id: 13678},
                    {name: "Lipsticks & Gloss", id: 13698},
                    {name: "Makeup Remover", id: 13291},
                    {name: "Makeup Brushes & Applicators", id: 13256},
                    {name: "Makeup Foundations & Primers", id: 13286},
                    {name: "Other Cosmetics & Makeup", id: 13301},
                    {name: "Powders", id: 13306},
                    {name: "Skin Moisturisers", id: 13331},
                    {name: "Toners", id: 13311}
                ]},
                {name: "Fragrances", id: 13001, nodes: [
                    {name: "Fragrance Gift Sets", id: 13012},
                    {name: "Men's Fragrances", id: 13022},
                    {name: "Other Fragrances", id: 13002},
                    {name: "Unisex Fragrances", id: 13042},
                    {name: "Women's Fragrances", id: 13032}
                ]},
                {name: "Hair Care", id: 13050, nodes: [
                    {name: "Coloring", id: 32551},
                    {name: "Hair & Scalp Treatment", id: 32553},
                    {name: "Hair Care Accessories", id: 32556},
                    {name: "Hair Dryers, Stylers & Barber Tools", id: 32555},
                    {name: "Hair Removal", id: 32554},
                    {name: "Shampoos & Conditioners", id: 32557},
                    {name: "Styling", id: 32558}
                ]},
            ]}];

            /*
            $scope.selectCategory = function (cat) {
                console.log('category selected:'+cat);
            }
            */

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
                doSearch(SearchQuery);

                //getCategories();
            });

            /* End pagination logic */

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