const DButils = require("./DButils");


// async function markAsFavorite(user_id, recipe_id){
//     await DButils.execQuery(`insert into favorite_recipes values ('${user_id}',${recipe_id})`);
// }

async function markAsFavorite(user_id, recipe_id) {
  const query = `INSERT INTO favorite_recipes (user_id, recipe_id) VALUES (?, ?)`;
  const values = [user_id, recipe_id];
  
  await DButils.execQuery(query, values);
}


async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from favorite_recipes where user_id='${user_id}'`);
    return recipes_id;
}

// async function removeFavorite(user_id, recipe_id) {
//     await DButils.execQuery(
//       `DELETE FROM favorite_recipes WHERE user_id = ? AND recipe_id = ?`,
//       [user_id, recipe_id]
//     );
// }

async function removeFavorite(user_id, recipe_id) {
  const query = `DELETE FROM favorite_recipes WHERE user_id = ? AND recipe_id = ?`;
  const values = [user_id, String(recipe_id)];  // Ensure recipe_id is a string
  
  await DButils.execQuery(query, values);
}


async function checkIsFavoriteRecipe(user_id, recipe_id){
    let favorite_recipes_id = await DButils.execQuery(`select recipe_id from favorite_recipes where user_id='${user_id}' and recipe_id='${recipe_id}'`)
    if (favorite_recipes_id.length > 0){
        return true;
    }
    return false;
}

async function checkIsRecipeWatched(user_id, recipe_id){
  let favorite_recipes_id = await DButils.execQuery(`select recipe_id from watchedrecipes where user_id='${user_id}' and recipe_id='${recipe_id}'`)
  if (favorite_recipes_id.length > 0){
      return true;
  }
  return false;
}

async function addPersonalRecipe(user_id, recipe) {
  const {
    title,
    readyInMinutes,
    image,
    popularity,
    vegan,
    vegetarian,
    glutenFree,
    servings,
    ingredients,
    instructions,
    parsedInstructions,
    topIngredients,
    topEquipment,
    summary
  } = recipe;

  await DButils.execQuery(
    `INSERT INTO user_recipes (user_id, title, readyInMinutes, image, popularity, vegan, vegetarian, glutenFree, servings, ingredients, instructions, parsedInstructions, topIngredients, topEquipment, summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id,
      title,
      readyInMinutes,
      image,
      popularity,
      vegan,
      vegetarian,
      glutenFree,
      servings,
      JSON.stringify(ingredients),
      JSON.stringify(instructions),
      JSON.stringify(parsedInstructions),
      JSON.stringify(topIngredients),
      JSON.stringify(topEquipment),
      summary
    ]
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
      isFavorite: await checkIsFavoriteRecipe(user_id, recipe.recipe_id),
      watched: await checkIsRecipeWatched(user_id, recipe.recipe_id)
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
      servings: recipe_details.servings,
      ingredients: JSON.parse(recipe_details.ingredients),
      instructions: JSON.parse(recipe_details.instructions),
      parsedInstructions: JSON.parse(recipe_details.parsedInstructions),
      topIngredients: JSON.parse(recipe_details.topIngredients),
      topEquipment: JSON.parse(recipe_details.topEquipment),
      summary: recipe_details.summary,
      isFavorite: await checkIsFavoriteRecipe(user_id, recipe_details.recipe_id),
      watched: await checkIsRecipeWatched(user_id, recipe_details.recipe_id),
      inMyMeal: await checkIsInMeal(user_id, recipe_details.recipe_id)
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

async function getRecipeStatusToMealPlan(user_id, recipeId) {
  const recipeStatus = await DButils.execQuery(
      `SELECT recipe_status FROM user_recipes_meal WHERE user_id = ? AND recipe_id = ?`,
      [user_id, recipeId]
  );
  return recipeStatus;
}

async function getRecipeProgressToMealPlan(user_id, recipeId) {
  const progress = await DButils.execQuery(
      `SELECT progress FROM user_recipes_meal WHERE user_id = ? AND recipe_id = ?`,
      [user_id, recipeId]
  );
  return progress;
}

async function getRecipeStepProgress(user_id, recipeId) {
  try {
    const result = await DButils.execQuery(
      `SELECT step FROM user_recipes_meal WHERE user_id = ? AND recipe_id = ?`,
      [user_id, recipeId]
    );
    
    if (result.length > 0) {
      return result[0]; // Return the object containing the 'step' key
    } else {
      throw { status: 404, message: "Recipe not found in meal plan" };
    }
  } catch (error) {
    throw error; // Propagate the error to be handled by the calling function
  }
}


async function getRecipeServingAmount(user_id, recipeId) {
  const serving = await DButils.execQuery(
      `SELECT sreving FROM user_recipes_meal WHERE user_id = ? AND recipe_id = ?`,
      [user_id, recipeId]
  );
  return serving;
}

async function setRecipeStatusInMealPlan(user_id, recipeId, status) {
  try {
    await DButils.execQuery(
      `UPDATE user_recipes_meal 
       SET recipe_status = ? 
       WHERE user_id = ? AND recipe_id = ?`,
      [status, user_id, recipeId]
    );
    return { success: true, message: "Recipe status updated successfully" };
  } catch (error) {
    console.error("Error updating recipe status:", error);
    throw error; // Re-throw the error to handle it in the calling function
  }
}

async function setRecipeStepProgress(user_id, recipeId, curr_step) {
  try {
    await DButils.execQuery(
      `UPDATE user_recipes_meal 
       SET step = ? 
       WHERE user_id = ? AND recipe_id = ?`,
      [curr_step, user_id, recipeId]
    );
    return { success: true, message: "Recipe step progress updated successfully" };
  } catch (error) {
    console.error("Error updating step progress status:", error);
    throw error; // Re-throw the error to handle it in the calling function
  }
}


async function setRecipeProgress(user_id, recipeId, progress) {
  try {
    await DButils.execQuery(
      `UPDATE user_recipes_meal 
       SET progress = ? 
       WHERE user_id = ? AND recipe_id = ?`,
      [progress, user_id, recipeId]
    );
    return { success: true, message: "Recipe progress updated successfully" };
  } catch (error) {
    console.error("Error updating progress status:", error);
    throw error; // Re-throw the error to handle it in the calling function
  }
}


async function resetAllMealProgressForUser(user_id) {
  try {
    await DButils.execQuery(
      `UPDATE user_recipes_meal 
       SET step = 0, progress = 0 
       WHERE user_id = ?`,
      [user_id]
    );
    return { success: true, message: "All meal progress and steps reset successfully" };
  } catch (error) {
    console.error("Error resetting meal progress and steps:", error);
    throw error; // Re-throw the error to handle it in the calling function
  }
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

//   async function markAsWatched(user_id, recipe_id){
//     await DButils.execQuery(`insert into watchedrecipes values ('${user_id}',${recipe_id}, CURRENT_TIMESTAMP) on duplicate key update watched_at=values(watched_at)`);
// }
//   async function getLastWatchedRecipes(user_id, number){
//     const recipes_id = await DButils.execQuery(`select recipe_id from watchedrecipes where user_id='${user_id}' order by watched_at desc limit ${number}`);
//     return recipes_id;
// }
// async function deleteAllWatchedRecipes(user_id) {
//   try {
//       await DButils.execQuery(`DELETE FROM watchedrecipes WHERE user_id='${user_id}'`);
//       console.log(`All watched recipes for user ${user_id} have been deleted.`);
//   } catch (error) {
//       console.error(`Error deleting watched recipes for user ${user_id}:`, error);
//   }
// }

// Function to mark a recipe as watched
async function markAsWatched(user_id, recipe_id) {
  const query = `INSERT INTO watchedrecipes (user_id, recipe_id, watched_at) 
                 VALUES (?, ?, CURRENT_TIMESTAMP) 
                 ON DUPLICATE KEY UPDATE watched_at = VALUES(watched_at)`;
  await DButils.execQuery(query, [user_id, recipe_id]);
}

// Function to get the last watched recipes
async function getLastWatchedRecipes(user_id, number) {
  const query = `SELECT recipe_id 
                 FROM watchedrecipes 
                 WHERE user_id = ? 
                 ORDER BY watched_at DESC 
                 LIMIT ?`;
  const recipes_id = await DButils.execQuery(query, [user_id, number]);
  return recipes_id;
}

// Function to delete all watched recipes for a user
async function deleteAllWatchedRecipes(user_id) {
  try {
    const query = `DELETE FROM watchedrecipes WHERE user_id = ?`;
    await DButils.execQuery(query, [user_id]);
    console.log(`All watched recipes for user ${user_id} have been deleted.`);
  } catch (error) {
    console.error(`Error deleting watched recipes for user ${user_id}:`, error);
  }
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
exports.getRecipeStatusToMealPlan = getRecipeStatusToMealPlan;
exports.getRecipeProgressToMealPlan = getRecipeProgressToMealPlan;
exports.setRecipeStatusInMealPlan = setRecipeStatusInMealPlan;
exports.getRecipeStepProgress = getRecipeStepProgress;
exports.getRecipeServingAmount = getRecipeServingAmount;
exports.setRecipeStepProgress = setRecipeStepProgress;
exports.setRecipeProgress = setRecipeProgress;
exports.resetAllMealProgressForUser = resetAllMealProgressForUser;
exports.getLastWatchedRecipes = getLastWatchedRecipes;
exports.markAsWatched = markAsWatched;
exports.deleteAllWatchedRecipes = deleteAllWatchedRecipes;
exports.checkIsRecipeWatched = checkIsRecipeWatched;