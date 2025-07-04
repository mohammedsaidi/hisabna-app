import React, { useState, useRef } from 'react';
import { Category } from '../types';
import { PlusIcon, TrashIcon, TagIcon, GripVerticalIcon } from './Icons';

interface CategoriesListProps {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

const CategoriesList: React.FC<CategoriesListProps> = ({ categories, setCategories }) => {
  const [newCategory, setNewCategory] = useState('');
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim()) {
      setCategories(prev => [...prev, { id: `cat-${Date.now()}`, name: newCategory.trim() }]);
      setNewCategory('');
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الفئة؟ سيتم إلغاء تصنيف المعاملات المرتبطة بها.')) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
        return;
    }
    
    let categoriesCopy = [...categories];
    // If the list is paginated, we need to get the actual index from the full list
    if(!showAllCategories && categories.length > 5) {
        // This logic is tricky. For simplicity, we'll sort based on the full list index.
        // This means dragging is most effective when all categories are shown.
    }
    
    const draggedItemContent = categoriesCopy.splice(dragItem.current, 1)[0];
    categoriesCopy.splice(dragOverItem.current, 0, draggedItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    
    setCategories(categoriesCopy);
  };
  
  const displayedCategories = showAllCategories ? categories : categories.slice(0, 5);


  return (
    <div className="bg-light-surface dark:bg-brand-surface p-4 sm:p-6 rounded-2xl shadow-lg h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">إدارة الفئات</h2>
        <p className="text-light-text-secondary dark:text-brand-text-secondary">قم بتنظيم معاملاتك باستخدام فئات مخصصة. اسحب وأفلت لترتيبها.</p>
      </div>

      <form onSubmit={handleAddCategory} className="flex gap-4 mb-6">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="اسم الفئة الجديدة"
          className="flex-grow p-3 bg-light-interactive dark:bg-brand-background rounded-lg border border-light-border dark:border-gray-600 focus:ring-brand-primary focus:outline-none"
        />
        <button
          type="submit"
          className="flex items-center justify-center p-3 font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-secondary transition-colors"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      </form>

      <div className="flex-grow overflow-y-auto pr-2">
         {categories.length > 0 ? (
            <div>
                <div className="space-y-3">
                {displayedCategories.map((category, index) => {
                    const originalIndex = showAllCategories ? index : categories.findIndex(c => c.id === category.id);
                    return (
                        <div 
                            key={category.id} 
                            className="bg-light-interactive/50 dark:bg-gray-800 p-4 rounded-lg flex items-center justify-between hover:bg-light-interactive dark:hover:bg-gray-900/50 transition-colors cursor-grab"
                            draggable
                            onDragStart={() => (dragItem.current = originalIndex)}
                            onDragEnter={() => (dragOverItem.current = originalIndex)}
                            onDragEnd={handleDragSort}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <div className="flex items-center gap-3">
                                <GripVerticalIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                <TagIcon className="w-5 h-5 text-light-text-secondary dark:text-brand-text-secondary" />
                                <span className="font-medium">{category.name}</span>
                            </div>
                            <button onClick={() => handleDeleteCategory(category.id)} className="text-red-500 hover:text-red-400">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )
                })}
                </div>
                {categories.length > 5 && !showAllCategories && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowAllCategories(true)}
                      className="px-4 py-2 font-semibold text-brand-primary hover:text-brand-secondary dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                    >
                      إظهار كل الفئات ({categories.length})
                    </button>
                  </div>
                )}
            </div>
         ): (
            <div className="flex flex-col items-center justify-center h-full text-center text-light-text-secondary">
                <TagIcon className="w-20 h-20 text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-lg">لا توجد فئات.</p>
                <p>أضف فئة جديدة لبدء تنظيم معاملاتك.</p>
            </div>
         )}
      </div>
    </div>
  );
};

export default CategoriesList;