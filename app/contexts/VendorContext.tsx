import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    registerAsVendor: (data: Omit<VendorData, 'isVendor'>) => void;
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
    const [vendorData, setVendorData] = useState<VendorData>(defaultVendorData);

    // Load vendor data on mount
    useEffect(() => {
        loadVendorData();
    }, []);

    // Save vendor data whenever it changes
    useEffect(() => {
        saveVendorData();
    }, [vendorData, isVendorMode]);

    const loadVendorData = async () => {
        try {
            const storedMode = await AsyncStorage.getItem('vendorMode');
            const storedData = await AsyncStorage.getItem('vendorData');

            if (storedMode !== null) {
                setIsVendorMode(JSON.parse(storedMode));
            }

            if (storedData !== null) {
                setVendorData(JSON.parse(storedData));
            }
        } catch (error) {
            console.error('Failed to load vendor data:', error);
        }
    };

    const saveVendorData = async () => {
        try {
            await AsyncStorage.setItem('vendorMode', JSON.stringify(isVendorMode));
            await AsyncStorage.setItem('vendorData', JSON.stringify(vendorData));
        } catch (error) {
            console.error('Failed to save vendor data:', error);
        }
    };

    const setVendorMode = (mode: boolean) => {
        setIsVendorMode(mode);
    };

    const updateVendorData = (data: Partial<VendorData>) => {
        setVendorData((prev) => ({ ...prev, ...data }));
    };

    const registerAsVendor = (data: Omit<VendorData, 'isVendor'>) => {
        setVendorData({ ...data, isVendor: true });
        setIsVendorMode(false); // Start in user mode, they can switch later
    };

    return (
        <VendorContext.Provider
            value={{
                isVendorMode,
                vendorData,
                setVendorMode,
                updateVendorData,
                registerAsVendor,
            }}
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

// Default export to prevent expo-router treating this as a route
export default VendorProvider;
