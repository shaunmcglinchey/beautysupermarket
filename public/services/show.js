angular.module("beautyApp")
.service('productService', function(){
  var selectedProduct;
   
  var selectProduct = function(newObj){
    selectedProduct = newObj;
  }
  
  var getSelectedProduct = function(){
   return selectedProduct;   
  }
  
  return {
      selectProduct : selectProduct,
      getSelectedProduct : getSelectedProduct
  }
})
.factory("productAPI", function($resource, $q) {

   var resource = $resource('/api/search/', {
            page: '@page',
            rpp: '@rpp',
            keyword: '@keyword',
            filterId: '@filterId',
            filterType: '@filterType'
        });

  return {
    fetchPage: function(SearchParams) {
    	 var deferred = $q.defer();
                resource.get({
                        page: SearchParams.page,
                        rpp: SearchParams.rpp,
                        keyword: SearchParams.keyword,
                        filterId: SearchParams.filterId,
                        filterType: SearchParams.filterType
                    },
                    function (event) {
                        deferred.resolve(event);
                    },
                    function (response) {
                        deferred.reject(response);
                    });
      return deferred.promise;
    }
  };
});