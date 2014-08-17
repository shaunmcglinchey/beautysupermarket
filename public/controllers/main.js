angular.module('beautyApp')
    .controller('ProductListController', ['$scope', '$location','productAPI','productService',
        function ($scope, $location, productAPI, productService) {

            $scope.itemsPerPage = 10;
            $scope.currentPage = 1;
            $scope.maxSize = 5;
            var filterSelection = new Array();
            var selectedFilter;

            var SearchParams = {};
            SearchParams.keyword = '';
            SearchParams.page = 1;
            SearchParams.rpp = 10;
            SearchParams.filterId = null;
            SearchParams.filterType = null;
            

            $scope.search = function () {
                console.log('searching for: ' + $scope.form.query);
                SearchParams.keyword = $scope.form.query;
                SearchParams.page = 1;
                SearchParams.rpp = 10;
                $scope.keyword = SearchParams.keyword;
                $scope.currentPage = 1;
                doSearch(SearchParams);
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

            function doSearch(SearchParams) {
                productAPI.fetchPage(SearchParams).then(function (res) {
                    console.log('product data ready to go');
                    $scope.products = res.results;
                    $scope.num_merchants = res.resources.merchants.count;
                    $scope.total = res.results.products.count;
                    $scope.totalItems = res.results.products.count;
                    $scope.merchants = res.resources.merchants.merchant;
                    $scope.brands = res.resources.brands.brand;
                    
                    console.log('res merchants:'+JSON.stringify(res.resources.merchants.merchant));
                    //pass the merchants to our product service so that other controllers may access them
                    productService.setMerchants(res.resources.merchants.merchant);
                    
                    console.log('res.parameters[0].value:' + res.parameters[0].value);
                    console.log('num results:' + $scope.total);
                });
            }

            $scope.$watch("currentPage", function (newValue, oldValue) {
                //set the page number
                console.log('requesting page:' + newValue)
                SearchParams.page = newValue;
                console.log('requesting rpp:' + SearchParams.rpp)
                console.log('requesting keyword:' + SearchParams.keyword)
                doSearch(SearchParams);
            });
            
            function getID(filterArray, filterProperty){
                //console.log('filter prop:'+filterProperty);
                //console.log('filter arr:'+JSON.stringify(filterArray));
                filterSelection = _.where(filterArray, {name:filterProperty});
                //console.log('selection:'+JSON.stringify(filterSelection));
                selectedFilterIdList = _.pluck(filterSelection,"id"); 
                return selectedFilterIdList[0];
            }
            
            $scope.selectItem = function(product){
             //use the productService to select the item
             productService.selectProduct(product);
             console.log('selected item:'+product.name);
             var url = '/products/' + product.id;
             $location.path(url);
            }
            
            $scope.filter = function(filter, filterType){
              //check what kind of filter we have
              if(filterType == 'brand'){
                console.log('brand filter selected:'+filter.name);
                SearchParams.filterType = 'brand';
                SearchParams.filterId = getID($scope.brands,filter.name);  
              }else if(filterType == 'merchant'){
                console.log('store filter selected:'+filter.name);
                SearchParams.filterType = 'merchant';
                SearchParams.filterId = getID($scope.merchants,filter.name);           
              }
                console.log('filter type:'+SearchParams.filterType+',filter id:'+SearchParams.filterId);
                SearchParams.keyword = $scope.keyword;
                SearchParams.page = 1;
                SearchParams.rpp = 10;
                doSearch(SearchParams);
            }

}])
.controller('ProductDetailController', ['$scope', '$routeParams','productService',
  function($scope, $routeParams, productService) {
      var filterSelection = new Array();
      $scope.productId = $routeParams.productId;
      console.log('reached product detail page for product: '+$scope.productId);
      
      //fetch the product from the product service
      $scope.product = productService.getSelectedProduct();
      //console.log('description: '+$scope.product.description);
      //console.log('merchants:'+JSON.stringify(productService.getMerchants()));
      $scope.merchants = productService.getMerchants();
      //console.log('merchants length:'+JSON.stringify($scope.merchants));
      $scope.min_merchant_name = getMerchantName($scope.merchants,$scope.product.price_min_merchant);
      //SearchParams.filterId = getName($scope.merchants,filter.name);  
      
      
      
       function getMerchantName(filterArray, filterProperty){
                filterSelection = _.where(filterArray, {id:filterProperty});
                selectedFilterIdList = _.pluck(filterSelection,"name"); 
                return selectedFilterIdList[0];
            }
      
  }]);;