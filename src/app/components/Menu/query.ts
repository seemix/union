export const menuQuery = JSON.stringify({
    query: `query NewQuery {
    menu(id: 154, idType: DATABASE_ID) {
    name  
    menuItems(where: {parentDatabaseId: 0}) { 
      nodes {
        id       
        label
        uri
        childItems {
          nodes {
            id
            label
            uri          
          }
        }
      }
    }
  }
}`
});