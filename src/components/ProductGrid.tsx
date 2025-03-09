// Update the price formatting in ProductGrid component
const products: Product[] = result.data.products.edges.map((edge: any) => ({
  id: parseInt(edge.node.id.split('/').pop()),
  name: edge.node.title,
  price: parseFloat(edge.node.priceRange.minVariantPrice.amount),
  image: edge.node.images.edges[0]?.node.url || 'https://via.placeholder.com/400',
  category: edge.node.productType || 'General',
  variantId: edge.node.variants.edges[0]?.node.id
}));