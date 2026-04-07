import React, { createContext, useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/lib/apiClient';
import { useAuthStore } from '../../src/stores/authStore';

export interface VendorData {
    isVendor: boolean;
    status: 'pending' | 'approved' | 'suspended' | null;
    shopName: string;
    shopDescription: string;
    shopLogoUrl: string | null;
    shopBannerUrl: string | null;
    contactEmail: string;
    contactPhone: string;
    businessAddress: string;
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
    status: null,
    shopName: '',
    shopDescription: '',
    shopLogoUrl: null,
    shopBannerUrl: null,
    contactEmail: '',
    contactPhone: '',
    businessAddress: '',
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
              isVendor: apiVendor.vendor.status !== 'suspended',
              status: apiVendor.vendor.status ?? null,
              shopName: apiVendor.vendor.shop_name ?? '',
              shopDescription: apiVendor.vendor.shop_description ?? '',
              shopLogoUrl: apiVendor.vendor.shop_logo_url ?? null,
              shopBannerUrl: apiVendor.vendor.shop_banner_url ?? null,
              contactEmail: apiVendor.vendor.contact_email ?? '',
              contactPhone: apiVendor.vendor.contact_phone ?? '',
              businessAddress: apiVendor.vendor.business_address ?? '',
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
