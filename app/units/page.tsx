'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, Play, Pause, Layers } from 'lucide-react'
import { Modal } from '@/components/ui'
import { Form, FormField, FormTextarea, FormSelect } from '@/components/forms'

interface Unit {
  id: number
  name: string
  description: string
  color: string
  icon: string
  active: boolean
}

interface NewUnit {
  name: string
  description: string
  color: string
  icon: string
}

const iconOptions = [
  { value: 'user', label: 'User' },
  { value: 'briefcase', label: 'Briefcase' },
  { value: 'lightbulb', label: 'Lightbulb' },
  { value: 'home', label: 'Home' },
  { value: 'trending-up', label: 'Trending Up' },
  { value: 'building-2', label: 'Building' },
  { value: 'car', label: 'Car' },
  { value: 'heart', label: 'Heart' },
  { value: 'star', label: 'Star' },
  { value: 'zap', label: 'Zap' }
]

// Mock data matching the prototype with "Test" prefix
const initialUnits: Unit[] = [
  { id: 1, name: 'Test Personal', description: 'Personal expenses and income', color: '#6B7280', icon: 'user', active: true },
  { id: 2, name: 'Test Main Business', description: 'Primary business operations', color: '#3B82F6', icon: 'briefcase', active: true },
  { id: 3, name: 'Test Side Hustle', description: 'Freelance and consulting work', color: '#10B981', icon: 'lightbulb', active: true },
  { id: 4, name: 'Test Real Estate', description: 'Rental property income and expenses', color: '#F59E0B', icon: 'home', active: true },
  { id: 5, name: 'Test Investments', description: 'Investment related transactions', color: '#8B5CF6', icon: 'trending-up', active: false }
]

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>(initialUnits)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [newUnit, setNewUnit] = useState<NewUnit>({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'briefcase'
  })

  const resetNewUnit = () => {
    setNewUnit({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: 'briefcase'
    })
  }

  const addUnit = () => {
    if (newUnit.name.trim()) {
      const newId = Math.max(...units.map(u => u.id)) + 1
      setUnits(prev => [...prev, {
        id: newId,
        name: newUnit.name,
        description: newUnit.description,
        color: newUnit.color,
        icon: newUnit.icon,
        active: true
      }])
      setShowAddModal(false)
      resetNewUnit()
    }
  }

  const editUnit = () => {
    if (editingUnit) {
      setUnits(prev => prev.map(u => 
        u.id === editingUnit.id ? { ...editingUnit } : u
      ))
      setShowEditModal(false)
      setEditingUnit(null)
    }
  }

  const deleteUnit = (unitId: number) => {
    if (confirm('Are you sure you want to delete this unit? This action cannot be undone.')) {
      setUnits(prev => prev.filter(u => u.id !== unitId))
    }
  }

  const toggleUnitStatus = (unitId: number) => {
    setUnits(prev => prev.map(u => 
      u.id === unitId ? { ...u, active: !u.active } : u
    ))
  }

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<{ className?: string; style?: React.CSSProperties }> } = {
      'user': ({ className, style }) => <div className={className} style={style}>👤</div>,
      'briefcase': ({ className, style }) => <div className={className} style={style}>💼</div>,
      'lightbulb': ({ className, style }) => <div className={className} style={style}>💡</div>,
      'home': ({ className, style }) => <div className={className} style={style}>🏠</div>,
      'trending-up': ({ className, style }) => <div className={className} style={style}>📈</div>,
      'building-2': ({ className, style }) => <div className={className} style={style}>🏢</div>,
      'car': ({ className, style }) => <div className={className} style={style}>🚗</div>,
      'heart': ({ className, style }) => <div className={className} style={style}>❤️</div>,
      'star': ({ className, style }) => <div className={className} style={style}>⭐</div>,
      'zap': ({ className, style }) => <div className={className} style={style}>⚡</div>
    }
    return iconMap[iconName] || iconMap['briefcase']
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Units</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Manage your business units and expense categories</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Unit
        </button>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {units.map((unit) => {
          const IconComponent = getIconComponent(unit.icon)
          return (
            <div 
              key={unit.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-6 border-l-4"
              style={{ borderLeftColor: unit.color }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                    style={{ backgroundColor: `${unit.color}20` }}
                  >
                    <IconComponent 
                      className="w-5 h-5 flex items-center justify-center text-sm"
                      style={{ color: unit.color }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{unit.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{unit.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span 
                    className={`px-2 py-1 text-xs rounded-full ${
                      unit.active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {unit.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: unit.color }}
                    ></div>
                    <span>{unit.color}</span>
                  </div>
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => toggleUnitStatus(unit.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title={unit.active ? 'Deactivate unit' : 'Activate unit'}
                    >
                      {unit.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => {
                        setEditingUnit({ ...unit })
                        setShowEditModal(true)
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Edit unit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteUnit(unit.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete unit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {units.length === 0 && (
        <div className="text-center py-12">
          <Layers className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No units found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by creating your first business unit.</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Unit
          </button>
        </div>
      )}

      {/* Add Unit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          resetNewUnit()
        }}
        title="Add New Unit"
        size="sm"
      >
        <Form>
          <FormField
            label="Name"
            required
            value={newUnit.name}
            onChange={(e) => setNewUnit(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Marketing Agency"
          />
          
          <FormTextarea
            label="Description"
            value={newUnit.description}
            onChange={(e) => setNewUnit(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
            placeholder="Brief description of this unit"
          />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
            <div className="flex items-center space-x-2">
              <input 
                type="color" 
                value={newUnit.color}
                onChange={(e) => setNewUnit(prev => ({ ...prev, color: e.target.value }))}
                className="w-12 h-10 border dark:border-gray-600 rounded-lg px-1 py-1 bg-white dark:bg-gray-700"
              />
              <input 
                type="text" 
                value={newUnit.color}
                onChange={(e) => setNewUnit(prev => ({ ...prev, color: e.target.value }))}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <FormSelect
            label="Icon"
            value={newUnit.icon}
            onChange={(e) => setNewUnit(prev => ({ ...prev, icon: e.target.value }))}
            options={iconOptions}
          />
          
          <div className="flex justify-end space-x-2 pt-4">
            <button 
              onClick={() => {
                setShowAddModal(false)
                resetNewUnit()
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            >
              Cancel
            </button>
            <button 
              onClick={addUnit}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add Unit
            </button>
          </div>
        </Form>
      </Modal>

      {/* Edit Unit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingUnit(null)
        }}
        title="Edit Unit"
        size="sm"
      >
        {editingUnit && (
          <Form>
            <FormField
              label="Name"
              required
              value={editingUnit.name}
              onChange={(e) => setEditingUnit(prev => prev ? { ...prev, name: e.target.value } : null)}
            />
            
            <FormTextarea
              label="Description"
              value={editingUnit.description}
              onChange={(e) => setEditingUnit(prev => prev ? { ...prev, description: e.target.value } : null)}
              rows={2}
            />
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="color" 
                  value={editingUnit.color}
                  onChange={(e) => setEditingUnit(prev => prev ? { ...prev, color: e.target.value } : null)}
                  className="w-12 h-10 border dark:border-gray-600 rounded-lg px-1 py-1 bg-white dark:bg-gray-700"
                />
                <input 
                  type="text" 
                  value={editingUnit.color}
                  onChange={(e) => setEditingUnit(prev => prev ? { ...prev, color: e.target.value } : null)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <FormSelect
              label="Icon"
              value={editingUnit.icon}
              onChange={(e) => setEditingUnit(prev => prev ? { ...prev, icon: e.target.value } : null)}
              options={iconOptions}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <button 
                onClick={() => {
                  setShowEditModal(false)
                  setEditingUnit(null)
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={editUnit}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  )
}