/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "query Me {\n  me {\n    username\n    roles\n    borrowedRecords {\n      bookId\n      borrowedAt\n    }\n  }\n}\n\nmutation Register($input: RegisterInput!) {\n  register(input: $input) {\n    username\n    roles\n    borrowedRecords {\n      bookId\n      borrowedAt\n    }\n  }\n}": typeof types.MeDocument,
    "query GetAuthors($query: String) {\n  authors(query: $query) {\n    id\n    name\n    books {\n      id\n      title\n      year\n    }\n  }\n}\n\nquery GetAuthor($id: ID!) {\n  author(id: $id) {\n    id\n    name\n    books {\n      id\n      title\n      year\n    }\n  }\n}\n\nsubscription OnAuthorAdded {\n  authorAdded {\n    id\n    name\n  }\n}\n\nsubscription OnAuthorDeleted {\n  authorDeleted\n}": typeof types.GetAuthorsDocument,
    "query GetBooks($query: String) {\n  books(query: $query) {\n    id\n    title\n    year\n    coverImage\n    totalCopies\n    availableCount\n    author {\n      id\n      name\n    }\n  }\n}\n\nquery GetBook($id: ID!) {\n  book(id: $id) {\n    id\n    title\n    year\n    coverImage\n    totalCopies\n    availableCount\n    author {\n      id\n      name\n    }\n  }\n}\n\nsubscription OnBookAdded {\n  bookAdded {\n    id\n    title\n    year\n    coverImage\n    totalCopies\n    availableCount\n    author {\n      id\n      name\n    }\n  }\n}\n\nsubscription OnBookDeleted {\n  bookDeleted\n}": typeof types.GetBooksDocument,
    "mutation AddBook($input: BookInput!) {\n  addBook(input: $input) {\n    id\n    title\n    year\n    totalCopies\n    availableCount\n    author {\n      id\n      name\n    }\n  }\n}\n\nmutation UpdateBook($id: ID!, $input: BookInput!) {\n  updateBook(id: $id, input: $input) {\n    id\n    title\n    year\n    totalCopies\n    availableCount\n    author {\n      id\n      name\n    }\n  }\n}\n\nmutation DeleteBook($id: ID!) {\n  deleteBook(id: $id)\n}\n\nmutation BorrowBook($bookId: ID!) {\n  borrowBook(bookId: $bookId) {\n    id\n    totalCopies\n    availableCount\n  }\n}\n\nmutation ReturnBook($bookId: ID!) {\n  returnBook(bookId: $bookId) {\n    id\n    totalCopies\n    availableCount\n  }\n}\n\nmutation AddAuthor($input: AuthorInput!) {\n  addAuthor(input: $input) {\n    id\n    name\n  }\n}\n\nmutation DeleteAuthor($id: ID!) {\n  deleteAuthor(id: $id)\n}\n\nmutation Login($input: LoginInput!) {\n  login(input: $input) {\n    username\n    roles\n    borrowedRecords {\n      bookId\n      borrowedAt\n    }\n  }\n}\n\nmutation Logout {\n  logout\n}": typeof types.AddBookDocument,
    "query Users {\n  users {\n    username\n    roles\n  }\n}\n\nmutation CreateUser($input: RegisterInput!) {\n  createUser(input: $input) {\n    username\n    roles\n  }\n}\n\nmutation DeleteUser($username: String!) {\n  deleteUser(username: $username)\n}\n\nmutation UpdateUser($input: UpdateUserInput!) {\n  updateUser(input: $input) {\n    username\n    roles\n  }\n}": typeof types.UsersDocument,
};
const documents: Documents = {
    "query Me {\n  me {\n    username\n    roles\n    borrowedRecords {\n      bookId\n      borrowedAt\n    }\n  }\n}\n\nmutation Register($input: RegisterInput!) {\n  register(input: $input) {\n    username\n    roles\n    borrowedRecords {\n      bookId\n      borrowedAt\n    }\n  }\n}": types.MeDocument,
    "query GetAuthors($query: String) {\n  authors(query: $query) {\n    id\n    name\n    books {\n      id\n      title\n      year\n    }\n  }\n}\n\nquery GetAuthor($id: ID!) {\n  author(id: $id) {\n    id\n    name\n    books {\n      id\n      title\n      year\n    }\n  }\n}\n\nsubscription OnAuthorAdded {\n  authorAdded {\n    id\n    name\n  }\n}\n\nsubscription OnAuthorDeleted {\n  authorDeleted\n}": types.GetAuthorsDocument,
    "query GetBooks($query: String) {\n  books(query: $query) {\n    id\n    title\n    year\n    coverImage\n    totalCopies\n    availableCount\n    author {\n      id\n      name\n    }\n  }\n}\n\nquery GetBook($id: ID!) {\n  book(id: $id) {\n    id\n    title\n    year\n    coverImage\n    totalCopies\n    availableCount\n    author {\n      id\n      name\n    }\n  }\n}\n\nsubscription OnBookAdded {\n  bookAdded {\n    id\n    title\n    year\n    coverImage\n    totalCopies\n    availableCount\n    author {\n      id\n      name\n    }\n  }\n}\n\nsubscription OnBookDeleted {\n  bookDeleted\n}": types.GetBooksDocument,
    "mutation AddBook($input: BookInput!) {\n  addBook(input: $input) {\n    id\n    title\n    year\n    totalCopies\n    availableCount\n    author {\n      id\n      name\n    }\n  }\n}\n\nmutation UpdateBook($id: ID!, $input: BookInput!) {\n  updateBook(id: $id, input: $input) {\n    id\n    title\n    year\n    totalCopies\n    availableCount\n    author {\n      id\n      name\n    }\n  }\n}\n\nmutation DeleteBook($id: ID!) {\n  deleteBook(id: $id)\n}\n\nmutation BorrowBook($bookId: ID!) {\n  borrowBook(bookId: $bookId) {\n    id\n    totalCopies\n    availableCount\n  }\n}\n\nmutation ReturnBook($bookId: ID!) {\n  returnBook(bookId: $bookId) {\n    id\n    totalCopies\n    availableCount\n  }\n}\n\nmutation AddAuthor($input: AuthorInput!) {\n  addAuthor(input: $input) {\n    id\n    name\n  }\n}\n\nmutation DeleteAuthor($id: ID!) {\n  deleteAuthor(id: $id)\n}\n\nmutation Login($input: LoginInput!) {\n  login(input: $input) {\n    username\n    roles\n    borrowedRecords {\n      bookId\n      borrowedAt\n    }\n  }\n}\n\nmutation Logout {\n  logout\n}": types.AddBookDocument,
    "query Users {\n  users {\n    username\n    roles\n  }\n}\n\nmutation CreateUser($input: RegisterInput!) {\n  createUser(input: $input) {\n    username\n    roles\n  }\n}\n\nmutation DeleteUser($username: String!) {\n  deleteUser(username: $username)\n}\n\nmutation UpdateUser($input: UpdateUserInput!) {\n  updateUser(input: $input) {\n    username\n    roles\n  }\n}": types.UsersDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Me {\n  me {\n    username\n    roles\n    borrowedRecords {\n      bookId\n      borrowedAt\n    }\n  }\n}\n\nmutation Register($input: RegisterInput!) {\n  register(input: $input) {\n    username\n    roles\n    borrowedRecords {\n      bookId\n      borrowedAt\n    }\n  }\n}"): (typeof documents)["query Me {\n  me {\n    username\n    roles\n    borrowedRecords {\n      bookId\n      borrowedAt\n    }\n  }\n}\n\nmutation Register($input: RegisterInput!) {\n  register(input: $input) {\n    username\n    roles\n    borrowedRecords {\n      bookId\n      borrowedAt\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetAuthors($query: String) {\n  authors(query: $query) {\n    id\n    name\n    books {\n      id\n      title\n      year\n    }\n  }\n}\n\nquery GetAuthor($id: ID!) {\n  author(id: $id) {\n    id\n    name\n    books {\n      id\n      title\n      year\n    }\n  }\n}\n\nsubscription OnAuthorAdded {\n  authorAdded {\n    id\n    name\n  }\n}\n\nsubscription OnAuthorDeleted {\n  authorDeleted\n}"): (typeof documents)["query GetAuthors($query: String) {\n  authors(query: $query) {\n    id\n    name\n    books {\n      id\n      title\n      year\n    }\n  }\n}\n\nquery GetAuthor($id: ID!) {\n  author(id: $id) {\n    id\n    name\n    books {\n      id\n      title\n      year\n    }\n  }\n}\n\nsubscription OnAuthorAdded {\n  authorAdded {\n    id\n    name\n  }\n}\n\nsubscription OnAuthorDeleted {\n  authorDeleted\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetBooks($query: String) {\n  books(query: $query) {\n    id\n    title\n    year\n    coverImage\n    totalCopies\n    availableCount\n    author {\n      id\n      name\n    }\n  }\n}\n\nquery GetBook($id: ID!) {\n  book(id: $id) {\n    id\n    title\n    year\n    coverImage\n    totalCopies\n    availableCount\n    author {\n      id\n      name\n    }\n  }\n}\n\nsubscription OnBookAdded {\n  bookAdded {\n    id\n    title\n    year\n    coverImage\n    totalCopies\n    availableCount\n    author {\n      id\n      name\n    }\n  }\n}\n\nsubscription OnBookDeleted {\n  bookDeleted\n}"): (typeof documents)["query GetBooks($query: String) {\n  books(query: $query) {\n    id\n    title\n    year\n    coverImage\n    totalCopies\n    availableCount\n    author {\n      id\n      name\n    }\n  }\n}\n\nquery GetBook($id: ID!) {\n  book(id: $id) {\n    id\n    title\n    year\n    coverImage\n    totalCopies\n    availableCount\n    author {\n      id\n      name\n    }\n  }\n}\n\nsubscription OnBookAdded {\n  bookAdded {\n    id\n    title\n    year\n    coverImage\n    totalCopies\n    availableCount\n    author {\n      id\n      name\n    }\n  }\n}\n\nsubscription OnBookDeleted {\n  bookDeleted\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation AddBook($input: BookInput!) {\n  addBook(input: $input) {\n    id\n    title\n    year\n    totalCopies\n    availableCount\n    author {\n      id\n      name\n    }\n  }\n}\n\nmutation UpdateBook($id: ID!, $input: BookInput!) {\n  updateBook(id: $id, input: $input) {\n    id\n    title\n    year\n    totalCopies\n    availableCount\n    author {\n      id\n      name\n    }\n  }\n}\n\nmutation DeleteBook($id: ID!) {\n  deleteBook(id: $id)\n}\n\nmutation BorrowBook($bookId: ID!) {\n  borrowBook(bookId: $bookId) {\n    id\n    totalCopies\n    availableCount\n  }\n}\n\nmutation ReturnBook($bookId: ID!) {\n  returnBook(bookId: $bookId) {\n    id\n    totalCopies\n    availableCount\n  }\n}\n\nmutation AddAuthor($input: AuthorInput!) {\n  addAuthor(input: $input) {\n    id\n    name\n  }\n}\n\nmutation DeleteAuthor($id: ID!) {\n  deleteAuthor(id: $id)\n}\n\nmutation Login($input: LoginInput!) {\n  login(input: $input) {\n    username\n    roles\n    borrowedRecords {\n      bookId\n      borrowedAt\n    }\n  }\n}\n\nmutation Logout {\n  logout\n}"): (typeof documents)["mutation AddBook($input: BookInput!) {\n  addBook(input: $input) {\n    id\n    title\n    year\n    totalCopies\n    availableCount\n    author {\n      id\n      name\n    }\n  }\n}\n\nmutation UpdateBook($id: ID!, $input: BookInput!) {\n  updateBook(id: $id, input: $input) {\n    id\n    title\n    year\n    totalCopies\n    availableCount\n    author {\n      id\n      name\n    }\n  }\n}\n\nmutation DeleteBook($id: ID!) {\n  deleteBook(id: $id)\n}\n\nmutation BorrowBook($bookId: ID!) {\n  borrowBook(bookId: $bookId) {\n    id\n    totalCopies\n    availableCount\n  }\n}\n\nmutation ReturnBook($bookId: ID!) {\n  returnBook(bookId: $bookId) {\n    id\n    totalCopies\n    availableCount\n  }\n}\n\nmutation AddAuthor($input: AuthorInput!) {\n  addAuthor(input: $input) {\n    id\n    name\n  }\n}\n\nmutation DeleteAuthor($id: ID!) {\n  deleteAuthor(id: $id)\n}\n\nmutation Login($input: LoginInput!) {\n  login(input: $input) {\n    username\n    roles\n    borrowedRecords {\n      bookId\n      borrowedAt\n    }\n  }\n}\n\nmutation Logout {\n  logout\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Users {\n  users {\n    username\n    roles\n  }\n}\n\nmutation CreateUser($input: RegisterInput!) {\n  createUser(input: $input) {\n    username\n    roles\n  }\n}\n\nmutation DeleteUser($username: String!) {\n  deleteUser(username: $username)\n}\n\nmutation UpdateUser($input: UpdateUserInput!) {\n  updateUser(input: $input) {\n    username\n    roles\n  }\n}"): (typeof documents)["query Users {\n  users {\n    username\n    roles\n  }\n}\n\nmutation CreateUser($input: RegisterInput!) {\n  createUser(input: $input) {\n    username\n    roles\n  }\n}\n\nmutation DeleteUser($username: String!) {\n  deleteUser(username: $username)\n}\n\nmutation UpdateUser($input: UpdateUserInput!) {\n  updateUser(input: $input) {\n    username\n    roles\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;