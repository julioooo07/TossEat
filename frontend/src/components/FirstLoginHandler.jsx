import { useEffect, useRef } from 'react';
import { useChatbot } from '../context/ChatbotContext';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const FirstLoginHandler = () => {
  const { startChatbot, chatbotOpen } = useChatbot();
  const { user } = useAuth();
  const location = useLocation();
  const hasHandledFirstLogin = useRef(false); // ADD THIS REF

  useEffect(() => {
    if (!user || user.isAdmin || hasHandledFirstLogin.current || ['/order-type', '/dine-in'].includes(location.pathname)) return;
    
    const userId = user.id || user.email || user._id;
    
    // Check if preferences are completed
    const hasCompletedPreferences = localStorage.getItem(`preferences_completed_${userId}`);
    const hasStoredRecommendations = localStorage.getItem(`user_recommendations_${userId}`);
    const hasSeenRecommendations = localStorage.getItem(`has_seen_first_recs_${userId}`);
    
    
    // If preferences completed but haven't seen recommendations
    if (hasCompletedPreferences === 'true' && hasStoredRecommendations && !hasSeenRecommendations) {
      localStorage.setItem(`has_seen_first_recs_${userId}`, 'true');
      
      // Set a flag in sessionStorage to prevent multiple redirects
      if (!sessionStorage.getItem('redirecting_to_recs')) {
        sessionStorage.setItem('redirecting_to_recs', 'true');
        const timer = setTimeout(() => {
          window.location.href = '/menu?category=RECOMMENDED&showRecs=true';
          sessionStorage.removeItem('redirecting_to_recs');
        }, 1500);
        
        hasHandledFirstLogin.current = true;
        return () => clearTimeout(timer);
      }
    }
    
    // If first login and preferences not completed, start chatbot
    if (!hasCompletedPreferences && !chatbotOpen) {
      hasHandledFirstLogin.current = true;
      
      const timer = setTimeout(() => {
        startChatbot(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    hasHandledFirstLogin.current = true;
  }, [user, chatbotOpen, startChatbot, location.pathname]);

  return null;
};

export default FirstLoginHandler;
