import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Fil d'Ariane" className="py-2.5 mb-4 text-xs">
      <ol className="flex items-center flex-wrap gap-1.5 text-gray-500">
        <li>
          <Link
            to="/"
            className="flex items-center gap-1 text-gray-500 hover:text-brand-600 transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-gray-400" />
            <span className="sr-only">Accueil</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              {isLast || !item.href ? (
                <span className="font-bold text-gray-900 truncate max-w-[200px] sm:max-w-xs">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="hover:text-brand-600 transition-colors truncate max-w-[150px] sm:max-w-xs"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
