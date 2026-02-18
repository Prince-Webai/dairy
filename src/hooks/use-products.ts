
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';

export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('name');

            if (error) throw error;

            const formattedProducts: Product[] = (data || []).map(p => ({
                id: p.id,
                sku: p.sku,
                name: p.name,
                price: p.sell_price,
                stock: p.stock_level,
                category: p.category || 'General',
                description: '', // Not in schema explicitly but needed for type?
                unit: 'unit'
            }));

            setProducts(formattedProducts);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { products, loading, error, refetch: fetchProducts };
};
