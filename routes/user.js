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
        recipe_details = await user_utils.getMyRecipeByRecipeID(user_id, recipes_id_array[i]);
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
        recipe_details = await user_utils.getMyRecipeByRecipeID(user_id, recipes_id_array[i]);
      }

      recipes_meal_plan.push(recipe_details);
    }

    res.status(200).send(recipes_meal_plan);
  } catch (error) {
    console.error("Error fetching meal plan recipes:", error);
    next(error);
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




module.exports = router;
