var express = require("express");
const axios = require("axios");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils.js");
const api_domain = "https://api.spoonacular.com/recipes";


router.get("/", (req, res) => res.send("im here"));


router.get("/random", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    let random_three_recipe = await recipes_utils.getThreeRandomRecipes(user_id);
    res.send(random_three_recipe);
  } catch (error) {
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


/**
 * This path is for searching a recipe
 */
router.get("/search", async (req, res, next) => {
  try {
    const recipeName = req.query.recipeName;
    const cuisine = req.query.cuisine;
    const diet = req.query.diet;
    const intolerance = req.query.intolerance;
    const number = req.query.number || 5;
    const results = await recipes_utils.searchRecipe(recipeName, cuisine, diet, intolerance, number);
    res.send(results);
  } catch (error) {
    next(error);
  }
});

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

module.exports = router;
