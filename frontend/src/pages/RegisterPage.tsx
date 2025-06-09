import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RegisterForm from '../components/auth/RegisterForm';
import RedirectIfAuthenticated from '../components/common/RedirectIfAuthenticated';
import PageContainer from '../components/layout/PageContainer';

const RegisterPage: React.FC = () => {
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
          <RegisterForm />
        </div>
      </PageContainer>
    </RedirectIfAuthenticated>
  );
};

export default RegisterPage;