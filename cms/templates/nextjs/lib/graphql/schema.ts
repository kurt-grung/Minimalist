export const typeDefs = /* GraphQL */ `
  type Query {
    posts(locale: String, limit: Int, offset: Int): [Post!]!
    post(slug: String!, locale: String, preview: Boolean): Post
    pages(locale: String): [Page!]!
    page(slug: String!, locale: String): Page
    # Categories/Tags are optional in the template; return [] if not present
    categories(locale: String): [Category!]!
    tags(locale: String): [Tag!]!
    search(query: String!, locale: String, type: String): SearchResult!
    settings: Settings!
  }

  type Post {
    id: ID!
    title: String!
    slug: String!
    content: String
    excerpt: String
    date: String
    author: String
    locale: String
  }

  type Page {
    id: ID!
    title: String!
    slug: String!
    content: String
    locale: String
  }

  type Category {
    id: ID!
    slug: String!
    name: String!
  }

  type Tag {
    id: ID!
    slug: String!
    name: String!
  }

  type SearchResult {
    total: Int!
    results: [SearchHit!]!
  }

  type SearchHit {
    id: ID!
    type: String!
    title: String!
    slug: String!
    excerpt: String
    relevance: Float!
    locale: String
  }

  type Settings {
    siteTitle: String!
    siteSubtitle: String
    defaultLocale: String!
    postRoute: String
    pageRoute: String
  }
`


