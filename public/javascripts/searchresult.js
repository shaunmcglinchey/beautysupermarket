
module.exports = SearchResult;


function SearchResult(n){

    //set the list of products to the product array
    if(n.results.products.product){
        this.products = n.results.products.product;
    }

    //set the number of results
    this.num_results = n.results.products.count;

    //set the brands associated with these results
    this.brands = n.resources.brands.brand;

    //set the number of brands associated with these results
    this.num_brands = n.resources.brands.count;

    //set the merchants
    this.merchants = n.resources.merchants.merchant;

    //set the number of merchants associated with these results
    this.num_merchants = n.resources.merchants.count;

    //set the search result page
    this.page = n.parameters[0].value;
    //this.page = 1;
    console.log('page value :'+n.parameters[0].value);
    //set the num results per page
    this.rpp = n.parameters[1].value;

    //set the popshop categories matched in this search
    //this.categories = n.resources.categories.matches.category;
}

