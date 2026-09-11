export interface Project {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  category: string;
  tags: string[];
  cover_image: string;
  demo_url: string;
  github_url: string;
  status: 'completed' | 'in-progress' | 'featured' | string;
  featured: boolean;
  order: number;
  metrics?: Record<string, string>;
  views?: number;
}

export interface Stats {
  total_projects: number;
  total_views: number;
  total_messages: number;
  categories: string[];
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}
