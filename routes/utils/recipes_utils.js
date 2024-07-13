const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const user_utils = require("./user_utils");



/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */


async function getSearchRecipes(query, number, cuisine, diet, intolerance){
    if(number === undefined){
        number = 5;
    }
    let search_result = await getRecipesFromSearchAPI(query, number, cuisine, diet, intolerance) ;
    return getRecipesPreviewDetails(search_result.results);
    //return search_result.results.map((element) => element.id);
}

// get the recipes data from the spooncular API query search
 async function getRecipesFromSearchAPI(searchQuery, searchNumber, searchCuisine, searchDiet, searchIntolerance) { 
    const response = await axios.get(`${api_domain}/complexSearch`, {
        params: {
            query: searchQuery,
            number: searchNumber,
            cuisine: searchCuisine,
            diet: searchDiet,
            intolerances: searchIntolerance,
            instructionsRequired: true,
            addRecipeInformation: true,
            apiKey: process.env.spooncular_apiKey,
        },
    });
    return response.data;
}

async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}



async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        
    }
}

// for favorites..
async function getRecipeDetailsToUser(user_id, recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;
    let isFavorite = await user_utils.checkIsFavoriteRecipe(user_id, id);
    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        favorite: isFavorite
        
    }
}

async function searchRecipe(recipeName, cuisine, diet, intolerance, number, username) {
    const response = await axios.get(`${api_domain}/complexSearch`, {
        params: {
            query: recipeName,
            cuisine: cuisine,
            diet: diet,
            intolerances: intolerance,
            number: number,
            apiKey: process.env.spooncular_apiKey
        }
    });

    return getRecipesPreview(response.data.results.map((element) => element.id), username);
}


async function getThreeRandomRecipes(user_id) {
    let random_recipes = await getRandomRecipes(5);
    //filter them that they have at least image and instruction
    // let filter_random_recipes = random_recipes.data.recipes.filter((random) => (random.instructions != "") && (random.image && random.image != ""));
    // if (filter_random_recipes.length < 3) {

    //     return getThreeRandomRecipes(user_id);
    // }
    // return random_recipes 
    return getRecipesPreviewDetails(random_recipes.data.recipes.slice(0, 3), user_id); // Ensure to pass the correct part of the response
}

//get recipe details from list of recipes
async function getRecipesPreviewDetails(recipes_info, user_id) {
    
    return await Promise.all(recipes_info.map(async (recipe_info) => {
        if (!recipe_info) {
            return null;
        }
        let data = recipe_info;
        if (recipe_info.data) {
            data = recipe_info.data;
        }
        let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = data;
        // let isWatched = await user_utils.checkIsWatchedRecipe(user_id, id);
        let isFavorite = await user_utils.checkIsFavoriteRecipe(user_id, id);
        return {
            id: id,
            title: title,
            readyInMinutes: readyInMinutes,
            image: image,
            popularity: aggregateLikes,
            vegan: vegan,
            vegetarian: vegetarian,
            glutenFree: glutenFree,
            // isWatched: isWatched,
            isFavorite: isFavorite,
        }
    }))
}

  
//get random recipes from spooncolar api
async function getRandomRecipes(number){
const response = await axios.get(`${api_domain}/random`, {
    params: {
        limitLicense: true,
        number: number,
        apiKey: process.env.spooncular_apiKey

    }
}); 
return response;
}


//get full recipe details by recipe_id
async function getRecipeFullDetails(recipe_id, user_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let {id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree,analyzedInstructions,extendedIngredients,servings} = recipe_info.data;
    // let isWatched = await user_utils.checkIsWatchedRecipe(user_id, id);
    let isFavorite = await user_utils.checkIsFavoriteRecipe(user_id, id);
    let ingredients_dict = [];
    await Promise.all(extendedIngredients.map(async (element) => ingredients_dict.push({
        name: element.name,
        amount: element.amount,
    })))
        return {
            id: id,
            title: title,
            readyInMinutes: readyInMinutes,
            image: image,
            popularity: aggregateLikes,
            vegan: vegan,
            vegetarian: vegetarian,
            glutenFree: glutenFree,
            ingredients: ingredients_dict,
            instructions: analyzedInstructions,  
            servings: servings,
            // isWatched: isWatched,
            isFavorite: glutenFree, // there is a problem here with the boolean insert.
        } 
}

  module.exports = {
    getRecipeDetails,
    searchRecipe,
    getThreeRandomRecipes,
    getRecipesPreviewDetails,
    getRecipeFullDetails,
    getSearchRecipes,
    getRecipeDetailsToUser,

};
// exports.getRecipeDetails = getRecipeDetails;

/////////////////////// kalanit ////////////////////////////////////////



// //get full recipe details by recipe_id
// async function getRecipeFullDetails(recipe_id, user_id) {
//     let recipe_info = await getRecipeInformation(recipe_id);
//     let {id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree,analyzedInstructions,extendedIngredients,servings} = recipe_info.data;
//     let isWatched = await user_utils.checkIsWatchedRecipe(user_id, id);
//     let isFavorite = await user_utils.checkIsFavoriteRecipe(user_id, id);
//     let ingredients_dict = [];
//     await Promise.all(extendedIngredients.map(async (element) => ingredients_dict.push({
//         name: element.name,
//         amount: element.amount,
//     })))
//         return {
//             id: id,
//             title: title,
//             readyInMinutes: readyInMinutes,
//             image: image,
//             popularity: aggregateLikes,
//             vegan: vegan,
//             vegetarian: vegetarian,
//             glutenFree: glutenFree,
//             ingredients: ingredients_dict,
//             instructions: analyzedInstructions,  
//             servings: servings,
//             isWatched: isWatched,
//             isFavorite: isFavorite,
//         } 
// }

// //get preview details of 3 random recipes
// async function getThreeRandomRecipes(user_id){
//     let random_recipes = await getRandomRecipes(5);
//     //filter them that they have at least image and instruction
//     let filter_random_recipes = random_recipes.data.recipes.filter((random) => (random.instructions != "") && (random.image && random.image != ""));
//     if (filter_random_recipes.length < 3) {
//         return getThreeRandomRecipes(user_id);
//     }
//     return getRecipesPreviewDetails([filter_random_recipes[0], filter_random_recipes[1], filter_random_recipes[2]], user_id);
// }
// //get random recipes from spooncolar api
// async function getRandomRecipes(number){
//     const response = await axios.get(`${api_domain}/random`, {
//         params: {
//             limitLicense: true,
//             number: number,
//             apiKey: process.env.spooncular_apiKey
//         }
//     }); 
//     return response;
// }

// // get recipes preview from the spooncular API query search
// // default nuber of recipes is 5
// async function getSearchRecipes(query, number, cuisine, diet, intolerance){
//     if(number === undefined){
//         number = 5;
//     }
//     let search_result = await getRecipesFromSearchAPI(query, number, cuisine, diet, intolerance) ;
//     return getRecipesPreviewDetails(search_result.results);
// }

// // get the recipes data from the spooncular API query search
//  async function getRecipesFromSearchAPI(searchQuery, searchNumber, searchCuisine, searchDiet, searchIntolerance) { 
//     const response = await axios.get(`${api_domain}/complexSearch`, {
//         params: {
//             query: searchQuery,
//             number: searchNumber,
//             cuisine: searchCuisine,
//             diet: searchDiet,
//             intolerances: searchIntolerance,
//             instructionsRequired: true,
//             addRecipeInformation: true,
//             apiKey: process.env.spooncular_apiKey,
//         },
//     });
//     return response.data;
// }

