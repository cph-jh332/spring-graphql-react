export interface Author {
  id: string;
  name: string;
  books: Book[];
}

export interface Book {
  id: string;
  title: string;
  year: number;
  author: Author;
}

export interface BookInput {
  title: string;
  year: number;
  authorId: string;
}

export interface AuthorInput {
  name: string;
}
