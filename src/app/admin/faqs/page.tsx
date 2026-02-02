"use client";

import { useState, useEffect } from "react";
import { 
    SearchLg, 
    Plus, 
    Edit01, 
    Trash01, 
    HelpCircle,
    CheckCircle,
    File02,
    FilterLines,
    DotsVertical,
    ChevronRight
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Badge } from "@/components/base/badges/badges";
import { Input } from "@/components/base/input/input";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { cx } from "@/utils/cx";
import { faqService, FAQ, FAQCategory } from "@/services/faq-service";

export default function FAQsPage() {
    // State
    const [categories, setCategories] = useState<FAQCategory[]>([]);
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState("");
    
    // Slideout State
    const [isCategorySlideoutOpen, setIsCategorySlideoutOpen] = useState(false);
    const [isFAQSlideoutOpen, setIsFAQSlideoutOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null);
    const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);

    // Form State
    const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
    const [faqForm, setFaqForm] = useState({ question: "", answer: "", categoryId: "", status: "published" });

    // Fetch Data
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [cats, allFaqs] = await Promise.all([
                faqService.getCategories(),
                faqService.getFAQs()
            ]);
            setCategories(cats);
            setFaqs(allFaqs);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Derived Data
    const filteredFAQs = faqs.filter(faq => {
        const matchesCategory = selectedCategoryId === 'all' || 
            (typeof faq.category === 'string' ? faq.category : faq.category?._id) === selectedCategoryId;
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const selectedCategory = categories.find(c => c._id === selectedCategoryId);

    // Handlers
    const handleAddCategory = () => {
        setEditingCategory(null);
        setCategoryForm({ name: "", description: "" });
        setIsCategorySlideoutOpen(true);
    };

    const handleEditCategory = (category: FAQCategory) => {
        setEditingCategory(category);
        // Note: FAQCategory doesn't have description in the type definition currently, but keeping it for now
        setCategoryForm({ name: category.name, description: "" }); 
        setIsCategorySlideoutOpen(true);
    };

    const handleAddFAQ = () => {
        setEditingFAQ(null);
        setFaqForm({ 
            question: "", 
            answer: "", 
            categoryId: selectedCategoryId === 'all' ? (categories[0]?._id || "") : selectedCategoryId, 
            status: "published" 
        });
        setIsFAQSlideoutOpen(true);
    };

    const handleEditFAQ = (faq: FAQ) => {
        setEditingFAQ(faq);
        setFaqForm({ 
            question: faq.question, 
            answer: faq.answer, 
            categoryId: typeof faq.category === 'string' ? faq.category : faq.category?._id, 
            status: faq.isActive ? "published" : "draft"
        });
        setIsFAQSlideoutOpen(true);
    };

    const handleSaveCategory = async () => {
        try {
            if (editingCategory) {
                await faqService.updateCategory(editingCategory._id, { name: categoryForm.name });
            } else {
                await faqService.createCategory({ name: categoryForm.name });
            }
            fetchData();
            setIsCategorySlideoutOpen(false);
        } catch (error) {
            console.error("Failed to save category:", error);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await faqService.deleteCategory(id);
            fetchData();
            if (selectedCategoryId === id) setSelectedCategoryId('all');
        } catch (error) {
            console.error("Failed to delete category:", error);
        }
    };

    const handleSaveFAQ = async () => {
        try {
            const faqData = {
                question: faqForm.question,
                answer: faqForm.answer,
                category: faqForm.categoryId,
                isActive: faqForm.status === 'published'
            };

            if (editingFAQ) {
                await faqService.updateFAQ(editingFAQ._id, faqData);
            } else {
                await faqService.createFAQ(faqData);
            }
            fetchData();
            setIsFAQSlideoutOpen(false);
        } catch (error) {
            console.error("Failed to save FAQ:", error);
        }
    };

    const handleDeleteFAQ = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await faqService.deleteFAQ(id);
            fetchData();
        } catch (error) {
            console.error("Failed to delete FAQ:", error);
        }
    };


    return (
        <div className="flex h-[calc(100vh-1rem)] bg-white">
            {/* Left Pane: Categories */}
            <div className="w-80 border-r border-gray-200 flex flex-col h-full bg-gray-50/50">
                <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-white">
                    <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
                    <Button size="sm" color="secondary" iconLeading={Plus} onClick={handleAddCategory} />
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    <button
                        onClick={() => setSelectedCategoryId('all')}
                        className={cx(
                            "w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors",
                            selectedCategoryId === 'all' 
                                ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-200" 
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <File02 className="size-5" />
                            <span>All FAQs</span>
                        </div>
                        <Badge size="sm" color="gray" type="pill-color">{faqs.length}</Badge>
                    </button>

                    <div className="my-2 border-t border-gray-200 mx-2"></div>

                    {categories.map(category => (
                        <div key={category._id} className="group relative">
                            <button
                                onClick={() => setSelectedCategoryId(category._id)}
                                className={cx(
                                    "w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors",
                                    selectedCategoryId === category._id 
                                        ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-200" 
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <HelpCircle className="size-5" />
                                    <span className="truncate">{category.name}</span>
                                </div>
                                {/* <Badge size="sm" color="gray" type="pill-color">{category.count}</Badge> */}
                            </button>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleEditCategory(category); }}
                                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200"
                                >
                                    <Edit01 className="size-3.5" />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category._id); }}
                                    className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50"
                                >
                                    <Trash01 className="size-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Pane: FAQs */}
            <div className="flex-1 flex flex-col h-full bg-white min-w-0">
                {/* Header */}
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">
                            {selectedCategoryId === 'all' ? 'All FAQs' : selectedCategory?.name}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {selectedCategoryId === 'all' 
                                ? 'Manage frequently asked questions across all categories.' 
                                : ''}
                        </p>
                    </div>
                    <Button color="primary" iconLeading={Plus} onClick={handleAddFAQ}>
                        Add FAQ
                    </Button>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Search questions..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button color="tertiary" iconLeading={FilterLines}>Filter</Button>
                </div>

                {/* FAQ List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-12">Loading...</div>
                    ) : filteredFAQs.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <HelpCircle className="size-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-lg font-medium text-gray-900">No FAQs found</p>
                            <p className="text-sm">Try adjusting your search or add a new FAQ.</p>
                        </div>
                    ) : (
                        filteredFAQs.map(faq => (
                            <div key={faq._id} className="group border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all bg-white">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold text-gray-900 text-base">{faq.question}</h3>
                                            <Badge 
                                                size="sm" 
                                                color={faq.isActive ? 'success' : 'warning'} 
                                                type="pill-color"
                                            >
                                                {faq.isActive ? 'Published' : 'Draft'}
                                            </Badge>
                                        </div>
                                        <p className="text-gray-600 text-sm line-clamp-2">{faq.answer}</p>
                                        
                                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <File02 className="size-3.5" />
                                                {categories.find(c => c._id === (typeof faq.category === 'string' ? faq.category : faq.category?._id))?.name}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="sm" color="tertiary" iconLeading={Edit01} onClick={() => handleEditFAQ(faq)} />
                                        <Button size="sm" color="tertiary" iconLeading={Trash01} className="text-red-600 hover:bg-red-50" onClick={() => handleDeleteFAQ(faq._id)} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Category Slideout */}
            <SlideoutMenu isOpen={isCategorySlideoutOpen} onOpenChange={setIsCategorySlideoutOpen}>
                <SlideoutMenu.Content>
                    <SlideoutMenu.Header onClose={() => setIsCategorySlideoutOpen(false)}>
                        <span className="font-semibold text-gray-900">{editingCategory ? 'Edit Category' : 'Add Category'}</span>
                    </SlideoutMenu.Header>
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Name</label>
                            <Input 
                                value={categoryForm.name}
                                onChange={(value) => setCategoryForm({...categoryForm, name: value})}
                                placeholder="e.g. Billing"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Description</label>
                            <textarea 
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                value={categoryForm.description}
                                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                                placeholder="Describe this category..."
                            />
                        </div>
                        <div className="pt-4">
                            <Button className="w-full" onClick={handleSaveCategory}>
                                {editingCategory ? 'Save Changes' : 'Create Category'}
                            </Button>
                        </div>
                    </div>
                </SlideoutMenu.Content>
            </SlideoutMenu>

            {/* FAQ Slideout */}
            <SlideoutMenu isOpen={isFAQSlideoutOpen} onOpenChange={setIsFAQSlideoutOpen}>
                <SlideoutMenu.Content>
                    <SlideoutMenu.Header onClose={() => setIsFAQSlideoutOpen(false)}>
                        <span className="font-semibold text-gray-900">{editingFAQ ? 'Edit FAQ' : 'Add FAQ'}</span>
                    </SlideoutMenu.Header>
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Question</label>
                            <Input 
                                value={faqForm.question}
                                onChange={(value) => setFaqForm({...faqForm, question: value})}
                                placeholder="e.g. How do I reset my password?"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Answer</label>
                            <textarea 
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={6}
                                value={faqForm.answer}
                                onChange={(e) => setFaqForm({...faqForm, answer: e.target.value})}
                                placeholder="Type the answer here..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Category</label>
                            <select 
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                value={faqForm.categoryId}
                                onChange={(e) => setFaqForm({...faqForm, categoryId: e.target.value})}
                            >
                                {categories.map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Status</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="status" 
                                        value="published" 
                                        checked={faqForm.status === 'published'}
                                        onChange={() => setFaqForm({...faqForm, status: 'published'})}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Published</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="status" 
                                        value="draft" 
                                        checked={faqForm.status === 'draft'}
                                        onChange={() => setFaqForm({...faqForm, status: 'draft'})}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Draft</span>
                                </label>
                            </div>
                        </div>
                        <div className="pt-4">
                            <Button className="w-full" onClick={handleSaveFAQ}>
                                {editingFAQ ? 'Save Changes' : 'Create FAQ'}
                            </Button>
                        </div>
                    </div>
                </SlideoutMenu.Content>
            </SlideoutMenu>

        </div>
    );
}
