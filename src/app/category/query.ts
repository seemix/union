export const categoryQuery = (categoryId: number) => JSON.stringify({
    query: `query GetCategoryEdges {
  category(id: "${categoryId}", idType: DATABASE_ID) {
    databaseId
    posts {
      edges {
        node {
          id
          title
          date
          excerpt
          featuredImage {
            node {
              mediaItemUrl
            }
          }
        }
      }
    }
  }
}`
});