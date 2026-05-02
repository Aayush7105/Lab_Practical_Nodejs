Task:
Create Product Management APIs using MongoDB.
Product Schema:
{
title: String,
price: Number,
stock: Number
}

APIs:
● POST /products
● GET /products
● GET /products/:id
● PUT /products/:id
● DELETE /products/:id
Constraints:
● title required
● price and stock cannot be negative
● Proper validation required
Bonus:
Create API:
GET /products/out-of-stock

Return all products with stock = 0.
