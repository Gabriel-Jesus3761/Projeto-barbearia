import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  UserIcon,
  PhoneIcon,
  CakeIcon,
  IdentificationIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { getProfileCompletenessInfo } from '../utils/profileValidation';

export function CompleteProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    phone: user?.phone || '',
    cpf: user?.cpf || '',
    gender: user?.gender || '',
    birthDate: user?.birthDate || '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const completenessInfo = user ? getProfileCompletenessInfo(user as any) : null;

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        phone: user.phone || '',
        cpf: user.cpf || '',
        gender: user.gender || '',
        birthDate: user.birthDate || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const formatCPF = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');

    // Limita a 11 dígitos
    const limited = numbers.slice(0, 11);

    // Formata: 000.000.000-00
    if (limited.length <= 3) return limited;
    if (limited.length <= 6) return `${limited.slice(0, 3)}.${limited.slice(3)}`;
    if (limited.length <= 9)
      return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
  };

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');

    // Limita a 11 dígitos
    const limited = numbers.slice(0, 11);

    // Formata: (00) 00000-0000 ou (00) 0000-0000
    if (limited.length <= 2) return limited;
    if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    if (limited.length <= 10)
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData(prev => ({ ...prev, cpf: formatted }));
    setError('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
    setError('');
  };

  const validateForm = (): boolean => {
    // Validar nome
    if (!formData.displayName || formData.displayName.trim().length < 3) {
      setError('Nome completo deve ter pelo menos 3 caracteres');
      return false;
    }

    // Validar telefone (mínimo 10 dígitos)
    const phoneNumbers = formData.phone.replace(/\D/g, '');
    if (phoneNumbers.length < 10) {
      setError('Telefone inválido');
      return false;
    }

    // Validar CPF (11 dígitos)
    const cpfNumbers = formData.cpf.replace(/\D/g, '');
    if (cpfNumbers.length !== 11) {
      setError('CPF inválido');
      return false;
    }

    // Validar gênero
    if (!formData.gender) {
      setError('Selecione seu gênero');
      return false;
    }

    // Validar data de nascimento
    if (!formData.birthDate) {
      setError('Data de nascimento é obrigatória');
      return false;
    }

    // Validar idade mínima (13 anos)
    const birthDate = new Date(formData.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 13) {
      setError('Você precisa ter pelo menos 13 anos');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('Usuário não autenticado');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const userRef = doc(db, 'users', user.uid);

      await updateDoc(userRef, {
        displayName: formData.displayName.trim(),
        phone: formData.phone,
        cpf: formData.cpf.replace(/\D/g, ''),
        gender: formData.gender,
        birthDate: formData.birthDate,
        profileComplete: true,
        updatedAt: serverTimestamp(),
      });

      setSuccess(true);

      // Aguarda 1.5 segundos e redireciona
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      setError(err.message || 'Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Perfil completo!</h2>
          <p className="text-gray-600">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete seu perfil</h1>
          <p className="mt-2 text-sm text-gray-600">
            Preencha as informações abaixo para desbloquear todas as funcionalidades
          </p>

          {/* Progress */}
          {completenessInfo && (
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${completenessInfo.completeness}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {completenessInfo.completeness}% completo ({completenessInfo.totalFilled} de{' '}
                {completenessInfo.totalRequired} campos)
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome completo */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                Nome completo *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="displayName"
                  id="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            </div>

            {/* Telefone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefone *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
            </div>

            {/* CPF */}
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
                CPF *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IdentificationIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="cpf"
                  id="cpf"
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="000.000.000-00"
                  required
                />
              </div>
            </div>

            {/* Gênero */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                Gênero *
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md"
                required
              >
                <option value="">Selecione...</option>
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
                <option value="other">Outro</option>
                <option value="prefer-not-to-say">Prefiro não dizer</option>
              </select>
            </div>

            {/* Data de nascimento */}
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
                Data de nascimento *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CakeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  name="birthDate"
                  id="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Salvando...' : 'Salvar e continuar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
