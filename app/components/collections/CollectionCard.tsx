import { Link } from '@remix-run/react';
import type { CollectionsQuery } from '~/generated/graphql';

export function CollectionCard({
  collection,
}: {
  collection: CollectionsQuery['collections']['items'][number];
}) {
  return (
    <div className="flex flex-col border rounded-xl relative bg-white shadow-sm  group">
      <Link
        to={'/collections/' + collection.slug}
        prefetch="intent"
        key={collection.id}
        className="flex flex-col flex-1 relative overflow-hidden rounded-xl"
      >
        <img
          className="rounded-xl flex-grow object-cover aspect-[6/4] transition-transform duration-300 ease-in-out group-hover:scale-110"
          alt={collection.name}
          src={
            collection.featuredAsset?.preview
              ? collection.featuredAsset.preview + '?w=100&h=200'
              : '/placeholder.svg?height=200&width=100'
          }
        />

        <span
          aria-hidden="true"
          className="absolute w-full bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent rounded-b-xl transition-opacity duration-300 group-hover:from-black/80"
        />

        <span className="absolute bottom-2 w-full text-center text-lg font-medium text-white transition-all duration-300 group-hover:text-xl group-hover:font-semibold group-hover:bottom-3">
          {collection.name}
        </span>
      </Link>
    </div>
  );
}
