const http = require("http");
const fs = require("fs");

const PORT = process.env.PORT || 3000;
const DB_FILE = "db.json";

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function response(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function getBody(req) {
  return new Promise((resolve) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

function checkProduct(product, isNew) {
  if (isNew && !product.title) return "title is required";
  if (
    "title" in product &&
    (typeof product.title !== "string" || product.title.trim() === "")
  ) {
    return "title is required";
  }

  if (isNew && product.price === undefined) return "price is required";
  if (
    "price" in product &&
    (typeof product.price !== "number" || product.price < 0)
  ) {
    return "price cannot be negative";
  }
  if (isNew && product.stock === undefined) return "stock is required";
  if (
    "stock" in product &&
    (typeof product.stock !== "number" || product.stock < 0)
  ) {
    return "stock cannot be negative";
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  const db = readDB();
  const url = req.url.split("?")[0];
  const parts = url.split("/");
  const id = Number(parts[2]);

  if (parts[1] !== "products") {
    return response(res, 404, { message: "Route not found" });
  }

  if (req.method === "GET" && url === "/products") {
    return response(res, 200, db.products);
  }

  if (req.method === "GET" && url === "/products/out-of-stock") {
    const result = db.products.filter((product) => product.stock === 0);
    return response(res, 200, result);
  }

  if (req.method === "POST" && url === "/products") {
    const product = await getBody(req);
    const error = checkProduct(product, true);
    if (error) return response(res, 400, { message: error });
    product.id = db.products.length
      ? db.products[db.products.length - 1].id + 1
      : 1;
    product.title = product.title.trim();
    db.products.push(product);
    writeDB(db);

    return response(res, 201, product);
  }

  const index = db.products.findIndex((product) => product.id === id);

  if (index === -1) {
    return response(res, 404, { message: "Product not found" });
  }

  if (req.method === "GET") {
    return response(res, 200, db.products[index]);
  }

  if (req.method === "PUT" || req.method === "PATCH") {
    const updatedData = await getBody(req);
    const error = checkProduct(updatedData, false);

    if (error) return response(res, 400, { message: error });

    db.products[index] = { ...db.products[index], ...updatedData };
    writeDB(db);

    return response(res, 200, db.products[index]);
  }

  if (req.method === "DELETE") {
    const deletedProduct = db.products.splice(index, 1);
    writeDB(db);

    return response(res, 200, deletedProduct[0]);
  }

  response(res, 405, { message: "Method not allowed" });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
