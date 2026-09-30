import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import path from "path";
import { Types } from "mongoose";
import app from "../../../app";

import { Category } from "../../../models/categories/models/category.model";
import { Product } from "../../../models/products/models/product.model";

import { createTestAdmin } from "../../../test/helpers/createTestAdmin";
import { CreateProductInput } from "../schema/product.schema";

// Mock Cloudinary

vi.mock("../../../services/cloudinary.service", () => ({
  uploadImages: vi.fn().mockResolvedValue([
    {
      url: "https://test.com/test-image.jpg",
      publicId: "test-image",
    },
  ]),

  uploadImage: vi.fn().mockResolvedValue({
    url: "https://test.com/test-image.jpg",
    publicId: "test-image",
  }),

  deleteCloudinaryImages: vi.fn().mockResolvedValue(undefined),
}));

// Test image

const testImagePath = path.join(
  __dirname,
  "../../../test/fixtures/T-Shirt.png",
);

const invalidImagePath = path.join(
  __dirname,
  "../../../test/fixtures/test.txt",
);

const largeImagePath = path.join(
  __dirname,
  "../../../test/fixtures/large-image.jpg",
);

// Product Tests

const createProduct = async (
  categoryId: Types.ObjectId,
  overrides: Partial<CreateProductInput> = {},
) => {
  return Product.create({
    name: "Test Product",
    description: "Test product description",
    brand: "Test Brand",
    price: 1000,
    stock: 10,
    categoryId,
    images: [],
    isActive: true,
    ...overrides,
  });
};

const createCategory = async () => {
  return Category.create({
    name: `cat-${Math.random().toString(36).slice(2, 10)}`,
    description: "Category description",
    isActive: true,
  });
};

describe("Product", () => {
  
  // CREATE PRODUCT

  it("should admin create product", async () => {
    // Arrange
    const { user, password } = await createTestAdmin();

    // Login
    const responseLogin = await request(app).post("/auth/login").send({
      email: user.email,
      password,
    });

    expect(responseLogin.status).toBe(201);

    const token = responseLogin.body.data.token;

    // Create category
    const category = await Category.create({
      name: "Laptops",
      description: "Laptops are popular devices",
      isActive: true,
    });

    // Act
    const responseProduct = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Laptop X200")
      .field(
        "description",
        "High performance laptop with 16GB RAM and 512GB SSD.",
      )
      .field("brand", "TechBrand")
      .field("price", "1200")
      .field("stock", "50")
      .field("isActive", "true")
      .field("categoryId", category._id.toString())
      .attach("images", testImagePath);

    // Assert
    expect(responseProduct.status).toBe(201);

    expect(responseProduct.body).toMatchObject({
      success: true,
      message: "Product created successfully",
    });

    expect(responseProduct.body.data).toMatchObject({
      name: "Laptop X200",
      brand: "TechBrand",
      price: 1200,
      stock: 50,
    });

    expect(responseProduct.body.data.images).toHaveLength(1);

    expect(responseProduct.body.data.images[0]).toMatchObject({
      url: "https://test.com/test-image.jpg",
      publicId: "test-image",
      alt: "Laptop X200",
    });
  });

  // ==========================================================
  // CREATE PRODUCT + DATABASE
  // ==========================================================

  it("should create product and save images in database", async () => {
    // Arrange
    const { user, password } = await createTestAdmin();

    const responseLogin = await request(app).post("/auth/login").send({
      email: user.email,
      password,
    });

    expect(responseLogin.status).toBe(201);

    const token = responseLogin.body.data.token;

    const category = await Category.create({
      name: "Phones",
      description: "Smart phones",
      isActive: true,
    });

    // Act
    const responseProduct = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Phone X")
      .field("description", "Modern smartphone")
      .field("brand", "TechBrand")
      .field("price", "900")
      .field("stock", "20")
      .field("isActive", "true")
      .field("categoryId", category._id.toString())
      .attach("images", testImagePath);

    // Assert
    expect(responseProduct.status).toBe(201);

    const product = await Product.findOne({
      name: "Phone X",
    });

    expect(product).not.toBeNull();

    expect(product?.images).toHaveLength(1);

    expect(product?.images[0]).toMatchObject({
      url: "https://test.com/test-image.jpg",
      publicId: "test-image",
      alt: "Phone X",
    });
  });

  // ==========================================================
  // NO IMAGES
  // ==========================================================

  it("should reject product creation without images", async () => {
    // Arrange
    const { user, password } = await createTestAdmin();

    const responseLogin = await request(app).post("/auth/login").send({
      email: user.email,
      password,
    });

    expect(responseLogin.status).toBe(201);

    const token = responseLogin.body.data.token;

    const category = await Category.create({
      name: "Laptops",
      description: "Laptops",
      isActive: true,
    });

    // Act
    const responseProduct = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Laptop X200")
      .field("description", "High performance laptop")
      .field("brand", "TechBrand")
      .field("price", "1200")
      .field("stock", "50")
      .field("isActive", "true")
      .field("categoryId", category._id.toString());

    // Assert
    expect(responseProduct.status).toBe(400);

    expect(responseProduct.body).toMatchObject({
      success: false,
      message: "Images are required",
    });
  });

  // ==========================================================
  // MORE THAN 10 IMAGES
  // ==========================================================

  it("should reject more than 10 images", async () => {
    // Arrange
    const { user, password } = await createTestAdmin();

    const responseLogin = await request(app).post("/auth/login").send({
      email: user.email,
      password,
    });

    expect(responseLogin.status).toBe(201);

    const token = responseLogin.body.data.token;

    const category = await Category.create({
      name: "Laptops",
      description: "Laptops",
      isActive: true,
    });

    let productRequest = request(app)
      .post("/products")
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Laptop X200")
      .field("description", "High performance laptop")
      .field("brand", "TechBrand")
      .field("price", "1200")
      .field("stock", "50")
      .field("isActive", "true")
      .field("categoryId", category._id.toString());

    // 11 images
    for (let i = 0; i < 11; i++) {
      productRequest = productRequest.attach("images", testImagePath);
    }

    // Act
    const responseProduct = await productRequest;

    // Assert
    expect(responseProduct.status).toBe(400);
  });

  // ==========================================================
  // INVALID IMAGE TYPE
  // ==========================================================

  it("should reject unsupported image type", async () => {
    // Arrange
    const { user, password } = await createTestAdmin();

    const responseLogin = await request(app).post("/auth/login").send({
      email: user.email,
      password,
    });

    expect(responseLogin.status).toBe(201);

    const token = responseLogin.body.data.token;

    const category = await Category.create({
      name: "Laptops",
      description: "Laptops",
      isActive: true,
    });

    // Act
    const responseProduct = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Laptop X200")
      .field("description", "High performance laptop")
      .field("brand", "TechBrand")
      .field("price", "1200")
      .field("stock", "50")
      .field("isActive", "true")
      .field("categoryId", category._id.toString())
      .attach("images", invalidImagePath);

    // Assert
    expect(responseProduct.status).toBe(400);
  });

  // ==========================================================
  // IMAGE TOO LARGE
  // ==========================================================

  it("should reject image larger than 5MB", async () => {
    // Arrange
    const { user, password } = await createTestAdmin();

    const responseLogin = await request(app).post("/auth/login").send({
      email: user.email,
      password,
    });

    expect(responseLogin.status).toBe(201);

    const token = responseLogin.body.data.token;

    const category = await Category.create({
      name: "Laptops",
      description: "Laptops",
      isActive: true,
    });

    // Act
    await expect(
      request(app)
        .post("/products")
        .set("Authorization", `Bearer ${token}`)
        .field("name", "Laptop X200")
        .field("description", "High performance laptop")
        .field("brand", "TechBrand")
        .field("price", "1200")
        .field("stock", "50")
        .field("isActive", "true")
        .field("categoryId", category._id.toString())
        .attach("images", largeImagePath),
    ).rejects.toThrow("Aborted");
  });

  // ==========================================================
  // ADDITIONAL PARAMETERS
  // ==========================================================

  it("should reject additional parameters", async () => {
    // Arrange
    const { user, password } = await createTestAdmin();

    const responseLogin = await request(app).post("/auth/login").send({
      email: user.email,
      password,
    });

    expect(responseLogin.status).toBe(201);

    const token = responseLogin.body.data.token;

    const category = await Category.create({
      name: "Laptops",
      description: "Laptops",
      isActive: true,
    });

    // Act
    const responseProduct = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Laptop X200")
      .field("description", "High performance laptop")
      .field("brand", "TechBrand")
      .field("price", "1200")
      .field("stock", "50")
      .field("isActive", "true")
      .field("categoryId", category._id.toString())
      .field("averageRating", "5")
      .field("reviewsCount", "9999")
      .attach("images", testImagePath);

    // Assert
    expect(responseProduct.status).toBe(400);

    expect(responseProduct.body).toMatchObject({
      success: false,
      message: "Invalid data",
    });
  });

  // ==========================================================
  // NORMAL USER
  // ==========================================================

  it("should reject normal user", async () => {
    // Arrange
    await request(app).post("/auth/register").send({
      email: "user@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "+201000000001",
    });

    const responseLogin = await request(app).post("/auth/login").send({
      email: "user@example.com",
      password: "password123",
    });

    expect(responseLogin.status).toBe(201);

    const token = responseLogin.body.data.token;

    const category = await Category.create({
      name: "Laptops",
      description: "Laptops",
      isActive: true,
    });

    // Act
    const responseProduct = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Laptop X200")
      .field("description", "High performance laptop")
      .field("brand", "TechBrand")
      .field("price", "1200")
      .field("stock", "50")
      .field("isActive", "true")
      .field("categoryId", category._id.toString());
    // .attach("images", testImagePath);

    // Assert
    expect(responseProduct.status).toBe(403);

    expect(responseProduct.body).toEqual({
      success: false,
      message: "Forbidden: You do not have permission to access this resource.",
    });
  });

  // ==========================================================
  // NON-EXISTING CATEGORY
  // ==========================================================

  it("should reject non-existing category", async () => {
    // Arrange
    const { user, password } = await createTestAdmin();

    const responseLogin = await request(app).post("/auth/login").send({
      email: user.email,
      password,
    });

    expect(responseLogin.status).toBe(201);

    const token = responseLogin.body.data.token;

    // Act
    const responseProduct = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Laptop X200")
      .field("description", "High performance laptop")
      .field("brand", "TechBrand")
      .field("price", "1200")
      .field("stock", "50")
      .field("isActive", "true")
      .field("categoryId", "507f1f77bcf86cd799439011")
      .attach("images", testImagePath);

    // Assert
    expect(responseProduct.status).toBe(404);

    expect(responseProduct.body).toMatchObject({
      success: false,
      message: "Category not found or inactive",
    });
  });

  // ==========================================================
  // INVALID CATEGORY OBJECT ID
  // ==========================================================

  it("should reject invalid category ObjectId", async () => {
    // Arrange
    const { user, password } = await createTestAdmin();

    const responseLogin = await request(app).post("/auth/login").send({
      email: user.email,
      password,
    });

    expect(responseLogin.status).toBe(201);

    const token = responseLogin.body.data.token;

    // Act
    const responseProduct = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Laptop X200")
      .field("description", "High performance laptop")
      .field("brand", "TechBrand")
      .field("price", "1200")
      .field("stock", "50")
      .field("isActive", "true")
      .field("categoryId", "non-valid-objectId")
      .attach("images", testImagePath);

    // Assert
    expect(responseProduct.status).toBe(400);

    expect(responseProduct.body.success).toBe(false);
  });

  // ==========================================================
  // INACTIVE CATEGORY
  // ==========================================================

  it("should reject product creation if category is inactive", async () => {
    // Arrange
    const { user, password } = await createTestAdmin();

    const responseLogin = await request(app).post("/auth/login").send({
      email: user.email,
      password,
    });

    expect(responseLogin.status).toBe(201);

    const token = responseLogin.body.data.token;

    const category = await Category.create({
      name: "Old Laptops",
      description: "This category is inactive",
      isActive: false,
    });

    // Act
    const responseProduct = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Laptop Z300")
      .field("description", "Test laptop with inactive category")
      .field("brand", "TechBrand")
      .field("price", "1500")
      .field("stock", "20")
      .field("isActive", "true")
      .field("categoryId", category._id.toString())
      .attach("images", testImagePath);

    // Assert
    expect(responseProduct.status).toBe(404);

    expect(responseProduct.body).toMatchObject({
      success: false,
      message: "Category not found or inactive",
    });
  });
it("should get products with pagination", async () => {
  const category = await createCategory();

  await createProduct(category._id, { name: "Laptop 1" });
  await createProduct(category._id, { name: "Laptop 2" });
  await createProduct(category._id, { name: "Laptop 3" });

  const response = await request(app).get(
    "/products?page=1&limit=2",
  );
console.log("STATUS:", response.status);
console.log("BODY:", response.body);
  expect(response.status).toBe(200);

  expect(response.body.success).toBe(true);

  expect(response.body.data).toHaveLength(2);

  expect(response.body.pagination).toMatchObject({
    page: 1,
    limit: 2,
    totalProducts: 3,
    totalPages: 2,
  });
});
it("should search products", async () => {
  const category = await createCategory();

  await createProduct(category._id, {
    name: "Gaming Laptop",
  });

  await createProduct(category._id, {
    name: "Wireless Mouse",
  });

  const indexes = await Product.collection.indexes();

  console.log("PRODUCT INDEXES:", indexes);

  const response = await request(app).get(
    "/products?search=Laptop",
  );

  console.log("STATUS:", response.status);
  console.log("BODY:", response.body);


});
it("should filter by price range", async () => {
  const category = await createCategory();

  await createProduct(category._id, {
    name: "Cheap Product",
    price: 300,
  });

  await createProduct(category._id, {
    name: "Medium Product",
    price: 1000,
  });

  await createProduct(category._id, {
    name: "Expensive Product",
    price: 3000,
  });

  const response = await request(app).get(
    "/products?minPrice=500&maxPrice=2000",
  );

  expect(response.status).toBe(200);

  expect(response.body.success).toBe(true);

  expect(response.body.data).toHaveLength(1);

  expect(response.body.data[0].name).toBe(
    "Medium Product",
  );

  expect(response.body.data[0].price).toBe(1000);
});
});
