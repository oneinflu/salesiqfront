"use client";

import { useState, useEffect } from "react";
import { 
    Plus, 
    SearchLg, 
    FilterLines, 
    File02,
    Trash01,
    Edit01,
    Clock,
    Check,
    Bold01,
    Italic01,
    Underline01,
    Link01,
    List,
    Image01,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Calendar
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Tabs, TabList, Tab, TabPanel } from "@/components/application/tabs/tabs";
import { Table } from "@/components/application/table/table";
import { Badge } from "@/components/base/badges/badges";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { cx } from "@/utils/cx";
import { Avatar } from "@/components/base/avatar/avatar";
import { articleService, Article, ArticleCategory } from "@/services/article-service";

export default function ArticlesPage() {
    // State
    const [categories, setCategories] = useState<ArticleCategory[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState("");
    
    // Slideout State
    const [isCategorySlideoutOpen, setIsCategorySlideoutOpen] = useState(false);
    const [isArticleSlideoutOpen, setIsArticleSlideoutOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ArticleCategory | null>(null);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);

    // Form State
    const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
    const [articleForm, setArticleForm] = useState<{
        title: string;
        content: string;
        excerpt: string;
        categoryId: string;
        status: 'published' | 'draft' | 'archived';
        author: string;
    }>({ 
        title: "", 
        content: "", 
        excerpt: "",
        categoryId: "", 
        status: "published",
        author: "Current User" // Placeholder
    });

    // Fetch Data
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [cats, arts] = await Promise.all([
                articleService.getCategories(),
                articleService.getArticles()
            ]);
            setCategories(cats);
            setArticles(arts);
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
    const filteredArticles = articles.filter(article => {
        const matchesCategory = selectedCategoryId === 'all' || 
            (typeof article.category === 'string' ? article.category : article.category?._id) === selectedCategoryId;
        const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              article.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const selectedCategory = categories.find(c => c._id === selectedCategoryId);

    // Handlers
    const handleAddCategory = () => {
        setEditingCategory(null);
        setCategoryForm({ name: "", description: "" });
        setIsCategorySlideoutOpen(true);
    };

    const handleEditCategory = (category: ArticleCategory) => {
        setEditingCategory(category);
        setCategoryForm({ name: category.name, description: category.description || "" });
        setIsCategorySlideoutOpen(true);
    };

    const handleAddArticle = () => {
        setEditingArticle(null);
        setArticleForm({ 
            title: "", 
            content: "",
            excerpt: "", 
            categoryId: selectedCategoryId === 'all' ? (categories[0]?._id || "") : selectedCategoryId, 
            status: "published",
            author: "Current User"
        });
        setIsArticleSlideoutOpen(true);
    };

    const handleEditArticle = (article: Article) => {
        setEditingArticle(article);
        setArticleForm({ 
            title: article.title, 
            content: article.content, 
            excerpt: article.excerpt,
            categoryId: typeof article.category === 'string' ? article.category : article.category?._id, 
            status: article.status,
            author: article.author
        });
        setIsArticleSlideoutOpen(true);
    };

    const handleSaveCategory = async () => {
        try {
            if (editingCategory) {
                await articleService.updateCategory(editingCategory._id, categoryForm);
            } else {
                await articleService.createCategory(categoryForm);
            }
            fetchData();
            setIsCategorySlideoutOpen(false);
        } catch (error) {
            console.error("Failed to save category:", error);
        }
    };

    const handleSaveArticle = async () => {
        try {
            const articleData = {
                ...articleForm,
                category: articleForm.categoryId
            };

            if (editingArticle) {
                await articleService.updateArticle(editingArticle._id, articleData);
            } else {
                await articleService.createArticle(articleData);
            }
            fetchData();
            setIsArticleSlideoutOpen(false);
        } catch (error) {
            console.error("Failed to save article:", error);
        }
    };

    const handleDeleteArticle = async (articleId: string) => {
        if (confirm('Are you sure you want to delete this article?')) {
            try {
                await articleService.deleteArticle(articleId);
                fetchData();
            } catch (error) {
                console.error("Failed to delete article:", error);
            }
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        if (confirm('Are you sure you want to delete this category?')) {
            try {
                await articleService.deleteCategory(categoryId);
                fetchData();
                if (selectedCategoryId === categoryId) setSelectedCategoryId('all');
            } catch (error) {
                console.error("Failed to delete category:", error);
            }
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
                            <span>All Articles</span>
                        </div>
                        <Badge size="sm" color="gray" type="pill-color">{articles.length}</Badge>
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
                                    <File02 className="size-5" />
                                    <span className="truncate">{category.name}</span>
                                </div>
                                <Badge size="sm" color="gray" type="pill-color">
                                    {articles.filter((a) => (typeof a.category === 'string' ? a.category : a.category?._id) === category._id).length}
                                </Badge>
                            </button>
                            <button 
                                onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleEditCategory(category); }}
                                className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Edit01 className="size-3.5" />
                            </button>
                            <button 
                                onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDeleteCategory(category._id); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash01 className="size-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Pane: Articles */}
            <div className="flex-1 flex flex-col h-full bg-white min-w-0">
                {/* Header */}
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">
                            {selectedCategoryId === 'all' ? 'All Articles' : selectedCategory?.name}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {selectedCategoryId === 'all' 
                                ? 'Manage and publish articles across all categories.' 
                                : selectedCategory?.description}
                        </p>
                    </div>
                    <Button color="primary" iconLeading={Plus} onClick={handleAddArticle}>
                        Write Article
                    </Button>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Search articles..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button color="tertiary" iconLeading={FilterLines}>Filter</Button>
                </div>

                {/* Article List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {filteredArticles.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <File02 className="size-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-lg font-medium text-gray-900">No articles found</p>
                            <p className="text-sm">Try adjusting your search or write a new article.</p>
                        </div>
                    ) : (
                        filteredArticles.map(article => (
                            <div key={article._id} className="group border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all bg-white cursor-pointer" onClick={() => handleEditArticle(article)}>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold text-gray-900 text-lg">{article.title}</h3>
                                            <Badge 
                                                size="sm" 
                                                color={article.status === 'published' ? 'success' : 'warning'} 
                                                type="pill-color"
                                            >
                                                {article.status === 'published' ? 'Published' : 'Draft'}
                                            </Badge>
                                        </div>
                                        <p className="text-gray-600 text-sm line-clamp-2 mb-4">{article.content}</p>
                                        
                                        <div className="flex items-center gap-6 text-xs text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <Avatar initials={article.author.charAt(0)} size="xs" className="bg-gray-100 text-gray-600" />
                                                <span className="font-medium text-gray-700">{article.author}</span>
                                            </div>
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="size-3.5" />
                                                {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Draft'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" color="tertiary" iconLeading={Edit01} onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleEditArticle(article); }} />
                                        <Button size="sm" color="tertiary-destructive" iconLeading={Trash01} onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDeleteArticle(article._id); }} />
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
                        <span className="font-semibold text-gray-900">{editingCategory ? 'Edit Category' : 'New Category'}</span>
                    </SlideoutMenu.Header>
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Name</label>
                            <Input 
                                value={categoryForm.name}
                                onChange={(value) => setCategoryForm({...categoryForm, name: value})}
                                placeholder="e.g. Engineering"
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

            {/* Article Slideout (With Editor) */}
            <SlideoutMenu isOpen={isArticleSlideoutOpen} onOpenChange={setIsArticleSlideoutOpen}>
                <SlideoutMenu.Content>
                    <SlideoutMenu.Header onClose={() => setIsArticleSlideoutOpen(false)}>
                        <span className="font-semibold text-gray-900">{editingArticle ? 'Edit Article' : 'New Article'}</span>
                    </SlideoutMenu.Header>
                    <div className="flex flex-col h-full">
                        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                            {/* Article Title */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Article Title</label>
                                <Input 
                                    value={articleForm.title}
                                    onChange={(value) => setArticleForm({...articleForm, title: value})}
                                    placeholder="Enter article title..."
                                    className="text-lg font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Category</label>
                                    <select 
                                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        value={articleForm.categoryId}
                                        onChange={(e) => setArticleForm({...articleForm, categoryId: e.target.value})}
                                    >
                                        {categories.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Status</label>
                                    <select 
                                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        value={articleForm.status}
                                        onChange={(e) => setArticleForm({...articleForm, status: e.target.value as 'published' | 'draft'})}
                                    >
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                </div>
                            </div>

                            {/* Rich Text Editor Simulation */}
                            <div className="space-y-2 flex flex-col flex-1 min-h-[400px]">
                                <label className="text-sm font-medium text-gray-700">Content</label>
                                <div className="border border-gray-300 rounded-lg overflow-hidden flex flex-col flex-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                                    {/* Toolbar */}
                                    <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center gap-1 flex-wrap">
                                        <div className="flex items-center border-r border-gray-300 pr-2 mr-2 gap-1">
                                            <EditorButton icon={Bold01} tooltip="Bold" />
                                            <EditorButton icon={Italic01} tooltip="Italic" />
                                            <EditorButton icon={Underline01} tooltip="Underline" />
                                        </div>
                                        <div className="flex items-center border-r border-gray-300 pr-2 mr-2 gap-1">
                                            <EditorButton icon={AlignLeft} tooltip="Align Left" />
                                            <EditorButton icon={AlignCenter} tooltip="Align Center" />
                                            <EditorButton icon={AlignRight} tooltip="Align Right" />
                                        </div>
                                        <div className="flex items-center border-r border-gray-300 pr-2 mr-2 gap-1">
                                            <EditorButton icon={List} tooltip="Bullet List" />
                                            <EditorButton icon={Link01} tooltip="Link" />
                                            <EditorButton icon={Image01} tooltip="Image" />
                                        </div>
                                    </div>
                                    {/* Editor Area */}
                                    <textarea 
                                        className="w-full flex-1 p-4 text-sm focus:outline-none resize-none font-mono"
                                        value={articleForm.content}
                                        onChange={(e) => setArticleForm({...articleForm, content: e.target.value})}
                                        placeholder="Start writing your article..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end shrink-0">
                            <Button color="tertiary" onClick={() => setIsArticleSlideoutOpen(false)}>Cancel</Button>
                            <Button color="primary" onClick={handleSaveArticle}>
                                {editingArticle ? 'Save Changes' : 'Publish Article'}
                            </Button>
                        </div>
                    </div>
                </SlideoutMenu.Content>
            </SlideoutMenu>
        </div>
    );
}

// Helper Component for Editor Toolbar
const EditorButton = ({ icon: Icon, tooltip }: { icon: any, tooltip: string }) => (
    <button 
        type="button"
        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"
        title={tooltip}
    >
        <Icon className="size-4" />
    </button>
);
