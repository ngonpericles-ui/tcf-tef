'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getComprehensiveProfilePictureUrl } from '@/lib/utils/profilePicture';
import { useSharedData } from '@/components/shared-data-provider';
import { useLanguage } from '@/components/language-provider';

interface SimulationHeaderProps {
  currentPage?: 'dashboard' | 'booking' | 'results' | 'voice' | 'usage' | 'questions' | 'cultural' | 'documents';
  type?: 'voice' | 'immigration';
}

export function SimulationHeader({ currentPage = 'dashboard', type = 'voice' }: SimulationHeaderProps) {
  const { userProfile } = useSharedData();
  const { lang } = useLanguage();
  
  const t_ = (fr: string, en: string) => lang === "fr" ? fr : en;

  // Get profile picture URL - prioritize uploaded profile image from DB
  // The API returns: { success: true, data: { user: { profileImage, profilePicture, ... } } }
  // shared-data-provider sets: userProfile = response.data (which is { user: {...} })
  // So userProfile.user contains the actual user data
  const actualUser = (userProfile as any)?.user || userProfile;
  const dbProfileImage = actualUser?.profileImage || actualUser?.profilePicture;
  
  const profileImageUrl = dbProfileImage && dbProfileImage.trim() !== ''
    ? (dbProfileImage.startsWith('http') || dbProfileImage.startsWith('//') 
        ? dbProfileImage 
        : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'}${dbProfileImage.startsWith('/') ? '' : '/'}${dbProfileImage}`)
    : actualUser?.email || userProfile?.email
      ? getComprehensiveProfilePictureUrl(actualUser?.email || userProfile?.email || '', '')
      : '';
  
  // Get user initials from name or email - use actualUser for consistency
  const userName = actualUser?.firstName && actualUser?.lastName 
    ? `${actualUser.firstName} ${actualUser.lastName}`
    : actualUser?.name || userProfile?.name || '';
  const userEmail = actualUser?.email || userProfile?.email || '';
  
  const userInitials = userName
    ? userName.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase().slice(0, 2) || userEmail.charAt(0).toUpperCase() || 'U'
    : userEmail
      ? userEmail.charAt(0).toUpperCase()
      : 'U';

  return (
    <div className="sticky top-0 z-50 w-full px-4 md:px-6 py-4">
      {/* 3D Rounded Container with Glass Effect */}
      <div className="max-w-7xl mx-auto relative">
        {/* 3D Shadow Layers for Depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2ECC71]/20 via-transparent to-[#2ECC71]/10 rounded-full blur-2xl opacity-50 -z-10" />
        <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-white/20 to-transparent rounded-full blur-xl opacity-30 -z-10" />
        
        {/* Main Container - Fully Rounded with 3D Effect */}
        <div className="relative bg-white/90 dark:bg-white/5 backdrop-blur-3xl rounded-full border-2 border-white/30 dark:border-white/10 shadow-2xl px-6 md:px-8 py-4 md:py-5 transform transition-all duration-300 hover:shadow-[0_20px_60px_-15px_rgba(46,204,113,0.3)]">
          {/* Inner Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#2ECC71]/5 via-transparent to-[#2ECC71]/5 rounded-full pointer-events-none" />
          
          <div className="relative flex items-center justify-between gap-4">
            {/* Left: Sound Wave Icon and Title with 3D Effect */}
            <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
              {/* 3D Sound Wave Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-[#2ECC71]/20 rounded-full blur-md opacity-50" />
                <div className="relative flex items-end gap-1 h-6 md:h-7">
                  <div className="w-1 bg-[#2ECC71] rounded-full shadow-lg shadow-[#2ECC71]/50" style={{ height: '12px', animation: 'pulse 1s ease-in-out infinite' }} />
                  <div className="w-1 bg-[#2ECC71] rounded-full shadow-lg shadow-[#2ECC71]/50" style={{ height: '18px', animation: 'pulse 1s ease-in-out infinite 0.2s' }} />
                  <div className="w-1 bg-[#2ECC71] rounded-full shadow-lg shadow-[#2ECC71]/50" style={{ height: '24px', animation: 'pulse 1s ease-in-out infinite 0.4s' }} />
                  <div className="w-1 bg-[#2ECC71] rounded-full shadow-lg shadow-[#2ECC71]/50" style={{ height: '18px', animation: 'pulse 1s ease-in-out infinite 0.6s' }} />
                  <div className="w-1 bg-[#2ECC71] rounded-full shadow-lg shadow-[#2ECC71]/50" style={{ height: '12px', animation: 'pulse 1s ease-in-out infinite 0.8s' }} />
                </div>
              </div>
              <span className="text-sm md:text-base lg:text-lg text-black dark:text-white font-semibold tracking-tight">
                {t_("Pratique d'Entretien IA", "AI Interview Practice")}
              </span>
            </div>
            
            {/* Center: Navigation Links with 3D Hover Effects */}
            <nav className="hidden lg:flex items-center gap-2 md:gap-4 flex-1 justify-center">
              {type === 'voice' ? (
                <>
              <Link 
                href="/simulation-vocale/booking" 
                className={`relative px-4 md:px-5 py-2 rounded-full transition-all duration-300 whitespace-nowrap text-sm md:text-base font-medium ${
                  currentPage === 'booking' 
                    ? 'text-white bg-gradient-to-r from-[#2ECC71] to-[#27c066] shadow-lg shadow-[#2ECC71]/50 transform scale-105' 
                    : 'text-gray-700 dark:text-white/80 hover:text-[#2ECC71] hover:bg-[#2ECC71]/10'
                }`}
              >
                {currentPage === 'booking' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#2ECC71]/20 to-[#27c066]/20 rounded-full blur-md -z-10" />
                )}
                {t_("Nouvelle Simulation", "New Simulation")}
              </Link>
              <Link 
                href="/simulation-vocale/results" 
                className={`relative px-4 md:px-5 py-2 rounded-full transition-all duration-300 whitespace-nowrap text-sm md:text-base font-medium ${
                  currentPage === 'results' 
                    ? 'text-white bg-gradient-to-r from-[#2ECC71] to-[#27c066] shadow-lg shadow-[#2ECC71]/50 transform scale-105' 
                    : 'text-gray-700 dark:text-white/80 hover:text-[#2ECC71] hover:bg-[#2ECC71]/10'
                }`}
              >
                {currentPage === 'results' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#2ECC71]/20 to-[#27c066]/20 rounded-full blur-md -z-10" />
                )}
                {t_("Resultat", "Results")}
              </Link>
              <Link 
                href="/simulation-vocale/usage" 
                className={`relative px-4 md:px-5 py-2 rounded-full transition-all duration-300 whitespace-nowrap text-sm md:text-base font-medium ${
                  currentPage === 'usage' 
                    ? 'text-white bg-gradient-to-r from-[#2ECC71] to-[#27c066] shadow-lg shadow-[#2ECC71]/50 transform scale-105' 
                    : 'text-gray-700 dark:text-white/80 hover:text-[#2ECC71] hover:bg-[#2ECC71]/10'
                }`}
              >
                {currentPage === 'usage' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#2ECC71]/20 to-[#27c066]/20 rounded-full blur-md -z-10" />
                )}
                {t_("usage", "Usage")}
              </Link>
              <Link 
                href="/simulation-vocale/voice" 
                className={`relative px-4 md:px-5 py-2 rounded-full transition-all duration-300 whitespace-nowrap text-sm md:text-base font-medium ${
                  currentPage === 'voice' 
                    ? 'text-white bg-gradient-to-r from-[#2ECC71] to-[#27c066] shadow-lg shadow-[#2ECC71]/50 transform scale-105' 
                    : 'text-gray-700 dark:text-white/80 hover:text-[#2ECC71] hover:bg-[#2ECC71]/10'
                }`}
              >
                {currentPage === 'voice' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#2ECC71]/20 to-[#27c066]/20 rounded-full blur-md -z-10" />
                )}
                {t_("Parametre Vocales", "Voice Settings")}
              </Link>
                </>
              ) : (
                <>
                  <Link 
                    href="/immigration-simulations" 
                    className={`relative px-4 md:px-5 py-2 rounded-full transition-all duration-300 whitespace-nowrap text-sm md:text-base font-medium ${
                      currentPage === 'dashboard' 
                        ? 'text-white bg-gradient-to-r from-[#2ECC71] to-[#27c066] shadow-lg shadow-[#2ECC71]/50 transform scale-105' 
                        : 'text-gray-700 dark:text-white/80 hover:text-[#2ECC71] hover:bg-[#2ECC71]/10'
                    }`}
                  >
                    {currentPage === 'dashboard' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#2ECC71]/20 to-[#27c066]/20 rounded-full blur-md -z-10" />
                    )}
                    {t_("Explorer", "Explore")}
                  </Link>
                  <Link 
                    href="/immigration-simulations/questions" 
                    className={`relative px-4 md:px-5 py-2 rounded-full transition-all duration-300 whitespace-nowrap text-sm md:text-base font-medium ${
                      currentPage === 'questions' 
                        ? 'text-white bg-gradient-to-r from-[#2ECC71] to-[#27c066] shadow-lg shadow-[#2ECC71]/50 transform scale-105' 
                        : 'text-gray-700 dark:text-white/80 hover:text-[#2ECC71] hover:bg-[#2ECC71]/10'
                    }`}
                  >
                    {currentPage === 'questions' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#2ECC71]/20 to-[#27c066]/20 rounded-full blur-md -z-10" />
                    )}
                    {t_("Configurer Simulation", "Configure Simulation")}
                  </Link>
                  <Link 
                    href="/immigration-simulations/cultural" 
                    className={`relative px-4 md:px-5 py-2 rounded-full transition-all duration-300 whitespace-nowrap text-sm md:text-base font-medium ${
                      currentPage === 'cultural' 
                        ? 'text-white bg-gradient-to-r from-[#2ECC71] to-[#27c066] shadow-lg shadow-[#2ECC71]/50 transform scale-105' 
                        : 'text-gray-700 dark:text-white/80 hover:text-[#2ECC71] hover:bg-[#2ECC71]/10'
                    }`}
                  >
                    {currentPage === 'cultural' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#2ECC71]/20 to-[#27c066]/20 rounded-full blur-md -z-10" />
                    )}
                    {t_("Contexte Culturel", "Cultural Context")}
                  </Link>
                  <Link 
                    href="/immigration-simulations/documents" 
                    className={`relative px-4 md:px-5 py-2 rounded-full transition-all duration-300 whitespace-nowrap text-sm md:text-base font-medium ${
                      currentPage === 'documents' 
                        ? 'text-white bg-gradient-to-r from-[#2ECC71] to-[#27c066] shadow-lg shadow-[#2ECC71]/50 transform scale-105' 
                        : 'text-gray-700 dark:text-white/80 hover:text-[#2ECC71] hover:bg-[#2ECC71]/10'
                    }`}
                  >
                    {currentPage === 'documents' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#2ECC71]/20 to-[#27c066]/20 rounded-full blur-md -z-10" />
                    )}
                    {t_("Nos Agents", "Our Agents")}
                  </Link>
                  <Link 
                    href="/immigration-simulations/results" 
                    className={`relative px-4 md:px-5 py-2 rounded-full transition-all duration-300 whitespace-nowrap text-sm md:text-base font-medium ${
                      currentPage === 'results' 
                        ? 'text-white bg-gradient-to-r from-[#2ECC71] to-[#27c066] shadow-lg shadow-[#2ECC71]/50 transform scale-105' 
                        : 'text-gray-700 dark:text-white/80 hover:text-[#2ECC71] hover:bg-[#2ECC71]/10'
                    }`}
                  >
                    {currentPage === 'results' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#2ECC71]/20 to-[#27c066]/20 rounded-full blur-md -z-10" />
                    )}
                    {t_("Résultats et performance", "Results & Performance")}
                  </Link>
                </>
              )}
            </nav>
            
            {/* Right: Profile Picture with 3D Effects */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-[#2ECC71]/20 rounded-full blur-md opacity-50" />
                <Avatar className="relative w-9 h-9 md:w-10 md:h-10 border-2 border-[#2ECC71]/50 shadow-lg shadow-[#2ECC71]/20 transform transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-[#2ECC71]/30">
                  <AvatarImage 
                    src={profileImageUrl}
                    alt={userName || userEmail || 'User'}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-[#2ECC71] to-[#27c066] text-white font-semibold text-sm shadow-inner">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

