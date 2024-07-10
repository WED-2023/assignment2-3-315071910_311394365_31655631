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

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.removeFavorite = removeFavorite;
exports.checkIsFavoriteRecipe = checkIsFavoriteRecipe;

