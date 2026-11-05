/**
 * Navigation Types for Nexora Bank OmniWear Suite
 */

export type ScreenType = 
  // Auth screens
  | 'welcome'
  | 'login'
  | 'register'
  | 'forgotPassword'
  | 'resetPassword'
  | 'companionPairing'
  
  // Main app screens
  | 'dashboard'
  | 'balance'
  | 'transfer'
  | 'qrPay'
  | 'profile'
  | 'transactions'
  | 'loans'
  | 'cards'
  | 'bills'
  | 'admin'
  | 'health'
  | 'pentestLab'
  | 'companionManager'
  
  // Card-related screens
  | 'cardDetails'
  | 'cardTransactions'
  | 'createCard'
  
  // Bill-related screens
  | 'selectBillCategory'
  | 'selectBiller'
  | 'paymentMethod';

// Parameter types for each screen
export type ScreenParams = {
  // Auth screens don't need params
  companionPairing?: {};
  
  // Main app screens
  dashboard?: {};
  balance?: {};
  transfer?: {
    prefillRecipient?: string;
    prefillAmount?: number;
  };
  qrPay?: {};
  profile?: {};
  transactions?: {
    filterByType?: 'sent' | 'received';
  };
  loans?: {};
  cards?: {};
  bills?: {};
  admin?: {};
  health?: {};
  pentestLab?: {};
  companionManager?: {};
  
  // Card screens
  cardDetails?: {
    cardId: number | string;
  };
  cardTransactions?: {
    cardId: number | string;
    cardNumber?: string;
  };
  createCard?: {};
  
  // Bill screens
  selectBillCategory?: {};
  selectBiller?: {
    categoryId: number;
    categoryName: string;
  };
  paymentMethod?: {
    billerId: number;
    billerName: string;
    accountNumber: string;
    amount: number;
  };
};

export interface NavigationProps {
  navigate: (screen: ScreenType, params?: ScreenParams) => void;
  goBack: () => void;
  currentScreen: ScreenType;
}
