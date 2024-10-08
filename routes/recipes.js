var express = require("express");
const axios = require("axios");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils.js");
const user_utils = require("./utils/user_utils.js");
const api_domain = "https://api.spoonacular.com/recipes";


router.get("/", (req, res) => res.send("im here hi"));


router.get("/search", async (req, res, next) => {
  try {
    console.log("search")
    const user_id = req.session.user_id;
    if (!req.query.query) {
      throw { status: 400, message: "query is missing"};
    }
    let search_recipes = await recipes_utils.getSearchRecipes(req.query.query, req.query.number, req.query.cuisine, req.query.diet, req.query.intolerance);
    if (user_id){
      req.session.lastSearch = search_recipes;
    }
    res.send(search_recipes);
  } catch (error) {
    next(error);
  }
});

router.get("/random", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    let random_three_recipe = await recipes_utils.getThreeRandomRecipes(user_id);
    res.send(random_three_recipe);
  } catch (error) {
    next(error);
  }
});


router.get("/allFamily", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    if (!user_id) {
      return res.status(401).send({ error: "User not logged in" });
    }

    // Fetch all family recipe IDs
    const recipes_id = await recipes_utils.getFamilyRecipes();
    const recipes_id_array = recipes_id.map(element => element.recipe_id);

    // Fetch recipe details concurrently using Promise.all
    const recipes_family = await Promise.all(
      recipes_id_array.map(recipe_id => recipes_utils.getFamilyRecipeDetailsToUser(user_id, recipe_id))
    );

    // Send the result
    res.status(200).send(recipes_family);
  } catch (error) {
    console.error("Error fetching family recipes:", error);
    next(error);
  }
});


/**
 * This path returns a full details of a recipe by its id
 */
router.get("/:recipeId", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    // if (user_id){
    //   await user_utils.markAsWatched(user_id, req.params.recipeId);
    // }
    const recipe = await recipes_utils.getRecipeFullDetails(req.params.recipeId, user_id);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});


router.get("/FAMILY/:recipeId", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    // if (user_id){
    //   await user_utils.markAsWatched(user_id, req.params.recipeId);
    // }
    const recipe = await recipes_utils.getFamilyRecipeFullDetails(req.params.recipeId, user_id);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});


// router.get("/markwatched/:recipeId", async (req, res, next) => {
//   try {
//     const user_id = req.session.user_id;
//     if (user_id){
//       await user_utils.markAsWatched(user_id, req.params.recipeId);
//     }
//     const recipe = await recipes_utils.getRecipeFullDetails(req.params.recipeId, user_id);
//     res.send(recipe);
//   } catch (error) {
//     next(error);
//   }
// });





router.get("/:recipeId/analyzedInstructions", async (req, res, next) => {
  try {
    const recipeInstructions = await recipes_utils.getRecipeFullInstructions(req.params.recipeId);
    res.json(recipeInstructions);
  } catch (error) {
    next(error);
  }
});


router.get("/:recipeId/formatted", async (req, res, next) => {
  try {
      const recipeId = req.params.recipeId;
      const recipeDetails = await recipes_utils.getFormattedRecipeDetails(recipeId);
      res.json(recipeDetails);
  } catch (error) {
      next(error);
  }
});

router.get("/FAMILY/:recipeId/formatted", async (req, res, next) => {
  try {
      const recipeId = req.params.recipeId;
      const recipeDetails = await recipes_utils.getFormattedFamilyRecipeDetails(recipeId);
      res.json(recipeDetails);
  } catch (error) {
      next(error);
  }
});


module.exports = router;


/**
 * This path is for searching a recipe
 */
// router.get("/search", async (req, res, next) => {
//   try {
//     const recipeName = req.query.recipeName;
//     const cuisine = req.query.cuisine;
//     const diet = req.query.diet;
//     const intolerance = req.query.intolerance;
//     const number = req.query.number || 5;
//     const results = await recipes_utils.searchRecipe(recipeName, cuisine, diet, intolerance, number);
//     res.send(results);
//   } catch (error) {
//     next(error);
//   }
// });

// /**
//  * This path returns a full details of a recipe by its id
//  */
// router.get("/:recipeId", async (req, res, next) => {
//   try {
//     const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
//     res.send(recipe);
//   } catch (error) {
//     next(error);
//   }
// });


