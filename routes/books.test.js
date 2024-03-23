process.env.NODE_ENV = 'test'; // when db.js is encountered, NODE_ENV will be "test" and use test environment

const request = require('supertest');
const app = require('../app'); // ../app goes back one directory
const db = require('../db');

let testBook;
beforeEach(async () => {
    const result = await db.query(`INSERT INTO books (isbn, amazon-url, author, language, pages, publisher, title, year)`);
    testBook = result.rows[0]
})

afterEach(async () => {
    await db.query(`DELETE FROM books`)
})

afterAll(async () => {
    await db.end()
})

describe("GET /books", () => {
    test("Get list of books", async () => {
        const res = await request(app).get('/')
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ books: [testBook] })
    })
})

describe("GET /books/:isbn", () => {
    test("Gets single book by its isbn", async () => {
        const res = await request(app).get(`/books/${testBook.id}`)
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ book: testBook })
    })
    test("Responds with 404 for invalid isbn", async () => {
        const res = await request(app).get(`/books/0`)
        expect(res.statusCode).toBe(404);
    })
})

describe("POST /books", () => {
    test("Creates a book", async () => {
        const res = (await request(app).post('/books')).send(
            { isbn: '12345678',
              amazon_url: "https://amazon.com",
              author: "Test Author",
              language: "english",
              pages: 250,
              publisher: "Test Publisher",
              title: "Testing 1 2 3",
              year: 2004});
        
        expect(res.statusCode).toBe(201);
        expect(res.body.book).toHaveProperty("isbn");
    })
})

describe("PUT /books/:isbn", () => {
    test("Updates a book", async () => {
        const res = await request(app).put(`/books/${testBook.isbn}`).send(
            {isbn: '12345678',
            amazon_url: "https://amazon.com",
            author: "Test Author",
            language: "english",
            pages: 250,
            publisher: "Test Publisher",
            title: "Testing ABC",
            year: 2004}
        );
        expect(res.statusCode).toBe(200);
        expect(res.body.book.title).toBe("Testing ABC")
    })
    test("Responds with error if update is bad", async () => {
        const res = await request(app).put(`/books/${testBook.isbn}`).send({
            isbn: '12345678',
            amazon_url: "https://amazon.com",
            author: "Test Author",
            language: "english",
            pages: 250,
            field_does_not_exist: "Cause Error",
            publisher: "Test Publisher",
            title: "Testing ABC",
            year: 2004
        })
        expect(res.statusCode).toBe(400);
    });
    test("Responds with 404 or invalid isbn", async () => {
        const res = await request(app).put(`/books/0`).send({
            isbn: '12345678',
            amazon_url: "https://amazon.com",
            author: "Test Author",
            language: "english",
            pages: 250,
            field_does_not_exist: "Cause Error",
            publisher: "Test Publisher",
            title: "Testing ABC",
            year: 2004
        })
        expect(res.statusCode).toBe(404);
    })
})

describe("DELETE /books/:isbn", () => {
    test("Deletes single book", async () => {
        const res = await request(app).delete(`/books/${testBook.isbn}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ msg: 'DELETED!' })
    })
})