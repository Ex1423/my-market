import React from 'react';
import ProductReviews from '@/components/product/ProductReviews';

export default async function ProductReviewsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <ProductReviews productId={id} />;
}
