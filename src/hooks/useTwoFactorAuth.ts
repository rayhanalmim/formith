/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';

export interface MFAFactor {
  id: string;
  friendly_name?: string;
  factor_type: 'totp';
  status: 'verified' | 'unverified';
  created_at: string;
  updated_at: string;
}

export interface EnrollmentData {
  id: string;
  type: 'totp';
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

export function useMFAFactors() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mfa-factors', user?.id],
    queryFn: async (): Promise<MFAFactor[]> => {
      if (!user) return [];

      const response = await api.listMFAFactors(user.id);
      
      if (!response.success) throw new Error('Failed to list MFA factors');
      
      return response.data?.totp || [];
    },
    enabled: !!user,
  });
}

export function useEnrollMFA() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);

  const enrollMutation = useMutation({
    mutationFn: async (friendlyName?: string): Promise<EnrollmentData> => {
      if (!user) throw new Error('Not authenticated');
      
      const response = await api.enrollMFA(user.id, user.email || '', friendlyName || 'Authenticator App');

      if (!response.success || !response.data) throw new Error('Failed to enroll MFA');
      
      return response.data as EnrollmentData;
    },
    onSuccess: (data) => {
      setEnrollmentData(data);
    },
    onError: (error: any) => {
      console.error('Failed to enroll MFA:', error);
      toast.error(
        language === 'ar' 
          ? 'فشل في تفعيل التحقق بخطوتين' 
          : 'Failed to enable 2FA'
      );
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!enrollmentData) throw new Error('No enrollment in progress');

      const response = await api.verifyMFAEnrollment(enrollmentData.id, code);

      if (!response.success) throw new Error('Verification failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-factors'] });
      setEnrollmentData(null);
      toast.success(
        language === 'ar' 
          ? 'تم تفعيل التحقق بخطوتين بنجاح' 
          : '2FA enabled successfully'
      );
    },
    onError: (error: any) => {
      console.error('Failed to verify MFA:', error);
      toast.error(
        language === 'ar' 
          ? 'رمز التحقق غير صحيح' 
          : 'Invalid verification code'
      );
    },
  });

  const cancelEnrollment = () => {
    setEnrollmentData(null);
  };

  return {
    enrollmentData,
    enroll: enrollMutation.mutate,
    isEnrolling: enrollMutation.isPending,
    verify: verifyMutation.mutate,
    isVerifying: verifyMutation.isPending,
    cancelEnrollment,
  };
}

export function useUnenrollMFA() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (factorId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const response = await api.unenrollMFA(factorId, user.id);

      if (!response.success) throw new Error('Failed to unenroll MFA');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-factors'] });
      toast.success(
        language === 'ar' 
          ? 'تم تعطيل التحقق بخطوتين' 
          : '2FA disabled successfully'
      );
    },
    onError: (error: any) => {
      console.error('Failed to unenroll MFA:', error);
      toast.error(
        language === 'ar' 
          ? 'فشل في تعطيل التحقق بخطوتين' 
          : 'Failed to disable 2FA'
      );
    },
  });
}

export function useMFAChallenge() {
  const { language } = useLanguage();

  return useMutation({
    mutationFn: async ({ factorId, code }: { factorId: string; code: string }) => {
      const response = await api.challengeMFA(factorId, code);

      if (!response.success) throw new Error('MFA verification failed');
    },
    onError: (error: any) => {
      console.error('MFA verification failed:', error);
      toast.error(
        language === 'ar' 
          ? 'رمز التحقق غير صحيح' 
          : 'Invalid verification code'
      );
    },
  });
}

export function useGetAssuranceLevel() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mfa-assurance', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const response = await api.getMFAAssuranceLevel(user.id);
      
      if (!response.success) throw new Error('Failed to get assurance level');
      
      return response.data;
    },
    enabled: !!user,
  });
}
