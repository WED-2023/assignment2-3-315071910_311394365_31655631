var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");


router.get("/", (req, res) => res.send("im here 2"));



/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users").then((users) => {
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        next();
      }
    }).catch(err => next(err));
  } else {
    res.sendStatus(401);
  }
});


router.post('/favorites', async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      throw { status: 402, message: "User not logged in" };
    }
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsFavorite(user_id, recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
  } catch (error) {
    next(error);
  }
});

router.get('/lastSearch', async (req,res,next) => {
  try{
    const lastSearch = req.session.lastSearch;
    console.log(lastSearch);
    res.status(200).send(lastSearch);
  } catch(error){
    next(error); 
  }
});


// /**
//  * This path returns the favorites recipes that were saved by the logged-in user
//  */
// router.get('/favorites', async (req,res,next) => {
//   try{
//     const user_id = req.session.user_id;
//     let favorite_recipes = {};
//     const recipes_id = await user_utils.getFavoriteRecipes(user_id);
//     let recipes_id_array = [];
//     recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
//     const results = await recipe_utils.getRecipesPreviewDetails(recipes_id_array, user_id);
//     res.status(200).send(results);
//   } catch(error){
//     next(error); 
//   }
// });



/**
 * This path returns the favorite recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    if (!user_id) {
      return res.status(401).send({ error: "User not logged in" });
    }

    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    let recipes_favorites = [];

    // Extracting the recipe ids into array
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id));

    for (let i = 0; i < recipes_id_array.length; i++) {
      let recipe_details;

      if (Number.isInteger(Number(recipes_id_array[i]))) {
        recipe_details = await recipe_utils.getRecipeDetailsToUser(user_id, recipes_id_array[i]);
      } else {
        if (recipes_id_array[i].substring(0, 6) === "FAMILY") {
          recipe_details = await recipe_utils.getFamilyRecipeDetailsToUser(user_id, recipes_id_array[i]);
        } else {
          recipe_details = await user_utils.getMyRecipeByRecipeID(user_id, recipes_id_array[i]);
        }
      }

      recipes_favorites.push(recipe_details);
    }

    res.status(200).send(recipes_favorites);
  } catch (error) {
    console.error("Error fetching favorite recipes:", error);
    next(error);
  }
});



/**
 * This path gets body with recipeId and removes this recipe from the favorites list of the logged-in user
 */
router.delete('/favorites', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;

    // Ensure the user is logged in
    if (!user_id) {
      throw { status: 402, message: "User not logged in" };
    }

    // Remove the recipe from the favorites
    await user_utils.removeFavorite(user_id, recipe_id);
    
    res.status(200).send("The Recipe was successfully removed from favorites");
  } catch (error) {
    next(error);
  }
});


/**
 * POST /my_recipes - Add a new recipe to the user's personal collection
 */
router.post('/my_recipes', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    if (!user_id) {
      return res.status(401).send({ error: "User not logged in" });
    }

    const recipe = req.body;
    await user_utils.addPersonalRecipe(user_id, recipe);

    res.status(201).send("Recipe added successfully");
  } catch (error) {
    next(error);
  }
});

/**
 * GET /my_recipes - Retrieve all personal recipes of the logged-in user
 */
router.get('/my_recipes', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    if (!user_id) {
      return res.status(401).send({ error: "User not logged in" });
    }

    const recipes = await user_utils.getPersonalRecipes(user_id);
    res.status(200).send(recipes);
  } catch (error) {
    next(error);
  }
});


router.get('/my_recipes/:recipeId', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.params.recipeId;
    const recipe = await user_utils.getMyRecipeByRecipeID(user_id, recipe_id);
    res.status(200).send(recipe);
  } catch (error) {
    next(error);
  }
});


/**
 * POST /meal_plan - Add a new recipe to the user's meal plan
 */
router.post('/meal_plan', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    if (!user_id) {
      return res.status(401).send({ error: "User not logged in" });
    }

    const recipe_id = req.body.recipeId;
    await user_utils.addRecipeToMealPlan(user_id, recipe_id);

    res.status(201).send("Recipe added to meal plan successfully");
  } catch (error) {
    next(error);
  }
});

/**
 * GET /meal_plan - Retrieve all recipes in the user's meal plan
 */
router.get('/meal_plan', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    if (!user_id) {
      return res.status(401).send({ error: "User not logged in" });
    }

    const recipes_id = await user_utils.getMealPlanRecipes(user_id);
    let recipes_id_array = [];
    let recipes_meal_plan = [];

    // Extracting the recipe ids into an array
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id));

    for (let i = 0; i < recipes_id_array.length; i++) {
      let recipe_details;

      if (Number.isInteger(Number(recipes_id_array[i]))) {
        recipe_details = await recipe_utils.getRecipeDetailsToUser(user_id, recipes_id_array[i]);
      } else {
        if (recipes_id_array[i].substring(0, 6) === "FAMILY") {
          recipe_details = await recipe_utils.getFamilyRecipeDetailsToUser(user_id, recipes_id_array[i]);
        } else {
          recipe_details = await user_utils.getMyRecipeByRecipeID(user_id, recipes_id_array[i]);
        }
      }

      recipe_details['preperation_status'] = (await user_utils.getRecipeStatusToMealPlan(user_id, recipe_details.id))[0].recipe_status.toString();
      recipe_details['progress'] = (await user_utils.getRecipeProgressToMealPlan(user_id, recipe_details.id))[0].progress;
      // recipe_details['step'] = (await user_utils.getRecipeStepProgress(user_id, recipe_details.id))[0].step;
      // recipe_details['serving'] = (await user_utils.getRecipeServingAmount(user_id, recipe_details.id))[0].serving;
      recipes_meal_plan.push(recipe_details);
    }

    res.status(200).send(recipes_meal_plan);
  } catch (error) {
    console.error("Error fetching meal plan recipes:", error);
    next(error);
  }
});


// Route to get the step value for a recipe in the user's meal plan
router.get('/meal_plan/:recipeId/step', async (req, res, next) => {
  try {
    const user_id = req.session.user_id; // Assume user is authenticated and session contains user_id
    const recipe_id = req.params.recipeId;

    // Fetch the step value using the utility function
    const stepResult = await user_utils.getRecipeStepProgress(user_id, recipe_id);
    const step = stepResult.step; // Extract the step value

    res.status(200).send({ step });
  } catch (error) {
    next(error); // Pass the error to the error-handling middleware
  }
});


router.post('/meal_plan/:recipeId/:status', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.params.recipeId;
    const status = parseInt(req.params.status, 10); // Convert status to an integer

    // Validate status (assuming valid statuses are 0, 1, or 2)
    if (![0, 1, 2].includes(status)) {
      return res.status(400).send({ error: "Invalid status value" });
    }

    // Update the recipe status in the meal plan
    await user_utils.setRecipeStatusInMealPlan(user_id, recipe_id, status);
    
    res.status(200).send({ success: true, message: "Recipe status updated successfully" });
  } catch (error) {
    next(error); // Pass error to the global error handler
  }
});


router.post('/meal_plan/:recipeId/step/:step', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.params.recipeId;
    const step = parseInt(req.params.step, 10); // Convert step to an integer

    if (isNaN(step)) {
      return res.status(400).send({ error: "Invalid step value" });
    }

    // Update the recipe step in the meal plan
    await user_utils.setRecipeStepProgress(user_id, recipe_id, step);
    
    res.status(200).send({ success: true, message: "Recipe step progress updated successfully" });
  } catch (error) {
    next(error); // Pass error to the global error handler
  }
});


router.post('/meal_plan/:recipeId/progress/:progress', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.params.recipeId;
    const progress = parseFloat(req.params.progress); // Convert progress to a float

    if (isNaN(progress) || progress < 0 || progress > 1) {
      return res.status(400).send({ error: "Invalid progress value" });
    }

    // Update the recipe progress in the meal plan
    await user_utils.setRecipeProgress(user_id, recipe_id, progress);
    
    res.status(200).send({ success: true, message: "Recipe progress updated successfully" });
  } catch (error) {
    next(error); // Pass error to the global error handler
  }
});




/**
 * DELETE /meal_plan - Remove a recipe from the user's meal plan
 */
router.delete('/meal_plan', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;

    // Ensure the user is logged in
    if (!user_id) {
      throw { status: 402, message: "User not logged in" };
    }

    // Remove the recipe from the meal plan
    await user_utils.removeRecipeFromMealPlan(user_id, recipe_id);
    
    res.status(200).send("The Recipe was successfully removed from the meal plan");
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /meal_plan/all - Remove all recipes from the user's meal plan
 */
router.delete('/meal_plan/all', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    // Ensure the user is logged in
    if (!user_id) {
      throw { status: 402, message: "User not logged in" };
    }

    // Remove all recipes from the meal plan
    await user_utils.removeAllRecipesFromMealPlan(user_id);
    
    res.status(200).send("All recipes were successfully removed from the meal plan");
  } catch (error) {
    next(error);
  }
});

// return the amount of recipes in meal by user.
router.get('/meal_plan/count', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    // Check if the user is logged in
    if (!user_id) {
      return res.status(401).send({ error: "User not logged in" });
    }

    // Get the list of recipe IDs in the user's meal plan
    const recipes_id = await user_utils.getMealPlanRecipes(user_id);

    // Return the count of recipes
    res.status(200).send({ mealPlanCount: recipes_id.length });
  } catch (error) {
    console.error("Error fetching meal plan count:", error);
    next(error);
  }
});


router.post('/resetAllMealPlan', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    // Reset all meal progress and steps for the user
    await user_utils.resetAllMealProgressForUser(user_id);

    // Send a success response
    res.status(200).send({ success: true, message: "All meal progress and steps reset successfully" });
  } catch (error) {
    next(error); // Pass error to the global error handler
  }
});

// new

/**
 * This path returns the 3 last recipes that the logged-in user watched
 */
// router.get('/lastWatchedRecipes', async (req,res,next) => {
//   try{
//     const user_id = req.session.user_id;
//     const recipes_id = await user_utils.getLastWatchedRecipes(user_id, 3);
//     let recipes_id_array = []
//     let last_watched_recipes = [];
//     recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
//     for(let i=0; i<recipes_id_array.length;i++){
//       last_watched_recipes.push(await recipe_utils.getRecipeFullDetails(recipes_id_array[i],user_id))
//       //last_watched_recipes.push(await recipe_utils.getRecipesPreviewDetails(recipes_id_array[i],user_id))
//     }

//     res.status(200).send(last_watched_recipes);
//   } catch(error){
//     next(error); 
//   }
// });

// amit functions

// router.get('/lastWatchedRecipes', async (req, res, next) => {
//   try {
//     const user_id = req.session.user_id;
//     const recipes_id = await user_utils.getLastWatchedRecipes(user_id, 3);
//     let recipes_id_array = [];
//     let last_watched_recipes = [];

//     // Extracting the recipe ids into an array
//     recipes_id.map((element) => recipes_id_array.push(element.recipe_id));

//     // Fetching detailed information for each recipe and getting preview details
//     for (let i = 0; i < recipes_id_array.length; i++) {
//       const recipeInfo = await recipe_utils.getRecipeInformation(recipes_id_array[i]);
//       const recipePreview = await recipe_utils.getRecipesPreviewDetails([recipeInfo], user_id);
//       last_watched_recipes.push(recipePreview[0]); // Since getRecipesPreviewDetails returns an array
//     }

//     res.send(last_watched_recipes);
//   } catch (error) {
//     next(error);
//   }
// });


router.get('/lastWatchedRecipes', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipes_id = await user_utils.getLastWatchedRecipes(user_id, 3);
    let recipes_id_array = [];
    let last_watched_recipes = [];

    // Extracting the recipe ids into an array
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id));

    // Fetching detailed information for each recipe and getting preview details
    for (let i = 0; i < recipes_id_array.length; i++) {
      if (Number.isInteger(Number(recipes_id_array[i]))) {
        recipe_details = await recipe_utils.getRecipeDetailsToUser(user_id, recipes_id_array[i]);
      } else {
        if (recipes_id_array[i].substring(0, 6) === "FAMILY") {
          recipe_details = await recipe_utils.getFamilyRecipeDetailsToUser(user_id, recipes_id_array[i]);
        } else {
          recipe_details = await user_utils.getMyRecipeByRecipeID(user_id, recipes_id_array[i]);
        }
      }
      last_watched_recipes.push(recipe_details); // Since getRecipesPreviewDetails returns an array
    }
    res.send(last_watched_recipes);
  } catch (error) {
    next(error);
  }
});



router.delete('/deleteWatchedRecipes', async (req, res, next) => {
  try {
    const user_id = req.session.user_id; // Get the user ID from the session

    // Call the function to delete all watched recipes for the specific user
    await user_utils.deleteAllWatchedRecipes(user_id);

    // Send a success response
    res.status(200).send({ message: "All watched recipes have been deleted." });
  } catch (error) {
    next(error); // Pass any errors to the error handling middleware
  }
});

router.post("/markwatched/:recipeId", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    
    if (!user_id) {
      return res.status(401).send({ message: "Unauthorized: No user session" });
    }

    await user_utils.markAsWatched(user_id, req.params.recipeId);

    // Send a success response
    res.status(200).send({ message: "Recipe marked as watched successfully" });
  } catch (error) {
    next(error);  // Pass error to the error handler
  }
});


module.exports = router;
