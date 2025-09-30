import { cn } from '@/lib/utils'

describe('utils', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      const result = cn('text-red-500', 'bg-blue-500')
      expect(result).toBe('text-red-500 bg-blue-500')
    })

    it('should handle conditional class names', () => {
      const isActive = true
      const isDisabled = false

      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class'
      )

      expect(result).toBe('base-class active-class')
    })

    it('should handle arrays of class names', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('should handle objects with conditional classes', () => {
      const result = cn('base', {
        'text-red-500': true,
        'text-blue-500': false,
        'font-bold': true
      })

      expect(result).toBe('base text-red-500 font-bold')
    })

    it('should merge Tailwind classes correctly (override conflicts)', () => {
      // twMerge should handle conflicting Tailwind classes
      const result = cn('px-4', 'px-2', 'py-2')
      expect(result).toBe('px-2 py-2')
    })

    it('should handle undefined and null values', () => {
      const result = cn('class1', undefined, null, 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle empty strings', () => {
      const result = cn('class1', '', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle no arguments', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle single class', () => {
      const result = cn('single-class')
      expect(result).toBe('single-class')
    })

    it('should merge color utilities correctly', () => {
      // Test that newer color utilities override older ones
      const result = cn('text-red-500 bg-white', 'text-blue-500')
      expect(result).toBe('bg-white text-blue-500')
    })

    it('should merge size utilities correctly', () => {
      // Test that newer size utilities override older ones
      const result = cn('w-4 h-4', 'w-6 h-8')
      expect(result).toBe('w-6 h-8')
    })

    it('should handle complex nested arrays and objects', () => {
      const condition1 = true
      const condition2 = false

      const result = cn(
        'base',
        [
          'array-class',
          condition1 && 'conditional-in-array'
        ],
        {
          'object-class-true': true,
          'object-class-false': false
        },
        condition2 ? 'not-included' : 'included'
      )

      expect(result).toBe('base array-class conditional-in-array object-class-true included')
    })

    it('should handle responsive and state modifiers', () => {
      const result = cn(
        'hover:bg-gray-100',
        'dark:bg-gray-800',
        'md:px-4',
        'hover:bg-gray-200' // Should override previous hover
      )
      expect(result).toBe('dark:bg-gray-800 md:px-4 hover:bg-gray-200')
    })

    it('should preserve important modifiers', () => {
      const result = cn('!text-red-500', 'text-blue-500')
      // Important modifier should be preserved
      expect(result).toContain('!text-red-500')
    })

    it('should handle arbitrary values in Tailwind', () => {
      const result = cn('w-[100px]', 'h-[200px]', 'w-[150px]')
      // Should override the width with the latest value
      expect(result).toBe('h-[200px] w-[150px]')
    })
  })
})