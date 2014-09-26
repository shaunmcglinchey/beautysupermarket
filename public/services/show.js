angular.module("beautyApp")
    .service('productService', function () {
        var selectedProduct;
        var brands = new Array();
        var merchants = new Array();

        var selectProduct = function (newObj) {
            selectedProduct = newObj;
        }

        var getSelectedProduct = function () {
            return selectedProduct;
        }

        var setMerchants = function (newObj) {
            merchants = newObj;
        }

        var getMerchants = function () {
            return merchants;
        }

        return {
            selectProduct: selectProduct,
            getSelectedProduct: getSelectedProduct,
            setMerchants: setMerchants,
            getMerchants: getMerchants
        }
    })
    .factory("productAPI", function ($http, $resource, $q) {

        var base_url = '/api/products/';

        return {

            fetchProducts: function ($params) {
                return $http({
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        url: base_url,
                        method: "POST",
                        data: $params,
                    })
                    .success(function () {
                        console.log('fetchProducts ran');
                    })
                    .error(function () {
                        console.log('fetchProducts call resulted in an error');
                    });
            }
        };
    });