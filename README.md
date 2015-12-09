# Grocery List

[Link](http://grocerylist-williewrinkle.rhcloud.com/)

Grocery checklist project built in the MEAN stack.

## Cookies and Creating New Users

Application checks for cookie containing unique `_id` via the `userObj` factory. If no cookie is found a new user is created on the server by reading the `template.json` file and inserting it into the collection.

## Start Fresh

If the user selects 'Start Fresh' the entire document with the exception of the `_id` feild is replaced with `template.json`. This action occurs on the front end via the `blankUserObj` function.

## Thanks for taking a look

Any comments, criticisms and suggestions are welomed.

Best,

Willie

