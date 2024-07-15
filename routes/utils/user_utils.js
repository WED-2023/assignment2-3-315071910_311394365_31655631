const DButils = require("./DButils");


async function markAsFavorite(user_id, recipe_id){
    await DButils.execQuery(`insert into favorite_recipes values ('${user_id}',${recipe_id})`);
}

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from favorite_recipes where user_id='${user_id}'`);
    return recipes_id;
}

async function removeFavorite(user_id, recipe_id) {
    await DButils.execQuery(
      `DELETE FROM favorite_recipes WHERE user_id = ? AND recipe_id = ?`,
      [user_id, recipe_id]
    );
}

async function checkIsFavoriteRecipe(user_id, recipe_id){
    let favorite_recipes_id = await DButils.execQuery(`select recipe_id from favorite_recipes where user_id='${user_id}' and recipe_id='${recipe_id}'`)
    if (favorite_recipes_id.length > 0){
        return true;
    }
    return false;
}

async function addPersonalRecipe(user_id, recipe) {
    const {title, readyInMinutes, image, popularity, vegan, vegetarian, glutenFree, servings, ingredients, instructions } = recipe;
    await DButils.execQuery(
      `INSERT INTO user_recipes (user_id, title, readyInMinutes, image, popularity, vegan, vegetarian, glutenFree, servings, ingredients, instructions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, title, readyInMinutes, image, popularity, vegan, vegetarian, glutenFree, servings, JSON.stringify(ingredients), JSON.stringify(instructions)]
    );
}

async function getPersonalRecipes(user_id) {
    const personal_recipes = await DButils.execQuery(`SELECT * FROM user_recipes WHERE user_id = ?`, [user_id]);
    
    return await Promise.all(personal_recipes.map(async recipe => ({
      id: recipe.recipe_id,
      title: recipe.title,
      readyInMinutes: recipe.readyInMinutes,
      image: recipe.image,
      popularity: recipe.popularity,
      vegan: recipe.vegan,
      vegetarian: recipe.vegetarian,
      glutenFree: recipe.glutenFree,
      servings: recipe.servings,
      ingredients: JSON.parse(recipe.ingredients),
      instructions: JSON.parse(recipe.instructions),
      isFavorite: await checkIsFavoriteRecipe(user_id, recipe.recipe_id)
    })));
  }

async function getMyRecipeByRecipeID(user_id, recipe_id) {
    const recipe = await DButils.execQuery(`SELECT * FROM user_recipes WHERE user_id = ? AND recipe_id = ?`, [user_id, recipe_id]);
    if (recipe.length === 0) {
      throw { status: 404, message: "Recipe not found" };
    }
    const recipe_details = recipe[0];
    return {
      id: recipe_details.recipe_id,
      title: recipe_details.title,
      readyInMinutes: recipe_details.readyInMinutes,
      image: recipe_details.image,
      popularity: recipe_details.popularity,
      vegan: recipe_details.vegan == 1,
      vegetarian: recipe_details.vegetarian == 1,
      glutenFree: recipe_details.glutenFree == 1,
      ingredients: JSON.parse(recipe_details.ingredients),
      instructions: JSON.parse(recipe_details.instructions),
      servings: recipe_details.servings,
      isFavorite: await checkIsFavoriteRecipe(user_id, recipe_details.recipe_id)
    };
  }

  
  async function addRecipeToMealPlan(user_id, recipe_id) {
    await DButils.execQuery(
        `INSERT INTO user_recipes_meal (user_id, recipe_id) VALUES (?, ?)`,
        [user_id, recipe_id]
    );
}

async function getMealPlanRecipes(user_id) {
    const recipes_id = await DButils.execQuery(
        `SELECT recipe_id FROM user_recipes_meal WHERE user_id = ?`,
        [user_id]
    );
    return recipes_id;
}

async function removeRecipeFromMealPlan(user_id, recipe_id) {
    await DButils.execQuery(
        `DELETE FROM user_recipes_meal WHERE user_id = ? AND recipe_id = ?`,
        [user_id, recipe_id]
    );
}

async function removeAllRecipesFromMealPlan(user_id) {
    await DButils.execQuery(
        `DELETE FROM user_recipes_meal WHERE user_id = ?`,
        [user_id]
    );
}

async function checkIsInMeal(user_id, recipe_id) {
    const rows = await DButils.execQuery(
      'SELECT * FROM user_recipes_meal WHERE user_id = ? AND recipe_id = ?',
      [user_id, recipe_id]
    );
    return rows.length > 0;
  }


exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.removeFavorite = removeFavorite;
exports.checkIsFavoriteRecipe = checkIsFavoriteRecipe;
exports.addPersonalRecipe = addPersonalRecipe;
exports.getPersonalRecipes = getPersonalRecipes;
exports.getMyRecipeByRecipeID = getMyRecipeByRecipeID;
exports.addRecipeToMealPlan = addRecipeToMealPlan;
exports.getMealPlanRecipes = getMealPlanRecipes;
exports.removeRecipeFromMealPlan = removeRecipeFromMealPlan;
exports.removeAllRecipesFromMealPlan = removeAllRecipesFromMealPlan;
exports.checkIsInMeal = checkIsInMeal;




