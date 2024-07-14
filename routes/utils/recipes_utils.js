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

async function getRecipeFullInstructions(recipe_id) {
    const response = await axios.get(`${api_domain}/${recipe_id}/analyzedInstructions`, {
        params: {
            apiKey: process.env.spooncular_apiKey
        }
    });

    const instructions = response.data;
    const parsedInstructions = instructions.map(instruction => ({
        name: instruction.name,
        steps: instruction.steps.map(step => ({
            number: step.number,
            step: step.step,
            ingredients: step.ingredients.map(ingredient => ({
                id: ingredient.id,
                name: ingredient.name,
                localizedName: ingredient.localizedName,
                image: ingredient.image
            })),
            equipment: step.equipment.map(equip => ({
                id: equip.id,
                name: equip.name,
                localizedName: equip.localizedName,
                image: equip.image
            }))
        }))
    }));

    const ingredients = [];
    const equipment = [];
    parsedInstructions.forEach(instruction => {
        instruction.steps.forEach(step => {
            step.ingredients.forEach(ingredient => {
                if (!ingredients.some(i => i.id === ingredient.id)) {
                    ingredients.push({
                        id: ingredient.id,
                        name: ingredient.name
                    });
                }
            });
            step.equipment.forEach(equip => {
                if (!equipment.some(e => e.id === equip.id)) {
                    equipment.push({
                        id: equip.id,
                        name: equip.name
                    });
                }
            });
        });
    });

    return {
        parsedInstructions: parsedInstructions,
        ingredients: ingredients,
        equipment: equipment
    };
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
    // analyzedInstructions = getRecipeFullInstructions(recipe_id);
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



/**
 * Get full recipe details in the required structure
 * @param {number} recipe_id - ID of the recipe
 * @returns {Object} - Formatted recipe details
 */
async function getFormattedRecipeDetails(recipe_id) {
    try {
        // Fetch recipe information
        const recipe_info = await axios.get(`${api_domain}/${recipe_id}/information`, {
            params: {
                includeNutrition: false,
                apiKey: process.env.spooncular_apiKey
            }
        });

        // Extract relevant details
        const { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree, analyzedInstructions, extendedIngredients, servings, summary } = recipe_info.data;

        // Format ingredients
        const ingredients = extendedIngredients.map(ingredient => ({
            name: ingredient.name,
            amount: ingredient.amount
        }));

        // Format instructions
        const parsedInstructions = analyzedInstructions.map(instruction => ({
            name: instruction.name,
            steps: instruction.steps.map(step => ({
                number: step.number,
                step: step.step,
                ingredients: step.ingredients.map(ingredient => ({
                    id: ingredient.id,
                    name: ingredient.name,
                    localizedName: ingredient.localizedName,
                    image: ingredient.image
                })),
                equipment: step.equipment.map(equip => ({
                    id: equip.id,
                    name: equip.name,
                    localizedName: equip.localizedName,
                    image: equip.image
                })),
                length: step.length ? {
                    number: step.length.number,
                    unit: step.length.unit
                } : undefined
            }))
        }));

        // Format ingredients and equipment for the top-level
        const topIngredients = extendedIngredients.map(ingredient => ({
            id: ingredient.id,
            name: ingredient.name
        }));

        const topEquipment = analyzedInstructions.flatMap(instruction => 
            instruction.steps.flatMap(step => step.equipment.map(equip => ({
                id: equip.id,
                name: equip.name
            })))
        ).filter((equip, index, self) => 
            index === self.findIndex(e => e.id === equip.id)
        );

        // Format the final data structure
        const formattedRecipeDetails = {
            id,
            title,
            readyInMinutes,
            image,
            popularity: aggregateLikes,
            vegan,
            vegetarian,
            glutenFree,
            ingredients,
            instructions: parsedInstructions,
            servings,
            isFavorite: false, // Assuming a default value, you can modify it based on your logic
            parsedInstructions,
            topIngredients,
            topEquipment,
            summary // Adding the summary field
        };

        return formattedRecipeDetails;
    } catch (error) {
        console.error(`Error fetching recipe details: ${error.message}`);
        throw error;
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
    getRecipeFullInstructions,
    getFormattedRecipeDetails

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

