// Global cache for categories to prevent repeated API calls
let categoriesCache: Array<{ id: string; name: string }> | null = null
let categoriesPromise: Promise<Array<{ id: string; name: string }>> | null = null

export const getCategories = async (): Promise<Array<{ id: string; name: string }>> => {
  // Return cached data if available
  if (categoriesCache) {
    return categoriesCache
  }

  // Return existing promise if one is already in progress
  if (categoriesPromise) {
    return categoriesPromise
  }

  // Create new promise to fetch categories
  categoriesPromise = fetch('/api/categories')
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      const data = await response.json()
      categoriesCache = data
      return data
    })
    .catch((error) => {
      console.error('Error loading categories:', error)
      // Reset promise so we can retry later
      categoriesPromise = null
      throw error
    })

  return categoriesPromise
}

export const clearCategoriesCache = () => {
  categoriesCache = null
  categoriesPromise = null
}
