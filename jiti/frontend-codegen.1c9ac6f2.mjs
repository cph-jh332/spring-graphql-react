"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;

const config = {
  schema: "../backend/src/main/resources/graphql/schema.graphqls",
  documents: ["src/**/*.graphql"],
  ignoreNoDocuments: true,
  generates: {
    "./src/gql/": {
      preset: "client",
      config: {
        useTypeImports: true
      }
    }
  }
};var _default = exports.default =

config; /* v9-e3ca4120e8f7f2dd */
