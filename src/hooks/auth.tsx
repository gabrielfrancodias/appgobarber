import React, {
  useState, createContext, useCallback, useContext, useEffect,
} from 'react';
import AsyncStorage from '@react-native-community/async-storage';

import api from '../services/api';

interface SignInCredentials {
  email: string;
  password: string;
}

interface AuthContextData {
  name: string;
  signIn(credentials: SignInCredentials): Promise<void>;
  signOut(): void;
  user: object;
  loading: boolean;
}

interface AuthData {
  token: string;
  user: object;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC = ({ children }) => {
  const [authData, setAuthData] = useState<AuthData>({} as AuthData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async (): Promise<void> => {
      const [user, token] = await AsyncStorage.multiGet([
        '@GoBarber:user',
        '@GoBarber:token',
      ]);

      if (user[1] && token[1]) {
        setAuthData({
          token: token[1],
          user: JSON.parse(user[1]),
        });
      }
      setLoading(false);
    };

    loadStorageData();
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const response = await api.post('/sessions', {
      email,
      password,
    });
    const { token, user } = response.data;

    await AsyncStorage.multiSet([
      ['@GoBarber:token', token],
      ['@GoBarber:user', JSON.stringify(user)],
    ]);

    setAuthData({
      token,
      user,
    });
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove(['@GoBarber:token', '@GoBarber:user']);
    setAuthData({
      token: '',
      user: {},
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        name: 'Franco',
        signIn,
        signOut,
        user: authData.user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
