import getDatabase from '../connection'

const db = getDatabase()
import { categories, Category, NewCategory } from '../schema'
import { eq, isNull, sql } from 'drizzle-orm'

export type InsertCategory = NewCategory
export type SelectCategory = Category

export interface CategoryWithChildren extends SelectCategory {
  children?: CategoryWithChildren[]
}

export const categoriesModel = {
  // Get all categories with hierarchy
  async getAll(): Promise<CategoryWithChildren[]> {
    const allCategories = await db.select().from(categories).orderBy(categories.name)
    return this.buildHierarchy(allCategories)
  },

  // Get all categories flat (no hierarchy)
  async getAllFlat(): Promise<SelectCategory[]> {
    return await db.select().from(categories).orderBy(categories.name)
  },

  // Get category by ID
  async getById(id: number): Promise<SelectCategory | null> {
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
    return result[0] || null
  },

  // Create new category
  async create(data: Omit<InsertCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<SelectCategory> {
    const result = await db.insert(categories).values({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning()
    return result[0]
  },

  // Update category
  async update(id: number, data: Partial<Omit<InsertCategory, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SelectCategory> {
    // Prevent setting self as parent
    if (data.parentCategoryId === id) {
      throw new Error('A category cannot be its own parent')
    }

    // Check for circular dependency
    if (data.parentCategoryId) {
      const wouldCreateCircularDependency = await this.checkCircularDependency(id, data.parentCategoryId)
      if (wouldCreateCircularDependency) {
        throw new Error('This change would create a circular dependency')
      }
    }

    const result = await db.update(categories)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(categories.id, id))
      .returning()
    
    if (!result[0]) {
      throw new Error('Category not found')
    }
    
    return result[0]
  },

  // Delete category
  async delete(id: number): Promise<void> {
    // Check if category has children
    const children = await db.select()
      .from(categories)
      .where(eq(categories.parentCategoryId, id))
      .limit(1)
    
    if (children.length > 0) {
      throw new Error('Cannot delete category with subcategories')
    }

    // Check if category is used in transactions (will be implemented later)
    // For now, just delete the category
    const result = await db.delete(categories).where(eq(categories.id, id)).returning()
    
    if (!result[0]) {
      throw new Error('Category not found')
    }
  },

  // Update only the monthly budget
  async updateBudget(id: number, monthlyBudget: number | null): Promise<SelectCategory> {
    const result = await db.update(categories)
      .set({
        monthlyBudget: monthlyBudget,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(categories.id, id))
      .returning()
    
    if (!result[0]) {
      throw new Error('Category not found')
    }
    
    return result[0]
  },

  // Build hierarchy from flat list
  buildHierarchy(flatCategories: SelectCategory[]): CategoryWithChildren[] {
    const categoryMap = new Map<number, CategoryWithChildren>()
    const rootCategories: CategoryWithChildren[] = []

    // First pass: create all category objects
    flatCategories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })

    // Second pass: build hierarchy
    flatCategories.forEach(cat => {
      const category = categoryMap.get(cat.id)!
      if (cat.parentCategoryId === null) {
        rootCategories.push(category)
      } else {
        const parent = categoryMap.get(cat.parentCategoryId)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(category)
        } else {
          // If parent doesn't exist, treat as root
          rootCategories.push(category)
        }
      }
    })

    return rootCategories
  },

  // Check if setting parentId would create a circular dependency
  async checkCircularDependency(categoryId: number, proposedParentId: number): Promise<boolean> {
    if (categoryId === proposedParentId) {
      return true
    }

    let currentId: number | null = proposedParentId
    const visited = new Set<number>()

    while (currentId !== null) {
      if (visited.has(currentId)) {
        return true // Found a cycle
      }
      if (currentId === categoryId) {
        return true // Would create a cycle
      }
      visited.add(currentId)

      const parent = await this.getById(currentId)
      currentId = parent?.parentCategoryId || null
    }

    return false
  },

  // Get categories for dropdown (flat list with indentation)
  async getForDropdown(): Promise<{ value: string; label: string }[]> {
    const hierarchical = await this.getAll()
    const options: { value: string; label: string }[] = []

    const addToOptions = (cats: CategoryWithChildren[], level = 0) => {
      cats.forEach(cat => {
        const indent = '  '.repeat(level)
        options.push({
          value: cat.id.toString(),
          label: `${indent}${cat.name}`,
        })
        if (cat.children && cat.children.length > 0) {
          addToOptions(cat.children, level + 1)
        }
      })
    }

    addToOptions(hierarchical)
    return options
  },
}