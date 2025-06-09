import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import RedirectIfAuthenticated from '../components/common/RedirectIfAuthenticated';
import PageContainer from '../components/layout/PageContainer';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect to home if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return (
    <RedirectIfAuthenticated>
      <PageContainer>
        <div className="flex justify-center pt-8 pb-16">
          <LoginForm />
        </div>
      </PageContainer>
    </RedirectIfAuthenticated>
  );
};

export default LoginPage;