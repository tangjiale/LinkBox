export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type LinkItem = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  iconUrl: string | null;
  categoryId: string;
  category: Category | null;
  tags: Tag[];
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PublicData = {
  categories: Category[];
  tags: Tag[];
  links: LinkItem[];
};
