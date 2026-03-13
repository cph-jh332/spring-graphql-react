import { gql } from "graphql-request";

export const GET_BOOKS = gql`
  query GetBooks {
    books {
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

export const GET_BOOK = gql`
  query GetBook($id: ID!) {
    book(id: $id) {
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

export const GET_AUTHORS = gql`
  query GetAuthors {
    authors {
      id
      name
      books {
        id
        title
        year
      }
    }
  }
`;

export const GET_AUTHOR = gql`
  query GetAuthor($id: ID!) {
    author(id: $id) {
      id
      name
      books {
        id
        title
        year
      }
    }
  }
`;

export const BOOK_ADDED_SUBSCRIPTION = gql`
  subscription OnBookAdded {
    bookAdded {
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

export const BOOK_DELETED_SUBSCRIPTION = gql`
  subscription OnBookDeleted {
    bookDeleted
  }
`;

export const AUTHOR_ADDED_SUBSCRIPTION = gql`
  subscription OnAuthorAdded {
    authorAdded {
      id
      name
    }
  }
`;

export const AUTHOR_DELETED_SUBSCRIPTION = gql`
  subscription OnAuthorDeleted {
    authorDeleted
  }
`;
