import { gql } from "graphql-request";

export const ADD_BOOK = gql`
  mutation AddBook($input: BookInput!) {
    addBook(input: $input) {
      id
      title
      year
      author {
        id
        name
      }
    }
  }
`;

export const DELETE_BOOK = gql`
  mutation DeleteBook($id: ID!) {
    deleteBook(id: $id)
  }
`;

export const ADD_AUTHOR = gql`
  mutation AddAuthor($input: AuthorInput!) {
    addAuthor(input: $input) {
      id
      name
    }
  }
`;

export const DELETE_AUTHOR = gql`
  mutation DeleteAuthor($id: ID!) {
    deleteAuthor(id: $id)
  }
`;
