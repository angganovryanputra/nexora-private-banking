import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, BackHandler } from 'react-native';
import { ScreenType, ScreenParams } from './types';
import { useAuth } from '../contexts/AuthContext';
import globalStyles from '../styles/globalStyles';
import Header from '../components/Header';
import MenuModal from '../components/MenuModal';
import LockoutModal from '../components/LockoutModal';

// Import screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import DashboardScreen from '../screens/DashboardScreen';
import BalanceScreen from '../screens/BalanceScreen';
import TransferScreen from '../screens/TransferScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import LoansScreen from '../screens/LoansScreen';
import CardsScreen from '../screens/CardsScreen';
import BillsScreen from '../screens/BillsScreen';
import AdminScreen from '../screens/AdminScreen';
import CardDetailsScreen from '../screens/CardDetailsScreen';
import CardTransactionsScreen from '../screens/CardTransactionsScreen';
import CreateCardScreen from '../screens/CreateCardScreen';
import HealthScreen from '../screens/HealthScreen';
import PentestLabScreen from '../screens/PentestLabScreen';
import QRPayScreen from '../screens/QRPayScreen';
import CompanionPairingScreen from '../screens/CompanionPairingScreen';
import SmartphoneCompanionScreen from '../screens/SmartphoneCompanionScreen';

interface Props {
  initialScreen?: ScreenType;
}

const AppNavigator: React.FC<Props> = ({ initialScreen = 'welcome' }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(
    isAuthenticated ? 'dashboard' : initialScreen
  );
  const [screenParams, setScreenParams] = useState<ScreenParams>({});
  const [menuVisible, setMenuVisible] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Navigate to a new screen with optional parameters
  const navigate = (screen: ScreenType, params: ScreenParams = {}) => {
    setCurrentScreen(screen);
    setScreenParams(params);
    setMenuVisible(false);
  };
  
  // Go back to dashboard or previous screen
  const goBack = () => {
    if (!['welcome', 'login', 'register', 'forgotPassword', 'resetPassword', 'companionPairing', 'dashboard'].includes(currentScreen)) {
      setCurrentScreen('dashboard');
      return true;
    }
    return false;
  };

  // Hardware Back Button Hook for Wear OS physical buttons & swipe gesture
  useEffect(() => {
    const onBackPress = () => {
      if (menuVisible) {
        setMenuVisible(false);
        return true;
      }
      return goBack();
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [currentScreen, menuVisible]);

  const handleMenuItemPress = (screen: string) => {
    if (screen === 'lockout') {
      setIsLocked(true);
      setMenuVisible(false);
      return;
    }
    navigate(screen as ScreenType);
  };

  const handleLogout = async () => {
    await logout();
    navigate('login');
    setMenuVisible(false);
  };

  const renderScreen = () => {
    // If not authenticated, only show auth screens
    if (!isAuthenticated && !['welcome', 'login', 'register', 'forgotPassword', 'resetPassword', 'companionPairing'].includes(currentScreen)) {
      return <WelcomeScreen onNavigate={navigate} />;
    }

    switch (currentScreen) {
      // Auth screens
      case 'welcome':
        return <WelcomeScreen onNavigate={navigate} />;
      case 'login':
        return <LoginScreen onNavigate={navigate} />;
      case 'register':
        return <RegisterScreen onNavigate={navigate} />;
      case 'forgotPassword':
        return <ForgotPasswordScreen onNavigate={navigate} />;
      case 'resetPassword':
        return <ResetPasswordScreen onNavigate={navigate} />;
      case 'companionPairing':
        return <CompanionPairingScreen onNavigate={navigate} />;
      
      // Main app screens
      case 'dashboard':
        return <DashboardScreen onNavigate={navigate} />;
      case 'balance':
        return <BalanceScreen onNavigate={navigate} />;
      case 'transfer':
        return <TransferScreen onNavigate={navigate} params={screenParams.transfer} />;
      case 'qrPay':
        return <QRPayScreen onNavigate={navigate} />;
      case 'profile':
        return <ProfileScreen onNavigate={navigate} />;
      case 'transactions':
        return <TransactionsScreen onNavigate={navigate} params={screenParams.transactions} />;
      case 'loans':
        return <LoansScreen onNavigate={navigate} />;
      case 'cards':
        return <CardsScreen onNavigate={navigate} />;
      case 'bills':
        return <BillsScreen onNavigate={navigate} />;
      case 'admin':
        return <AdminScreen onNavigate={navigate} />;
      case 'health':
        return <HealthScreen onNavigate={navigate} />;
      case 'pentestLab':
        return <PentestLabScreen onNavigate={navigate} />;
      case 'companionManager':
        return <SmartphoneCompanionScreen onNavigate={navigate} />;
      
      // Card screens
      case 'cardDetails':
        return (
          <CardDetailsScreen 
            onNavigate={navigate} 
            params={screenParams.cardDetails ? { cardId: screenParams.cardDetails.cardId } : undefined} 
          />
        );
      case 'cardTransactions':
        return (
          <CardTransactionsScreen 
            onNavigate={navigate} 
            params={screenParams.cardTransactions ? { cardId: screenParams.cardTransactions.cardId } : undefined} 
          />
        );
      case 'createCard':
        return <CreateCardScreen onNavigate={navigate} />;
      
      default:
        return <DashboardScreen onNavigate={navigate} />;
    }
  };

  const isAuthenticatedScreen = isAuthenticated && 
    !['welcome', 'login', 'register', 'forgotPassword', 'resetPassword', 'companionPairing'].includes(currentScreen);

  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'dashboard': return 'VulnBank';
      case 'balance': return 'Balance';
      case 'transfer': return 'Transfer';
      case 'qrPay': return 'QR Pay';
      case 'cards': return 'Cards';
      case 'health': return 'Health';
      case 'pentestLab': return 'Pentest Lab';
      case 'companionManager': return 'Phone Companion';
      case 'transactions': return 'History';
      case 'loans': return 'Loans';
      case 'bills': return 'Bills';
      case 'profile': return 'Profile';
      case 'admin': return 'Admin';
      default: return 'VulnBank';
    }
  };

  return (
    <SafeAreaView style={globalStyles.safeAreaView}>
      {isAuthenticatedScreen && (
        <Header 
          title={getScreenTitle()} 
          onBackPress={goBack} 
          onMenuPress={() => setMenuVisible(true)} 
        />
      )}
      
      <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>
      
      {isAuthenticatedScreen && (
        <MenuModal
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onMenuItemPress={handleMenuItemPress}
          isAdmin={user?.isAdmin || false}
          onLogout={handleLogout}
        />
      )}

      {/* V-W11: Wrist-Off Lockout Gatekeeper Modal */}
      <LockoutModal
        visible={isLocked}
        onUnlock={() => setIsLocked(false)}
      />
    </SafeAreaView>
  );
};

export default AppNavigator;
