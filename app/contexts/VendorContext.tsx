import React, { createContext, useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/lib/apiClient';
import { useAuthStore } from '../../src/stores/authStore';

export interface VendorData {
    isVendor: boolean;
    brandName: string;
    brandType: 'local' | 'startup' | 'established' | 'corporation' | null;
    categories: string[];
    description: string;
    logo: string | null;
    banner: string | null;
    contactEmail: string;
    socialLinks: {
        instagram?: string;
        website?: string;
    };
}

interface VendorContextType {
    isVendorMode: boolean;
    vendorData: VendorData;
    setVendorMode: (mode: boolean) => void;
    updateVendorData: (data: Partial<VendorData>) => void;
    isLoadingVendor: boolean;
}

const defaultVendorData: VendorData = {
    isVendor: false,
    brandName: '',
    brandType: null,
    categories: [],
    description: '',
    logo: null,
    banner: null,
    contactEmail: '',
    socialLinks: {},
};

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export const VendorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isVendorMode, setIsVendorMode] = useState(false);
    const isSignedIn = useAuthStore((s) => s.isSignedIn);

    const { data: apiVendor, isLoading: isLoadingVendor } = useQuery({
        queryKey: ['vendor-me'],
        queryFn: () => apiClient.get('/vendors/me').then((r) => r.data),
        enabled: isSignedIn,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    const vendorData: VendorData = apiVendor?.vendor
        ? {
              isVendor: true,
              brandName: apiVendor.vendor.brand_name ?? '',
              brandType: apiVendor.vendor.brand_type ?? null,
              categories: apiVendor.vendor.categories ?? [],
              description: apiVendor.vendor.description ?? '',
              logo: apiVendor.vendor.logo_url ?? null,
              banner: apiVendor.vendor.banner_url ?? null,
              contactEmail: apiVendor.vendor.contact_email ?? '',
              socialLinks: apiVendor.vendor.social_links ?? {},
          }
        : defaultVendorData;

    const setVendorMode = (mode: boolean) => setIsVendorMode(mode);

    const updateVendorData = (_data: Partial<VendorData>) => {
        // Local updates are handled via API mutations; invalidate ['vendor-me'] after changes
    };

    return (
        <VendorContext.Provider
            value={{ isVendorMode, vendorData, setVendorMode, updateVendorData, isLoadingVendor }}
        >
            {children}
        </VendorContext.Provider>
    );
};

export const useVendor = () => {
    const context = useContext(VendorContext);
    if (context === undefined) {
        throw new Error('useVendor must be used within a VendorProvider');
    }
    return context;
};

export default VendorProvider;
